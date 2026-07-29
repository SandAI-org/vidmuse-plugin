import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  findMediaUrl,
  modelSupportsRoute,
  parseVidMuseJson,
  runVidMuseJson,
  selectVidMuseModel,
  wordsFromAlignment,
} from "./vidmuse-cli.mjs";

test("parses VidMuse JSON and rejects empty output", () => {
  assert.deepEqual(parseVidMuseJson('{"ok":true}'), { ok: true });
  assert.throws(() => parseVidMuseJson(""), /empty output/);
});

test("runVidMuseJson passes output=json without a shell", () => {
  let captured;
  const result = runVidMuseJson(["model", "list", "--image"], {
    spawnSync(command, args, options) {
      captured = { command, args, options };
      return { status: 0, stdout: '{"data":[]}', stderr: "" };
    },
  });
  assert.deepEqual(result, { data: [] });
  assert.equal(captured.command, "vidmuse");
  assert.deepEqual(captured.args.slice(-2), ["-o", "json"]);
  assert.equal(captured.options.encoding, "utf8");
});

test("live default model wins for the requested route", () => {
  const models = [
    {
      name: "cheap",
      capabilities: { allowed_default_model_keys: ["t2i_model_name"] },
      options: { required_params: { text_to_image: ["prompt"] } },
      priceItems: [{ price: { output: 1 } }],
    },
    {
      name: "default",
      capabilities: {
        allowed_default_model_keys: ["t2i_model_name"],
        default_model_keys: ["t2i_model_name"],
      },
      options: { required_params: { text_to_image: ["prompt"] } },
      priceItems: [{ price: { output: 10 } }],
    },
  ];
  assert.equal(
    selectVidMuseModel(models, { generationType: "text_to_image" }).name,
    "default",
  );
});

test("audio subtype supports documented routes with empty required_params", () => {
  assert.equal(
    modelSupportsRoute(
      { subType: "voice", options: { required_params: {} } },
      "text_to_speech",
    ),
    true,
  );
  assert.equal(
    modelSupportsRoute(
      { subType: "music", options: { required_params: {} } },
      "text_to_music",
    ),
    true,
  );
  assert.equal(
    modelSupportsRoute(
      { subType: "audio", options: { required_params: {} } },
      "sound_effect",
    ),
    false,
  );
});

test("finds nested media URLs from model responses", () => {
  assert.equal(
    findMediaUrl({ data: { outputs: [{ video_url: "https://cdn.test/out.mp4" }] } }),
    "https://cdn.test/out.mp4",
  );
});

test("normalizes ATA millisecond words to seconds", () => {
  const words = wordsFromAlignment({
    data: {
      utterances: [
        {
          words: [
            { text: "你", start_time: 100, end_time: 300 },
            { text: "好", start_time: 320, end_time: 600 },
          ],
        },
      ],
    },
  });
  assert.deepEqual(words, [
    { id: "w0", text: "你", start: 0.1, end: 0.3 },
    { id: "w1", text: "好", start: 0.32, end: 0.6 },
  ]);
});
