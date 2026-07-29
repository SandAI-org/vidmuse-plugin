import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI = join(import.meta.dirname, "resolve.mjs");

function run(args, options = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, DO_NOT_TRACK: "1", ...options.env },
  });
}

test("bundled SFX remains available without an AI call", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-media-use-"));
  try {
    const result = run([
      "--type",
      "sfx",
      "--intent",
      "whoosh",
      "--project",
      project,
      "--local-only",
      "--json",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.provenance.provider, "bundled.sfx");
    assert.ok(existsSync(join(project, output.path)));
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test("old AI provider overrides are rejected", () => {
  const result = run([
    "--type",
    "image",
    "--intent",
    "test",
    "--provider",
    "mflux",
    "--json",
  ]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown provider "mflux"/);
  assert.match(result.stderr, /vidmuse\.model/);
});

test("logo variants reject invalid values and non-logo types", () => {
  const invalid = run([
    "--type",
    "logo",
    "--intent",
    "Codex logo",
    "--variant",
    "rainbow",
  ]);
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /unsupported logo variant "rainbow"/);

  const wrongType = run([
    "--type",
    "image",
    "--intent",
    "editorial still",
    "--variant",
    "color",
  ]);
  assert.equal(wrongType.status, 2);
  assert.match(wrongType.stderr, /--variant only supports --type logo/);
});

test("an unattested explicit logo variant returns a structured terminal miss", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-logo-variant-"));
  try {
    const result = run([
      "--type",
      "logo",
      "--intent",
      "UnknownCo color logo",
      "--entity",
      "unknownco",
      "--variant",
      "color",
      "--project",
      project,
      "--local-only",
      "--json",
    ]);
    assert.equal(result.status, 1);
    const output = JSON.parse(result.stdout);
    assert.equal(output.code, "logo_variant_unavailable");
    assert.equal(output.details.requested_variant, "color");
    assert.deepEqual(output.details.available_variants, []);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test("doctor checks VidMuse, credits, catalog, and deterministic tools only", () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-doctor-"));
  const bin = join(root, "bin");
  mkdirSync(bin, { recursive: true });
  const vidmuse = join(bin, "vidmuse");
  writeFileSync(
    vidmuse,
    `#!/bin/sh
if [ "$1" = "--version" ]; then echo "v9.9.9"; exit 0; fi
if [ "$1" = "profile" ]; then echo '{"email":"test@example.com"}'; exit 0; fi
if [ "$1" = "plan" ]; then echo '{"hasActivePlan":true,"planName":"Studio","credits":42}'; exit 0; fi
if [ "$1" = "model" ]; then echo '{"data":[{"name":"image-model"}]}'; exit 0; fi
exit 1
`,
  );
  chmodSync(vidmuse, 0o755);
  for (const name of ["ffmpeg", "ffprobe"]) {
    const path = join(bin, name);
    writeFileSync(path, `#!/bin/sh\necho "${name} version test"\n`);
    chmodSync(path, 0o755);
  }
  try {
    const result = run(["--doctor", "--json"], {
      env: { PATH: `${bin}:${process.env.PATH}` },
    });
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.ok, true);
    const names = output.checks.map((check) => check.name);
    assert.ok(names.includes("vidmuse authenticated"));
    assert.ok(names.includes("vidmuse plan"));
    assert.ok(names.includes("vidmuse model catalog"));
    assert.equal(names.some((name) => /heygen|hyperframes|parakeet|whisper|kokoro/i.test(name)), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pre-existing cached assets resolve without VidMuse", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-cache-"));
  try {
    const mediaDir = join(project, ".media", "images");
    mkdirSync(mediaDir, { recursive: true });
    const asset = join(mediaDir, "image_001.png");
    writeFileSync(asset, "image");
    mkdirSync(join(project, ".media"), { recursive: true });
    writeFileSync(
      join(project, ".media", "manifest.jsonl"),
      `${JSON.stringify({
        id: "image_001",
        type: "image",
        path: ".media/images/image_001.png",
        source: "generated",
        description: "cached plate",
        provenance: { provider: "vidmuse.model", prompt: "cached plate" },
      })}\n`,
    );
    const stdout = execFileSync(
      process.execPath,
      [CLI, "--type", "image", "--intent", "cached plate", "--project", project, "--json"],
      { encoding: "utf8", env: { ...process.env, DO_NOT_TRACK: "1" } },
    );
    const output = JSON.parse(stdout);
    assert.equal(output._source, "cached");
    assert.equal(readFileSync(asset, "utf8"), "image");
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
