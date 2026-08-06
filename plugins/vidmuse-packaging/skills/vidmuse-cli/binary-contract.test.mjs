import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const binaryUrl = new URL("./assets/bin/vidmuse-darwin-arm64", import.meta.url);
const binaryPath = fileURLToPath(binaryUrl);
const checksum = readFileSync(new URL("./assets/bin/SHA256SUMS", import.meta.url), "utf8").trim().split(/\s+/)[0];
const vendor = JSON.parse(readFileSync(new URL("../VENDOR-SOURCES.json", import.meta.url), "utf8"));

test("the bundled CLI matches both checksum receipts", () => {
  const actual = createHash("sha256").update(readFileSync(binaryUrl)).digest("hex");
  assert.equal(actual, checksum);
  assert.equal(actual, vendor.vidmuseCli.sha256);
});

test("the bundled macOS arm64 CLI reports the vendored version", {
  skip: process.platform !== "darwin" || process.arch !== "arm64",
}, () => {
  const result = spawnSync(binaryPath, ["--version"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), vendor.vidmuseCli.version);
});

test("the bundled macOS CLI keeps a valid Developer ID signature", {
  skip: process.platform !== "darwin" || process.arch !== "arm64",
}, () => {
  const result = spawnSync("codesign", ["--verify", "--deep", "--strict", binaryPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
