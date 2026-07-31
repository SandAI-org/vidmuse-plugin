import { spawnSync } from "node:child_process";

const ROUTE_KEYS = {
  text_to_image: "t2i_model_name",
  image_to_image: "i2i_model_name",
  text_to_video: "t2v_model_name",
  image_to_video: "i2v_model_name",
  images_to_video: "is2v_model_name",
  reference_to_video: "ref2v_model_name",
  avatar: "avatar_model_name",
  text_to_speech: "voice_model_name",
  text_to_music: "music_model_name",
};

const SUBTYPE_BY_ROUTE = {
  text_to_speech: "voice",
  text_to_music: "music",
  avatar: "avatar",
};

function commandError(args, result) {
  const stderr = String(result.stderr || "").trim();
  const stdout = String(result.stdout || "").trim();
  const detail = stderr || stdout || result.error?.message || `exit ${result.status}`;
  const error = new Error(`vidmuse ${args.join(" ")} failed: ${detail}`);
  error.code = result.error?.code;
  error.vidmuseDetail = detail;
  return error;
}

export function parseVidMuseJson(stdout) {
  const text = String(stdout || "").trim();
  if (!text) throw new Error("vidmuse returned empty output");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`vidmuse returned invalid JSON: ${error.message}`);
  }
}

export function runVidMuseJson(args, options = {}) {
  const spawn = options.spawnSync || spawnSync;
  const result = spawn("vidmuse", [...args, "-o", "json"], {
    encoding: "utf8",
    timeout: options.timeout ?? 1_800_000,
    maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024,
    env: options.env || process.env,
  });
  if (result.status !== 0) throw commandError(args, result);
  return parseVidMuseJson(result.stdout);
}

export function listVidMuseModels(type, options = {}) {
  const args = ["model", "list"];
  if (type) args.push(`--${type}`);
  return runVidMuseJson(args, options).data || [];
}

function generationRoutes(model) {
  const required = model?.options?.required_params;
  return required && !Array.isArray(required) && typeof required === "object"
    ? Object.keys(required)
    : [];
}

export function modelSupportsRoute(model, generationType) {
  if (!generationType) return true;
  const routes = generationRoutes(model);
  if (routes.includes(generationType)) return true;

  const routeKey = ROUTE_KEYS[generationType];
  const allowed = model?.capabilities?.allowed_default_model_keys || [];
  if (routeKey && allowed.includes(routeKey)) return true;

  // Some audio models currently publish an empty required_params object even
  // though the documented Aion route is valid. Subtype is the reliable signal.
  const subtype = SUBTYPE_BY_ROUTE[generationType];
  return !!subtype && model?.subType === subtype;
}

function modelRank(model, generationType) {
  const routeKey = ROUTE_KEYS[generationType];
  const defaults = model?.capabilities?.default_model_keys || [];
  const allowed = model?.capabilities?.allowed_default_model_keys || [];
  return [
    routeKey && defaults.includes(routeKey) ? 0 : 1,
    routeKey && allowed.includes(routeKey) ? 0 : 1,
    model?.priceItems?.[0]?.price?.output ?? Number.MAX_SAFE_INTEGER,
    model?.name || "",
  ];
}

function compareRank(left, right, generationType) {
  const a = modelRank(left, generationType);
  const b = modelRank(right, generationType);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] < b[index]) return -1;
    if (a[index] > b[index]) return 1;
  }
  return 0;
}

export function selectVidMuseModel(models, { modelName, generationType } = {}) {
  if (modelName) {
    const exact = models.find((model) => model.name === modelName);
    if (!exact) throw new Error(`VidMuse model not found: ${modelName}`);
    if (!modelSupportsRoute(exact, generationType)) {
      throw new Error(`${modelName} does not support generation_type=${generationType}`);
    }
    return exact;
  }
  return models
    .filter((model) => modelSupportsRoute(model, generationType))
    .sort((a, b) => compareRank(a, b, generationType))[0] || null;
}

