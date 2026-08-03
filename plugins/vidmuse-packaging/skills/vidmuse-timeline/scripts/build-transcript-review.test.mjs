import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildTranscriptReview } from "./build-transcript-review.mjs";
import { validateDsl } from "./validate-dsl.mjs";

test("builds a valid source-video and subtitle review DSL", () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-review-dsl-"));
  const assets = join(root, "assets");
  mkdirSync(assets);
  const video = join(assets, "source.mp4");
  const metadata = join(root, "metadata.json");
  const subtitles = join(root, "subtitles.timeline.json");
  const output = join(root, "dsl.json");
  writeFileSync(video, "test-video");
  writeFileSync(metadata, JSON.stringify({
    streams: [
      { codec_type: "video", width: 1920, height: 1080, avg_frame_rate: "30000/1001" },
      { codec_type: "audio" },
    ],
    format: { duration: "12" },
  }));
  writeFileSync(subtitles, JSON.stringify([
    { id: "subtitle-001", text: "这是一条安全字幕", startTime: 0, endTime: 2 },
  ]));

  assert.equal(buildTranscriptReview({ project: root, video, metadata, subtitles, output }), output);
  const dsl = JSON.parse(readFileSync(output, "utf8"));
  assert.equal(dsl.videoTracks[0].videos[0].videoFile[0].filePath, "assets/source.mp4");
  assert.equal(dsl.subtitles[0].text, "这是一条安全字幕");
  assert.deepEqual(dsl.subtitles[0].layout, { x: 0.5, y: 0.88, width: 0.88 });
  assert.deepEqual(validateDsl(dsl, { dslPath: output }), []);
});

test("rejects subtitles longer than 16 characters", () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-review-dsl-long-"));
  const video = join(root, "source.mp4");
  const metadata = join(root, "metadata.json");
  const subtitles = join(root, "subtitles.timeline.json");
  writeFileSync(video, "test-video");
  writeFileSync(metadata, JSON.stringify({
    streams: [{ codec_type: "video", width: 1080, height: 1920, avg_frame_rate: "30/1" }],
    format: { duration: 3 },
  }));
  writeFileSync(subtitles, JSON.stringify([
    { text: "这是一条明显超过十六个字符因此必须被拒绝的字幕", startTime: 0, endTime: 2 },
  ]));

  assert.throws(
    () => buildTranscriptReview({ project: root, video, metadata, subtitles }),
    /maximum is 16/,
  );
});
