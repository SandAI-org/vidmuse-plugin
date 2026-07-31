---
name: media-use
description: >
  User-facing VidMuse media capability and shared execution runtime. Use
  directly when the requested deliverable is one exact media result:
  ASR/transcription, supplied-text ATA alignment, TTS/voiceover, BGM, SFX,
  image/video generation, download/adopt/freeze, trim, crop, reframe,
  transcript-driven cut, grade, LUT, or another deterministic media
  operation. Also load inside vidmuse-assets, vidmuse-recut, or
  vidmuse-create to execute an already-decided operation and return control.
  Do not turn a standalone media request into a film workflow, decide whether
  a film should show an entity asset, canonicalize brand identity, or own
  library/license policy. All AI work uses the VidMuse CLI live catalog.
compatibility: VidMuse CLI on PATH and authenticated; ffmpeg/ffprobe; Node.js 18+. Model calls require network and VidMuse credits.
---

# Media Use

VidMuse's media capability: **resolve · generate · operate · remember**.

This skill has two valid entry modes:

| Mode | Trigger | Completion |
| --- | --- | --- |
| Standalone capability | The user wants one media artifact or transform, not a designed film | Produce the artifact and receipt, then stop. Do not create a film brief, `FRAME.md`, storyboard, or Timeline project. |
| Workflow dependency | `/vidmuse-recut`, `/vidmuse-create`, or `/vidmuse-assets` has already made the product/editorial decision | Execute the exact operation, return paths and receipts, then return control to the owner. |

`/vidmuse` owns fresh intent routing. `/vidmuse-recut` owns an existing
speaking-footage film; `/vidmuse-create` owns a film whose material must be
made; `/vidmuse-assets` owns semantic asset intelligence, libraries,
source/license policy, and canonical identity. This skill never takes over
those decisions merely because it performs the media work.

## Runtime contract

| Input decision | Made by | This skill does |
| --- | --- | --- |
| Show/suppress an entity asset at a beat | film owner + `vidmuse-assets` | nothing until given an exact request |
| Canonical entity, type, variant, provider/license policy | `vidmuse-assets` | execute and return a receipt |
| TTS/ASR/ATA or deterministic transform | user in standalone mode, otherwise film owner | execute the requested operation |
| Cache, file allocation, freeze, manifest/index write | this skill | perform atomically |
| Placement, animation, density, final QA | film owner | no editorial decision |

Do not duplicate `asset-plan.json` or implement a second asset-policy layer
here. A deterministic request from `vidmuse-assets` is an execution contract,
not an invitation to reinterpret the entity.

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
| `sfx` | Exact Creator Library → indexed/bundled deterministic SFX → VidMuse SFX model |
| `image` | Exact Creator Library when selected, otherwise VidMuse text-to-image or image-to-image |
| `icon` | Exact Creator Library → Core Pack → VidMuse image generation |
| `logo` | Exact Creator Library → Lobe Icons → SVGL → Simple Icons → GitHub avatar → favicon → offline Core Pack floor; never AI-generated |
| `shape` `font` `lottie` `palette` | Exact Creator Library → VidMuse Core Pack (preinstalled, offline, licensed); no generative route — a wrong typeface or timeline is worse than a miss |
| `texture` `overlay` | Core Pack first (adopted project file / Creator Library), then VidMuse image generation. Not preinstalled: surface treatment is film-specific. Prefer CSS/canvas for plain grain and noise |
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

For Lobe Icons variants:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type logo --intent "Codex logo" --entity codex \
  --variant color --provider lobehub.icons --project .
```

For preinstalled Core Pack material:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type shape --intent "进度环" --project .
```

Core Pack runs before generation, works under `--local-only`, and returns a
license receipt plus the HyperFrames usage contract in the manifest record. To
browse candidates before resolving — or to see a contact sheet of raster options
— use `vidmuse-assets/scripts/core_pack.mjs --query`; this skill executes the
choice rather than making it. Pass `--core-pack-id <id>` to freeze the exact
candidate selected during browsing. Pass `--creator-library-id <id>
--provider creator-library --local-only` for one explicitly approved private
asset; private content is never fuzzy-selected.

Standalone and in-film semantic asset work enters through `/vidmuse-assets`,
which supplies the exact query and source/license policy around this command.

## Speech and captions

Direct requests such as “transcribe this clip,” “align this approved script,”
or “turn this paragraph into speech” start and finish here. They do not require
`/vidmuse-recut` or `/vidmuse-create`.

```bash
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --out talk.transcribe.json
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --asr-only --out talk.text.json
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --text-file approved.txt --out talk.aligned.json
```

No supplied text means **VidMuse ASR → recognized text → VidMuse ATA → word
timestamps**. Supplying `--text` or `--text-file` skips ASR and aligns the
approved text with ATA. ASR alone is never treated as timed captions. Retryable
ASR CLI/API failures retry twice by default (three total attempts); authentication,
credit, validation, and other deterministic failures fail immediately.

For one standalone TTS result:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type voice --intent "欢迎来到 VidMuse" --project .
```

For a narration pass with TTS + ATA, BGM, and SFX:

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

For a speech-recognition-ready WAV (mono, 16 kHz, PCM s16le):

```bash
node <SKILL_DIR>/scripts/extract-audio.mjs --input talk.mp4
```

Use `--out talk.mp3` when compact transfer matters more than lossless input.

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
