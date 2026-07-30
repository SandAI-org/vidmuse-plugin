#!/usr/bin/env node

// Core Pack: ledger, index, and query surface for preinstalled assets.
//
// Three files, three jobs — the v1 layout collapsed all of them into one
// manifest, which is why a 1500-icon set would have meant 1500 hand-written
// records with 1500 duplicate license notices:
//
//   packs/<id>/pack.json  LEDGER. Hand-written, audited. One license + one
//                         upstream version per pack, plus per-file hashes.
//   index.json            DERIVED. Written by --reindex, never by hand. The
//                         only file the query path and the provider read.
//   packs/<id>/tags.json  SEMANTIC. Optional. Survives --reindex, which is why
//                         it lives beside the pack instead of inside index.json.
//
// types.json declares which types exist and how each is discovered. Adding a
// type (maps, shapes, whatever comes next) is a data change there, not a code
// change here.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { getAdapter } from "./lib/core_pack_adapters.mjs";
import { mechanicalTags, runProbe } from "./lib/core_pack_probe.mjs";
import { queryIndex } from "./lib/core_pack_query.mjs";
import {
  clearTypeCache,
  DEFAULT_CORE_PACK_ROOT,
  discoveryFor,
  loadTypes,
  ownedTypeNames,
  typeNames,
  typeSpec,
} from "./lib/core_pack_types.mjs";

export const DEFAULT_ROOT = DEFAULT_CORE_PACK_ROOT;
export const MANIFEST_SCHEMA = "vidmuse.core-pack.v2";
export const PACK_SCHEMA = "vidmuse.core-pack.pack.v1";
export const INDEX_SCHEMA = "vidmuse.core-pack.index.v1";

const LICENSE_STATES = new Set([
  "verified-commercial",
  "verified-personal",
  "user-licensed",
  "unknown",
  "no-redistribution",
]);
const SKIP_FILES = new Set(["pack.json", "tags.json", "README.md", ".DS_Store"]);

function inside(root, path) {
  const full = pathResolve(root, path);
  return full === root || full.startsWith(`${root}/`);
}

function isText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256String(text) {
  return createHash("sha256").update(text).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJsonAtomic(path, value) {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(tmp, path);
}

// --- manifest / pack validation --------------------------------------------

export function validateManifest(manifest, root = DEFAULT_ROOT) {
  const errors = [];
  const err = (message) => errors.push(message);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["manifest must be a JSON object"];
  }
  if (manifest.schema !== MANIFEST_SCHEMA) {
    err(`schema must equal ${MANIFEST_SCHEMA}`);
  }
  if (!manifest.roots || typeof manifest.roots !== "object" || Array.isArray(manifest.roots)) {
    err("roots object is required");
  } else {
    if (!manifest.roots["core-pack"]) err("roots must declare the owned core-pack root");
    for (const [name, spec] of Object.entries(manifest.roots)) {
      if (typeof spec?.path !== "string" || !spec.path) {
        err(`roots.${name}: path is required`);
      }
      if (typeof spec?.owned !== "boolean") {
        err(`roots.${name}: owned must be a boolean`);
      }
      if (spec?.owned === false) {
        if (!spec.adapter) err(`roots.${name}: an external root needs an adapter`);
        else if (!getAdapter(spec.adapter)) err(`roots.${name}: unknown adapter ${spec.adapter}`);
        if (spec.license_state && !LICENSE_STATES.has(spec.license_state)) {
          err(`roots.${name}: unsupported license_state ${spec.license_state}`);
        }
      }
      // An external root must never be written to. Enforced structurally by
      // never calling a write path on it, and flagged here so a future edit
      // that marks the owned root as external is caught.
      if (spec?.owned === true && name !== "core-pack") {
        err(`roots.${name}: only core-pack may be owned`);
      }
    }
  }
  if (!Array.isArray(manifest.packs)) err("packs must be an array");
  return errors;
}

