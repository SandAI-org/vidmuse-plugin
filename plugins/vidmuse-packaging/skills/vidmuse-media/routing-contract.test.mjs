import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("./SKILL.md", import.meta.url), "utf8");
const cli = readFileSync(new URL("../vidmuse-cli/SKILL.md", import.meta.url), "utf8");
const create = readFileSync(new URL("../vidmuse-create/SKILL.md", import.meta.url), "utf8");
const recut = readFileSync(new URL("../vidmuse-recut/SKILL.md", import.meta.url), "utf8");
const vox = readFileSync(new URL("../vidmuse-vox/SKILL.md", import.meta.url), "utf8");

test("scribe-v2 is the default ASR path without promising timestamps", () => {
  for (const skill of [cli, media, create, recut]) {
    assert.match(skill, /`scribe-v2`/);
  }
  assert.match(cli, /"model_name":"scribe-v2"/);
  assert.match(cli, /transcription as successful but untimed/);
  assert.match(media, /transcription succeeded but timestamped transcription did not/);
  assert.match(media, /do not create `transcript\.json`/);
  assert.match(recut, /Do not append ATA automatically/);
});

test("verification and alignment remain independent opt-in operations", () => {
  assert.match(media, /5\. `verify-transcript`/);
  assert.match(media, /6\. `align-transcript`/);
  assert.match(media, /Do not make `transcribe` automatically call verification or alignment/);
  assert.match(media, /Use Gemini only when the user actively asks/);
  assert.match(create, /user supplies an exact spoken script/);
  assert.match(create, /resulting TTS audio; do not transcribe it first/);
  assert.match(vox, /atomic `align-transcript` operation/);
  assert.doesNotMatch([media, create, recut, vox].join("\n"), /`transcribe-and-align`/);
});

test("music analysis is atomic and available to Create", () => {
  assert.match(cli, /tool run analyze_music/);
  assert.match(media, /7\. `analyze-music`/);
  assert.match(media, /does not choose the music, require a cut on every beat, or alter the timeline/);
  assert.match(create, /When the user supplies music, or an approved BGM file already exists/);
  assert.match(create, /do not force a cut on every detected beat/);
});
