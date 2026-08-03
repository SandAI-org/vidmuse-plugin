import assert from "node:assert/strict";
import test from "node:test";

import {
  groupTranscript,
  normalizeTranscript,
  timelineSubtitles,
  transcriptToSrt,
} from "./transcript-tools.mjs";

test("normalizes the official flat contract and clamps the final end", () => {
  const words = normalizeTranscript(
    [
      { text: "用户", start: 0, end: 0.4, ignored: true },
      { text: "需要。", start: 0.5, end: 1.1 },
    ],
    1,
  );
  assert.deepEqual(words, [
    { text: "用户", start: 0, end: 0.4 },
    { text: "需要。", start: 0.5, end: 1 },
  ]);
});

test("accepts an explicit top-level words array", () => {
  const words = normalizeTranscript({ words: [{ text: "Hello", start: 0.1, end: 0.4 }] }, 1);
  assert.deepEqual(words, [{ text: "Hello", start: 0.1, end: 0.4 }]);
});

test("rejects text without explicit word timings", () => {
  assert.throws(() => normalizeTranscript({ text: "untimed transcript" }, 1), /words array/);
});

test("rejects a large overrun instead of hiding it with a clamp", () => {
  assert.throws(
    () => normalizeTranscript([{ text: "late", start: 0.5, end: 2 }], 1),
    /more than 0.25 seconds/,
  );
});

test("derives SRT from validated word timing", () => {
  const words = normalizeTranscript(
    [
      { text: "用户", start: 0, end: 0.3 },
      { text: "真正", start: 0.31, end: 0.6 },
      { text: "需要。", start: 0.61, end: 1.2 },
      { text: "Next", start: 2, end: 2.3 },
      { text: "point.", start: 2.31, end: 2.8 },
    ],
    3,
  );
  assert.equal(
    transcriptToSrt(words),
    "1\n00:00:00,000 --> 00:00:01,200\n用户真正需要。\n\n2\n00:00:02,000 --> 00:00:02,800\nNext point.\n",
  );
});

test("targets 15 characters and never exceeds 16", () => {
  const words = Array.from("这是一个用于验证字幕长度不会超出画面的测试句子").map((text, index) => ({
    text,
    start: index * 0.1,
    end: index * 0.1 + 0.09,
  }));
  const groups = groupTranscript(words);
  const lengths = groups.map((group) => Array.from(group.map((word) => word.text).join("")).length);
  assert.deepEqual(lengths, [15, 8]);
  assert(lengths.every((length) => length <= 16));
});

test("creates stable Timeline subtitle objects", () => {
  const words = [
    { text: "真实", start: 0, end: 0.4 },
    { text: "字幕。", start: 0.5, end: 1 },
  ];
  assert.deepEqual(timelineSubtitles(words), [
    { id: "subtitle-001", text: "真实字幕。", startTime: 0, endTime: 1 },
  ]);
});

test("rejects a single aligned token that cannot fit safely", () => {
  assert.throws(
    () => groupTranscript([{ text: "这是一个无法在不猜测时间的情况下安全拆开的超长识别词元", start: 0, end: 1 }]),
    /cannot fit/,
  );
});