export function validatePack(pack, packDir, { root = DEFAULT_ROOT, verifyHashes = false } = {}) {
  const errors = [];
  const err = (message) => errors.push(message);
  const where = pack?.id || relative(root, packDir);

  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    return [`${where}: pack.json must be a JSON object`];
  }
  if (pack.schema !== PACK_SCHEMA) err(`${where}: schema must equal ${PACK_SCHEMA}`);
  if (typeof pack.id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(pack.id)) {
    err(`${where}: id must be a lowercase slug`);
  }
  if (pack.id && basename(packDir) !== pack.id) {
    err(`${where}: pack directory name must equal its id (${basename(packDir)} != ${pack.id})`);
  }

  let spec = null;
  try {
    spec = typeSpec(pack.type, root);
  } catch (error) {
    err(`${where}: cannot load type registry: ${error.message}`);
  }
  if (!spec) {
    err(`${where}: unsupported type ${String(pack.type)} (known: ${safeTypeNames(root).join(", ")})`);
  } else if (spec.external_root) {
    err(`${where}: type ${pack.type} is indexed from ${spec.external_root}, not redistributed here`);
  }

  const license = pack.license;
  if (!license || typeof license !== "object") {
    err(`${where}: license block is required`);
  } else {
    if (license.redistributable !== true) err(`${where}: license.redistributable must be true`);
    if (license.commercial_output !== true) err(`${where}: license.commercial_output must be true`);
    if (typeof license.receipt !== "string" || !license.receipt.trim()) {
      err(`${where}: license.receipt is required`);
    } else if (!inside(packDir, license.receipt)) {
      err(`${where}: license receipt must stay inside the pack`);
    } else if (!existsSync(join(packDir, license.receipt))) {
      err(`${where}: license receipt does not exist: ${license.receipt}`);
    }
  }

  if (!pack.upstream || typeof pack.upstream !== "object") {
    err(`${where}: upstream provenance is required (npm+version, or url+ref)`);
  } else {
    const { npm, version, url, ref } = pack.upstream;
    const pinned = (npm && version) || (url && ref) || pack.upstream.self === true;
    if (!pinned) {
      err(`${where}: upstream must pin a version — npm+version, url+ref, or self: true for own work`);
    }
  }

  if (!Array.isArray(pack.files)) {
    err(`${where}: files must be an array`);
    return errors;
  }

  const seen = new Set();
  for (const [index, entry] of pack.files.entries()) {
    const at = `${where}[${index}]`;
    if (!entry || typeof entry !== "object") {
      err(`${at}: file entry must be an object`);
      continue;
    }
    if (typeof entry.path !== "string" || !entry.path.trim()) {
      err(`${at}: path is required`);
      continue;
    }
    if (seen.has(entry.path)) err(`${at}: duplicate path ${entry.path}`);
    seen.add(entry.path);
    if (!inside(packDir, entry.path)) {
      err(`${at}: path must stay inside the pack`);
      continue;
    }
    const full = join(packDir, entry.path);
    if (!existsSync(full)) {
      err(`${at}: file does not exist: ${entry.path}`);
      continue;
    }
    if (!/^[a-f0-9]{64}$/.test(String(entry.sha256 || ""))) {
      err(`${at}: sha256 must be a lowercase 64-character digest`);
      continue;
    }
    if (spec && !spec.extensions.includes(extname(entry.path).toLowerCase())) {
      err(
        `${at}: extension ${extname(entry.path)} is not declared for type ${pack.type} (${spec.extensions.join(", ")})`,
      );
    }
    // Hashing every file on every validate is what made v1 slow at scale.
    // Structure is checked always; bytes only under --verify-hashes.
    if (verifyHashes && sha256(full) !== entry.sha256) {
      err(`${at}: sha256 does not match file bytes: ${entry.path}`);
    }
  }

  if (spec?.size_budget_kb) {
    // A pack may raise its own ceiling, but only with a stated reason. CJK
    // fonts carry thousands of glyphs and cannot physically meet a budget set
    // for Latin faces; making that an explicit, reviewable override keeps the
    // guardrail tight for everything else instead of loosening it globally.
    const override = pack.size_budget_kb;
    let budget = spec.size_budget_kb;
    if (override != null) {
      if (typeof override !== "number" || override <= spec.size_budget_kb) {
        err(
          `${where}: size_budget_kb must be a number greater than the ${spec.size_budget_kb}KB ${pack.type} default`,
        );
      } else if (!isText(pack.size_budget_reason)) {
        err(`${where}: size_budget_kb requires size_budget_reason explaining why`);
      } else {
        budget = override;
      }
    }
    const over = [];
    for (const entry of pack.files) {
      if (typeof entry?.path !== "string") continue;
      const full = join(packDir, entry.path);
      if (!existsSync(full)) continue;
      const kb = statSync(full).size / 1024;
      if (kb > budget) over.push(`${entry.path} (${Math.round(kb)}KB)`);
    }
    if (over.length > 0) {
      err(
        `${where}: ${over.length} file(s) exceed the ${budget}KB ${pack.type} budget: ${over.slice(0, 3).join(", ")}${over.length > 3 ? ", …" : ""}`,
      );
    }
  }
  if (spec?.requires_alpha) {
    const opaque = (pack.files || []).filter((entry) => entry?.geometry?.alpha === false);
    if (opaque.length > 0) {
      err(
        `${where}: type ${pack.type} requires alpha; ${opaque.length} file(s) have none: ${opaque
          .slice(0, 3)
          .map((entry) => entry.path)
          .join(", ")}`,
      );
    }
  }

  return errors;
}

