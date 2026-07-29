import { strict as assert } from "node:assert";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getProviders } from "./registry.mjs";

const SKILL = join(import.meta.dirname, "..", "..");

test("AI generation has exactly one provider boundary", () => {
  for (const type of ["bgm", "image", "icon", "voice", "video"]) {
    assert.deepEqual(getProviders(type).map((provider) => provider.name), ["vidmuse.model"]);
  }
});

test("transcription and audio engine use VidMuse adapters", () => {
  for (const file of ["scripts/transcribe.mjs", "audio/scripts/audio.mjs"]) {
    const path = join(SKILL, file);
    assert.ok(existsSync(path), `${file} missing`);
    const source = readFileSync(path, "utf8");
    assert.match(source, /vidmuse/i);
    assert.doesNotMatch(source, /parakeet|whisper|kokoro|mflux|heygen/i);
  }
});

test("deterministic media utilities remain present", () => {
  for (const file of [
    "scripts/transcript-cut.mjs",
    "scripts/audio-duck.mjs",
    "scripts/lib/cache.mjs",
    "scripts/lib/cube-build.mjs",
  ]) {
    assert.ok(existsSync(join(SKILL, file)), `${file} missing`);
  }
});
