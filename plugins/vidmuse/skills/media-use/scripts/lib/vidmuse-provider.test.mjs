import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildVidMuseParams } from "./vidmuse-provider.mjs";

test("advanced model parameters cannot replace the selected model or route", () => {
  const params = buildVidMuseParams(
    "video",
    "slow camera push",
    { name: "selected/model" },
    "text_to_video",
    {
      modelParams: {
        model_name: "other/model",
        generation_type: "avatar",
        negative_prompt: "watermark",
      },
    },
  );
  assert.equal(params.model_name, "selected/model");
  assert.equal(params.generation_type, "text_to_video");
  assert.equal(params.negative_prompt, "watermark");
});

test("avatar route uses image and audio inputs without a prompt", () => {
  const params = buildVidMuseParams(
    "video",
    "ignored prose",
    { name: "avatar/model" },
    "avatar",
    {
      inputs: ["./avatar.png"],
      audioInput: "./voice.wav",
    },
  );
  assert.deepEqual(params.image_urls, ["./avatar.png"]);
  assert.equal(params.audio_url, "./voice.wav");
  assert.equal("prompt" in params, false);
});
