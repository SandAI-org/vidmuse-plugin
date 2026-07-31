import { strict as assert } from "node:assert";
import { existsSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import {
  mergeAsrTexts,
  planAsrChunks,
  transcribeMediaWithVidMuse,
} from "./asr-chunks.mjs";

test("plans overlapping five-minute chunks for long media", () => {
  const chunks = planAsrChunks(969.685, {
    chunkSeconds: 300,
    overlapSeconds: 2,
  });
  assert.deepEqual(
    chunks.map(({ start, end }) => [start, end]),
    [
      [0, 300],
      [298, 598],
      [596, 896],
      [894, 969.685],
    ],
  );
});

test("merges repeated Chinese and Latin text from overlapping chunks", () => {
  assert.equal(
    mergeAsrTexts([
      "大家好，今天我们聊大疆 P4P。",
      "大疆P4P，用了两周以后我有了答案。",
      "有了答案。接下来看看影石 Luna。",
    ]),
    "大家好，今天我们聊大疆 P4P。用了两周以后我有了答案。接下来看看影石 Luna。",
  );
});

test("segments local long media, transcribes every chunk, and cleans temporary WAVs", () => {
  const seenPaths = [];
  const progress = [];
  const result = transcribeMediaWithVidMuse("/tmp/talk.mp3", {
    chunkSeconds: 300,
    overlapSeconds: 2,
    retries: 2,
    probeDuration: () => 601,
    extractChunk({ output, start }) {
      writeFileSync(output, String(start));
    },
    runAsr(path, options) {
      assert.equal(options.retries, 2);
      assert.ok(existsSync(path));
      seenPaths.push(path);
      const texts = [
        "第一段内容，边界重复文字。",
        "边界重复文字。第二段内容。",
        "第二段内容。第三段结束。",
      ];
      return { data: { text: texts[seenPaths.length - 1] } };
    },
    onChunk(event) {
      progress.push([event.index, event.total]);
    },
  });

  assert.equal(result.segmented, true);
  assert.equal(result.chunk_count, 3);
  assert.equal(result.text, "第一段内容，边界重复文字。第二段内容。第三段结束。");
  assert.deepEqual(progress, [
    [0, 3],
    [1, 3],
    [2, 3],
  ]);
  assert.equal(seenPaths.every((path) => !existsSync(path)), true);
});

test("short local media keeps the direct ASR path", () => {
  let extracted = false;
  const result = transcribeMediaWithVidMuse("/tmp/short.wav", {
    probeDuration: () => 42,
    extractChunk() {
      extracted = true;
    },
    runAsr(path) {
      assert.equal(path, "/tmp/short.wav");
      return { text: "短音频" };
    },
  });
  assert.equal(result.segmented, false);
  assert.equal(result.chunk_count, 1);
  assert.equal(result.text, "短音频");
  assert.equal(extracted, false);
});
