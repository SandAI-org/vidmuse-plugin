#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value) fail(`${flag} requires a value`);
    if (flag === "--project") values.project = value;
    else if (flag === "--video") values.video = value;
    else if (flag === "--metadata") values.metadata = value;
    else if (flag === "--subtitles") values.subtitles = value;
    else if (flag === "--output") values.output = value;
    else fail(`unknown option: ${flag}`);
    index += 1;
  }
  for (const key of ["project", "video", "metadata", "subtitles"]) {
    if (!values[key]) fail(`--${key} is required`);
  }
  return values;
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) fail(`${label} must be a positive number`);
  return number;
}

function frameRate(value) {
  if (typeof value === "number") return positiveNumber(value, "frame rate");
  if (typeof value !== "string") fail("video frame rate is missing");
  const [numerator, denominator = "1"] = value.split("/").map(Number);
  return positiveNumber(numerator / denominator, "frame rate");
}

function projectPath(targetPath, dslPath) {
  const absolutePath = resolve(targetPath);
  const localPath = relative(dirname(dslPath), absolutePath);
  return !localPath.startsWith("..") && !isAbsolute(localPath) ? localPath : absolutePath;
}

function aspectRatio(width, height) {
  const ratio = width / height;
  if (ratio >= 1.2) return "16:9";
  if (ratio <= 0.8) return "9:16";
  return "4:5";
}

function validateSubtitles(value, duration) {
  if (!Array.isArray(value) || value.length === 0) fail("subtitles must be a non-empty array");
  let previousEnd = 0;
  return value.map((subtitle, index) => {
    if (!subtitle || typeof subtitle !== "object" || Array.isArray(subtitle)) fail(`subtitle ${index} must be an object`);
    const text = typeof subtitle.text === "string" ? subtitle.text.trim() : "";
    if (!text) fail(`subtitle ${index}.text must be non-empty`);
    const length = Array.from(text).length;
    if (length > 16) fail(`subtitle ${index}.text has ${length} characters; maximum is 16`);
    const startTime = Number(subtitle.startTime);
    const endTime = Number(subtitle.endTime);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime < 0 || endTime <= startTime) {
      fail(`subtitle ${index} has invalid timing`);
    }
    if (startTime < previousEnd - 0.001) fail(`subtitle ${index} overlaps the previous subtitle`);
    if (endTime > duration + 0.001) fail(`subtitle ${index} ends after the source video`);
    previousEnd = endTime;
    return {
      id: subtitle.id || `subtitle-${String(index + 1).padStart(3, "0")}`,
      text,
      startTime,
      endTime,
      layout: { x: 0.5, y: 0.88, width: 0.88 },
    };
  });
}

export function buildTranscriptReview({ project, video, metadata, subtitles, output }) {
  const projectRoot = resolve(project);
  const videoPath = resolve(video);
  const metadataPath = resolve(metadata);
  const subtitlesPath = resolve(subtitles);
  const outputPath = output ? resolve(output) : resolve(projectRoot, "dsl.json");

  for (const [label, path] of [["video", videoPath], ["metadata", metadataPath], ["subtitles", subtitlesPath]]) {
    if (!existsSync(path)) fail(`${label} does not exist: ${path}`);
  }
  if (existsSync(outputPath)) fail(`output already exists: ${outputPath}`);

  const probe = JSON.parse(readFileSync(metadataPath, "utf8"));
  const streams = Array.isArray(probe.streams) ? probe.streams : [];
  const videoStream = streams.find((stream) => stream.codec_type === "video");
  if (!videoStream) fail("metadata contains no video stream");
  const width = positiveNumber(videoStream.width, "video width");
  const height = positiveNumber(videoStream.height, "video height");
  const duration = positiveNumber(probe.format?.duration, "media duration");
  const fps = frameRate(videoStream.avg_frame_rate || videoStream.r_frame_rate);
  const hasAudio = streams.some((stream) => stream.codec_type === "audio");
  const reviewedSubtitles = validateSubtitles(JSON.parse(readFileSync(subtitlesPath, "utf8")), duration);
  const mediaPath = projectPath(videoPath, outputPath);

  const dsl = {
    version: "2",
    projectName: basename(projectRoot),
    totalDuration: duration,
    options: {
      aspectRatio: aspectRatio(width, height),
      resolution: "source",
      frameRate: fps,
      sourceSize: { width, height },
    },
    sourceVideo: {
      filePath: mediaPath,
      metadata: { duration, width, height, frameRate: fps, hasAudio },
    },
    videoTracks: [
      {
        id: "main-video",
        type: "main",
        videos: [
          {
            id: "source-video",
            type: "video",
            duration,
            videoClipStartTime: 0,
            playbackRate: 1,
            muted: false,
            volume: 1,
            videoFile: [{ source: "upload", active: true, filePath: mediaPath }],
          },
        ],
      },
      { id: "graphics", type: "sub", videos: [] },
    ],
    sounds: [],
    subtitles: reviewedSubtitles,
  };

  writeFileSync(outputPath, `${JSON.stringify(dsl, null, 2)}\n`, { flag: "wx" });
  return outputPath;
}

export function main(argv = process.argv.slice(2)) {
  const outputPath = buildTranscriptReview(parseArgs(argv));
  process.stdout.write(`${outputPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
