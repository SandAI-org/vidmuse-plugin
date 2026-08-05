import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseTime, validateDsl } from "./validate-dsl.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vidmuse-timeline-test-"));
  fs.mkdirSync(path.join(root, "assets"), { recursive: true });
  fs.mkdirSync(path.join(root, "hyperframes"), { recursive: true });
  fs.writeFileSync(path.join(root, "assets", "source.mp4"), "video");
  fs.writeFileSync(path.join(root, "assets", "music.wav"), "audio");
  fs.writeFileSync(path.join(root, "hyperframes", "index.html"), `<!doctype html>
<html><head><style>html, body, [data-composition-id] { background: transparent; }</style></head><body>
<main data-composition-id="overlay" data-start="0" data-duration="12" data-width="1920" data-height="1080"></main>
<script>window.__timelines = { overlay: { seek() {}, duration() { return 12; } } };</script>
</body></html>`);
  return { dslPath: path.join(root, "dsl.json"), root };
}

function validDsl() {
  return {
    version: "2",
    projectName: "test",
    totalDuration: 12,
    options: { aspectRatio: "16:9", resolution: "1080p" },
    sourceVideo: {
      filePath: "assets/source.mp4",
      metadata: { duration: 12, width: 1920, height: 1080, frameRate: 30, hasAudio: true },
    },
    videoTracks: [
      {
        id: "main",
        type: "main",
        videos: [{
          id: "source",
          type: "video",
          duration: 12,
          muted: false,
          videoClipStartTime: 0,
          videoFile: [{ active: true, filePath: "assets/source.mp4" }],
        }],
      },
      {
        id: "graphics",
        type: "sub",
        videos: [{
          id: "overlay",
          type: "hyperframes",
          startTime: 0,
          duration: 12,
          htmlSourceFilePath: "hyperframes/index.html",
          params: { enabled: true, sourceStartTime: 0 },
        }],
      },
    ],
    sounds: [],
    subtitles: [],
  };
}

test("parses numeric and dot/comma timecodes", () => {
  assert.equal(parseTime(1.25), 1.25);
  assert.equal(parseTime("00:01:02.500"), 62.5);
  assert.equal(parseTime("00:01:02,500"), 62.5);
  assert.equal(parseTime("bad"), null);
});

test("accepts a complete DSL with a composed HyperFrames host", () => {
  const { dslPath } = fixture();
  assert.deepEqual(validateDsl(validDsl(), { dslPath }), []);
});

test("allows at most one source frame of HyperFrames duration rounding", () => {
  const { dslPath, root } = fixture();
  fs.writeFileSync(path.join(root, "hyperframes", "index.html"), '<main data-composition-id="overlay" data-start="0" data-duration="11.98" data-width="1920" data-height="1080"></main>');
  const findings = validateDsl(validDsl(), { dslPath });
  assert(!findings.some((finding) => finding.code === "hyperframes_duration_short"));
});

test("rejects a raw component and a template-only block", () => {
  const { dslPath, root } = fixture();
  const componentDir = path.join(root, "compositions", "components");
  fs.mkdirSync(componentDir, { recursive: true });
  fs.writeFileSync(path.join(componentDir, "grain.html"), "<div class=\"grain\"></div>");
  const dsl = validDsl();
  dsl.videoTracks[1].videos[0].htmlSourceFilePath = "compositions/components/grain.html";
  const componentFindings = validateDsl(dsl, { dslPath });
  assert(componentFindings.some((finding) => finding.code === "raw_hyperframes_component"));
  assert(componentFindings.some((finding) => finding.code === "incomplete_hyperframes_host"));

  fs.writeFileSync(path.join(root, "hyperframes", "block.html"), '<template><main data-composition-id="block" data-start="0" data-duration="3" data-width="1920" data-height="1080"></main></template>');
  dsl.videoTracks[1].videos[0].htmlSourceFilePath = "hyperframes/block.html";
  dsl.videoTracks[1].videos[0].duration = 3;
  const blockFindings = validateDsl(dsl, { dslPath });
  assert(blockFindings.some((finding) => finding.code === "incomplete_hyperframes_host"));
});

test("preserves legacy items while warning when both collections are populated", () => {
  const { dslPath } = fixture();
  const dsl = validDsl();
  dsl.videoTracks[0].items = [{ id: "legacy", duration: 1 }];
  const findings = validateDsl(dsl, { dslPath });
  assert(findings.some((finding) => finding.code === "ambiguous_item_collection"));
  assert(!findings.some((finding) => finding.path.includes("legacy") && finding.level === "error"));
});

test("reports missing media, ignored main start, invalid settings, and short total duration", () => {
  const { dslPath } = fixture();
  const dsl = validDsl();
  dsl.totalDuration = 4;
  dsl.videoTracks[0].videos[0].startTime = 5;
  dsl.videoTracks[0].videos[0].playbackRate = 20;
  dsl.videoTracks[0].videos[0].videoFile = [{ active: true, filePath: "assets/missing.mp4" }];
  const findings = validateDsl(dsl, { dslPath });
  for (const code of ["ignored_main_start", "invalid_playback_rate", "missing_local_file", "total_duration_short"]) {
    assert(findings.some((finding) => finding.code === code), `missing ${code}`);
  }
});

