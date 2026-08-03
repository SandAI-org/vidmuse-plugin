#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const VALID_RESOLUTIONS = new Set(["source", "720p", "1080p", "4k"]);
const EPSILON = 0.01;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTime(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parts = value.trim().replaceAll(",", ".").split(":").map(Number);
  if (parts.length > 3 || parts.some((part) => !Number.isFinite(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function itemDuration(item) {
  const explicit = positiveNumber(item.duration);
  if (explicit !== null) return explicit;
  const start = parseTime(item.startTime);
  const end = parseTime(item.endTime);
  if (start !== null && end !== null && end > start) return end - start;
  return positiveNumber(item.modelConfig?.duration);
}

function assetSelection(value) {
  if (typeof value === "string") {
    return { activeCount: value ? 1 : 0, candidates: value ? [value] : [], selected: value || null };
  }
  if (!Array.isArray(value)) return { activeCount: 0, candidates: [], selected: null };
  if (value.every((entry) => typeof entry === "string")) {
    const candidates = value.filter(Boolean);
    return { activeCount: candidates.length > 0 ? 1 : 0, candidates, selected: candidates[0] ?? null };
  }
  const entries = value.filter(isRecord);
  const explicit = entries.filter((entry) => entry.active === true && typeof entry.filePath === "string" && entry.filePath);
  const fallback = entries.filter((entry) => entry.active !== false && typeof entry.filePath === "string" && entry.filePath);
  const candidates = entries.flatMap((entry) => typeof entry.filePath === "string" && entry.filePath ? [entry.filePath] : []);
  return {
    activeCount: explicit.length,
    candidates,
    selected: explicit[0]?.filePath ?? fallback[0]?.filePath ?? null,
  };
}

function isHttp(value) {
  return /^https?:\/\//i.test(value ?? "");
}

function resolveLocalPath(value, dslDirectory) {
  if (/^file:/i.test(value)) return fileURLToPath(value);
  return path.isAbsolute(value) ? value : path.resolve(dslDirectory, value);
}

function attributeValue(tag, name) {
  const expression = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i");
  const match = expression.exec(tag);
  return match?.[1] ?? match?.[2] ?? null;
}

function rootCompositionTag(html) {
  const expression = /<(?:main|div)\b[^>]*\bdata-composition-id=(?:"[^"]*"|'[^']*')[^>]*>/gi;
  for (const match of html.matchAll(expression)) {
    const index = match.index ?? 0;
    const lastTemplateOpen = html.toLowerCase().lastIndexOf("<template", index);
    const lastTemplateClose = html.toLowerCase().lastIndexOf("</template", index);
    if (lastTemplateOpen <= lastTemplateClose) return match[0];
  }
  return null;
}

function ratioFromAspect(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value.trim());
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? width / height : null;
}

export function validateDsl(dsl, { dslPath = path.resolve("dsl.json"), fileSystem = fs } = {}) {
  const findings = [];
  const dslDirectory = path.dirname(dslPath);
  const ids = new Map();
  const hyperframesSources = [];
  let contentEnd = 0;
  let hasExplicitMainMedia = false;
  let hasAudibleMainProgram = false;

  const add = (level, code, fieldPath, message) => findings.push({ level, code, path: fieldPath, message });

  const recordId = (value, fieldPath) => {
    if (typeof value !== "string" || value.trim() === "") {
      add("error", "missing_id", fieldPath, "A stable non-empty ID is required.");
      return;
    }
    const previous = ids.get(value);
    if (previous) add("error", "duplicate_id", fieldPath, `ID ${JSON.stringify(value)} already appears at ${previous}.`);
    else ids.set(value, fieldPath);
  };

  const validatePath = (value, fieldPath, { hyperframes = false } = {}) => {
    if (!value) {
      add("error", "missing_path", fieldPath, "An active file path is required.");
      return null;
    }
    if (isHttp(value)) {
      if (hyperframes) add("error", "remote_hyperframes", fieldPath, "HyperFrames HTML must be a local file.");
      return null;
    }
    let resolved;
    try {
      resolved = resolveLocalPath(value, dslDirectory);
    } catch (error) {
      add("error", "invalid_file_url", fieldPath, error instanceof Error ? error.message : "Invalid file URL.");
      return null;
    }
    if (!fileSystem.existsSync(resolved)) {
      add("error", "missing_local_file", fieldPath, `Local file does not exist: ${resolved}`);
      return resolved;
    }
    return resolved;
  };

  const validateAsset = (value, fieldPath, options = {}) => {
    const selection = assetSelection(value);
    if (selection.activeCount > 1) {
      add("warning", "multiple_active_assets", fieldPath, "More than one asset is explicitly active; the runtime uses the first one.");
    }
    const resolved = selection.selected ? validatePath(selection.selected, fieldPath, options) : null;
    return { ...selection, resolved };
  };

  const validateHyperframesHost = (resolved, fieldPath, item, duration) => {
    if (!resolved || !fileSystem.existsSync(resolved)) return;
    if (resolved.split(path.sep).join("/").includes("/compositions/components/")) {
      add("error", "raw_hyperframes_component", fieldPath, "Reference a complete host composition, not a raw Registry component snippet.");
    }
    let html;
    try {
      html = fileSystem.readFileSync(resolved, "utf8");
    } catch (error) {
      add("error", "unreadable_hyperframes", fieldPath, error instanceof Error ? error.message : "Unable to read HyperFrames HTML.");
      return;
    }
    const rootTag = rootCompositionTag(html);
    if (!rootTag) {
      add("error", "incomplete_hyperframes_host", fieldPath, "HTML needs a standalone data-composition-id root outside <template>.");
      return;
    }
    for (const attribute of ["data-start", "data-width", "data-height", "data-duration"]) {
      if (attributeValue(rootTag, attribute) === null) {
        add("error", "missing_hyperframes_attribute", fieldPath, `Host root is missing ${attribute}.`);
      }
    }
    const rootStart = nonNegativeNumber(attributeValue(rootTag, "data-start"));
    if (rootStart !== 0) add("error", "invalid_hyperframes_start", fieldPath, "Host root data-start must be 0.");
    const width = positiveNumber(attributeValue(rootTag, "data-width"));
    const height = positiveNumber(attributeValue(rootTag, "data-height"));
    const rootDuration = positiveNumber(attributeValue(rootTag, "data-duration"));
    const sourceStart = nonNegativeNumber(item.params?.sourceStartTime) ?? 0;
    const frameRate = positiveNumber(sourceMetadata.frameRate) ?? 30;
    const durationTolerance = Math.max(EPSILON, 1 / frameRate + 0.001);
    if (rootDuration !== null && rootDuration + durationTolerance < sourceStart + duration) {
      add("error", "hyperframes_duration_short", fieldPath, `Host duration ${rootDuration}s does not cover source range through ${sourceStart + duration}s.`);
    }
    const targetRatio = ratioFromAspect(dsl.options?.aspectRatio);
    if (width !== null && height !== null && targetRatio !== null && Math.abs(width / height - targetRatio) > 0.01) {
      add("warning", "hyperframes_aspect_mismatch", fieldPath, "HyperFrames host aspect ratio differs from the DSL canvas and will be scaled.");
    }
  };

  if (!isRecord(dsl)) {
    add("error", "invalid_root", "$", "DSL root must be a JSON object.");
    return findings;
  }

  if (!(dsl.version === "2" || dsl.version === 2)) add("error", "invalid_version", "version", "Use DSL version \"2\".");

  const canvasRatio = ratioFromAspect(dsl.options?.aspectRatio);
  if (dsl.options?.aspectRatio !== undefined && canvasRatio === null) {
    add("error", "invalid_aspect_ratio", "options.aspectRatio", "Use a positive W:H aspect ratio such as 16:9 or 9:16.");
  }
  if (dsl.options?.resolution !== undefined && !VALID_RESOLUTIONS.has(dsl.options.resolution)) {
    add("error", "invalid_resolution", "options.resolution", "Resolution must be source, 720p, 1080p, or 4k.");
  }

  const sourceSelection = dsl.sourceVideo?.filePath
    ? validatePath(dsl.sourceVideo.filePath, "sourceVideo.filePath")
    : null;
  const sourceMetadata = dsl.sourceVideo?.metadata ?? dsl.sourceVideo ?? {};
  for (const field of ["duration", "width", "height", "frameRate"]) {
    if (sourceMetadata[field] !== undefined && positiveNumber(sourceMetadata[field]) === null) {
      add("error", "invalid_source_metadata", `sourceVideo.metadata.${field}`, `${field} must be a positive number.`);
    }
  }

  const tracks = dsl.videoTracks;
  if (tracks !== undefined && !Array.isArray(tracks)) add("error", "invalid_tracks", "videoTracks", "videoTracks must be an array.");

  for (const [trackIndex, track] of (Array.isArray(tracks) ? tracks : []).entries()) {
    const trackPath = `videoTracks[${trackIndex}]`;
    if (!isRecord(track)) {
      add("error", "invalid_track", trackPath, "Track must be an object.");
      continue;
    }
    recordId(track.id, `${trackPath}.id`);
    if (track.type !== "main" && track.type !== "sub") {
      add("warning", "noncanonical_track_type", `${trackPath}.type`, "New projects should use main or sub; preserve this only for a required legacy project.");
    }
    const videos = Array.isArray(track.videos) ? track.videos : [];
    const legacyItems = Array.isArray(track.items) ? track.items : [];
    if (videos.length > 0 && legacyItems.length > 0) {
      add("warning", "ambiguous_item_collection", trackPath, "Both videos and items are populated; the runtime prefers videos.");
    }
    const items = videos.length > 0 ? videos : legacyItems;
    const collection = videos.length > 0 ? "videos" : "items";
    let sequentialCursor = 0;

    for (const [itemIndex, item] of items.entries()) {
      const itemPath = `${trackPath}.${collection}[${itemIndex}]`;
      if (!isRecord(item)) {
        add("error", "invalid_item", itemPath, "Track item must be an object.");
        continue;
      }
      recordId(item.id, `${itemPath}.id`);
      const hyperframes = item.type === "hyperframes" || Boolean(item.htmlSourceFilePath || item.htmlSource);
      const duration = itemDuration(item);
      if (duration === null) {
        add("error", "missing_duration", `${itemPath}.duration`, "Give every item an explicit positive duration or a valid start/end range.");
        continue;
      }
      const parsedStart = item.startTime === undefined ? null : parseTime(item.startTime);
      if (item.startTime !== undefined && (parsedStart === null || parsedStart < 0)) {
        add("error", "invalid_start_time", `${itemPath}.startTime`, "startTime must be a non-negative number or timecode.");
      }
      const timed = hyperframes || track.type === "sub";
      if (timed && item.startTime === undefined) add("error", "missing_start_time", `${itemPath}.startTime`, "Timed items require explicit startTime, including 0.");
      const start = timed ? Math.max(0, parsedStart ?? 0) : sequentialCursor;
      if (!timed && parsedStart !== null && Math.abs(parsedStart - sequentialCursor) > EPSILON) {
        add("warning", "ignored_main_start", `${itemPath}.startTime`, `Main-track placement is sequential at ${sequentialCursor}s; this startTime is ignored.`);
      }
      if (!timed) sequentialCursor += duration;
      contentEnd = Math.max(contentEnd, start + duration);

      const parsedEnd = item.endTime === undefined ? null : parseTime(item.endTime);
      if (item.endTime !== undefined && (parsedEnd === null || parsedEnd < 0)) {
        add("error", "invalid_end_time", `${itemPath}.endTime`, "endTime must be a non-negative number or timecode.");
      } else if (timed && parsedEnd !== null && Math.abs(parsedEnd - (start + duration)) > EPSILON) {
        add("warning", "inconsistent_end_time", `${itemPath}.endTime`, "endTime does not equal startTime + duration.");
      }

      if (hyperframes) {
        const sourceValue = item.htmlSourceFilePath || item.htmlSource;
        const resolved = validatePath(sourceValue, `${itemPath}.htmlSourceFilePath`, { hyperframes: true });
        validateHyperframesHost(resolved, `${itemPath}.htmlSourceFilePath`, item, duration);
        if (sourceValue) hyperframesSources.push({ item, itemPath, sourceValue });
        continue;
      }

      const rate = item.playbackRate === undefined ? 1 : Number(item.playbackRate);
      if (!Number.isFinite(rate) || rate < 0.1 || rate > 16) {
        add("error", "invalid_playback_rate", `${itemPath}.playbackRate`, "playbackRate must be within 0.1–16.");
      }
      const volume = item.volume === undefined ? 1 : Number(item.volume);
      if (!Number.isFinite(volume) || volume < 0 || volume > 2) {
        add("error", "invalid_volume", `${itemPath}.volume`, "volume must be within 0–2.");
      }
      const sourceStart = item.videoClipStartTime === undefined ? 0 : parseTime(item.videoClipStartTime);
      if (sourceStart === null || sourceStart < 0) {
        add("error", "invalid_source_start", `${itemPath}.videoClipStartTime`, "videoClipStartTime must be non-negative.");
      }
      const media = assetSelection(item.videoFile);
      if (!media.selected) {
        if (item.modelConfig !== undefined) add("warning", "pending_video", itemPath, "Video is a generation placeholder and is not render-ready.");
        else add("error", "missing_video_file", `${itemPath}.videoFile`, "Video item needs an active videoFile.");
      } else {
        validateAsset(item.videoFile, `${itemPath}.videoFile`);
        if (!timed) hasExplicitMainMedia = true;
      }
      const sourceHasAudio = item.hasAudio === true || (sourceMetadata.hasAudio === true && sourceSelection && media.selected === dsl.sourceVideo?.filePath);
      if (!timed && track.muted !== true && item.muted !== true && sourceHasAudio) hasAudibleMainProgram = true;
    }
  }

  if (dsl.sourceVideo?.filePath && !hasExplicitMainMedia) {
    contentEnd = Math.max(contentEnd, positiveNumber(sourceMetadata.duration) ?? 0);
  }

  const repeatedSources = new Map();
  for (const entry of hyperframesSources) {
    const entries = repeatedSources.get(entry.sourceValue) ?? [];
    entries.push(entry);
    repeatedSources.set(entry.sourceValue, entries);
  }
  for (const entries of repeatedSources.values()) {
    if (entries.length > 1 && entries.some(({ item }) => nonNegativeNumber(item.params?.sourceStartTime) === null)) {
      for (const { itemPath } of entries) {
        add("warning", "implicit_shared_hyperframes_time", `${itemPath}.params.sourceStartTime`, "Repeated HyperFrames sources should set sourceStartTime explicitly on every item.");
      }
    }
  }

  for (const [soundIndex, sound] of (Array.isArray(dsl.sounds) ? dsl.sounds : []).entries()) {
    const soundPath = `sounds[${soundIndex}]`;
    if (!isRecord(sound)) {
      add("error", "invalid_sound", soundPath, "Sound must be an object.");
      continue;
    }
    recordId(sound.id, `${soundPath}.id`);
    const start = parseTime(sound.startTime ?? 0);
    const duration = positiveNumber(sound.duration);
    if (start === null || start < 0) add("error", "invalid_start_time", `${soundPath}.startTime`, "Sound startTime must be non-negative.");
    if (duration === null) add("error", "missing_duration", `${soundPath}.duration`, "Sound needs a positive duration.");
    if (start !== null && start >= 0 && duration !== null && sound.muted !== true) contentEnd = Math.max(contentEnd, start + duration);
    const volume = sound.volume === undefined ? 1 : Number(sound.volume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 2) add("error", "invalid_volume", `${soundPath}.volume`, "volume must be within 0–2.");
    const media = assetSelection(sound.audioFile);
    if (!media.selected) {
      if (sound.description) add("warning", "pending_audio", soundPath, "Sound is a placeholder and is not render-ready.");
      else add("error", "missing_audio_file", `${soundPath}.audioFile`, "Sound needs an active audioFile.");
    } else validateAsset(sound.audioFile, `${soundPath}.audioFile`);
    const label = [sound.id, sound.name, sound.description, sound.type].filter(Boolean).join(" ");
    if (hasAudibleMainProgram && /(?:source|program|original).*(?:audio|sound)|(?:audio|sound).*(?:source|program|original)/i.test(label)) {
      add("warning", "possible_program_audio_duplicate", soundPath, "Main video is audible and this independent sound looks like another program-audio copy.");
    }
  }

  const activeSubtitleIntervals = [];
  for (const [subtitleIndex, subtitle] of (Array.isArray(dsl.subtitles) ? dsl.subtitles : []).entries()) {
    const subtitlePath = `subtitles[${subtitleIndex}]`;
    if (!isRecord(subtitle)) {
      add("error", "invalid_subtitle", subtitlePath, "Subtitle must be an object.");
      continue;
    }
    recordId(subtitle.id, `${subtitlePath}.id`);
    const start = parseTime(subtitle.startTime);
    const end = parseTime(subtitle.endTime);
    if (start === null || start < 0 || end === null || end <= start) {
      add("error", "invalid_subtitle_time", subtitlePath, "Subtitle needs non-negative startTime and a later endTime.");
    } else if (subtitle.disabled !== true && subtitle.text) {
      contentEnd = Math.max(contentEnd, end);
      activeSubtitleIntervals.push({ end, path: subtitlePath, start });
    }
    if (subtitle.disabled !== true && (typeof subtitle.text !== "string" || subtitle.text.trim() === "")) {
      add("error", "missing_subtitle_text", `${subtitlePath}.text`, "Enabled subtitle needs non-empty text.");
    }
    for (const coordinate of ["x", "y", "width"]) {
      const value = subtitle.layout?.[coordinate];
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1)) {
        add("error", "invalid_subtitle_layout", `${subtitlePath}.layout.${coordinate}`, `${coordinate} must be normalized within 0–1.`);
      }
    }
    for (const field of ["fontSize", "scale", "fontWeight"]) {
      const value = subtitle.style?.[field];
      if (value !== undefined && positiveNumber(value) === null) add("error", "invalid_subtitle_style", `${subtitlePath}.style.${field}`, `${field} must be positive.`);
    }
    const opacity = subtitle.style?.opacity;
    if (opacity !== undefined && (!Number.isFinite(Number(opacity)) || Number(opacity) < 0 || Number(opacity) > 1)) {
      add("error", "invalid_subtitle_style", `${subtitlePath}.style.opacity`, "opacity must be within 0–1.");
    }
  }

  activeSubtitleIntervals.sort((left, right) => left.start - right.start);
  for (let index = 1; index < activeSubtitleIntervals.length; index += 1) {
    const previous = activeSubtitleIntervals[index - 1];
    const current = activeSubtitleIntervals[index];
    if (current.start < previous.end - EPSILON) add("warning", "subtitle_overlap", current.path, `Overlaps ${previous.path}.`);
  }

  const declaredDuration = positiveNumber(dsl.totalDuration);
  if (declaredDuration === null) {
    add("error", "missing_total_duration", "totalDuration", "Declare a positive totalDuration for assembled projects.");
  } else if (contentEnd > declaredDuration + EPSILON) {
    add("error", "total_duration_short", "totalDuration", `Declared ${declaredDuration}s ends before content at ${Number(contentEnd.toFixed(3))}s.`);
  } else if (declaredDuration > contentEnd + 0.05) {
    add("warning", "total_duration_long", "totalDuration", `Declared ${declaredDuration}s exceeds derived content end ${Number(contentEnd.toFixed(3))}s.`);
  }

  return findings;
}

export function validateDslFile(dslPath, options = {}) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(dslPath, "utf8"));
  } catch (error) {
    return [{
      level: "error",
      code: "invalid_json",
      path: "$",
      message: error instanceof Error ? error.message : "Invalid JSON.",
    }];
  }
  return validateDsl(parsed, { ...options, dslPath: path.resolve(dslPath) });
}

function printHuman(findings, dslPath) {
  if (findings.length === 0) {
    process.stdout.write(`DSL valid: ${dslPath}\n`);
    return;
  }
  for (const finding of findings) {
    process.stdout.write(`${finding.level.toUpperCase()} ${finding.code} ${finding.path}: ${finding.message}\n`);
  }
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  process.stdout.write(`${errors} error(s), ${warnings} warning(s)\n`);
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const positional = args.filter((argument) => !argument.startsWith("--"));
  if (positional.length !== 1 || args.some((argument) => argument.startsWith("--") && argument !== "--json")) {
    process.stderr.write("Usage: validate-dsl.mjs <dsl.json> [--json]\n");
    return 2;
  }
  const dslPath = path.resolve(positional[0]);
  const findings = validateDslFile(dslPath);
  if (json) process.stdout.write(`${JSON.stringify({ dslPath, findings, ok: !findings.some((finding) => finding.level === "error") }, null, 2)}\n`);
  else printHuman(findings, dslPath);
  return findings.some((finding) => finding.level === "error") ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = main(process.argv);
