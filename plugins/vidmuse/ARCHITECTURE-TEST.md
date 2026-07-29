# VidMuse 0.4 architecture acceptance

Test this branch before merging it into `dev`. The core question is whether the
Agent selects an owner from the requested deliverable instead of routing every
video or audio input through a film workflow.

## Expected routing

| Prompt | Expected owner | Must not happen |
| --- | --- | --- |
| “把 interview.mp4 转成带时间戳的逐字稿，先不要包装视频。” | `/media-use` | No recut brief, FRAME, storyboard, or Timeline project |
| “把这段中文文案配成女声，只返回音频。” | `/media-use` | No create film plan |
| “把这条 16:9 视频裁成 9:16，只转换文件。” | `/media-use` | No editorial recut |
| “查找 OpenAI 和 ChatGPT 的官方 Logo，保持身份区分并记录来源。” | `/vidmuse-assets` | No film workflow; no identity substitution |
| “把这条创始人口播包装成发布会质感，加入信息卡和产品截图。” | `/vidmuse-recut` | Domain skills must not take over the final film |
| “根据这份脚本做一条 60 秒 AI 发展史视频，没有真人素材，需要旁白。” | `/vidmuse-create` | TTS must not become a separate final deliverable |
| “给现有口播只加干净字幕并导出视频。” | `/vidmuse-recut` Packaging mode | No missing upstream caption workflow install |
| “诊断这个已有 HyperFrames 项目的 lint 错误，只分析。” | `/hyperframes-cli` | No film discovery |

## Artifact checks

Standalone tasks should return only the requested media artifact plus a
receipt:

- transcription: `*.transcribe.json` with text source and optional ATA words;
- TTS or generated media: frozen local asset plus `.media/manifest.jsonl`;
- deterministic transform: output file registered through Media Use.

Film tasks retain their workflow artifacts:

- recut: transcript receipt, asset plan, packaging/scene plan, FRAME, Timeline;
- create: `audio_request.json`, `audio_meta.json`, `audio.mp3`, ATA
  `transcript.json`, asset plan, film plan, Timeline.

## Local regression commands

```bash
node --test skills/vidmuse/scripts/routing-contract.test.mjs
node --test skills/media-use/scripts/**/*.test.mjs skills/media-use/scripts/*.test.mjs
node --test skills/vidmuse-assets/scripts/*.test.mjs
python3 skills/vidmuse-recut/scripts/test_asset_gate.py
python3 skills/vidmuse-create/scripts/test_alignment_contract.py
python3 skills/vidmuse-create/scripts/test_asset_plan_binding.py
```
