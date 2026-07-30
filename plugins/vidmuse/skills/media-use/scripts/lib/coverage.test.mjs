import { strict as assert } from "node:assert";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getProviders } from "./registry.mjs";

const SKILL = join(import.meta.dirname, "..", "..");
const SKILLS = join(SKILL, "..");

test("AI generation has exactly one provider boundary", () => {
  // The invariant is that GENERATION has one substrate, not that a type has one
  // provider: local, non-generative providers (Core Pack, bundled SFX) may sit
  // ahead of it in the cascade. Anything that can `generate` must be VidMuse.
  for (const type of ["bgm", "image", "icon", "voice", "video"]) {
    const generators = getProviders(type).filter((provider) => provider.generate);
    assert.deepEqual(
      generators.map((provider) => provider.name),
      ["vidmuse.model"],
      `${type} must generate only through VidMuse`,
    );
    for (const provider of getProviders(type)) {
      if (provider.name === "vidmuse.model") continue;
      assert.ok(!provider.generate, `${type}: ${provider.name} must not generate`);
      assert.ok(!provider.network, `${type}: ${provider.name} must be local`);
    }
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

test("bundled skill docs keep media execution on the VidMuse boundary", () => {
  const files = [
    "hyperframes-cli/SKILL.md",
    "hyperframes-cli/references/init-and-scaffold.md",
    "hyperframes-cli/references/upgrade-info-misc.md",
    "hyperframes-core/references/script-format.md",
    "hyperframes-creative/references/composition-patterns.md",
    "hyperframes-animation/rules/asr-keyword-glow.md",
    "hyperframes/references/capability-menu.md",
  ];
  const forbidden = [
    /npx\s+hyperframes\s+(?:tts|transcribe|remove-background)\b/i,
    /\bheygen\s+(?:video|audio|image)\b/i,
    /\bvideo-translate\b/i,
    /\bHEYGEN_API_KEY\b/,
    /\.heygen\/credentials\b/i,
  ];

  for (const file of files) {
    const source = readFileSync(join(SKILLS, file), "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${file} escaped the VidMuse media boundary`);
    }
  }

  const setup = readFileSync(join(SKILLS, "vidmuse-recut/scripts/setup.sh"), "utf8");
  assert.doesNotMatch(setup, /hyperframes\s+doctor/i);
  assert.match(setup, /media-use[\s\S]*resolve\.mjs"\s+--doctor/i);
});
