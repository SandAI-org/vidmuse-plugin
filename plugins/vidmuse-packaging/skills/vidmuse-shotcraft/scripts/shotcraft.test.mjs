import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildIndexes,
  installLocal,
  readJson,
  searchCatalog,
  verifyRegistry,
} from "./registry-lib.mjs";

test("the canonical registry covers all 162 deterministic blocks", () => {
  buildIndexes();
  const report = verifyRegistry({ requireIndexes: true });
  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.equal(report.summary.blocks, 162);
  assert.equal(report.summary.blockDirectories, 162);
  assert.equal(report.summary.declaredAssetFiles, 64);
  assert.equal(report.summary.variableBlocks, 159);
});

test("Chinese job search resolves the scan transition", () => {
  const results = searchCatalog({ query: "扫描式转场", limit: 3 });
  assert.equal(results[0]?.name, "shot-clock-wipe");
  assert.ok(results.every((item) => item.score > 0));
});

test("recut discovery is fail-closed", () => {
  const safe = searchCatalog({ tag: "transition", recut: "safe", limit: 100 });
  assert.ok(safe.some((item) => item.name === "shot-flash-cut"));
  assert.ok(safe.every((item) => item.recut === "recut:safe"));
  const catalog = readJson(join(new URL("../indexes/catalog.json", import.meta.url).pathname));
  assert.equal(catalog.find((item) => item.name === "shot-clock-wipe").recut, "recut:adapt");
  assert.equal(catalog.find((item) => item.name === "shot-bento-light-up").recut, "create-only");
  const createOnly = searchCatalog({ recut: "create-only", limit: 200 });
  assert.ok(createOnly.some((item) => item.name === "shot-bento-light-up"));
  assert.ok(createOnly.every((item) => item.recut === "create-only"));
});

test("local install writes a complete clip mount and a deterministic lock", () => {
  const project = mkdtempSync(join(tmpdir(), "shotcraft-basic-"));
  const result = installLocal("shot-clock-wipe", { projectDir: project });
  const composition = join(project, "compositions/shot-clock-wipe.html");
  assert.equal(existsSync(composition), true);
  assert.match(readFileSync(composition, "utf8"), /hyperframes-registry-item: shot-clock-wipe/);
  assert.match(result.snippet, /class="clip"/);
  assert.match(result.snippet, /data-duration="5"/);
  assert.equal(existsSync(join(project, "shotcraft-lock.json")), true);
  const second = installLocal("shot-clock-wipe", { projectDir: project });
  assert.equal(second.written.length, 0);
  assert.equal(second.skipped.length, 1);
});

test("assets are isolated per item and references are rewritten", () => {
  const project = mkdtempSync(join(tmpdir(), "shotcraft-assets-"));
  installLocal("shot-crash-zoom", { projectDir: project });
  installLocal("shot-depth-multiplane", { projectDir: project });
  const crashAsset = join(
    project,
    "assets/vidmuse-shotcraft/shot-crash-zoom/textures/projects-full.png",
  );
  const depthAsset = join(
    project,
    "assets/vidmuse-shotcraft/shot-depth-multiplane/textures/projects-full.png",
  );
  assert.equal(existsSync(crashAsset), true);
  assert.equal(existsSync(depthAsset), true);
  assert.equal(existsSync(join(project, "assets/textures/projects-full.png")), false);
  const html = readFileSync(join(project, "compositions/shot-crash-zoom.html"), "utf8");
  assert.match(html, /assets\/vidmuse-shotcraft\/shot-crash-zoom\/textures\/projects-full\.png/);
  assert.doesNotMatch(html, /["']assets\/textures\/projects-full\.png["']/);
});

test("custom project paths are honored without shared mutable assets", () => {
  const project = mkdtempSync(join(tmpdir(), "shotcraft-paths-"));
  writeFileSync(
    join(project, "hyperframes.json"),
    JSON.stringify({ paths: { blocks: "public/compositions", assets: "public/media" } }),
  );
  const result = installLocal("shot-crash-zoom", { projectDir: project });
  assert.equal(existsSync(join(project, "public/compositions/shot-crash-zoom.html")), true);
  assert.equal(
    existsSync(
      join(
        project,
        "public/media/vidmuse-shotcraft/shot-crash-zoom/textures/projects-full.png",
      ),
    ),
    true,
  );
  assert.match(result.snippet, /public\/compositions\/shot-crash-zoom\.html/);
});

test("modified project files are never overwritten without explicit force", () => {
  const project = mkdtempSync(join(tmpdir(), "shotcraft-conflict-"));
  installLocal("shot-clock-wipe", { projectDir: project });
  const composition = join(project, "compositions/shot-clock-wipe.html");
  writeFileSync(composition, "user edit", "utf8");
  assert.throws(
    () => installLocal("shot-clock-wipe", { projectDir: project }),
    /Refusing to overwrite modified files/,
  );
  const forced = installLocal("shot-clock-wipe", { projectDir: project, force: true });
  assert.deepEqual(forced.overwritten, ["compositions/shot-clock-wipe.html"]);
});
