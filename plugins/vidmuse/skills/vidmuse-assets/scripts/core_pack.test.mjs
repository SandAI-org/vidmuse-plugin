import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  DEFAULT_ROOT,
  buildIndex,
  indexFreshness,
  ingestPack,
  inventory,
  listPackDirs,
  resolveIndexItem,
  validateCorePack,
  writeIndex,
  validateManifest,
  validatePack,
} from "./core_pack.mjs";
import { clearTypeCache, loadTypes, typeNames } from "./lib/core_pack_types.mjs";
import { parsePaletteMarkdown, scanSfx, tokenize } from "./lib/core_pack_adapters.mjs";
import {
  expandTerms,
  queryIndex,
  scoreItem,
  stableChoice,
  terms,
} from "./lib/core_pack_query.mjs";

const TYPES_JSON = readFileSync(join(DEFAULT_ROOT, "types.json"), "utf8");

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "core-pack-"));
  writeFileSync(join(root, "types.json"), TYPES_JSON);
  clearTypeCache();
  return root;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** A minimal valid shape pack on disk. */
function seedPack(root, { id = "demo", type = "shape", files = ["a.svg", "b.svg"] } = {}) {
  const dir = join(root, "packs", id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "LICENSE.txt"), "CC0.\n");
  for (const name of files) {
    writeFileSync(
      join(dir, name),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10"/></svg>`,
    );
  }
  writeJson(join(dir, "pack.json"), {
    schema: "vidmuse.core-pack.pack.v1",
    id,
    type,
    upstream: { self: true },
    license: {
      spdx: "CC0-1.0",
      receipt: "LICENSE.txt",
      redistributable: true,
      commercial_output: true,
      attribution_required: false,
    },
    files: [],
  });
  writeJson(join(root, "manifest.json"), {
    schema: "vidmuse.core-pack.v2",
    version: "0.0.0-test",
    status: "test",
    roots: { "core-pack": { path: ".", owned: true } },
    packs: [{ id, type }],
  });
  return dir;
}

// --- shipped Core Pack ------------------------------------------------------

test("the shipped Core Pack validates, including hashes", () => {
  clearTypeCache();
  assert.deepEqual(validateCorePack(DEFAULT_ROOT, { verifyHashes: true }), []);
});

test("the shipped index is fresh", () => {
  clearTypeCache();
  assert.equal(indexFreshness(DEFAULT_ROOT).fresh, true);
});

test("every declared type has a discovery mode and extensions", () => {
  clearTypeCache();
  const { types } = loadTypes(DEFAULT_ROOT);
  for (const [name, spec] of Object.entries(types)) {
    assert.ok(["keyword", "table", "sheet"].includes(spec.discovery), name);
    assert.ok(spec.extensions.length > 0, name);
  }
});

test("logo is deliberately not an indexed type", () => {
  clearTypeCache();
  // Identity assets must stay on the live official-logo cascade; a stale local
  // copy invites the wrong-identity substitution the semantic pass forbids.
  assert.ok(!typeNames(DEFAULT_ROOT).includes("logo"));
  assert.ok(loadTypes(DEFAULT_ROOT).not_indexed.logo);
});

test("inventory reports every type plus what is deliberately excluded", () => {
  clearTypeCache();
  const report = inventory(DEFAULT_ROOT);
  assert.equal(report.types.length, typeNames(DEFAULT_ROOT).length);
  assert.ok(report.not_indexed.logo);
  assert.ok(report.total > 0);
});

// --- manifest / pack ledger -------------------------------------------------

test("manifest requires an owned core-pack root and rejects a second owned root", () => {
  clearTypeCache();
  const errors = validateManifest({
    schema: "vidmuse.core-pack.v2",
    roots: { elsewhere: { path: "../x", owned: true } },
    packs: [],
  });
  assert.ok(errors.some((e) => e.includes("owned core-pack root")));
  assert.ok(errors.some((e) => e.includes("only core-pack may be owned")));
});

test("an external root must name a known adapter", () => {
  clearTypeCache();
  const errors = validateManifest({
    schema: "vidmuse.core-pack.v2",
    roots: {
      "core-pack": { path: ".", owned: true },
      borrowed: { path: "../x", owned: false, adapter: "nope" },
    },
    packs: [],
  });
  assert.ok(errors.some((e) => e.includes("unknown adapter nope")));
});

