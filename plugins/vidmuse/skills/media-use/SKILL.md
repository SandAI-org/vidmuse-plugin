---
name: media-use
description: VidMuse plugin dependency for media assets and deterministic media operations inside vidmuse-recut or vidmuse-create. Resolve, generate, freeze, inventory, and reuse BGM, SFX, images, icons, official logos, TTS voice, AI video, color grades, and LUTs. All AI generation and speech processing must use the VidMuse CLI live model catalog (`vidmuse model list`, `vidmuse voice list`, `vidmuse model run`); transcription uses VidMuse ASR followed by ATA for word timing. Do not use provider-specific CLIs or local AI stacks. Not a top-level router: existing speaking footage, plain subtitle extraction, SRT, and captions-only requests belong to vidmuse-recut; films without speaking footage belong to vidmuse-create.
compatibility: VidMuse CLI on PATH and authenticated; ffmpeg/ffprobe; Node.js 18+. Model calls require network and VidMuse credits.
---

# media-use

VidMuse's media capability layer: **resolve · generate · operate · remember**.

> Product boundary: `/vidmuse-recut` owns existing speaking footage, ASR/ATA
> transcript strategy, subtitle delivery, and packaging. `/vidmuse-create` owns
> films without a speaking source. Load this skill inside those workflows for
> assets and media operations; never take over their product routing.

## One AI execution substrate

For every AI task:

1. Check `vidmuse plan get -o json` before a generation batch.
2. Read the live catalog with `vidmuse model list -o json` (filter by
   `--audio`, `--image`, or `--video`).
3. Choose a model whose live `options` support the required
   `generation_type`.
4. Execute with `vidmuse model run -o json --param '<Aion JSON>'`.
5. Freeze the returned CDN media into the project and record model, route, and
   prompt in `.media/manifest.jsonl`.

Do not install or call HeyGen, Parakeet, Whisper, Kokoro, mflux, Codex
image_gen, LTX, MusicGen, Lyria, or another provider-specific AI path from this
skill. The VidMuse CLI owns provider selection, authentication, billing, local
path upload, and evolving model availability.

## Resolve

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type <type> --intent "<description>" --project <dir>
```

| Type | Behavior |
| --- | --- |
| `bgm` | VidMuse music model (`text_to_music`) |
| `sfx` | VidMuse SFX model when the live catalog supports `sound_effect`; otherwise bundled deterministic SFX |
| `image` | VidMuse text-to-image or image-to-image |
| `icon` | VidMuse image generation with transparent-icon constraints |
| `logo` | Official mark cascade only; never AI-generated |
| `voice` | VidMuse TTS; voice id comes from `vidmuse voice list` |
| `video` | VidMuse t2v / i2v / multi-image / reference / avatar model |
| `grade` | Local paste-ready color-grade block |
| `lut` | Local validated `.cube` file |

Use `--model` to pin an exact live model, `--generation-type` for an explicit
route, `--input` for image/video inputs, and `--voice-id` for an approved voice.
Use `--model-params '<JSON>'` only for fields published by the selected live
model; it cannot replace the selected model or route.
Read `references/resolve.md` for flags, model selection, cache, ingest, and
provenance.

## Speech and captions

```bash
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --out talk.transcribe.json
```

No supplied text means **VidMuse ASR → recognized text → VidMuse ATA → word
timestamps**. Supplying `--text` or `--text-file` skips ASR and aligns the
approved text with ATA. ASR alone is never treated as timed captions.

For a narration pass (TTS + ATA, BGM, SFX):

```bash
node <SKILL_DIR>/audio/scripts/audio.mjs \
  --request ./audio_request.json --project . --out ./audio_meta.json
```

Caption grouping and visual treatment remain part of the owning
`vidmuse-recut` / `vidmuse-create` workflow; use ATA utterance boundaries and
never invent word times.

## Deterministic operations

Use ffmpeg/ffprobe for cut, crop, reframe, stitch, audio ducking, loudness, and
format conversion, then register the output with `resolve --from`. These are
media transforms, not AI provider work. Read `references/operations.md`.

## Environment check

```bash
node <SKILL_DIR>/scripts/resolve.mjs --doctor
```

Doctor checks only: VidMuse CLI/version, VidMuse login, active plan and credits,
live model catalog, bundled SFX, ffmpeg, ffprobe, and Node. It must not probe
HyperFrames or third-party/local AI providers.

## Read only what the task needs

| Task | Reference |
| --- | --- |
| resolve / model route / reuse / ingest / inventory | `references/resolve.md` |
| TTS / BGM / SFX / transcription / ATA | `references/audio.md` |
| cut / reframe / stitch / transcript cut / loudness | `references/operations.md` |
| grade / LUT | `references/grading.md` |
| setup / login / credits / doctor | `references/setup-providers.md` |
| preferences / recipes / cross-project reuse | `references/memory.md` |
| ownership / privacy / stats | `references/meta.md` |
