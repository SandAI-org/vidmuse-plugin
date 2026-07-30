// Read-only adapters for assets that live outside the Core Pack.
//
// Static assets owned by sibling skills stay with their semantic owner.
// Copying those bytes into the Core Pack would create a second source of truth,
// so these adapters index them in place.
//
// Contract for every adapter:
//   scan(absRootDir, { rootName, licenseState }) -> { items[], warnings[] }
// An item is an index entry minus the fields the indexer stamps (root, id
// prefixing is done here since ids must be stable across reindexes).
// Adapters never write, never hash (upstream owns those bytes), and must
// degrade to a warning rather than throwing when the upstream layout shifts.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

const WORD_SPLIT = /[^a-z0-9]+/;

/** Tokenize a filename into search tags: "impact-bass-1" -> [impact, bass]. */
export function tokenize(name) {
  return [
    ...new Set(
      String(name)
        .toLowerCase()
        .split(WORD_SPLIT)
        .filter((token) => token && token.length > 1 && !/^\d+$/.test(token)),
    ),
  ];
}

// --- sfx -------------------------------------------------------------------
// media-use/audio/assets/sfx/manifest.json is keyed by cue name; each entry has
// at least { file }. We reuse the cue name as the semantic tag source, which is
// better than the filename because it is already curated.

export function scanSfx(dir, { rootName, licenseState } = {}) {
  const warnings = [];
  const manifestPath = join(dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    return { items: [], warnings: [`${rootName}: no manifest.json at ${manifestPath}`] };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return { items: [], warnings: [`${rootName}: manifest.json is not valid JSON: ${error.message}`] };
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { items: [], warnings: [`${rootName}: manifest.json must contain an object`] };
  }

  const items = [];
  for (const [cue, entry] of Object.entries(manifest)) {
    const file = entry?.file;
    if (typeof file !== "string" || !file) {
      warnings.push(`${rootName}: cue "${cue}" has no file; skipped`);
      continue;
    }
    if (!existsSync(join(dir, file))) {
      warnings.push(`${rootName}: cue "${cue}" points at a missing file ${file}; skipped`);
      continue;
    }
    const tags = [...new Set([...tokenize(cue), ...tokenize(basename(file, extname(file)))])];
    items.push({
      id: `${rootName}/${cue}`,
      type: "sfx",
      path: file,
      tags,
      ...(entry.description ? { description: String(entry.description) } : {}),
      ...(entry.duration != null && Number.isFinite(Number(entry.duration))
        ? { duration: Number(entry.duration) }
        : {}),
      license_state: licenseState || null,
      license_origin: "media-use bundled SFX (see media-use/audio/assets/sfx/CREDITS.md)",
    });
  }
  return { items, warnings };
}

// --- palette ---------------------------------------------------------------
// vidmuse-design/data/palettes/*.md holds fenced blocks of hex rows, one
// palette per line. Parsing markdown is admittedly coarse, but it keeps
// vidmuse-design as the owner. Nine files of coarse parsing is an
// acceptable trade against duplicating the values; a parse miss surfaces as a
// warning so a layout change is visible rather than silently dropping colors.

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

export function parsePaletteMarkdown(content) {
  const rows = [];
  const lines = content.split("\n");
  let heading = null;
  let intent = null;
  let fenced = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (!fenced && line.startsWith("#")) {
      heading = line.replace(/^#+\s*/, "").trim() || heading;
      continue;
    }
    // First non-empty prose line after the title states the use case
    // ("Tech, finance, luxury, cinematic content.") — good tag material.
    if (!fenced && line && !line.startsWith("#") && !intent) {
      intent = line.replace(/\.$/, "");
      continue;
    }
    if (!line) continue;
    const colors = line.match(HEX);
    if (colors && colors.length >= 2) {
      rows.push(colors.map((hex) => hex.toUpperCase()));
    }
  }
  return { heading, intent, rows };
}

export function scanPalettes(dir, { rootName, licenseState } = {}) {
  const warnings = [];
  if (!existsSync(dir)) {
    return { items: [], warnings: [`${rootName}: palette directory not found at ${dir}`] };
  }
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  if (files.length === 0) {
    return { items: [], warnings: [`${rootName}: no .md palettes found in ${dir}`] };
  }

  const items = [];
  for (const file of files) {
    const slug = basename(file, ".md");
    let parsed;
    try {
      parsed = parsePaletteMarkdown(readFileSync(join(dir, file), "utf8"));
    } catch (error) {
      warnings.push(`${rootName}: cannot read ${file}: ${error.message}`);
      continue;
    }
    if (parsed.rows.length === 0) {
      warnings.push(
        `${rootName}: ${file} yielded no hex rows — the upstream palette format may have changed`,
      );
      continue;
    }
    parsed.rows.forEach((colors, index) => {
      items.push({
        id: `${rootName}/${slug}/${index + 1}`,
        type: "palette",
        path: file,
        tags: [...new Set([...tokenize(slug), ...tokenize(parsed.intent || "")])],
        ...(parsed.heading ? { group: parsed.heading } : {}),
        value: colors,
        license_state: licenseState || null,
        license_origin: "VidMuse Design palette seeds",
      });
    });
  }
  return { items, warnings };
}

export const ADAPTERS = {
  sfx: scanSfx,
  palette: scanPalettes,
};

export function getAdapter(name) {
  return ADAPTERS[name] || null;
}
