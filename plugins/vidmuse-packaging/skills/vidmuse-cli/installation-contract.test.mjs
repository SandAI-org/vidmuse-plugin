import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const skillUrl = new URL("./SKILL.md", import.meta.url);
const skill = readFileSync(skillUrl, "utf8");
const vendor = JSON.parse(readFileSync(new URL("../VENDOR-SOURCES.json", import.meta.url), "utf8"));

test("the plugin ships no VidMuse CLI executable", () => {
  assert.equal(existsSync(new URL("./assets/bin/vidmuse-darwin-arm64", import.meta.url)), false);
  assert.equal(existsSync(new URL("./assets/bin/SHA256SUMS", import.meta.url)), false);
  assert.equal(vendor.vidmuseCli.distribution, "installed-on-demand");
  assert.equal(vendor.vidmuseCli.path, undefined);
  assert.equal(vendor.vidmuseCli.sha256, undefined);
});

test("the CLI skill resolves or installs the official release", () => {
  assert.match(skill, /command -v vidmuse/);
  assert.match(skill, /https:\/\/vidmuse\.sandcdn\.com\/cli\/install\.sh \| bash/);
  assert.match(skill, /The installer owns supported OS\/architecture detection/);
  assert.doesNotMatch(skill, /assets\/bin\/vidmuse/);
});

test("every documented executable invocation pins production", () => {
  const skillsRoot = fileURLToPath(new URL("../", import.meta.url));
  const skillFiles = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(skillsRoot, entry.name, "SKILL.md"))
    .filter(existsSync);
  const invocationLines = skillFiles.flatMap((path) =>
    readFileSync(path, "utf8").split("\n").filter((line) => line.includes('"$VIDMUSE_BIN"')),
  );
  assert.ok(invocationLines.length > 5);
  for (const line of invocationLines) {
    if (line.startsWith("VIDMUSE_BIN=") || line.startsWith("test ")) continue;
    assert.match(line, /VIDMUSE_BASE_URL=https:\/\/vidmuse\.ai/, line);
  }
  assert.doesNotMatch(skill, /VIDMUSE_BASE_URL=https:\/\/vidmuse-dev/);
  assert.equal(vendor.vidmuseCli.productionBaseUrl, "https://vidmuse.ai");
});
