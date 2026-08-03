#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function fail(message) {
  throw new Error(message);
}

function finiteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${label} must be a finite number`);
  return value;
}

export function normalizeTranscript(raw, duration) {
  const input = Array.isArray(raw) ? raw : raw && Array.isArray(raw.words) ? raw.words : null;
  if (!input) fail("transcript must be a flat array or an object with a words array");
  if (input.length === 0) fail("transcript contains no words");

  const mediaDuration = duration === undefined ? undefined : finiteNumber(duration, "duration");
  if (mediaDuration !== undefined && mediaDuration <= 0) fail("duration must be greater than zero");

  let previousStart = -1;
  return input.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) fail(`word ${index} must be an object`);
    const text = typeof entry.text === "string" ? entry.text.trim() : "";
    if (!text) fail(`word ${index}.text must be a non-empty string`);

    const start = finiteNumber(entry.start, `word ${index}.start`);
    const rawEnd = finiteNumber(entry.end, `word ${index}.end`);
    if (start < 0) fail(`word ${index}.start must be non-negative`);
    if (start < previousStart) fail(`word ${index}.start decreases relative to the previous word`);
    if (rawEnd < start) fail(`word ${index}.end precedes its start`);
    if (mediaDuration !== undefined && start >= mediaDuration) fail(`word ${index}.start is outside media duration`);
    if (mediaDuration !== undefined && rawEnd > mediaDuration + 0.25) {
      fail(`word ${index}.end exceeds media duration by more than 0.25 seconds`);
    }

    const end = mediaDuration === undefined ? rawEnd : Math.min(rawEnd, mediaDuration);
    previousStart = start;
    return { text, start, end };
  });
}

function isCjk(value) {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(value);
}

function joinTokens(tokens) {
  let output = "";
  for (const token of tokens) {
    if (!output) {
      output = token;
      continue;
    }
    const previous = output.at(-1) ?? "";
    const noSpace = isCjk(previous) || isCjk(token[0] ?? "") || /^[,.;:!?%。，；：！？、）》】」』]/u.test(token);
    output += noSpace ? token : ` ${token}`;
  }
  return output;
}

function formatTimestamp(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const millis = totalMs % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function characterCount(value) {
  return Array.from(value).length;
}

export function groupTranscript(words, options = {}) {
  const targetChars = options.targetChars ?? 15;
  const maxChars = options.maxChars ?? 16;
  const maxDuration = options.maxDuration ?? 5;
  const pauseThreshold = options.pauseThreshold ?? 0.65;
  if (!Number.isInteger(targetChars) || targetChars <= 0) fail("targetChars must be a positive integer");
  if (!Number.isInteger(maxChars) || maxChars < targetChars) fail("maxChars must be an integer greater than or equal to targetChars");

  const groups = [];
  let current = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const singleLength = characterCount(word.text);
    if (singleLength > maxChars) {
      fail(`word ${index}.text has ${singleLength} characters and cannot fit the ${maxChars}-character subtitle limit without inventing timing`);
    }

    const candidate = joinTokens([...current, word].map((item) => item.text));
    if (current.length > 0 && characterCount(candidate) > maxChars) {
      groups.push(current);
      current = [];
    }
    current.push(word);

    const next = words[index + 1];
    const text = joinTokens(current.map((item) => item.text));
    const duration = word.end - current[0].start;
    const pause = next ? next.start - word.end : Number.POSITIVE_INFINITY;
    const sentenceEnd = /[.!?。！？]$/u.test(word.text);
    const shouldBreak = !next || sentenceEnd || pause >= pauseThreshold || duration >= maxDuration || characterCount(text) >= targetChars;
    if (shouldBreak) {
      groups.push(current);
      current = [];
    }
  }

  return groups;
}

export function timelineSubtitles(words, options = {}) {
  return groupTranscript(words, options).map((group, index) => ({
    id: `subtitle-${String(index + 1).padStart(3, "0")}`,
    text: joinTokens(group.map((item) => item.text)),
    startTime: group[0].start,
    endTime: group[group.length - 1].end,
  }));
}

export function transcriptToSrt(words, options = {}) {
  const groups = groupTranscript(words, options);

  return `${groups
    .map((group, index) => {
      const first = group[0];
      const last = group[group.length - 1];
      const text = joinTokens(group.map((item) => item.text));
      return `${index + 1}\n${formatTimestamp(first.start)} --> ${formatTimestamp(last.end)}\n${text}`;
    })
    .join("\n\n")}\n`;
}

function parseCli(argv) {
  const [command, inputPath, ...tail] = argv;
  if (!command || !inputPath) {
    fail("usage: transcript-tools.mjs <normalize|validate|srt|timeline-subtitles> <input.json> [output] [--duration seconds] [--target-chars 15] [--max-chars 16]");
  }
  const outputPath = tail[0]?.startsWith("--") ? undefined : tail.shift();
  const options = {};
  for (let index = 0; index < tail.length; index += 1) {
    const flag = tail[index];
    const value = tail[index + 1];
    if (!value) fail(`${flag} requires a value`);
    if (flag === "--duration") options.duration = Number(value);
    else if (flag === "--target-chars") options.targetChars = Number(value);
    else if (flag === "--max-chars") options.maxChars = Number(value);
    else fail(`unknown option: ${flag}`);
    index += 1;
  }
  return { command, inputPath, outputPath, ...options };
}

export function main(argv = process.argv.slice(2)) {
  const { command, inputPath, outputPath, duration, targetChars, maxChars } = parseCli(argv);
  const raw = JSON.parse(readFileSync(inputPath, "utf8"));
  const words = normalizeTranscript(raw, duration);

  if (command === "validate") {
    process.stdout.write(`valid transcript: ${words.length} words\n`);
    return;
  }
  if (!outputPath) fail(`${command} requires an output path`);
  if (command === "normalize") {
    writeFileSync(outputPath, `${JSON.stringify(words, null, 2)}\n`, { flag: "wx" });
    return;
  }
  if (command === "srt") {
    writeFileSync(outputPath, transcriptToSrt(words, { targetChars, maxChars }), { flag: "wx" });
    return;
  }
  if (command === "timeline-subtitles") {
    writeFileSync(outputPath, `${JSON.stringify(timelineSubtitles(words, { targetChars, maxChars }), null, 2)}\n`, { flag: "wx" });
    return;
  }
  fail(`unknown command: ${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