test("checks subtitles and warns about possible duplicate program audio", () => {
  const { dslPath } = fixture();
  const dsl = validDsl();
  dsl.sounds = [{
    id: "source-audio",
    type: "audio",
    startTime: 0,
    duration: 12,
    audioFile: [{ active: true, filePath: "assets/music.wav" }],
  }];
  dsl.subtitles = [
    { id: "subtitle-1", text: "one", startTime: 0, endTime: 2, layout: { x: 0.5, y: 1.2 } },
    { id: "subtitle-2", text: "two", startTime: 1, endTime: 3 },
  ];
  const findings = validateDsl(dsl, { dslPath });
  for (const code of ["possible_program_audio_duplicate", "invalid_subtitle_layout", "subtitle_overlap"]) {
    assert(findings.some((finding) => finding.code === code), `missing ${code}`);
  }
});

test("requires explicit sourceStartTime when one HyperFrames source is reused", () => {
  const { dslPath } = fixture();
  const dsl = validDsl();
  dsl.videoTracks[1].videos = [
    { id: "one", type: "hyperframes", startTime: 0, duration: 3, htmlSourceFilePath: "hyperframes/index.html", params: {} },
    { id: "two", type: "hyperframes", startTime: 3, duration: 3, htmlSourceFilePath: "hyperframes/index.html", params: {} },
  ];
  const findings = validateDsl(dsl, { dslPath });
  assert.equal(findings.filter((finding) => finding.code === "implicit_shared_hyperframes_time").length, 2);
});

test("rejects an opaque layered host and a duplicated source-video plate", () => {
  const { dslPath, root } = fixture();
  fs.writeFileSync(path.join(root, "hyperframes", "index.html"), `<!doctype html>
<html><head><style>html, body { background: #000; }</style></head><body>
<main id="stage" data-composition-id="overlay" data-start="0" data-duration="12" data-width="1920" data-height="1080" style="background:#000">
  <video id="source-video" src="../assets/source.mp4" muted></video>
</main></body></html>`);
  const dsl = validDsl();
  dsl.videoTracks[1].videos.push({
    ...dsl.videoTracks[1].videos[0],
    id: "overlay-repeat",
  });
  const findings = validateDsl(dsl, { dslPath });
  assert.equal(findings.filter((finding) => finding.code === "opaque_layered_hyperframes_root").length, 1);
  assert.equal(findings.filter((finding) => finding.code === "duplicate_source_video_in_hyperframes").length, 1);
});

test("warns when layered transparency is only implicit", () => {
  const { dslPath, root } = fixture();
  fs.writeFileSync(path.join(root, "hyperframes", "index.html"), '<main data-composition-id="overlay" data-start="0" data-duration="12" data-width="1920" data-height="1080"></main>');
  const findings = validateDsl(validDsl(), { dslPath });
  assert(findings.some((finding) => finding.code === "unverified_layered_hyperframes_transparency"));
  assert(!findings.some((finding) => finding.code === "opaque_layered_hyperframes_root"));
});

test("does not treat an unused subtitle CSS class as duplicated caption markup", () => {
  const { dslPath, root } = fixture();
  fs.writeFileSync(path.join(root, "hyperframes", "index.html"), `<!doctype html>
<html><head><style>html, body, [data-composition-id] { background: transparent; }.subtitle-host { color: white; }</style></head><body>
<main data-composition-id="overlay" data-start="0" data-duration="12" data-width="1920" data-height="1080"></main>
</body></html>`);
  const dsl = validDsl();
  dsl.subtitles = [{ id: "subtitle", text: "hello", startTime: 0, endTime: 1 }];
  const findings = validateDsl(dsl, { dslPath });
  assert(!findings.some((finding) => finding.code === "possible_subtitle_duplicate_in_hyperframes"));
});

test("allows embedded media in a self-contained composition with no main video track", () => {
  const { dslPath, root } = fixture();
  fs.writeFileSync(path.join(root, "hyperframes", "index.html"), `<!doctype html>
<html><body><main data-composition-id="film" data-start="0" data-duration="12" data-width="1920" data-height="1080">
  <video id="source-video" src="../assets/source.mp4" muted></video>
  <audio src="../assets/music.wav"></audio>
</main></body></html>`);
  const dsl = validDsl();
  dsl.videoTracks = [dsl.videoTracks[1]];
  const findings = validateDsl(dsl, { dslPath });
  assert(!findings.some((finding) => finding.code === "duplicate_source_video_in_hyperframes"));
  assert(!findings.some((finding) => finding.code === "embedded_audio_in_layered_hyperframes"));
});
