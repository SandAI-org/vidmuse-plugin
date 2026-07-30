// Per-type file probes. Every probe is deterministic, local, and cheap — these
// run at ingest time only, and the mechanical properties they extract do most of
// the retrieval work for free (a "dark, high-contrast, fine-grain, alpha
// overlay" query is answerable without any model involvement).
//
// ffprobe is used opportunistically for raster stats: it is already a media-use
// dependency, but it is NOT required here. A missing ffprobe degrades the
// geometry block, never fails an ingest.

import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";

import { tokenize } from "./core_pack_adapters.mjs";

function ffprobeJson(path) {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,pix_fmt",
        "-of", "json",
        path,
      ],
      { encoding: "utf8", timeout: 10000, stdio: ["ignore", "pipe", "ignore"] },
    );
    return JSON.parse(out)?.streams?.[0] || null;
  } catch {
    return null; // ffprobe is optional; geometry just stays coarser
  }
}

const ALPHA_PIX_FMT = /a$|^ya|argb|abgr|rgba|bgra|pal8/i;

/** SVG: viewBox, stroke-vs-fill, and whether it is single-color (tintable). */
export function probeSvg(path) {
  let content = "";
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const viewBox = content.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() || null;
  const dims = viewBox ? viewBox.split(/[\s,]+/).map(Number) : null;
  const stroke = /stroke\s*=\s*["'](?!none)/i.test(content) || /stroke:/i.test(content);
  const explicitFills = [
    ...new Set(
      [...content.matchAll(/fill\s*=\s*["']([^"']+)["']/gi)]
        .map((m) => m[1].trim().toLowerCase())
        .filter((v) => v && v !== "none"),
    ),
  ];
  return {
    ...(viewBox ? { viewbox: viewBox } : {}),
    ...(dims && dims.length === 4 && dims.every(Number.isFinite)
      ? { width: dims[2], height: dims[3], aspect: round(dims[2] / dims[3]) }
      : {}),
    stroke,
    // currentColor or a single fill means CSS can recolor it without editing
    // the file — worth knowing before an agent picks a mark it cannot tint.
    tintable:
      /currentcolor/i.test(content) || explicitFills.length === 0 || explicitFills.length === 1,
    alpha: true,
  };
}

/** Raster: dimensions, alpha, tileability, and luminance/contrast stats. */
export function probeRaster(path) {
  const stream = ffprobeJson(path);
  const geometry = {};
  if (stream?.width && stream?.height) {
    geometry.width = stream.width;
    geometry.height = stream.height;
    geometry.aspect = round(stream.width / stream.height);
    geometry.square = stream.width === stream.height;
  }
  if (stream?.pix_fmt) {
    geometry.pix_fmt = stream.pix_fmt;
    geometry.alpha = ALPHA_PIX_FMT.test(stream.pix_fmt);
  }
  const stats = probeSignalStats(path);
  return { ...geometry, ...stats };
}

/**
 * Mean luminance + contrast, and a coarse grain-frequency read.
 *
 * These three numbers are what let a texture/overlay query narrow hundreds of
 * files down to a handful before anything needs to be looked at. Values are
 * normalized 0..1.
 */
export function probeSignalStats(path) {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-f", "lavfi",
        "-i", `movie=${ffLavfiEscape(path)},signalstats`,
        "-show_entries", "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YMIN,lavfi.signalstats.YMAX",
        "-of", "json",
        "-read_intervals", "%+#1",
      ],
      { encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "ignore"] },
    );
    const tags = JSON.parse(out)?.frames?.[0]?.tags || {};
    const avg = Number(tags["lavfi.signalstats.YAVG"]);
    const min = Number(tags["lavfi.signalstats.YMIN"]);
    const max = Number(tags["lavfi.signalstats.YMAX"]);
    if (!Number.isFinite(avg)) return {};
    const stats = { luminance: round(avg / 255) };
    if (Number.isFinite(min) && Number.isFinite(max)) {
      stats.contrast = round((max - min) / 255);
    }
    stats.tone = avg < 85 ? "dark" : avg > 170 ? "light" : "mid";
    return stats;
  } catch {
    return {};
  }
}

function ffLavfiEscape(path) {
  // lavfi movie= takes a filtergraph argument: : \ ' are all special.
  return path.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

/** Lottie JSON: frame range, fps, duration, canvas size, version. */
export function probeLottie(path) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {}; // .lottie is a zip; treat as opaque
  }
  if (!doc || typeof doc !== "object") return {};
  const fps = Number(doc.fr);
  const inPoint = Number(doc.ip);
  const outPoint = Number(doc.op);
  const frames =
    Number.isFinite(inPoint) && Number.isFinite(outPoint) ? outPoint - inPoint : null;
  return {
    ...(Number.isFinite(doc.w) ? { width: doc.w } : {}),
    ...(Number.isFinite(doc.h) ? { height: doc.h } : {}),
    ...(Number.isFinite(doc.w) && Number.isFinite(doc.h) && doc.h
      ? { aspect: round(doc.w / doc.h) }
      : {}),
    ...(Number.isFinite(fps) ? { fps } : {}),
    ...(frames != null ? { frames } : {}),
    ...(frames != null && Number.isFinite(fps) && fps > 0
      ? { duration: round(frames / fps) }
      : {}),
    ...(doc.v ? { lottie_version: String(doc.v) } : {}),
    alpha: true,
  };
}

/** Font: family/subfamily from the name table when readable. */
export function probeFont(path) {
  const geometry = {};
  try {
    geometry.bytes = statSync(path).size;
  } catch {
    // size is a nicety
  }
  const name = basename(path, extname(path));
  const weight = name.match(/\b(100|200|300|400|500|600|700|800|900)\b/)?.[1];
  if (weight) geometry.weight = Number(weight);
  if (/italic|oblique/i.test(name)) geometry.italic = true;
  if (/variable|\bvf\b/i.test(name)) geometry.variable = true;
  return geometry;
}

export const PROBES = {
  svg: probeSvg,
  raster: probeRaster,
  lottie: probeLottie,
  font: probeFont,
  none: () => ({}),
};

export function runProbe(kind, path) {
  const probe = PROBES[kind] || PROBES.none;
  try {
    return probe(path) || {};
  } catch {
    return {}; // a probe must never fail an ingest
  }
}

/** Mechanical tags every owned file gets for free. */
export function mechanicalTags(relPath, { pack, type } = {}) {
  const stem = basename(relPath, extname(relPath));
  const dirTokens = relPath.includes("/")
    ? tokenize(relPath.slice(0, relPath.lastIndexOf("/")))
    : [];
  return [...new Set([...tokenize(stem), ...dirTokens, ...(pack ? tokenize(pack) : [])])].filter(
    (token) => token !== type,
  );
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value;
}
