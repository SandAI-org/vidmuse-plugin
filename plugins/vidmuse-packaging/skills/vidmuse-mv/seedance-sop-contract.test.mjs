import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(new URL("./SKILL.md", import.meta.url), "utf8");
const agent = readFileSync(new URL("./agents/openai.yaml", import.meta.url), "utf8");
const sop = readFileSync(
  new URL("./references/seedance-mv-sop.md", import.meta.url),
  "utf8",
);
const vox = readFileSync(new URL("../vidmuse-vox/SKILL.md", import.meta.url), "utf8");

test("MV defaults to Seedance 2.5 chapters instead of H3 clips", () => {
  assert.match(skill, /Prefer `seedance-2\.5` for MV picture generation/);
  assert.match(skill, /one musically complete Seedance chapter/);
  assert.match(skill, /seedance-mv-sop\.md/);
  assert.match(agent, /Seedance 2\.5 music video/);
  assert.doesNotMatch(`${skill}\n${agent}`, /\bH3\b|h3-mv-compiler/);
  assert.equal(
    existsSync(new URL("./references/h3-mv-compiler.md", import.meta.url)),
    false,
  );
});

test("SOP preserves the proven black audio-wrapper contract", () => {
  assert.match(sop, /1280×720/);
  assert.match(sop, /512×512 wrapper has failed/);
  assert.match(sop, /407,696 pixels/);
  assert.match(sop, /accepted only one direct audio input/);
  assert.match(sop, /rejected a source longer than 15 seconds/);
  assert.match(sop, /ignore its featureless black visual frames completely/);
  assert.match(sop, /"video_url": "<black audio-wrapper video URL>"/);
  assert.match(sop, /Keep the unchanged master audio as the only Timeline sound/);
});

test("long async generations are polled without duplicate paid calls", () => {
  assert.match(sop, /vidmuse model run --async/);
  assert.match(sop, /did not complete within 1200 seconds/);
  assert.match(sop, /credits still deducted and no explicit terminal error: keep waiting/);
  assert.match(sop, /credits restored, no new asset exists/);
  assert.match(sop, /Never run parallel duplicate generations/);
  assert.match(sop, /observed 207-Credit charge/);
});

test("MV typography protects lip-sync and unrelated Vox rules stay intact", () => {
  assert.match(sop, /Lip-sync is the first acceptance criterion/);
  assert.match(sop, /Generated typography is optional picture content/);
  assert.match(sop, /use a deterministic Timeline\/HyperFrames overlay/);
  assert.match(vox, /`minimax\/hailuo-h3`/);
});