function safeTypeNames(root) {
  try {
    return typeNames(root);
  } catch {
    return [];
  }
}

// --- pack discovery ---------------------------------------------------------

export function listPackDirs(root = DEFAULT_ROOT) {
  const packsRoot = join(root, "packs");
  if (!existsSync(packsRoot)) return [];
  return readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packsRoot, entry.name))
    .filter((dir) => existsSync(join(dir, "pack.json")))
    .sort();
}

/**
 * Chinese query lexicon, shared by every pack. Optional: a missing file just
 * means no expansion, never an error.
 */
export function readLexicon(root = DEFAULT_ROOT) {
  const path = join(root, "lexicon-zh.json");
  if (!existsSync(path)) return null;
  try {
    const doc = readJson(path);
    return doc?.schema === "vidmuse.core-pack.lexicon.v1" ? doc : null;
  } catch {
    return null;
  }
}

function readTags(packDir) {
  const path = join(packDir, "tags.json");
  if (!existsSync(path)) return {};
  try {
    const doc = readJson(path);
    return doc && typeof doc === "object" && !Array.isArray(doc) ? doc.files || doc : {};
  } catch {
    return {};
  }
}

// --- ingest -----------------------------------------------------------------

/**
 * Scan a pack directory, probe every file, and rewrite pack.json's files array
 * with fresh hashes and geometry. Preserves hand-authored fields on pack.json
 * (id/type/license/upstream/tags) — ingest owns the file list, a human owns the
 * ledger's meaning.
 */
export function ingestPack(packDir, { root = DEFAULT_ROOT } = {}) {
  const packPath = join(packDir, "pack.json");
  if (!existsSync(packPath)) throw new Error(`missing ${packPath}`);
  const pack = readJson(packPath);
  const spec = typeSpec(pack.type, root);
  if (!spec) {
    throw new Error(
      `pack ${pack.id || basename(packDir)} declares unknown type ${String(pack.type)}`,
    );
  }

  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (SKIP_FILES.has(entry.name)) continue;
      const rel = relative(packDir, full);
      // License receipts and other prose stay out of the file list.
      if (rel === pack.license?.receipt) continue;
      if (!spec.extensions.includes(extname(entry.name).toLowerCase())) continue;
      found.push(rel);
    }
  };
  walk(packDir);

  const files = found.map((rel) => {
    const full = join(packDir, rel);
    const geometry = runProbe(spec.probe || "none", full);
    return {
      path: rel,
      sha256: sha256(full),
      bytes: statSync(full).size,
      ...(Object.keys(geometry).length > 0 ? { geometry } : {}),
    };
  });

  const next = { ...pack, schema: PACK_SCHEMA, files };
  writeJsonAtomic(packPath, next);
  return { pack: next, count: files.length };
}

// --- reindex ----------------------------------------------------------------

/**
 * Rebuild index.json from every root. Owned packs contribute their ledger plus
 * semantic tags; external roots contribute through their adapter.
 *
 * built_from records each pack ledger's hash so --validate can tell a stale
 * index from a fresh one without rescanning bytes.
 */
