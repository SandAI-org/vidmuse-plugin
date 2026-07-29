import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skills = resolve(here, "../..");
const plugin = resolve(skills, "..");
const read = (path) => readFileSync(path, "utf8");

test("vidmuse is the mandatory router and owns no execution", () => {
  const skill = read(join(skills, "vidmuse/SKILL.md"));
  assert.match(skill, /Mandatory VidMuse entry point/i);
  assert.match(skill, /Route by deliverable/i);
  assert.match(skill, /does\s+not create media or author a film itself/i);
  for (const owner of ["vidmuse-recut", "vidmuse-create", "vidmuse-assets", "media-use"]) {
    assert.match(skill, new RegExp(`/${owner}`));
  }
});

test("media-use accepts standalone ASR and TTS without owning films", () => {
  const skill = read(join(skills, "media-use/SKILL.md"));
  assert.doesNotMatch(skill, /Internal VidMuse media runtime used by/i);
  assert.doesNotMatch(skill, /Not a user-facing product router/i);
  assert.match(skill, /standalone/i);
  assert.match(skill, /ASR/i);
  assert.match(skill, /TTS/i);
  assert.match(skill, /never takes over[\s\S]*film/i);
});

test("film workflows defer shared runtime policy to the router", () => {
  for (const owner of ["vidmuse-recut", "vidmuse-create"]) {
    const skill = read(join(skills, `${owner}/SKILL.md`));
    assert.ok(skill.includes("../vidmuse/references/runtime-policy.md"));
    assert.ok(skill.includes("/vidmuse"));
  }
});

test("plugin metadata exposes router and standalone media prompts", () => {
  const metadata = JSON.parse(read(join(plugin, ".codex-plugin/plugin.json")));
  assert.ok(metadata.description.includes("/vidmuse"));
  assert.match(metadata.interface.longDescription, /ASR|transcription/i);
  assert.ok(metadata.interface.defaultPrompt.some((prompt) => /transcri|转写|逐字稿/i.test(prompt)));
  assert.ok(metadata.interface.defaultPrompt.some((prompt) => /TTS|配音|voice/i.test(prompt)));
});

test("setup validates the router skill in the bundled payload", () => {
  const setup = read(join(skills, "vidmuse-recut/scripts/setup.sh"));
  assert.match(setup, /REQUIRED_PLUGIN_SKILLS=\([\s\S]*?\bvidmuse\b/);
  assert.match(setup, /entry skill\s+: vidmuse/);
});
