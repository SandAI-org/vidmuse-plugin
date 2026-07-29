# Resolve — VidMuse models, cache, ingest, inventory

```bash
node <SKILL_DIR>/scripts/resolve.mjs --type <type> --intent "<description>" --project <dir>
```

`resolve` first checks the project and global caches. On a miss, AI types use
the live VidMuse model catalog; outputs are downloaded into `.media/`, recorded
in `.media/manifest.jsonl`, indexed in `.media/index.md`, and promoted to the
cross-project cache.

## Types and routes

| Type | VidMuse route / deterministic source |
| --- | --- |
| `bgm` | audio model + `text_to_music` |
| `sfx` | audio model + `sound_effect`; bundled SFX fallback |
| `image` | `text_to_image`; with `--input`, `image_to_image` |
| `icon` | `text_to_image` with transparent-icon prompt constraints |
| `voice` | audio model + `text_to_speech`; voice from `vidmuse voice list` |
| `video` | `text_to_video`; inputs select i2v/images2v unless route is explicit |
| `logo` | official svgl → simple-icons → GitHub avatar → favicon cascade |
| `grade` / `lut` | deterministic local color pipeline |

Model names are not frozen in the skill. `resolve` runs `vidmuse model list`
and prefers the live default model for the requested route. Pin only when the
user or workflow needs a specific model:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type image \
  --intent "editorial paper collage, warm ivory and vermilion, no text" \
  --model gemini-3-pro-image-preview \
  --aspect-ratio 16:9 \
  --resolution 1440p \
  --project .
```

Image-to-video:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type video \
  --intent "slow push-in, paper fibers drift subtly" \
  --input ./approved-still.png \
  --duration 6 \
  --aspect-ratio 16:9 \
  --project .
```

Digital-human/avatar video (local inputs are uploaded by the VidMuse CLI):

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type video \
  --generation-type avatar \
  --input ./approved-avatar.png \
  --audio-input ./approved-voice.wav \
  --project .
```

TTS:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type voice \
  --intent "欢迎来到 VidMuse" \
  --voice-id F-ZH-009 \
  --language zh \
  --project .
```

Query legal voice ids rather than guessing:

```bash
vidmuse voice list --language zh --scope official --limit 20 -o json
vidmuse voice list --model minimax/speech-2.6-hd --language zh -o json
```

## Flags

| Flag | Purpose |
| --- | --- |
| `--type`, `--intent`, `--project` | required media request |
| `--model` | exact `model_name` from the live catalog |
| `--generation-type` | explicit Aion route supported by the model |
| `--input` | local path or URL; repeat for multiple image inputs |
| `--audio-input` | audio input for avatar/video models |
| `--voice-id` | legal VidMuse voice id |
| `--language` | voice-search language when a voice id is not pinned |
| `--model-params <JSON>` | additional model-specific Aion fields; cannot override selected model/route |
| `--duration` / `--aspect-ratio` / `--resolution` | model controls when supported |
| `--provider vidmuse` | explicitly select the only AI provider |
| `--local-only` | cache/ingest/deterministic providers only; no model call |
| `--candidates` | list reusable project/global assets without mutation |
| `--reuse <sha>` | import one selected global candidate |
| `--from <file-or-direct-url>` | ingest and ledger an existing asset |
| `--adopt` | ledger assets already in the project |
| `--doctor` | check VidMuse + deterministic runtime dependencies |
| `--stats` | local usage/cache report |
| `--json` | machine-readable output |

## Reuse and provenance

Before generating, run `--candidates` and reuse a semantically appropriate
asset when confidence is high. Exact normalized prompts reuse automatically;
fuzzy matches never do. Official brand/entity assets require an exact entity
match.

Every generated record includes:

- `provider: "vidmuse.model"`
- `model_name`
- `generation_type`
- the generation prompt
- `voice_id` when applicable

Model calls spend VidMuse credits. Check `vidmuse plan get -o json` before a
batch and never hide the cost behind a local/provider fallback.