export function buildIndex(root = DEFAULT_ROOT) {
  const manifest = readJson(join(root, "manifest.json"));
  const items = [];
  const warnings = [];
  const builtFrom = {};
  // License, upstream pin, and HF usage guidance are constant per pack or per
  // type. Repeating them on every item cost ~310 bytes each, which at 2000+
  // icons made the index larger than the assets it indexes. They are normalized
  // into these headers and rejoined by resolveIndexItem().
  const packHeaders = {};
  const typeHeaders = {};

  for (const packDir of listPackDirs(root)) {
    const packPath = join(packDir, "pack.json");
    let pack;
    try {
      pack = readJson(packPath);
    } catch (error) {
      warnings.push(`${relative(root, packPath)}: ${error.message}`);
      continue;
    }
    const spec = typeSpec(pack.type, root);
    if (!spec) {
      warnings.push(`pack ${pack.id}: unknown type ${String(pack.type)}; skipped`);
      continue;
    }
    builtFrom[pack.id] = sha256String(JSON.stringify(pack));
    const semantic = readTags(packDir);
    const packRel = relative(root, packDir);
    packHeaders[pack.id] = {
      type: pack.type,
      license_state: "verified-commercial",
      license: {
        spdx: pack.license?.spdx || null,
        receipt: join(packRel, pack.license?.receipt || ""),
        attribution_required: pack.license?.attribution_required === true,
      },
      upstream: pack.upstream || null,
      // A subsetting or coverage limitation must travel with the asset all the
      // way to the composition author; an uncovered glyph is a visible defect.
      ...(pack.coverage ? { coverage: pack.coverage } : {}),
    };
    if (!typeHeaders[pack.type]) {
      typeHeaders[pack.type] = {
        ...(spec.hf_usage ? { hf_usage: spec.hf_usage } : {}),
        ...(spec.usage_contract ? { usage_contract: spec.usage_contract } : {}),
      };
    }

    for (const entry of pack.files || []) {
      if (typeof entry?.path !== "string") continue;
      const extra = semantic[entry.path] || {};
      const tags = [
        ...new Set([
          ...mechanicalTags(entry.path, { pack: pack.id, type: pack.type }),
          ...(Array.isArray(pack.tags) ? pack.tags : []),
          ...(Array.isArray(extra.tags) ? extra.tags : []),
        ]),
      ];
      items.push({
        id: `${pack.id}/${basename(entry.path, extname(entry.path))}`,
        root: "core-pack",
        pack: pack.id,
        type: pack.type,
        path: join(packRel, entry.path),
        tags,
        ...(Array.isArray(extra.aliases_zh) ? { aliases_zh: extra.aliases_zh } : {}),
        ...(extra.description ? { description: extra.description } : {}),
        ...(entry.geometry ? { geometry: entry.geometry } : {}),
        ...(entry.bytes != null ? { bytes: entry.bytes } : {}),
      });
    }
  }

  for (const [rootName, rootSpec] of Object.entries(manifest.roots || {})) {
    if (rootSpec?.owned !== false) continue;
    const adapter = getAdapter(rootSpec.adapter);
    if (!adapter) {
      warnings.push(`root ${rootName}: unknown adapter ${rootSpec.adapter}; skipped`);
      continue;
    }
    const dir = pathResolve(root, rootSpec.path);
    const scan = adapter(dir, {
      rootName,
      licenseState: rootSpec.license_state || null,
    });
    warnings.push(...(scan.warnings || []));
    for (const item of scan.items || []) {
      const spec = typeSpec(item.type, root);
      if (spec && !typeHeaders[item.type]) {
        typeHeaders[item.type] = {
          ...(spec.hf_usage ? { hf_usage: spec.hf_usage } : {}),
          ...(spec.usage_contract ? { usage_contract: spec.usage_contract } : {}),
        };
      }
      // Paths from an external root stay relative to that root; the provider
      // resolves them through manifest.roots so nothing here assumes layout.
      items.push({ ...item, root: rootName });
    }
  }

  items.sort((a, b) => a.id.localeCompare(b.id));
  const byType = {};
  for (const item of items) byType[item.type] = (byType[item.type] || 0) + 1;

  return {
    index: {
      schema: INDEX_SCHEMA,
      generated_by: "core_pack.mjs --reindex",
      built_from: builtFrom,
      counts: { total: items.length, by_type: byType },
      packs: packHeaders,
      types: typeHeaders,
      items,
    },
    warnings,
  };
}