export function findMediaUrl(payload) {
  const preferredKeys = [
    "audio_url",
    "video_url",
    "image_url",
    "download_url",
    "downloadUrl",
    "output_url",
    "outputUrl",
    "url",
  ];
  const seen = new Set();

  function visit(value) {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
    if (!value || typeof value !== "object" || seen.has(value)) return null;
    seen.add(value);
    for (const key of preferredKeys) {
      if (key in value) {
        const found = visit(value[key]);
        if (found) return found;
      }
    }
    for (const nested of Array.isArray(value) ? value : Object.values(value)) {
      const found = visit(nested);
      if (found) return found;
    }
    return null;
  }

  return visit(payload);
}

export function findDuration(payload) {
  const candidates = [
    payload?.duration,
    payload?.duration_s,
    payload?.data?.duration,
    payload?.data?.duration_s,
  ];
  return candidates.map(Number).find((value) => Number.isFinite(value) && value > 0) ?? null;
}

export function runVidMuseModel(params, options = {}) {
  return runVidMuseJson(
    ["model", "run", "--param", JSON.stringify(params)],
    { ...options, timeout: options.timeout ?? 3_600_000 },
  );
}

export function runVidMuseAsr(input, options = {}) {
  const {
    retries = 2,
    retryDelayMs = 1000,
    onRetry,
    ...modelOptions
  } = options;
  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error("ASR retries must be a non-negative integer");
  }
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new Error("ASR retry delay must be a non-negative number");
  }

  const maxAttempts = retries + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = runVidMuseModel(
        {
          files: [input],
          extra_params: { sub_model_type: "asr" },
        },
        modelOptions,
      );
      const text = String(response?.text || response?.data?.text || "").trim();
      if (!text) throw new Error("VidMuse ASR returned no text");
      return response;
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryableAsrError(error)) throw error;
      const delayMs = retryDelayMs * 2 ** (attempt - 1);
      onRetry?.({ attempt, maxAttempts, delayMs, error });
      sleepMs(delayMs);
    }
  }
  throw new Error("VidMuse ASR failed without an error");
}

export function isRetryableAsrError(error) {
  if (error?.code === "ENOENT") return false;
  const detail = String(error?.vidmuseDetail || error?.message || "");
  return !(
    /\b(?:400|401|403|404|422)\b/.test(detail) ||
    /unauthori[sz]ed|forbidden|not authenticated|login required|please log in/i.test(detail) ||
    /invalid (?:param|parameter|argument|request)|validation failed|unknown option/i.test(detail) ||
    /insufficient (?:credit|credits|balance)|model not found|does not support/i.test(detail)
  );
}

function sleepMs(ms) {
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function listVidMuseVoices({ modelName, language = "en", limit = 20 } = {}, options = {}) {
  const args = [
    "voice",
    "list",
    "--scope",
    "all",
    "--language",
    language,
    "--limit",
    String(limit),
    "--view",
    "summary",
  ];
  if (modelName) args.push("--model", modelName);
  return runVidMuseJson(args, options).data || [];
}

export function voiceIdFromRecord(record) {
  return record?.voiceId || record?.voice_id || record?.id || null;
}

export function wordsFromAlignment(payload) {
  const utterances =
    payload?.utterances ||
    payload?.data?.utterances ||
    payload?.result?.utterances ||
    payload?.data?.result?.utterances ||
    [];
  const words = [];
  for (const utterance of utterances) {
    for (const word of utterance?.words || []) {
      const text = String(word.text ?? word.word ?? "").trim();
      const startMs = Number(word.start_time ?? word.startTime ?? word.start);
      const endMs = Number(word.end_time ?? word.endTime ?? word.end);
      if (!text || !Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;
      words.push({
        id: `w${words.length}`,
        text,
        start: startMs / 1000,
        end: endMs / 1000,
      });
    }
  }
  return words;
}

export function alignWithVidMuse({ input, text }, options = {}) {
  const response = runVidMuseModel(
    {
      model_name: "doubao_speech/audio_text_alignment",
      prompt: text,
      files: [input],
    },
    options,
  );
  const words = wordsFromAlignment(response);
  if (!words.length) throw new Error("VidMuse ATA returned no word timestamps");
  return { response, words };
}
