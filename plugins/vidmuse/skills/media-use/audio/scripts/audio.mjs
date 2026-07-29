#!/usr/bin/env node

// VidMuse-native audio pass: TTS + ATA, generated BGM, and SFX.
// Every AI call goes through `vidmuse model list` / `vidmuse model run`.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateWithVidMuse } from "../../scripts/lib/vidmuse-provider.mjs";
import { alignWithVidMuse } from "../../scripts/lib/vidmuse-cli.mjs";
import { bundledSfxProvider } from "../../scripts/lib/bundled-sfx-provider.mjs";
import { freezeUrl } from "../../scripts/lib/freeze.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] != null ? argv[index + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);
const die = (message) => {
  console.error(`error: ${message}`);
  process.exit(1);
};

const requestPath = resolve(flag("request", "audio_request.json"));
const projectDir = resolve(flag("project", flag("hyperframes", ".")));
const outPath = resolve(flag("out", join(projectDir, "audio_meta.json")));
const only = new Set(
  flag("only", "tts,bgm,sfx")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);
if (!existsSync(requestPath)) die(`audio_request.json not found: ${requestPath}`);

let request;
try {
  request = JSON.parse(readFileSync(requestPath, "utf8"));
} catch (error) {
  die(`audio_request.json parse failed: ${error.message}`);
}

const previous = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};
const lines = Array.isArray(request.lines) ? request.lines : [];
const language = flag("lang", request.lang || "en");
const models = request.models || {};
const anomalies = [];

function mediaExtension(url, fallback) {
  try {
    return extname(new URL(url).pathname) || fallback;
  } catch {
    return fallback;
  }
}

function duration(path) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
    { encoding: "utf8" },
  );
  const value = Number(String(result.stdout || "").trim());
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

async function freezeGenerated(result, relativeBase, fallbackExt) {
  const extension = mediaExtension(result.url, fallbackExt);
  const relativePath = `${relativeBase}${extension}`;
  const absolutePath = join(projectDir, relativePath);
  await freezeUrl(result.url, absolutePath);
  return { relativePath, absolutePath };
}

let voices = previous.voices || [];
let ttsProvider = previous.tts_provider || null;
if (only.has("tts")) {
  voices = [];
  ttsProvider = "vidmuse.model";
  for (const line of lines) {
    const id = String(line.id);
    const text = String(line.text || "").trim();
    if (!text) {
      anomalies.push(`line ${id}: empty text — skipped`);
      continue;
    }
    try {
      const generated = await generateWithVidMuse("voice", text, {
        type: "voice",
        model: line.model || models.voice,
        voiceId: line.voice_id || request.voice_id || request.voice,
        language,
        modelParams: line.model_params || request.model_params?.voice,
      });
      if (!generated) throw new Error("no VidMuse TTS model supports text_to_speech");
      const frozen = await freezeGenerated(generated, `assets/voice/${id}`, ".mp3");
      const alignment = alignWithVidMuse({ input: frozen.absolutePath, text });
      voices.push({
        id,
        path: frozen.relativePath,
        duration_s: duration(frozen.absolutePath),
        model_name: generated.metadata.provenance.model_name,
        voice_id: generated.metadata.provenance.voice_id,
        words: alignment.words,
      });
    } catch (error) {
      anomalies.push(`line ${id}: VidMuse TTS/ATA failed — ${error.message}`);
    }
  }
}

const totalDuration = Number(
  voices.reduce((sum, voice) => sum + (voice.duration_s || 0), 0).toFixed(3),
);

let bgm = previous.bgm || null;
if (only.has("bgm")) {
  bgm = null;
  const mode = has("no-bgm") ? "none" : request.bgm?.mode || "generate";
  if (mode !== "none") {
    const prompt =
      request.bgm?.prompt ||
      request.bgm?.query ||
      "restrained cinematic underscore that supports spoken narration";
    try {
      const generated = await generateWithVidMuse("bgm", prompt, {
        type: "bgm",
        model: request.bgm?.model || models.bgm,
        duration: request.bgm?.duration || totalDuration || 30,
        modelParams: request.bgm?.model_params || request.model_params?.bgm,
      });
      if (!generated) throw new Error("no VidMuse music model supports text_to_music");
      const frozen = await freezeGenerated(generated, "assets/bgm/track", ".mp3");
      bgm = {
        path: frozen.relativePath,
        duration_s: duration(frozen.absolutePath),
        volume: voices.length ? 0.12 : 0.9,
        mode: "generate",
        provider: "vidmuse.model",
        model_name: generated.metadata.provenance.model_name,
      };
    } catch (error) {
      anomalies.push(`bgm: VidMuse generation failed — ${error.message}`);
    }
  }
}

let sfx = previous.sfx || [];
if (only.has("sfx")) {
  sfx = [];
  const cues = lines.flatMap((line) =>
    (Array.isArray(line.sfx) ? line.sfx : []).map((name) => ({
      id: String(line.id),
      name: String(name).trim(),
    })),
  );
  for (const cue of cues) {
    if (!cue.name) continue;
    try {
      let generated = await generateWithVidMuse("sfx", cue.name, {
        type: "sfx",
        model: models.sfx,
        modelParams: request.model_params?.sfx,
      });
      if (generated) {
        const frozen = await freezeGenerated(
          generated,
          `assets/sfx/${cue.id}-${sfx.length + 1}`,
          ".mp3",
        );
        sfx.push({
          id: cue.id,
          name: cue.name,
          file: frozen.relativePath,
          source: "vidmuse",
          duration_s: duration(frozen.absolutePath),
          volume: 0.35,
        });
        continue;
      }

      const bundled = await bundledSfxProvider.search(cue.name);
      if (!bundled) {
        anomalies.push(`sfx "${cue.name}" (id ${cue.id}): no VidMuse model or bundled match`);
        continue;
      }
      const extension = bundled.ext || extname(bundled.localPath) || ".mp3";
      const relativePath = `assets/sfx/${cue.id}-${sfx.length + 1}${extension}`;
      const absolutePath = join(projectDir, relativePath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      copyFileSync(bundled.localPath, absolutePath);
      sfx.push({
        id: cue.id,
        name: cue.name,
        file: relativePath,
        source: "bundled",
        duration_s: bundled.metadata.duration,
        volume: 0.35,
      });
    } catch (error) {
      anomalies.push(`sfx "${cue.name}" (id ${cue.id}): ${error.message}`);
    }
  }
}

const meta = {
  tts_provider: ttsProvider,
  voices,
  bgm,
  bgm_pending: false,
  bgm_provider: bgm?.provider || null,
  sfx,
  total_duration_s: totalDuration,
  anomalies,
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(meta, null, 2)}\n`);

console.log(`audio engine -> ${outPath}`);
console.log(`provider: VidMuse CLI · voices: ${voices.length} · bgm: ${bgm ? "yes" : "no"} · sfx: ${sfx.length}`);
if (anomalies.length) {
  console.log("anomalies:");
  for (const anomaly of anomalies) console.log(`  - ${anomaly}`);
}