/**
 * Rejoin an item with its pack and type headers.
 *
 * Consumers must call this rather than reading a raw item: license state,
 * upstream pin, and HF usage guidance live in the headers, and an item alone
 * does not carry them.
 */
export function resolveIndexItem(index, item) {
  if (!item) return null;
  const pack = item.pack ? index?.packs?.[item.pack] : null;
  const type = index?.types?.[item.type] || null;
  return {
    ...(pack || {}),
    ...(type || {}),
    ...item,
    // An external root supplies its own license_state; only fall back to the
    // pack header when the item did not state one.
    license_state: item.license_state ?? pack?.license_state ?? null,
  };
}

export function writeIndex(root = DEFAULT_ROOT) {
  const { index, warnings } = buildIndex(root);
  writeJsonAtomic(join(root, "index.json"), index);
  return { index, warnings };
}

/** Is index.json in sync with the pack ledgers on disk? */
export function indexFreshness(root = DEFAULT_ROOT) {
  const indexPath = join(root, "index.json");
  if (!existsSync(indexPath)) return { fresh: false, reason: "index.json does not exist" };
  let index;
  try {
    index = readJson(indexPath);
  } catch (error) {
    return { fresh: false, reason: `index.json is not valid JSON: ${error.message}` };
  }
  if (index?.schema !== INDEX_SCHEMA) {
    return { fresh: false, reason: `index.json schema must equal ${INDEX_SCHEMA}` };
  }
  const recorded = index.built_from || {};
  const current = {};
  for (const packDir of listPackDirs(root)) {
    try {
      const pack = readJson(join(packDir, "pack.json"));
      current[pack.id] = sha256String(JSON.stringify(pack));
    } catch {
      return { fresh: false, reason: `unreadable pack.json in ${relative(root, packDir)}` };
    }
  }
  for (const [id, hash] of Object.entries(current)) {
    if (!recorded[id]) return { fresh: false, reason: `pack ${id} is not in the index` };
    if (recorded[id] !== hash) return { fresh: false, reason: `pack ${id} changed since reindex` };
  }
  for (const id of Object.keys(recorded)) {
    if (!current[id]) return { fresh: false, reason: `indexed pack ${id} no longer exists` };
  }
  return { fresh: true, reason: "" };
}

// --- validate ---------------------------------------------------------------

export function validateCorePack(root = DEFAULT_ROOT, { verifyHashes = false } = {}) {
  const errors = [];
  const manifestPath = join(root, "manifest.json");
  if (!existsSync(manifestPath)) return [`missing ${manifestPath}`];
  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    return [`cannot read ${manifestPath}: ${error.message}`];
  }
  errors.push(...validateManifest(manifest, root));
  try {
    loadTypes(root);
  } catch (error) {
    errors.push(error.message);
    return errors;
  }

  const declared = new Set(
    (Array.isArray(manifest.packs) ? manifest.packs : []).map((entry) =>
      typeof entry === "string" ? entry : entry?.id,
    ),
  );
  const onDisk = new Set();
  for (const packDir of listPackDirs(root)) {
    let pack;
    try {
      pack = readJson(join(packDir, "pack.json"));
    } catch (error) {
      errors.push(`${relative(root, packDir)}/pack.json: ${error.message}`);
      continue;
    }
    onDisk.add(pack.id);
    errors.push(...validatePack(pack, packDir, { root, verifyHashes }));
  }
  for (const id of declared) {
    if (id && !onDisk.has(id)) errors.push(`manifest.packs lists ${id}, which has no pack directory`);
  }
  for (const id of onDisk) {
    if (!declared.has(id)) errors.push(`pack ${id} exists on disk but is not listed in manifest.packs`);
  }

  const freshness = indexFreshness(root);
  if (!freshness.fresh && (onDisk.size > 0 || existsSync(join(root, "index.json")))) {
    errors.push(`index is stale (${freshness.reason}) — run core_pack.mjs --reindex`);
  }
  return errors;
}

// --- inventory --------------------------------------------------------------