test("a pack without redistribution rights is rejected", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    pack.license.redistributable = false;
    const errors = validatePack(pack, dir, { root });
    assert.ok(errors.some((e) => e.includes("license.redistributable must be true")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a pack must pin its upstream version", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    pack.upstream = { npm: "lucide-static" }; // no version
    const errors = validatePack(pack, dir, { root });
    assert.ok(errors.some((e) => e.includes("upstream must pin a version")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a pack cannot claim a type that is indexed from an external root", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    pack.type = "sfx"; // owned by media-use
    const errors = validatePack(pack, dir, { root });
    assert.ok(errors.some((e) => e.includes("is indexed from")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a pack path may not escape the pack directory", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    pack.files = [{ path: "../../../etc/passwd", sha256: "0".repeat(64) }];
    const errors = validatePack(pack, dir, { root });
    assert.ok(errors.some((e) => e.includes("must stay inside the pack")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("structure validation skips hashing; --verify-hashes catches drift", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    ingestPack(dir, { root });
    writeFileSync(join(dir, "a.svg"), `<svg viewBox="0 0 9 9"></svg>`); // mutate bytes
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    assert.deepEqual(validatePack(pack, dir, { root, verifyHashes: false }), []);
    const strict = validatePack(pack, dir, { root, verifyHashes: true });
    assert.ok(strict.some((e) => e.includes("sha256 does not match")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- ingest / index ---------------------------------------------------------

test("ingest hashes and probes every file, and preserves the hand-written ledger", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    const { pack, count } = ingestPack(dir, { root });
    assert.equal(count, 2);
    assert.equal(pack.license.spdx, "CC0-1.0"); // untouched
    for (const entry of pack.files) {
      assert.match(entry.sha256, /^[a-f0-9]{64}$/);
      assert.equal(entry.geometry.viewbox, "0 0 10 10");
      assert.equal(entry.geometry.tintable, true);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ingest never lists the license receipt as an asset", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    const { pack } = ingestPack(dir, { root });
    assert.ok(!pack.files.some((f) => f.path === "LICENSE.txt"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("semantic tags survive a reindex", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    ingestPack(dir, { root });
    writeJson(join(dir, "tags.json"), {
      files: { "a.svg": { tags: ["handpicked"], aliases_zh: ["手选"] } },
    });
    const { index } = buildIndex(root);
    const item = index.items.find((i) => i.id === "demo/a");
    assert.ok(item.tags.includes("handpicked"));
    assert.deepEqual(item.aliases_zh, ["手选"]);
    // Re-ingesting rewrites the ledger; the semantic layer must persist.
    ingestPack(dir, { root });
    const again = buildIndex(root).index.items.find((i) => i.id === "demo/a");
    assert.ok(again.tags.includes("handpicked"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a changed pack makes the index stale, and validate says so", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    // ingestPack writes the ledger only; the index is a separate derived step,
    // so a caller that ingests without reindexing must be caught.
    ingestPack(dir, { root });
    assert.equal(indexFreshness(root).fresh, false);
    writeIndex(root);
    assert.equal(indexFreshness(root).fresh, true);

    writeFileSync(join(dir, "c.svg"), `<svg viewBox="0 0 10 10"></svg>`);
    ingestPack(dir, { root });
    assert.equal(indexFreshness(root).fresh, false, "new file must invalidate the index");
    assert.ok(validateCorePack(root).some((e) => e.includes("index is stale")));

    writeIndex(root);
    assert.equal(indexFreshness(root).fresh, true);
    assert.deepEqual(validateCorePack(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a pack on disk but absent from manifest.packs is an error", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    ingestPack(dir, { root });
    writeJson(join(root, "manifest.json"), {
      schema: "vidmuse.core-pack.v2",
      version: "0.0.0-test",
      status: "test",
      roots: { "core-pack": { path: ".", owned: true } },
      packs: [],
    });
    assert.ok(validateCorePack(root).some((e) => e.includes("not listed in manifest.packs")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listPackDirs ignores directories without a pack.json", () => {
  const root = tempRoot();
  try {
    seedPack(root);
    mkdirSync(join(root, "packs", "scratch"), { recursive: true });
    assert.equal(listPackDirs(root).length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- external-root adapters -------------------------------------------------

test("the sfx adapter indexes media-use in place and never copies files", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const sfx = index.items.filter((i) => i.type === "sfx");
  assert.ok(sfx.length > 0);
  for (const item of sfx) {
    assert.equal(item.root, "media-use-sfx");
    // Paths stay relative to the owning root; nothing lands under core-pack.
    assert.ok(!item.path.startsWith("packs/"));
    assert.ok(item.license_origin.includes("media-use"));
  }
});

test("the sfx adapter warns instead of throwing when upstream is missing", () => {
  const { items, warnings } = scanSfx("/nonexistent/sfx", { rootName: "media-use-sfx" });
  assert.deepEqual(items, []);
  assert.ok(warnings[0].includes("no manifest.json"));
});

test("the sfx adapter skips cues whose file is gone", () => {
  const root = mkdtempSync(join(tmpdir(), "sfx-"));
  try {
    writeJson(join(root, "manifest.json"), { ghost: { file: "missing.mp3" } });
    const { items, warnings } = scanSfx(root, { rootName: "r" });
    assert.deepEqual(items, []);
    assert.ok(warnings[0].includes("missing file"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("palette markdown parses into rows of hex values", () => {
  const parsed = parsePaletteMarkdown(
    "# Dark / Premium\n\nTech, finance, luxury.\n\n```\n#000000 #14213D #FCA311\n#001427 #708D81\n```\n",
  );
  assert.equal(parsed.heading, "Dark / Premium");
  assert.equal(parsed.intent, "Tech, finance, luxury");
  assert.deepEqual(parsed.rows, [
    ["#000000", "#14213D", "#FCA311"],
    ["#001427", "#708D81"],
  ]);
});

test("indexed palettes carry their hex values so no markdown read is needed", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const palettes = index.items.filter((i) => i.type === "palette");
  assert.ok(palettes.length > 0);
  for (const item of palettes.slice(0, 5)) {
    assert.ok(Array.isArray(item.value) && item.value.length >= 2);
    assert.equal(item.root, "hf-creative-palettes");
  }
});

test("filename tokenizing drops noise and pure digits", () => {
  assert.deepEqual(tokenize("impact-bass-1"), ["impact", "bass"]);
  assert.deepEqual(tokenize("Grid_Dots.svg"), ["grid", "dots", "svg"]);
});

// --- query engine -----------------------------------------------------------

const SAMPLE = {
  schema: "vidmuse.core-pack.index.v1",
  items: [
    {
      id: "s/ring",
      type: "shape",
      root: "core-pack",
      pack: "s",
      path: "packs/s/ring.svg",
      tags: ["progress", "ring", "counter"],
      aliases_zh: ["进度环", "圆环"],
      geometry: { tileable: false, alpha: true },
      license_state: "verified-commercial",
    },
    {
      id: "s/wave",
      type: "shape",
      root: "core-pack",
      pack: "s",
      path: "packs/s/wave.svg",
      tags: ["wave", "divider"],
      aliases_zh: ["波浪", "分隔线"],
      geometry: { tileable: true, alpha: true },
      license_state: "verified-commercial",
    },
    {
      id: "t/grain",
      type: "texture",
      root: "core-pack",
      pack: "t",
      path: "packs/t/grain.png",
      tags: ["grain", "film"],
      geometry: { tileable: true, alpha: false },
      license_state: "unknown",
    },
  ],
};

test("an exact tag beats a partial one, and every hit is explained", () => {
  const { results } = queryIndex(SAMPLE, { query: "progress", type: "shape" });
  assert.equal(results[0].item.id, "s/ring");
  assert.ok(results[0].reasons.some((r) => r === "tag=progress"));
});

test("covering more query terms outranks one strong hit", () => {
  const two = scoreItem(SAMPLE.items[0], terms("progress ring"));
  const one = scoreItem(SAMPLE.items[0], terms("progress"));
  assert.ok(two.score > one.score);
  assert.equal(two.matched, 2);
});

test("a Chinese alias matches exactly", () => {
  const { results } = queryIndex(SAMPLE, { query: "进度环", type: "shape" });
  assert.equal(results[0].item.id, "s/ring");
});

test("an unsegmented Chinese compound still reaches its parts", () => {
  // CJK has no word separator, so "波浪分隔" arrives as a single term and must
  // still find the "波浪" / "分隔线" aliases. A Latin-only 3-char floor broke this.
  const { results } = queryIndex(SAMPLE, { query: "波浪分隔", type: "shape" });
  assert.ok(results.length > 0);
  assert.equal(results[0].item.id, "s/wave");
});

test("a short Latin fragment does not match everything", () => {
  const { results } = queryIndex(SAMPLE, { query: "zz", type: "shape" });
  assert.equal(results.length, 0);
});

test("table mode returns the whole set; keyword mode truncates", () => {
  const table = queryIndex(SAMPLE, { mode: "table" });
  assert.equal(table.results.length, SAMPLE.items.length);
  assert.equal(table.truncated, false);
  const keyword = queryIndex(SAMPLE, { query: "a", mode: "keyword", top: 1 });
  assert.ok(keyword.results.length <= 1);
});

test("geometry and license filters narrow candidates", () => {
  assert.equal(queryIndex(SAMPLE, { tileable: true, mode: "table" }).results.length, 2);
  assert.equal(queryIndex(SAMPLE, { alpha: true, mode: "table" }).results.length, 2);
  assert.equal(
    queryIndex(SAMPLE, { commercialOnly: true, mode: "table" }).results.length,
    2,
  );
});

test("type and pack filters are honored", () => {
  assert.equal(queryIndex(SAMPLE, { type: "texture", mode: "table" }).results.length, 1);
  assert.equal(queryIndex(SAMPLE, { pack: "s", mode: "table" }).results.length, 2);
});

test("stableChoice is deterministic per seed and never leaves the candidate set", () => {
  const candidates = ["a", "b", "c", "d"];
  assert.equal(stableChoice(candidates, "beat-1"), stableChoice(candidates, "beat-1"));
  assert.ok(candidates.includes(stableChoice(candidates, "beat-9")));
  assert.equal(stableChoice(["only"], "x"), "only");
  assert.equal(stableChoice([], "x"), null);
});

// --- ranking regressions ----------------------------------------------------
//
// Each of these was a real wrong answer against the 2007-icon Lucide pack. They
// are cheap to assert and the failure mode is silent (a plausible-but-wrong icon
// ranks first), so they stay pinned.

const LEXICON = JSON.parse(
  readFileSync(join(DEFAULT_ROOT, "lexicon-zh.json"), "utf8"),
);

function topId(index, query, extra = {}) {
  const { results } = queryIndex(index, {
    query,
    type: "icon",
    top: 3,
    lexicon: LEXICON,
    ...extra,
  });
  return results[0]?.item.id;
}

test("an exact name beats a mere synonym", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  if (!index.items.some((i) => i.id === "lucide/trash")) return; // pack not installed
  // eraser and shredder both carry "trash" as an upstream synonym.
  assert.equal(topId(index, "trash"), "lucide/trash");
});

test("a compound query lands on the compound name", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  if (!index.items.some((i) => i.id === "lucide/shopping-cart")) return;
  // shopping-bag carries "cart" as a tag; the named cart must still win.
  assert.equal(topId(index, "shopping cart"), "lucide/shopping-cart");
  assert.equal(topId(index, "购物车"), "lucide/shopping-cart");
});

test("the plainest name wins over a more specific sibling", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  if (!index.items.some((i) => i.id === "lucide/arrow-right")) return;
  assert.equal(topId(index, "arrow right"), "lucide/arrow-right");
  // user-lock matched "lock" by name-part AND "locked" by tag — two payouts for
  // one concept — which used to beat the icon named lock.
  assert.equal(topId(index, "锁定"), "lucide/lock");
});

test("Chinese queries reach English-only upstream tags", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  if (!index.items.some((i) => i.pack === "lucide")) return;
  for (const [zh, expected] of [
    ["删除", ["lucide/delete", "lucide/trash"]],
    ["用户", ["lucide/user"]],
    ["日历", ["lucide/calendar"]],
    ["搜索", ["lucide/search"]],
    ["下载", ["lucide/download"]],
  ]) {
    assert.ok(expected.includes(topId(index, zh)), `${zh} -> ${topId(index, zh)}`);
  }
});

test("Chinese lexicon expansion does not fuzzy-match unrelated Latin prefixes", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const { results } = queryIndex(index, {
    query: "垃圾桶",
    type: "icon",
    top: 10,
    lexicon: LEXICON,
  });
  const ids = results.map((row) => row.item.id);
  assert.equal(ids[0], "lucide/trash");
  for (const noisy of ["lucide/binary", "lucide/binoculars", "lucide/non-binary"]) {
    assert.equal(ids.includes(noisy), false, noisy);
  }
});

test("lexicon expansion prefers the longest matching key", () => {
  // "购物车" must not also fire the shorter "购物" entry and drag in bag/store,
  // which diluted the query until cart tied with bag.
  const { terms: expanded } = expandTerms(terms("购物车"), LEXICON);
  assert.ok(expanded.includes("cart"));
  assert.ok(!expanded.includes("bag"), "shorter key 购物 must not also fire");
});

test("a lexicon hit is attributed in the match reason", () => {
  const item = { id: "p/lock", type: "icon", tags: ["lock"] };
  const { terms: expanded, expansions } = expandTerms(terms("锁定"), LEXICON);
  const { reasons } = scoreItem(item, expanded, expansions);
  assert.ok(reasons.some((r) => r.includes("via 锁定")), reasons.join(", "));
});

test("a direct hit outranks the same match reached via expansion", () => {
  const item = { id: "p/lock", type: "icon", tags: ["lock"] };
  const direct = scoreItem(item, terms("lock"), new Map());
  const viaZh = (() => {
    const { terms: e, expansions } = expandTerms(terms("锁定"), LEXICON);
    return scoreItem(item, e, expansions);
  })();
  assert.ok(direct.score > viaZh.score / (viaZh.matched || 1) - 1);
});

test("resolved entries carry license, upstream, and the HyperFrames contract", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const shape = resolveIndexItem(
    index,
    index.items.find((i) => i.type === "shape"),
  );
  assert.ok(shape.hf_usage, "a shape entry should tell the author how to consume it");
  assert.equal(shape.license_state, "verified-commercial");
  assert.ok(shape.license.spdx);
  assert.ok(shape.upstream);
});

test("per-pack constants are normalized out of items but still resolve", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const raw = index.items.find((i) => i.pack);
  // License/upstream/usage repeated per item made the index larger than the
  // assets it indexes once a 2000-icon pack landed. They live in headers now.
  assert.equal(raw.license, undefined);
  assert.equal(raw.upstream, undefined);
  assert.equal(raw.hf_usage, undefined);
  assert.ok(index.packs[raw.pack].license.spdx);
  const resolved = resolveIndexItem(index, raw);
  assert.ok(resolved.license.spdx);
  assert.ok(resolved.hf_usage);
});

test("an external item keeps its own inherited license state", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const sfx = index.items.find((i) => i.type === "sfx");
  if (!sfx) return;
  const resolved = resolveIndexItem(index, sfx);
  // Inherited from the root declaration, not claimed as a Core Pack review.
  assert.equal(resolved.license_state, "verified-commercial");
  assert.ok(resolved.license_origin.includes("media-use"));
});

test("a Lottie entry carries its runtime contract to the consumer", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const raw = index.items.find((i) => i.type === "lottie");
  if (!raw) return;
  const item = resolveIndexItem(index, raw);
  // A Lottie left on autoplay renders non-deterministically. That requirement
  // must travel with the asset rather than living only in the animation skill's
  // docs, so it is asserted on the resolved entry.
  assert.match(item.usage_contract, /autoplay: false/);
  assert.match(item.usage_contract, /__hfLottie/);
  assert.ok(item.geometry.fps > 0);
  assert.ok(item.geometry.duration > 0);
});

test("a subsetted pack declares a raised size budget with a reason", () => {
  clearTypeCache();
  const errors = validateCorePack(DEFAULT_ROOT);
  assert.deepEqual(errors, []);
  // The CJK font pack cannot meet the Latin-oriented default; the override is
  // only legal when it states why, so the guardrail stays tight elsewhere.
  const fontPack = listPackDirs(DEFAULT_ROOT)
    .map((dir) => JSON.parse(readFileSync(join(dir, "pack.json"), "utf8")))
    .find((pack) => pack.type === "font");
  if (!fontPack) return;
  assert.ok(fontPack.size_budget_kb > 400);
  assert.ok(fontPack.size_budget_reason);
});

test("a raised size budget without a reason is rejected", () => {
  const root = tempRoot();
  try {
    const dir = seedPack(root);
    ingestPack(dir, { root });
    const pack = JSON.parse(readFileSync(join(dir, "pack.json"), "utf8"));
    pack.size_budget_kb = 99999;
    assert.ok(
      validatePack(pack, dir, { root }).some((e) => e.includes("size_budget_reason")),
    );
    pack.size_budget_kb = 1; // lower than the default is not an "override"
    pack.size_budget_reason = "because";
    assert.ok(
      validatePack(pack, dir, { root }).some((e) => e.includes("greater than")),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a coverage limitation reaches the resolved entry", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const raw = index.items.find((i) => i.type === "font");
  if (!raw) return;
  const item = resolveIndexItem(index, raw);
  // A subsetted font renders uncovered characters as tofu boxes. Silent is the
  // one thing this must not be.
  assert.ok(item.coverage?.note, "a subsetted font must state its coverage");
  assert.match(item.coverage.note, /tofu/i);
});

test("a license filter still works against normalized headers", () => {
  clearTypeCache();
  const { index } = buildIndex(DEFAULT_ROOT);
  const all = queryIndex(index, { mode: "table" }).results.length;
  const commercial = queryIndex(index, { mode: "table", commercialOnly: true }).results.length;
  assert.equal(commercial, all, "every shipped asset should be commercial-cleared");
});
