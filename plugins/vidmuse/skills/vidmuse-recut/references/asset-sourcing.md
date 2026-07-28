# Asset Sourcing and Generation

How a film acquires media it does not already have — images, logos, icons,
textures, B-roll, music, SFX, voiceover. Shared by `/vidmuse-recut` (assets
*inside* a packaging run) and `/vidmuse-create` (assets as the film's fabric).
The generative backend is `vidmuse model run`; catalog resolution stays with
`media-use` `resolve`; real-web material arrives through the host agent's own
fetch tools.

Charter dimensions at stake: Authenticity (9) — generated material is the
fastest way to break "this room, this person"; More convincing (6) — the
viewer must never mistake styled fiction for evidence.

## Source priority

For any needed asset, exhaust each rung before falling to the next:

1. **User-provided** — brand kits, product shots, footage, existing music.
   Always first; ask once if the BRIEF suggests such material exists.
2. **Real material from the world** — official logos, real product
   screenshots, the actual website, documentary imagery. Acquired via
   `media-use` resolve (its logo cascade: svgl → simple-icons → avatar →
   favicon) or the host agent's web-fetch capability. **Logos and brand marks
   are never generated or redrawn — only official sources.** A real
   screenshot of the real product beats a generated impression of it in both
   charter dimensions.
3. **AI generation** — when the asset doesn't exist in the world because the
   film is inventing it: backgrounds, textures, illustrative scenes,
   diagram substrates, music beds, voiceover.

Record every asset in `$WORK_DIR/asset-sources.json`: id, type, rung
(user / real / generated), source (URL, model name + prompt, or file
provenance), license note when known, and where it lands in the composition.
Traceability here mirrors `effect-sources.json` for effects.

## Generating through `vidmuse model run`

List what is actually available before promising anything — the menu evolves:

```bash
vidmuse model list -o json   # image / video / audio / avatar + per-model options
vidmuse model run -o json --param '<JSON: model_name, generation_type, …>'
```

CLI mechanics — implicit upload of local media paths, `voice_id` lookup via
`vidmuse voice`, `asset generation-params` to ground a request body, and the ASR
call shape — are in [`vidmuse-cli.md`](vidmuse-cli.md).

### `generation_type`

API route field. **Required for every video request; optional for audio.** Omit
it on a video call and the request **400**s (Aion missing route). Always pass it
on multi-mode models regardless of category.

Valid values for a model = the keys of that model's
`options.required_params` from `model list` (not a global free string). The full
route table:

| Category | `generation_type` | Primary input |
| --- | --- | --- |
| Video | `text_to_video` | `prompt` |
| Video | `image_to_video` | `prompt`, one `image_urls` item |
| Video | `images_to_video` | `prompt`, multiple `image_urls` items |
| Video | `reference_to_video` | `prompt`, `elements` |
| Video | `avatar` | `image_urls`, `audio_url` (no `prompt`) |
| Audio | `text_to_audio` | `prompt` |
| Audio | `text_to_music` | `prompt` |
| Audio | `text_to_speech` | `prompt`, usually `voice_id` |
| Audio | `sound_effect` | `prompt` |

Stills use `text_to_image` / `image_to_image` (same rule: match the model's
`required_params` keys).

Examples: `gpt-image-2` → t2i | i2i; `seedance-2.0-pro` → i2v | images2v |
ref2v (t2v is separate id `seedance-2.0-pro-t2v`).

**Audio note:** the four audio routes above are real, documented values — pass
`text_to_speech` for voice and `sound_effect` for SFX rather than waiting for a
400 to name them. Many voice/ATA entries still report empty `required_params` in
`model list`; that makes the field optional there, not invalid.

**`voice_id`:** query it, never invent it or ask the user for a raw ID —
`vidmuse voice list --model <ttsModel> --language zh --gender female -o json`
(also `voice search -q`, `voice get`). Voice availability is per model, so
filter by `--model` once the TTS model is chosen. See
[`vidmuse-cli.md`](vidmuse-cli.md).

Other common body fields (per `supported_params`): `prompt`, `image_urls`,
`duration`, `aspect_ratio`, `resolution`, `generate_audio`, `elements`,
`voice_id`, …

Outputs are often **remote URLs** — download for Timeline; i2v may want the
still's HTTPS URL.

Families and their roles (verify names against the live list):

| family | examples | role |
| --- | --- | --- |
| image t2i / edit | `bytedance/seedream/v5/pro`, `fal-ai/flux-2-pro(/edit)`, `gemini-3-pro-image-preview`, `gpt-image-2` | backgrounds, textures, illustrative stills; edit variants for iterating one asset instead of rerolling |
| video t2v / i2v | `seedance-2.0-*`, `fal-ai/veo3.1(/image-to-video)`, `fal-ai/kling-video/v3/*`, `pixverse/v6/*` | B-roll, atmosphere shots, transitions (`pixverse/v6/transition`) |
| TTS | `elevenlabs/eleven_multilingual_v2`, `minimax/speech-2.6-hd`, `index-tts-2` | narration for create-mode films; scratch VO for timing |
| music / SFX | `suno/V5_5`, `elevenlabs/elevenlabs_music`, `mirelo-ai/sfx-v1.5/video-to-audio` | score and effects when the catalog (`media-use` bgm/sfx) misses |
| avatar | `fal-ai/bytedance/omnihuman/v1.5`, `gaga-2-avatar` | script-to-presenter source footage (create mode only) |

Prefer an **image-to-video** chain (approved still → i2v) over raw t2v when a
generated clip must match the film's world: the still is cheap to iterate and
gate; the motion inherits it. **Plan `duration` from the VO/ATA beat** using
the model's `duration_options` before you spend — especially collage / B-roll
([`../../vidmuse-create/references/vox-collage.md`](../../vidmuse-create/references/vox-collage.md)).

### Editorial paper-collage (create / optional recut seasoning)

Brief wants Vox / paper-collage →
[`../../vidmuse-create/references/vox-collage.md`](../../vidmuse-create/references/vox-collage.md):
plan argument spans → still → motion at planned duration. Optional ffmpeg:
`skills/vidmuse-create/scripts/collage_frames.py`. No baked numerals/logos as
fake evidence; provenance in `asset-sources.json`.

**TTS → ATA closes the loop:** generated narration goes through the same
`doubao_speech/audio_text_alignment` call as user footage (SKILL.md step 2),
yielding the same `transcript.json` — captions, packaging analysis, and the
whole downstream pipeline run unchanged on generated voice.

## Taste governance — generation is inside the design system, not beside it

- **FRAME tokens ride in the prompt.** After `FRAME.md` exists, every image /
  video generation prompt carries the project's palette values, material
  language, and mood terms, and each result is judged against FRAME like any
  hero frame. An off-palette generated asset is a style drift source — the
  generated equivalent of installing a foreign demo skin.
- **Before FRAME exists**, generate only throwaway scouting material, never
  anything that ships.
- **Text inside generated images** falls under the Numerals & Claims hard
  rule: no invented digits, no fake UI screenshots posing as the real
  product, no pseudo-English filler baked into pixels. Prefer imagery without
  embedded text; set type in the composition where it stays a token-governed,
  editable layer.
- **Evidence stays real** (charter 6): a generated image may illustrate or
  set atmosphere; it may not *impersonate* proof. Product capability is shown
  with real captures; a generated "screenshot" of claimed features is fake
  precision (tell V3) at asset scale.

## Recut boundary — generated media inside a packaging run

Recut's subject is the user's footage; generated media is seasoning, not a
second entrée.

- **Free under FRAME governance:** generated images, icons/textures (real
  icon sets via resolve still preferred), music beds, SFX.
- **Gated per instance — generated video:** any t2v/i2v clip composited into
  a real person's narration is declared in `packaging-analysis.md` (marked
  *generated*, with its editorial job) and passes the user coverage gate
  before production. On autonomous runs, default to **no generated video**
  in recut; a recorded pre-authorization in the BRIEF may override. Composited
  synthetic imagery erodes charter 9 in ways still assets do not — the viewer
  reads inserted footage as *documentary* unless told otherwise.
- **Out of scope for recut:** avatar/digital-presenter generation (that is
  create-mode source production), and regenerating the speaker themselves in
  any form.

In create mode the same governance applies with rung 3 promoted to a normal
tool: the film's fabric may be generated, but each hero-level generated shot
still appears in the storyboard/analysis for the user to see before rendering,
and evidence-bearing shots still prefer rung 2.