export function inventory(root = DEFAULT_ROOT) {
  const manifest = readJson(join(root, "manifest.json"));
  const registry = loadTypes(root);
  const indexPath = join(root, "index.json");
  const index = existsSync(indexPath) ? readJson(indexPath) : { items: [] };
  const items = Array.isArray(index.items) ? index.items : [];

  const rows = typeNames(root).map((type) => {
    const spec = registry.types[type];
    const matching = items.filter((item) => item.type === type);
    return {
      type,
      discovery: spec.discovery,
      count: matching.length,
      roots: [...new Set(matching.map((item) => item.root))],
      source: spec.external_root ? `${spec.external_root} (read-only)` : "core-pack",
      owned: !spec.external_root,
    };
  });

  return {
    version: manifest.version,
    status: manifest.status,
    total: items.length,
    types: rows,
    // Surfaced so an agent reading the inventory sees the whole asset picture,
    // including what deliberately is not indexed here.
    not_indexed: registry.not_indexed || {},
    roots: Object.fromEntries(
      Object.entries(manifest.roots || {}).map(([name, spec]) => [
        name,
        { owned: spec.owned === true, path: spec.path, adapter: spec.adapter || null },
      ]),
    ),
  };
}

// --- contact sheet ----------------------------------------------------------

/**
 * Render a contact sheet for the candidate set so the agent can look once and
 * pick a cell. Built on demand and cached by candidate-set hash: a committed
 * per-pack sheet does not scale past a few dozen files, and the useful sheet is
 * of the CANDIDATES, not of the pack.
 */
export function sheetFor(root, results, { columns = 4 } = {}) {
  // ffmpeg ships no SVG decoder, so a sheet is only meaningful for raster
  // types. That is also where it is actually needed: sheet discovery exists
  // because "noise-fine" vs "grain-heavy" cannot be told apart from metadata.
  // Vector types are small, named, and tagged — keyword discovery serves them.
  const rasterOnly = results.filter((row) => !row.item.path.toLowerCase().endsWith(".svg"));
  const skipped = results.length - rasterOnly.length;
  if (rasterOnly.length === 0) {
    return {
      ok: false,
      reason:
        skipped > 0
          ? `all ${skipped} candidate(s) are SVG; contact sheets cover raster types (texture, overlay). Read the paths directly or query by tag instead.`
          : "no candidate files on disk",
    };
  }
  results = rasterOnly;
  const paths = results
    .map((row) => join(root, row.item.path))
    .filter((path) => existsSync(path));
  if (paths.length === 0) return { ok: false, reason: "no candidate files on disk" };

  const key = sha256String(paths.join("\n")).slice(0, 16);
  const cacheDir = join(root, ".cache", "sheets");
  const out = join(cacheDir, `${key}.png`);
  const cells = results.map((row, index) => ({
    cell: index + 1,
    id: row.item.id,
    path: row.item.path,
  }));
  if (existsSync(out)) return { ok: true, path: out, cached: true, columns, cells };

  mkdirSync(cacheDir, { recursive: true });
  const cols = Math.min(columns, paths.length);
  const rows = Math.ceil(paths.length / cols);
  const args = [];
  for (const path of paths) args.push("-i", path);
  // Every tile is letterboxed onto an identical CELL x CELL canvas, so the grid
  // is laid out with explicit pixel offsets. xstack's `w0*n` expressions are not
  // portable across ffmpeg builds; fixed offsets are unambiguous and let cell
  // index map to array index exactly, which is what `cells` promises the agent.
  const layout = paths
    .map((_, i) => `${(i % cols) * CELL}_${Math.floor(i / cols) * CELL}`)
    .join("|");
  const scale = paths
    .map(
      (_, i) =>
        `[${i}:v]scale=${CELL}:${CELL}:force_original_aspect_ratio=decrease,pad=${CELL}:${CELL}:-1:-1:color=0x202020,setsar=1[t${i}]`,
    )
    .join(";");
  const stacked =
    paths.length === 1
      ? `${scale};[t0]copy[out]`
      : `${scale};${paths.map((_, i) => `[t${i}]`).join("")}xstack=inputs=${paths.length}:layout=${layout}:fill=0x202020[out]`;
  args.push("-filter_complex", stacked, "-map", "[out]", "-frames:v", "1", "-y", out);
  try {
    execFileSyncQuiet("ffmpeg", args);
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim().split("\n").pop() : error.message;
    return { ok: false, reason: `ffmpeg could not build the sheet: ${detail}` };
  }
  return { ok: true, path: out, cached: false, columns: cols, rows, cells };
}

const CELL = 320;

