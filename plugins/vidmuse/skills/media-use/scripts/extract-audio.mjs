#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, extname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { track } from "./lib/telemetry.mjs";

const { values: args } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    out: { type: "string", short: "o" },
    format: { type: "string", short: "f" },
    "sample-rate": { type: "string" },
    channels: { type: "string" },
    bitrate: { type: "string", default: "128k" },
    overwrite: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`media-use extract-audio — extract a video's audio track

Usage:
  node extract-audio.mjs --input talk.mp4
  node extract-audio.mjs --input talk.mp4 --out talk.mp3

Options:
  --input, -i       Source video file (required)
  --out, -o         Output path (default: <input>.wav)
  --format, -f      wav or mp3 (default: infer from --out, otherwise wav)
  --sample-rate     Output Hz (default: 16000 for WAV, 44100 for MP3)
  --channels        Output channels (default: 1 for WAV, 2 for MP3)
  --bitrate         MP3 bitrate (default: 128k)
  --overwrite       Replace an existing output file
  --json            Print a machine-readable result
  --help, -h        Show this help

The WAV preset is mono 16 kHz PCM s16le, suitable for speech recognition.
The MP3 preset is stereo 44.1 kHz at 128 kbps, suitable for compact transfer.`);
  process.exit(0);
}

try {
  const result = run();
  if (args.json) console.log(JSON.stringify(result));
  else {
    console.log(`Extracted ${result.format.toUpperCase()} audio: ${result.path}`);
    console.log(
      `${result.codec}, ${result.sample_rate} Hz, ${result.channels} channel(s), ${formatBytes(result.bytes)}`,
    );
  }
  await track("media_use_extract_audio", { format: result.format });
} catch (err) {
  if (args.json) console.log(JSON.stringify({ ok: false, error: err.message }));
  else console.error(`error: ${err.message}`);
  process.exit(1);
}

function run() {
  if (!args.input) throw new Error("--input is required");

  const input = resolve(args.input);
  if (!existsSync(input) || !statSync(input).isFile()) {
    throw new Error(`input file does not exist: ${input}`);
  }

  const format = selectFormat(args.format, args.out);
  const defaults =
    format === "wav"
      ? { sampleRate: 16000, channels: 1 }
      : { sampleRate: 44100, channels: 2 };
  const sampleRate = positiveInteger(args["sample-rate"] ?? defaults.sampleRate, "--sample-rate");
  const channels = positiveInteger(args.channels ?? defaults.channels, "--channels");
  if (channels > 8) throw new Error("--channels must be between 1 and 8");
  if (format === "mp3" && !/^[1-9]\d*[kK]$/.test(args.bitrate)) {
    throw new Error("--bitrate must look like 128k");
  }

  const output = selectOutput(input, args.out, format);
  if (input === output) throw new Error("input and output paths must be different");
  if (existsSync(output) && !args.overwrite) {
    throw new Error(`output already exists (use --overwrite): ${output}`);
  }

  const inputProbe = probe(input);
  if (!inputProbe.streams?.length) {
    throw new Error(`input has no audio stream: ${input}`);
  }

  mkdirSync(dirname(output), { recursive: true });
  const temporary = resolve(
    dirname(output),
    `.${basename(output, extname(output))}.tmp-${randomUUID()}.${format}`,
  );
  const codecArgs =
    format === "wav"
      ? ["-c:a", "pcm_s16le"]
      : ["-c:a", "libmp3lame", "-b:a", args.bitrate.toLowerCase()];
  const ffmpegArgs = [
    "-nostdin",
    "-hide_banner",
    "-loglevel",
    "error",
    ...(args.overwrite ? ["-y"] : ["-n"]),
    "-i",
    input,
    "-map",
    "0:a:0",
    "-vn",
    "-sn",
    "-dn",
    ...codecArgs,
    "-ar",
    String(sampleRate),
    "-ac",
    String(channels),
    temporary,
  ];

  try {
    runTool("ffmpeg", ffmpegArgs);
    renameSync(temporary, output);
  } catch (err) {
    rmSync(temporary, { force: true });
    throw err;
  }

  const outputProbe = probe(output);
  const stream = outputProbe.streams?.[0];
  if (!stream) {
    rmSync(output, { force: true });
    throw new Error("ffmpeg produced a file without an audio stream");
  }

  return {
    ok: true,
    path: output,
    format,
    codec: stream.codec_name,
    sample_rate: Number(stream.sample_rate),
    channels: stream.channels,
    duration_seconds: Number(outputProbe.format?.duration ?? stream.duration ?? 0),
    bytes: statSync(output).size,
  };
}

function selectFormat(requested, output) {
  const normalized = requested?.toLowerCase();
  if (normalized && !["wav", "mp3"].includes(normalized)) {
    throw new Error('--format must be either "wav" or "mp3"');
  }
  const outputExtension = output ? extname(output).slice(1).toLowerCase() : "";
  if (outputExtension && !["wav", "mp3"].includes(outputExtension)) {
    throw new Error("--out must end in .wav or .mp3");
  }
  if (normalized && outputExtension && normalized !== outputExtension) {
    throw new Error("--format must match the --out file extension");
  }
  return normalized || outputExtension || "wav";
}

function selectOutput(input, output, format) {
  if (output) return resolve(output);
  return resolve(dirname(input), `${basename(input, extname(input))}.${format}`);
}

function positiveInteger(value, flag) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return number;
}

function probe(path) {
  const result = runTool("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=codec_name,sample_rate,channels,duration:format=duration",
    "-of",
    "json",
    path,
  ]);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`ffprobe returned invalid metadata for: ${path}`);
  }
}

function runTool(command, toolArgs) {
  const result = spawnSync(command, toolArgs, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error?.code === "ENOENT") {
    throw new Error(`${command} is required but was not found on PATH`);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${(result.stderr || result.stdout).trim() || "unknown error"}`);
  }
  return result;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
