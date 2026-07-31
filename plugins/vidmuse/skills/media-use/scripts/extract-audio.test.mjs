import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const CLI = join(import.meta.dirname, "extract-audio.mjs");
const hasFfmpeg = toolExists("ffmpeg") && toolExists("ffprobe");

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, DO_NOT_TRACK: "1" },
  });
}

function toolExists(command) {
  return spawnSync(command, ["-version"], { stdio: "ignore" }).status === 0;
}

function makeVideo(path, withAudio = true) {
  const args = [
    "-nostdin",
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=160x90:r=10:d=0.4",
  ];
  if (withAudio) {
    args.push(
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=48000:duration=0.4",
      "-shortest",
      "-c:a",
      "aac",
    );
  }
  args.push("-c:v", "mpeg4", path);
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

test("extracts speech-ready mono 16 kHz PCM WAV by default", { skip: !hasFfmpeg }, () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-extract-audio-"));
  try {
    const input = join(root, "talk.mp4");
    makeVideo(input);
    const result = run(["--input", input, "--json"]);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.ok, true);
    assert.equal(output.path, join(root, "talk.wav"));
    assert.equal(output.format, "wav");
    assert.equal(output.codec, "pcm_s16le");
    assert.equal(output.sample_rate, 16000);
    assert.equal(output.channels, 1);
    assert.ok(output.bytes > 0);
    assert.ok(existsSync(output.path));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("infers compact MP3 output settings from --out", { skip: !hasFfmpeg }, () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-extract-audio-"));
  try {
    const input = join(root, "talk.mp4");
    const outputPath = join(root, "share.mp3");
    makeVideo(input);
    const result = run(["-i", input, "-o", outputPath, "--json"]);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.format, "mp3");
    assert.equal(output.codec, "mp3");
    assert.equal(output.sample_rate, 44100);
    assert.equal(output.channels, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses silent videos and preserves existing outputs", { skip: !hasFfmpeg }, () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-extract-audio-"));
  try {
    const silentInput = join(root, "silent.mp4");
    makeVideo(silentInput, false);
    const silentResult = run(["-i", silentInput, "--json"]);
    assert.equal(silentResult.status, 1);
    assert.match(JSON.parse(silentResult.stdout).error, /no audio stream/);

    const input = join(root, "talk.mp4");
    const output = join(root, "talk.wav");
    makeVideo(input);
    writeFileSync(output, "keep me");
    const existingResult = run(["-i", input, "--json"]);
    assert.equal(existingResult.status, 1);
    assert.match(JSON.parse(existingResult.stdout).error, /already exists/);

    const overwriteResult = run(["-i", input, "--overwrite", "--json"]);
    assert.equal(overwriteResult.status, 0, overwriteResult.stderr);
    assert.equal(JSON.parse(overwriteResult.stdout).codec, "pcm_s16le");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