function execFileSyncQuiet(cmd, args) {
  return execFileSync(cmd, args, { stdio: ["ignore", "ignore", "pipe"], timeout: 60000 });
}

// --- CLI --------------------------------------------------------------------

export function runCli(argv = process.argv.slice(2)) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        root: { type: "string", default: DEFAULT_ROOT },
        ingest: { type: "string" },
        reindex: { type: "boolean", default: false },
        validate: { type: "boolean", default: false },
        "verify-hashes": { type: "boolean", default: false },
        inventory: { type: "boolean", default: false },
        query: { type: "string" },
        type: { type: "string" },
        pack: { type: "string" },
        top: { type: "string", default: "10" },
        tileable: { type: "boolean" },
        alpha: { type: "boolean" },
        sheet: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
      strict: true,
    }));
  } catch (error) {
    console.error(`error: ${error.message}`);
    return 1;
  }

  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const root = pathResolve(values.root);
  clearTypeCache();

  try {
    if (values.ingest) return cmdIngest(root, values);
    if (values.reindex) return cmdReindex(root, values);
    if (values.inventory) return cmdInventory(root, values);
    if (values.query != null) return cmdQuery(root, values);
    return cmdValidate(root, values);
  } catch (error) {
    if (values.json) console.log(JSON.stringify({ ok: false, error: error.message }));
    else console.error(`error: ${error.message}`);
    return 1;
  }
}

const USAGE = `Usage: node core_pack.mjs [command] [options]

Commands
  --validate                 structure + freshness check (default)
    --verify-hashes          also re-hash every owned file
  --ingest <pack-dir>        rehash + reprobe one pack, rewrite its files array
  --reindex                  rebuild index.json from every root
  --inventory                every asset type, count, and source
  --query <text>             ranked candidates
    --type <t> --pack <p>    filters
    --top <n>                cap for keyword/sheet modes (default 10)
    --tileable / --alpha     geometry filters
    --sheet                  also render a contact sheet of the candidates

Options
  --root <dir>               Core Pack root
  --json                     machine-readable output`;

function cmdIngest(root, values) {
  const packDir = pathResolve(values.ingest);
  if (!inside(join(root, "packs"), packDir)) {
    console.error(`error: --ingest must target a directory under ${join(root, "packs")}`);
    return 1;
  }
  const { pack, count } = ingestPack(packDir, { root });
  const errors = validatePack(pack, packDir, { root, verifyHashes: false });
  const { warnings } = writeIndex(root);
  if (values.json) {
    console.log(JSON.stringify({ ok: errors.length === 0, pack: pack.id, files: count, errors, warnings }));
  } else {
    console.log(`ingested ${pack.id}: ${count} file(s)`);
    for (const warning of warnings) console.error(`WARN ${warning}`);
    for (const error of errors) console.error(`FAIL ${error}`);
  }
  return errors.length === 0 ? 0 : 1;
}

function cmdReindex(root, values) {
  const { index, warnings } = writeIndex(root);
  if (values.json) {
    console.log(JSON.stringify({ ok: true, counts: index.counts, warnings }));
  } else {
    console.log(
      `reindexed: ${index.counts.total} item(s) — ${Object.entries(index.counts.by_type)
        .map(([type, count]) => `${type} ${count}`)
        .join(", ") || "none"}`,
    );
    for (const warning of warnings) console.error(`WARN ${warning}`);
  }
  return 0;
}

function cmdValidate(root, values) {
  const errors = validateCorePack(root, { verifyHashes: values["verify-hashes"] });
  const packs = listPackDirs(root).length;
  if (values.json) {
    console.log(JSON.stringify({ ok: errors.length === 0, packs, errors }));
  } else if (errors.length > 0) {
    for (const error of errors) console.error(`FAIL ${error}`);
    console.error(`error: ${errors.length} Core Pack violation(s)`);
  } else {
    const index = existsSync(join(root, "index.json")) ? readJson(join(root, "index.json")) : null;
    console.log(
      `ok: Core Pack — ${packs} pack(s), ${index?.counts?.total ?? 0} indexed item(s)${values["verify-hashes"] ? " (hashes verified)" : ""}`,
    );
  }
  return errors.length === 0 ? 0 : 1;
}

