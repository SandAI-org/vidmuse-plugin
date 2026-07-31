import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVidMuseAsr } from "./vidmuse-cli.mjs";

const REMOTE_URL = /^https?:\/\//i;

export function planAsrChunks(durationSeconds, {
  chunkSeconds = 300,
  overlapSeconds = 2,
} = {}) {
  validateChunkOptions(chunkSeconds, overlapSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("media duration must be a positive number");
  }
  if (durationSeconds <= chunkSeconds) {
    return [{ index: 0, start: 0, end: durationSeconds, duration: durationSeconds }];
  }

  const chunks = [];
  const step = chunkSeconds - overlapSeconds;
  for (let start = 0; start < durationSeconds; start += step) {
    const end = Math.min(start + chunkSeconds, durationSeconds);
    chunks.push({
      index: chunks.length,
      start,
      end,
      duration: end - start,
    });
    if (end >= durationSeconds) break;
  }
  return chunks;
}

export function mergeAsrTexts(texts, { minimumOverlap = 4, searchLimit = 240 } = {}) {
  return texts
    .map((text) => String(text || "").trim())
    .filter(Boolean)
    .reduce((merged, next) => mergePair(merged, next, minimumOverlap, searchLimit), "");
}

export function transcribeMediaWithVidMuse(input, options = {}) {
  const {
    chunkSeconds = 300,
    overlapSeconds = 2,
    retries = 2,
    onRetry,
    onChunk,
    probeDuration = probeMediaDuration,
    extractChunk = extractAudioChunk,
    runAsr = runVidMuseAsr,
  } = options;
  validateChunkOptions(chunkSeconds, overlapSeconds);

  // Remote inputs remain a direct CLI handoff: downloading arbitrary URLs is a
  // separate ownership/security decision. Local long media gets deterministic
  // ffmpeg chunking before any model call.
  if (REMOTE_URL.test(input)) {
    const response = runAsr(input, { retries, onRetry });
    return {
      text: textFromAsr(response),
      response,
      segmented: false,
      chunk_count: 1,
      duration_seconds: null,
    };
  }

  const durationSeconds = probeDuration(input);
  const chunks = planAsrChunks(durationSeconds, { chunkSeconds, overlapSeconds });
  if (chunks.length === 1) {
    const response = runAsr(input, { retries, onRetry });
    return {
      text: textFromAsr(response),
      response,
      segmented: false,
      chunk_count: 1,
      duration_seconds: durationSeconds,
    };
  }

  const temporaryDir = mkdtempSync(join(tmpdir(), "vidmuse-asr-chunks-"));
  const texts = [];
  try {
    for (const chunk of chunks) {
      const chunkPath = join(
        temporaryDir,
        `chunk-${String(chunk.index + 1).padStart(3, "0")}.wav`,
      );
      extractChunk({
        input,
        output: chunkPath,
        start: chunk.start,
        duration: chunk.duration,
      });
      onChunk?.({ ...chunk, total: chunks.length, path: chunkPath });
      const response = runAsr(chunkPath, {
        retries,
        onRetry(event) {
          onRetry?.({ ...event, chunk: chunk.index + 1, totalChunks: chunks.length });
        },
      });
      texts.push(textFromAsr(response));
    }
  } finally {
    rmSync(temporaryDir, { recursive: true, force: true });
  }

  const text = mergeAsrTexts(texts);
  if (!text) throw new Error("VidMuse ASR chunks returned no text");
  return {
    text,
    response: null,
    segmented: true,
    chunk_count: chunks.length,
    chunk_seconds: chunkSeconds,
    overlap_seconds: overlapSeconds,
    duration_seconds: durationSeconds,
  };
}

export function probeMediaDuration(input, options = {}) {
  const result = runTool(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      input,
    ],
    options,
  );
  const duration = Number(String(result.stdout).trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`ffprobe returned an invalid duration for: ${input}`);
  }
  return duration;
}

export function extractAudioChunk({ input, output, start, duration }, options = {}) {
  runTool(
    "ffmpeg",
    [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(start),
      "-i",
      input,
      "-t",
      String(duration),
      "-map",
      "0:a:0",
      "-vn",
      "-sn",
      "-dn",
      "-c:a",
      "pcm_s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      output,
    ],
    options,
  );
}

function mergePair(previous, next, minimumOverlap, searchLimit) {
  if (!previous) return next;
  const left = comparableCharacters(previous);
  const right = comparableCharacters(next);
  const maximum = Math.min(searchLimit, left.length, right.length);
  for (let length = maximum; length >= minimumOverlap; length -= 1) {
    const leftText = left
      .slice(left.length - length)
      .map(({ character }) => character)
      .join("");
    const rightText = right
      .slice(0, length)
      .map(({ character }) => character)
      .join("");
    if (leftText !== rightText) continue;
    const rawCut = right[length - 1].end;
    const remainder = next.slice(rawCut).replace(/^[\s\p{P}\p{S}]+/u, "");
    return remainder ? `${previous}${remainder}` : previous;
  }
  return `${previous}\n${next}`;
}

function comparableCharacters(text) {
  const characters = [];
  for (const match of text.matchAll(/[\p{L}\p{N}]/gu)) {
    characters.push({
      character: match[0].toLocaleLowerCase(),
      end: match.index + match[0].length,
    });
  }
  return characters;
}

function textFromAsr(response) {
  const text = String(response?.text || response?.data?.text || "").trim();
  if (!text) throw new Error("VidMuse ASR returned no text");
  return text;
}

function validateChunkOptions(chunkSeconds, overlapSeconds) {
  if (!Number.isFinite(chunkSeconds) || chunkSeconds <= 0) {
    throw new Error("ASR chunk seconds must be a positive number");
  }
  if (!Number.isFinite(overlapSeconds) || overlapSeconds < 0) {
    throw new Error("ASR chunk overlap must be a non-negative number");
  }
  if (overlapSeconds >= chunkSeconds) {
    throw new Error("ASR chunk overlap must be smaller than the chunk duration");
  }
}

function runTool(command, args, options = {}) {
  const spawn = options.spawnSync || spawnSync;
  const result = spawn(command, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error?.code === "ENOENT") {
    throw new Error(`${command} is required but was not found on PATH`);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || `exit ${result.status}`).trim();
    throw new Error(`${command} failed: ${detail}`);
  }
  return result;
}
