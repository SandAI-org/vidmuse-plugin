#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { alignWithVidMuse, runVidMuseAsr } from "./lib/vidmuse-cli.mjs";
import { track } from "./lib/telemetry.mjs";

const { values: args } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    out: { type: "string", short: "o" },
    text: { type: "string" },
    "text-file": { type: "string" },
    "asr-only": { type: "boolean", default: false },
    "asr-retries": { type: "string", default: "2" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`media-use transcribe — VidMuse ASR + ATA

Usage:
  node transcribe.mjs --input talk.mp4 [--out talk.transcribe.json]
  node transcribe.mjs --input talk.mp4 --text-file corrected.txt
  node transcribe.mjs --input talk.mp4 --asr-only

Without supplied text, VidMuse ASR first returns the transcript. ATA then aligns
that text to the same media and produces word-level timestamps. Use --text or
--text-file to skip ASR and align corrected/user-authored text.

ASR retries twice by default after a retryable CLI/API failure (3 attempts
total). Use --asr-retries 0 to disable retries or 3 to allow 4 attempts.`);
  process.exit(0);
}

if (!args.input) {
  console.error("error: --input is required");
  process.exit(2);
}
const inputPath = /^https?:\/\//i.test(args.input) ? args.input : resolve(args.input);
if (!/^https?:\/\//i.test(inputPath) && !existsSync(inputPath)) {
  console.error(`error: input not found: ${inputPath}`);
  process.exit(2);
}
function defaultOutput(input) {
  if (/^https?:\/\//i.test(input)) {
    const remoteName = basename(new URL(input).pathname) || "remote-media";
    const extension = extname(remoteName);
    return `${extension ? remoteName.slice(0, -extension.length) : remoteName}.transcribe.json`;
  }
  const extension = extname(input);
  return `${extension ? input.slice(0, -extension.length) : input}.transcribe.json`;
}

const outPath = resolve(args.out || defaultOutput(inputPath));

function atomicWrite(target, value) {
  const temporary = `${target}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
}

function suppliedText() {
  if (args.text) return args.text.trim();
  if (args["text-file"]) {
    const path = resolve(args["text-file"]);
    if (!existsSync(path)) throw new Error(`text file not found: ${path}`);
    return readFileSync(path, "utf8").trim();
  }
  return "";
}

function normalizedUtterances(payload, words) {
  const raw =
    payload?.utterances ||
    payload?.data?.utterances ||
    payload?.result?.utterances ||
    payload?.data?.result?.utterances ||
    [];
  let wordIndex = 0;
  return raw.map((utterance, index) => {
    const count = Array.isArray(utterance?.words) ? utterance.words.length : 0;
    const slice = words.slice(wordIndex, wordIndex + count);
    wordIndex += count;
    return {
      id: `u${index}`,
      text: String(utterance?.text || slice.map((word) => word.text).join("")).trim(),
      start: slice[0]?.start ?? 0,
      end: slice.at(-1)?.end ?? slice[0]?.start ?? 0,
      word_ids: slice.map((word) => word.id),
    };
  });
}

try {
  let text = suppliedText();
  let textSource = text ? "provided" : "vidmuse-asr";
  if (!text) {
    const asr = runVidMuseAsr(inputPath, {
      retries: Number(args["asr-retries"]),
      onRetry({ attempt, maxAttempts, delayMs, error }) {
        console.error(
          `VidMuse ASR attempt ${attempt}/${maxAttempts} failed: ${error.message}; ` +
            `retrying in ${delayMs}ms`,
        );
      },
    });
    text = String(asr?.text || asr?.data?.text || "").trim();
  }

  if (args["asr-only"]) {
    const output = { text, text_source: textSource, words: [], utterances: [] };
    atomicWrite(outPath, output);
    if (args.json) console.log(JSON.stringify({ ok: true, out: outPath, text_source: textSource }));
    else console.log(`transcribed ${basename(String(inputPath))} -> ${outPath} (VidMuse ASR)`);
    process.exit(0);
  }

  const aligned = alignWithVidMuse({ input: inputPath, text });
  const output = {
    text,
    text_source: textSource,
    alignment_model: "doubao_speech/audio_text_alignment",
    words: aligned.words,
    utterances: normalizedUtterances(aligned.response, aligned.words),
  };
  atomicWrite(outPath, output);
  await track("media_use_transcribe", { engine: "vidmuse-asr-ata" });
  if (args.json) {
    console.log(
      JSON.stringify({
        ok: true,
        out: outPath,
        engine: "vidmuse-asr-ata",
        words: output.words.length,
        utterances: output.utterances.length,
        text_source: textSource,
      }),
    );
  } else {
    console.log(
      `transcribed ${basename(String(inputPath))} -> ${outPath} ` +
        `(${output.words.length} words, VidMuse ASR + ATA)`,
    );
  }
} catch (error) {
  if (args.json) console.log(JSON.stringify({ ok: false, error: error.message }));
  else console.error(`error: transcription failed: ${error.message}`);
  process.exit(1);
}
