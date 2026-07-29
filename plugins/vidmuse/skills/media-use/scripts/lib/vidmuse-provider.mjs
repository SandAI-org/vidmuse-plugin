import {
  findDuration,
  findMediaUrl,
  listVidMuseModels,
  listVidMuseVoices,
  runVidMuseModel,
  selectVidMuseModel,
  voiceIdFromRecord,
} from "./vidmuse-cli.mjs";

const ROUTES = {
  bgm: { modelType: "audio", generationType: "text_to_music" },
  sfx: { modelType: "audio", generationType: "sound_effect" },
  image: { modelType: "image", generationType: "text_to_image" },
  icon: { modelType: "image", generationType: "text_to_image" },
  voice: { modelType: "audio", generationType: "text_to_speech" },
  video: { modelType: "video", generationType: "text_to_video" },
};

function routeFor(type, ctx) {
  const base = ROUTES[type];
  if (!base) return null;
  if (ctx?.generationType) return { ...base, generationType: ctx.generationType };
  const inputs = ctx?.inputs || [];
  if (type === "image" && inputs.length) return { ...base, generationType: "image_to_image" };
  if (type === "video" && inputs.length > 1) {
    return { ...base, generationType: "images_to_video" };
  }
  if (type === "video" && inputs.length === 1) {
    return { ...base, generationType: "image_to_video" };
  }
  return base;
}

export function buildVidMuseParams(type, intent, model, generationType, ctx = {}) {
  const params = {
    model_name: model.name,
    generation_type: generationType,
    prompt:
      type === "icon"
        ? `${intent}. Single clean icon, transparent background, no text, no watermark.`
        : intent,
  };
  if (ctx.duration != null) params.duration = Number(ctx.duration);
  if (ctx.aspectRatio) params.aspect_ratio = ctx.aspectRatio;
  if (ctx.resolution) params.resolution = ctx.resolution;
  if (ctx.inputs?.length) params.image_urls = ctx.inputs;
  if (ctx.audioInput) params.audio_url = ctx.audioInput;
  const merged = {
    ...params,
    ...(ctx.modelParams || {}),
    // Route selection is explicit and cannot be silently changed by an
    // advanced model parameter object.
    model_name: model.name,
    generation_type: generationType,
  };
  if (generationType === "avatar") delete merged.prompt;
  return merged;
}

async function voiceIdFor(model, ctx) {
  if (ctx?.voiceId) return ctx.voiceId;
  const voices = listVidMuseVoices({
    modelName: model.name,
    language: ctx?.language || "en",
    limit: 1,
  });
  return voiceIdFromRecord(voices[0]);
}

export async function generateWithVidMuse(type, intent, ctx = {}) {
  const route = routeFor(type, ctx);
  if (!route) return null;
  const models = listVidMuseModels(route.modelType);
  const model = selectVidMuseModel(models, {
    modelName: ctx.model,
    generationType: route.generationType,
  });
  // A route can be temporarily absent from the live catalog. Let deterministic
  // fallbacks such as bundled SFX continue instead of inventing a model name.
  if (!model) return null;

  const params = buildVidMuseParams(type, intent, model, route.generationType, ctx);
  if (type === "voice") {
    const voiceId = await voiceIdFor(model, ctx);
    if (!voiceId) throw new Error(`no VidMuse voice available for ${model.name}`);
    params.voice_id = voiceId;
  }
  const response = runVidMuseModel(params);
  const url = findMediaUrl(response);
  if (!url) throw new Error(`${model.name} returned no media URL`);
  return {
    url,
    source: "generated",
    metadata: {
      description: intent,
      provider: "vidmuse.model",
      duration: findDuration(response),
      provenance: {
        model_name: model.name,
        generation_type: route.generationType,
        prompt: params.prompt,
        ...(params.voice_id && { voice_id: params.voice_id }),
      },
    },
  };
}

export const vidmuseProvider = {
  generate(intent, ctx) {
    return generateWithVidMuse(ctx.type, intent, ctx);
  },
};