function cmdInventory(root, values) {
  const report = inventory(root);
  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }
  console.log(`Core Pack ${report.version} (${report.status}) — ${report.total} indexed item(s)\n`);
  const width = Math.max(...report.types.map((row) => row.type.length), 4);
  console.log(`${"type".padEnd(width)}  count  discovery  source`);
  for (const row of report.types) {
    console.log(
      `${row.type.padEnd(width)}  ${String(row.count).padStart(5)}  ${row.discovery.padEnd(9)}  ${row.source}`,
    );
  }
  console.log("\nNot indexed here:");
  for (const [type, why] of Object.entries(report.not_indexed)) {
    console.log(`  ${type} — ${why}`);
  }
  return 0;
}

function cmdQuery(root, values) {
  const indexPath = join(root, "index.json");
  if (!existsSync(indexPath)) {
    const message = "index.json does not exist — run core_pack.mjs --reindex";
    if (values.json) console.log(JSON.stringify({ ok: false, error: message }));
    else console.error(`error: ${message}`);
    return 1;
  }
  const index = readJson(indexPath);
  const mode = values.type ? discoveryFor(values.type, root) || "keyword" : "keyword";
  if (values.type && !typeNames(root).includes(values.type)) {
    const message = `unknown type ${values.type} (known: ${typeNames(root).join(", ")})`;
    if (values.json) console.log(JSON.stringify({ ok: false, error: message }));
    else console.error(`error: ${message}`);
    return 1;
  }

  const result = queryIndex(index, {
    query: values.query,
    top: Number(values.top),
    mode,
    lexicon: readLexicon(root),
    ...(values.type ? { type: values.type } : {}),
    ...(values.pack ? { pack: values.pack } : {}),
    ...(values.tileable != null ? { tileable: values.tileable } : {}),
    ...(values.alpha != null ? { alpha: values.alpha } : {}),
  });

  let sheet = null;
  if (values.sheet && result.results.length > 0) {
    sheet = sheetFor(root, result.results);
  }

  if (values.json) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: result.mode,
        total: result.total,
        truncated: result.truncated,
        ...(sheet ? { sheet } : {}),
        results: result.results.map((row) => {
          const item = resolveIndexItem(index, row.item);
          return {
            id: item.id,
            type: item.type,
            path: item.path,
            root: item.root,
            score: row.score,
            why: row.reasons,
            license_state: item.license_state,
            ...(item.license ? { license: item.license } : {}),
            ...(item.value ? { value: item.value } : {}),
            ...(item.geometry ? { geometry: item.geometry } : {}),
            ...(item.hf_usage ? { hf_usage: item.hf_usage } : {}),
            ...(item.usage_contract ? { usage_contract: item.usage_contract } : {}),
          };
        }),
      }),
    );
    return 0;
  }

  if (result.results.length === 0) {
    console.log(`no match for "${values.query}"${values.type ? ` in type ${values.type}` : ""}`);
    return 0;
  }
  console.log(
    `${result.total} match(es)${result.truncated ? `, showing ${result.results.length}` : ""} — mode ${result.mode}\n`,
  );
  const caveats = new Set();
  for (const row of result.results) {
    const item = resolveIndexItem(index, row.item);
    const detail = item.value ? ` ${item.value.join(" ")}` : "";
    console.log(`${item.id}  [${item.type}]${detail}`);
    console.log(`  ${item.path}${row.score ? `  score ${row.score}` : ""}`);
    // In table mode the agent is choosing across the whole set, so the
    // description is the deciding information, not decoration.
    if (item.description) console.log(`  ${item.description}`);
    if (row.reasons?.length) console.log(`  why: ${row.reasons.join(", ")}`);
    if (item.usage_contract) console.log(`  contract: ${item.usage_contract}`);
    // A subset font renders uncovered characters as tofu boxes. That has to
    // reach whoever picks the font, not sit unread in the pack ledger.
    if (item.coverage?.note) caveats.add(`${item.pack}: ${item.coverage.note}`);
  }
  for (const caveat of caveats) console.log(`\ncoverage — ${caveat}`);
  if (sheet?.ok) {
    console.log(`\ncontact sheet: ${sheet.path} (${sheet.columns} columns, read it to pick a cell)`);
  } else if (sheet && !sheet.ok) {
    console.error(`WARN sheet unavailable: ${sheet.reason}`);
  }
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(pathResolve(process.argv[1])).href
) {
  process.exitCode = runCli();
}
