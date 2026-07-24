# Vox / editorial paper-collage

**Purpose:** editorial halftone paper-collage inside `/vidmuse-create`.

**You (Codex)** write metaphors, prompts, call `vidmuse model run`, plan
duration against VO. Optional ffmpeg help only:
`../scripts/collage_frames.py` (empty first frame / strip audio / contact sheet).

| mode | recipe | grain |
| --- | --- | --- |
| P1 B-roll | `recipe:vox-collage-broll` | silent clip under one **argument** beat |
| P2 explainer | `recipe:vox-collage-explainer` | one long clip per argument (not per sentence) |

Not promo-recipes **Anti-collage** (Registry dump ban).

---

## Style (short)

- Flat strong **color field** + BW **halftone** cut-outs + selective cardstock  
- Cream keylines, paper shadow, crisp cuts; **3–6** large groups  
- **No** baked type / numbers / logos / UI (those stay in captions/composition)  
- Motion: assemble-from-empty, living-poster, or **hybrid** with a few phases
  **inside one clip** that fills the VO span  
- Not PPT: not one clip per sentence; not six frozen posters under VO

Color fields may change by beat (orange / mustard / green / purple / teal) with
one craft language.

---

## Core planning rule (this is the product gate)

> **Picture duration is planned from the narration span, before video spend.**

1. TTS → ATA first (or lock script timing another honest way).  
2. Film plan lists **argument beats** with ATA `start–end`.  
3. Each collage beat sets `target_duration_s` = cover that span, snapped to the
   model's live `duration_options` (Seedance 2.0 Pro is **4–15** integers).  
4. Generate **that** length. One argument → one clip; 3–4 motion phases inside
   the prompt if the span is long.  
5. Do **not** schedule “short motion + long still bed” as the plan. If you
   only needed a 5s test clip, don’t treat it as the beat’s production media.

Example: VO spans 6.5 / 15.3 / 9.5 / 11.5 / 10.6 / 10.6 → generate about
**7 / 15 / 10 / 12 / 11 / 11**, not six×5s.

Quiet / ground-led is composition or residual paper life — not a multi-second
frozen PNG under speech.

---

## Gates (cheap → dear)

**V1 metaphor + duration** (text only) → user OK  

```text
beat_id · ATA start–end · target_duration_s
core_meaning · visual_proposition · key_objects[3-6]
color_field · motion_mode · motion_phases (for long beats)
```

**V2 still** → user OK → save local frame; keep remote URL if API returned one
(for i2v input).

**V3 motion** at **`target_duration_s`** with correct `generation_type`.

---

## `generation_type` (API route — required when the model is multi-mode)

From live `vidmuse model list` → each model’s `options.required_params` keys
**are** the valid `generation_type` values for that model. Pass one explicitly
in `--param` JSON or the API returns 400 (Aion missing route).

### Values seen on the current menu

| `generation_type` | used for |
| --- | --- |
| `text_to_image` | t2i stills |
| `image_to_image` | edit / ref stills |
| `text_to_video` | t2v (e.g. `seedance-2.0-pro-t2v`) |
| `image_to_video` | single-image i2v |
| `images_to_video` | multi-image video (e.g. first+last assemble when supported) |
| `reference_to_video` | ref-to-video |
| `avatar` | avatar / talking-head generators |

**Always re-read the chosen model’s `required_params` after `model list`** —
ids and modes move. Do not invent types that are not keys on that model.

### Multi-mode models (must disambiguate)

These expose **more than one** `required_params` mode — always set
`generation_type`:

- Video: `seedance-2.0-pro` → `image_to_video` | `images_to_video` | `reference_to_video`  
  (`text_to_video` is a **separate** id: `seedance-2.0-pro-t2v`)  
- Also multi among others on the menu: `seedance-2.0-fast/mini`, several
  Kling/Vidu/Wan/HappyHorse entries, etc.
- Image: `gpt-image-2`, `bytedance/seedream/v5/pro`, Gemini image, Flux edit
  pairs, … → `text_to_image` | `image_to_image`

Single-mode endpoints still accept the obvious type (e.g. t2v-only model →
`text_to_video`); matching the catalog key avoids 400s.

### Audio / ATA on current menu

Voice and `doubao_speech/audio_text_alignment` currently show **empty**
`required_params` in list JSON. For collage film still run them through the
create voice spine; if a call 400s asking for a type, pass what the error
names — don’t block planning on invented teal audio types.

### Other frequent param keys (not generation_type)

From list `supported_params` / options (verify per model):  
`prompt`, `image_urls`, `duration`, `aspect_ratio`, `resolution`,
`generate_audio`, `elements`, `voice_id`, …

Collage defaults:

```json
{
  "model_name": "gpt-image-2",
  "generation_type": "text_to_image",
  "prompt": "…",
  "aspect_ratio": "9:16",
  "resolution": "1080p"
}
```

```json
{
  "model_name": "seedance-2.0-pro",
  "generation_type": "image_to_video",
  "prompt": "… phases over N seconds …",
  "image_urls": ["https://…/still.png"],
  "duration": 12,
  "aspect_ratio": "9:16",
  "resolution": "720p",
  "generate_audio": false
}
```

For empty-field assemble when multi-image is available, use
`generation_type: "images_to_video"` (or whatever that model’s multi key is)
with first + last URLs.

**URL vs local:** outputs are usually remote URLs — download for Timeline;
prefer remote still URL as i2v input when the API fetches HTTP.

---

## visual-spec (minimal)

```json
{
  "beat_id": "01-…",
  "script_span": { "start": 0.0, "end": 11.5 },
  "target_duration_s": 12,
  "visual_metaphor": "",
  "motion_mode": "hybrid",
  "motion_phases": [
    { "t": "0-3", "action": "…" },
    { "t": "3-7", "action": "…" },
    { "t": "7-12", "action": "…" }
  ],
  "color_field": { "background_hex": "#4A148C", "accent_colors": ["#F5F0E6"] },
  "aspect_ratio": "9:16",
  "elements": []
}
```

---

## Prompt hints

Still: editorial paper collage, flat field, halftone BW cut-outs, cardstock
accents, cream keylines, 3–6 groups, no type/UI.

Motion: locked-off paper craft for **full N seconds**; phase the assembly /
relations so action spans the VO; do not invent a plan that freezes mid-way
for reading. No baked text/sound.

---

## Layout (light)

```text
$WORK_DIR/collage/<beat>/
  metaphor.md | visual-spec.json
  frames/last-frame.png · first-frame.png
  runs/v01/raw.mp4 · final-noaudio.mp4
```

```bash
python3 skills/vidmuse-create/scripts/collage_frames.py prepare --beat-dir …
python3 skills/vidmuse-create/scripts/collage_frames.py finalize-video --beat-dir … --input …/raw.mp4
```

---

## Create spine hook

```text
Voice (ATA) → film plan with target_duration_s per argument
  → V1 → V2 → V3 at planned duration → Timeline (local clips + VO + captions)
```

Example metaphor JSON:
[examples/collage-metaphor-01-mirror.json](examples/collage-metaphor-01-mirror.json).
