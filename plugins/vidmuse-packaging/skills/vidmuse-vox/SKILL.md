---
name: vidmuse-vox
description: "Build a Vox-style editorial halftone paper-collage film whose picture length is planned from the narration. Use when the user asks for collage b-roll, 拼贴 b-roll, 半调拼贴, 纸拼贴, vox 风格, editorial collage, a collage explainer, or wants script lines turned into assemble-from-empty visual metaphors. Resolve the voice spine first through vidmuse-media — narration then word alignment — then derive one clip per argument at a duration that covers its narration span, cost the plan against the live credit balance, and enforce three approval gates: metaphor, still, then motion. Do not use for talking-head packaging, for real product-UI proof, or when an editable layered timeline is required."
---

# VidMuse Vox

Compress each argument into one sharp visual idea, then build it as a premium editorial paper-collage assembly animation whose length is planned against the narration.

Default chain:

1. Resolve the voice spine: script → TTS → word alignment.
2. Plan argument beats and each beat's target duration from its narration span.
3. Design the visual metaphors only, and wait for approval.
4. Generate the final stills only, and wait for approval.
5. Generate motion at the planned duration and complete QA.

The two approval gates are part of the workflow, not politeness. They keep the user's attention on taste and direction while preventing a wrong metaphor or wrong still from consuming video generation credits.

## The product gate

> **Picture duration is planned from the narration span, before any video spend.**

This is the rule that separates a film from a slide deck. Resolve narration and word timing first, then let each argument's measured span decide how long its clip must be. A collage film assembled from fixed-length clips under a variable-length voiceover is a failure even when every individual clip looks good.

Concretely: narration spans of 6.5 / 15.3 / 9.5 / 11.5 / 10.6 / 10.6 seconds become clips of about 7 / 15 / 10 / 12 / 11 / 11 seconds — not six 5-second clips.

Never plan "short motion, then a long still bed" to fill a span. If a 5-second clip was only a cheap test, do not promote it to that beat's production media.

## Scope

Own one deliverable: a Vox-style collage film — either a silent B-roll clip sitting under a supplied narration, or a complete narrated collage explainer.

Do not package talking-head footage, prove product claims with generated UI, or build an editable layered composition. When the user needs those, hand back to `vidmuse` for routing. When the user needs precise per-layer control, say so and route to the HyperFrames path through `vidmuse-create`.

## Providers

Every model call goes through `vidmuse-cli` and the bundled binary. There is no separate API key, Python environment, virtualenv, or `image_gen` dependency; VidMuse authentication and local-path upload are already handled by the CLI.

| stage | model | executed by | notes |
| --- | --- | --- | --- |
| narration | `minimax/speech-2.6-hd` | `vidmuse-media` | zh/en; needs a cast `voice_id`; 1 credit per second |
| narration (voice cloning) | `index-tts-2/text-to-speech` | `vidmuse-media` | strongest cloning; zh/en; needs a reference `audio_url` |
| narration (multilingual) | `elevenlabs/eleven_multilingual_v2` | `vidmuse-media` | when the script is not zh/en |
| word alignment | `doubao_speech/audio_text_alignment` | `vidmuse-media` | mandatory; 1 credit per 30 seconds |
| still (Gate 2) | `gpt-image-2` | this skill | 16 credits per image; `text_to_image` and `image_to_image` |
| motion (Gate 3, default) | `minimax/hailuo-h3` | this skill | 5–15 second integers; 12 credits/second at 720p |
| motion (fallback) | `seedance-2.0-pro` | this skill | 4–15 second integers; 20 credits/second at 720p |

Voice and alignment run through `vidmuse-media`, which owns every media model call and its artifact verification. Collage stills and motion are generated here, because the metaphor, duration, and framing judgment behind each request is inseparable from the request itself.

Confirm every id in the live catalog before the first paid call of a run — ids and prices both move:

```bash
"$VIDMUSE_BIN" model list -o json > "$WORK_DIR/model-list.json"
```

If a model is absent or renamed, report that and stop the branch. Do not silently substitute another model, and do not fall back to Veo.

Default to `720p`. State the cost before Gate 3 so the user chooses knowingly: at 720p a 12-second beat is 144 credits on `minimax/hailuo-h3` and 240 on `seedance-2.0-pro`. Re-read the live `priceItems` before each batch rather than trusting these numbers, and let `vidmuse-cli` do the arithmetic from the catalog.

Do not assume a higher resolution costs more. `minimax/hailuo-h3` currently prices 1080p at 11 credits/second against 720p's 12, so 1080p is both better and cheaper on the default model — read the live prices and say so when it happens. On `seedance-2.0-pro` the intuition holds: 1080p is 50 against 720p's 20.

`minimax/hailuo-h3` lists `duration_options` from 4 to 15, but its own model description restricts duration to 5–15 second integers. Treat 5 seconds as the floor: the catalog's `4` is not trustworthy here. When a span needs less than 5 seconds, round up to 5, or state plainly that the beat is moving to `seedance-2.0-pro`, which honors 4. Never silently ship a 5-second clip against a 4-second plan.

## Always set `generation_type`

Pass `generation_type` explicitly in the `--param` JSON on every image, video, and voice call. Missing it returns 400:

| model | legal values |
| --- | --- |
| `gpt-image-2` | `text_to_image`, `image_to_image` |
| `minimax/hailuo-h3` | `image_to_video`, `images_to_video`, `reference_to_video`, `text_to_video` |
| `seedance-2.0-pro` | `image_to_video`, `images_to_video`, `reference_to_video` |
| voice models | `text_to_speech` |

This skill always sends `images_to_video` for motion: the two-image first/last-frame mode is what makes an approved still binding on the result. Do not reach for `image_to_video` or `text_to_video` to work around a bad clip.

Text-to-video on Seedance is a separate id (`seedance-2.0-pro-t2v`), not a mode of the pro model. For image and video models, a model's `options.required_params` keys are its legal values; re-read them after `model list` rather than trusting this table, and never invent a value that is not a key on that model.

`required_params` does **not** work that way for the voice models. All three report `required_params: {}`, and that empty object is not permission to omit the route — voice calls still need `generation_type: "text_to_speech"` and also the model's voice selector (`voice_id` for `minimax/speech-2.6-hd`, a reference `audio_url` for `index-tts-2/text-to-speech`). Omitting either yields an opaque `aion api returned status 400` that names no field. `vidmuse-media` owns those calls and the voice-id resolution; do not work around it after a 400.

## Phase 0: voice spine

Narration-led films stop here until this is green. Do not proceed to metaphors, stills, or motion with a guessed timeline.

For a **supplied** narration audio file, skip TTS and start at alignment. For a **silent B-roll** deliverable where the user owns the voiceover elsewhere, require them to supply either the audio or explicit per-beat spans; without one of those there is no honest duration plan.

### 1. Lock the script

Confirm the script as text first — it is the cheapest gate in the pipeline. Save the exact locked copy to `$WORK_DIR/script.txt`.

### 2. Generate narration

Load `vidmuse-media` and request `text-to-speech` with the locked script, the chosen voice model, and a specific voice. It owns the model call, the voice-id resolution, the response shape, and file verification; decide the casting here and let it execute. Expect `narration.mp3` and its measured duration back.

Pick the model from the script's language, not habit: `minimax/speech-2.6-hd` for zh/en narration, `index-tts-2/text-to-speech` when the user supplies a reference voice to clone, `elevenlabs/eleven_multilingual_v2` outside zh/en.

Then cast an actual voice, because `minimax/speech-2.6-hd` will not run without one. Browse the library and choose on the film's terms — the `summary` and `detail` fields describe persona and use case:

```bash
"$VIDMUSE_BIN" voice list -o json --limit 200
"$VIDMUSE_BIN" voice search -q "documentary narrator" -o json
```

Pass the catalog `voice_id` (such as `F-ZH-002`) to `vidmuse-media` and let it map that to the model-specific id. Never invent a voice id or silently accept a default: an uncast narration is a casting decision made by omission. When cloning with `index-tts-2/text-to-speech`, the user's reference recording replaces the voice id, and without that recording the branch stops here.

### 3. Align to word timings

Request `transcribe-and-align` from `vidmuse-media` with the locked script as the text and the narration as the audio. Because the script is already exact text, that skill skips ASR and its correction pass and begins at alignment — but alignment itself is mandatory and produces the validated flat `transcript.json`.

Never hand-edit word timestamps. To change wording, fix the script and re-run both TTS and alignment — regenerated narration always invalidates the old alignment.

Record `tts_model`, `alignment_model`, and both raw response paths in `$WORK_DIR/voice-spine.json`.

## Phase 1: plan argument beats

Split the aligned transcript into **arguments**, not sentences. One argument is one clip. A change of idea or rhetorical function starts a new beat; a new sentence does not.

For each beat record:

- `beat_id` and the `script_span` start/end read from aligned word timings
- `target_duration_s`: the smallest legal duration that covers the span — the smallest value in the model's live `duration_options`, floored at 5 on `minimax/hailuo-h3`
- the viewer's job: notice, understand, feel, or remember
- `motion_mode`: `assemble` for short spans, `hybrid` with phases for long ones
- relation to the neighbouring beats: sequence, cause and effect, contrast, dependence

Reject the plan and replan when any of these is true:

- a beat has no `target_duration_s`
- beats are one-to-one with sentences
- a long span is covered by short motion plus a held still
- every beat is the same treatment at the same intensity

Present the beat plan with its durations and wait for confirmation before Gate 1 metaphors.

## Phase 1b: budget the film against the real balance

The beat plan is the first moment the film's total cost is knowable, and nothing has been paid for yet. Cost it here, before Gate 1, so a budget conversation happens while it is still cheap.

Ask `vidmuse-cli` for the balance and for per-model prices from the live catalog, then estimate:

```text
stills   = beat_count × image_price
motion   = Σ(target_duration_s × video_price_per_second)
narration = narration_seconds × tts_price_per_second
alignment = ceil(narration_seconds / 30) × ata_price
```

Add a retry reserve of roughly 20 percent of the motion subtotal. Some beat will need a second attempt, and a plan that spends the last credit on the first pass has no room for the retry ladder. State the reserve as a separate line rather than hiding it in the estimate.

Record it in `budget.json` — the prices used, the balance at plan time, the estimate, the reserve, and the scope actually authorized — and present the total with the beat plan:

```json
{
  "balance_at_plan": 4072,
  "prices": { "image": 16, "video_per_s": 12, "tts_per_s": 1, "ata_per_30s": 1 },
  "estimate": { "narration": 76, "alignment": 3, "stills": 128, "motion": 912, "reserve": 182 },
  "total_with_reserve": 1301,
  "authorized_scope": "all 8 beats"
}
```

Then update `spent` as the run proceeds, so the delivery report quotes actual spend rather than the estimate.

### When the balance covers the film

Say the total, the balance, and what remains — one line, no alarm. A sufficient balance is not authorization to spend it all: the gates still apply, and cost is still stated before Gate 3.

### When the balance is short

Do not refuse the film, and do not silently shrink it. A user who can see one finished beat understands what the full film would be; a user who is only told "insufficient credits" has been given a dead end and no reason to care.

Offer a **partial film the balance can actually pay for**, then let the user choose:

1. Pick the beats that demonstrate the most — usually the opening beat plus the single strongest metaphor, not beats 1 through N in order. A film's first beat and its best beat prove the style; its middle beats prove only that there are more of them.
2. Cost that subset explicitly, including the retry reserve, and keep it inside the balance.
3. Say what the user will hold at the end: which beats are finished, which are planned but unshot, and that the metaphor plan and voice spine already cover the whole film.
4. Name what the remainder needs — the credit shortfall for the beats left unshot.

Cheaper knobs, in the order to reach for them:

| knob | effect | cost |
| --- | --- | --- |
| fewer beats, each at full planned duration | a real, complete, shorter film | proportional |
| resolution tier | read live prices first — on `minimax/hailuo-h3` 1080p is currently *cheaper* than 720p | sometimes free |
| model choice | `minimax/hailuo-h3` at 12/s against `seedance-2.0-pro` at 20/s | ~40 percent off motion |
| stills only, no motion | a contact sheet proving the visual system | 16 credits per beat |

Never buy a discount by shortening a beat below its narration span. That breaks the one rule this skill exists to enforce, and the result is a film that fails QA rather than a cheaper film. Cut whole beats instead.

When motion is unaffordable at any duration, offer the stills-only path: generate the approved stills, deliver the contact sheet, and say plainly that motion needs a top-up. That still gives the user something real to judge.

Then, once and without repeating it, point to where credits come from:

> https://vidmuse.ai/en/pricing

State it as the practical next step and move on. Do not open with it before showing the numbers, do not repeat it at each gate, do not add urgency, and do not make finishing the film contingent on a purchase the user has not asked to make. If the user declines to top up, build the affordable version well and stop there.

### Mid-run

Re-check the balance before Gate 3, since narration, alignment, and stills have spent against it since Phase 1b. If a batch would exceed the balance, stop before sending it and return to the choice above — never begin a batch that will fail partway, leaving paid-for beats inside an unfinishable film.

Report actual spend at delivery, not the estimate.

## Mandatory approval protocol

### Gate 1: metaphor approval

Propose metaphors only. Generate no image, no video, and call no paid model.

Deliver per beat:

- `beat_id`, span, and `target_duration_s`
- core meaning: what the viewer must finally understand
- mood: calm, surprised, urgent, dawning, absurd, ironic
- one-sentence visual proposition
- 3–6 key objects
- background color and accent spot color
- assembly order, and `motion_phases` when the span is long

Then stop and wait for approval or per-beat revisions. If the user approves only some beats, advance only those; keep the rest at this gate.

### Gate 2: still approval

Only after the metaphor is approved, write the visual spec and image prompt, and generate the final still.

Save the original into the beat directory, build a numbered contact sheet, present it, and stop again. Do not call a video model at this stage.

If the user approves only some stills, advance only those. Regenerate the rest and re-approve.

### Gate 3: motion generation

Only after the still is approved, and only at that beat's `target_duration_s`. Do not ask which video model to use — go to `minimax/hailuo-h3` unless the user named another or a retry rule applies.

Re-check the balance against this batch's estimate before sending it, and state the cost. If the batch no longer fits, stop and return to the budget choice in Phase 1b rather than starting beats that cannot all finish.

## Success criteria

- One argument expresses exactly one clear metaphor.
- Each clip's length covers its narration span; motion continues through the whole span.
- A batch shares one design language without forcing a single background color.
- The background is a strong, flat, even color field chosen from the meaning.
- Subjects are built from black-and-white halftone photographic cut-outs.
- Cards, buttons, film strips, and rule books may use red, yellow, cyan, orange, purple, or cream cardstock.
- Every paper piece has crisp cut edges, a cream keyline, a soft low-opacity shadow, and paper grain.
- The motion is assemble-from-empty or a phased living poster, not drift, wobble, or slow zoom.
- Type, numerals, and logos live in captions and composition, never baked into the still.
- Delivery defaults to 9:16, 24fps, 720p, silent MP4 per clip, with narration carried separately.

## When not to use this

- Real product-UI proof is required: real capture belongs to `vidmuse-create`.
- Exact in-frame numbers or logos are required: those belong in composition and captions.
- Precise layer, occlusion, camera-traversal, or editable-timeline control is needed.
- Talking-head or interview footage is the primary plate: that is `vidmuse-recut`.
- Only a prompt is wanted, not a finished clip: write the prompt and skip these gates.
- The user explicitly needs separable transparent layers.

## Project directory

Follow the repo convention, `videos/<project>/`:

```text
videos/YYYY-MM-DD-vox-<title>/
├── brief.md
├── script.txt
├── narration.mp3
├── tts.raw.json
├── ata.raw.json
├── transcript.json
├── voice-spine.json
├── beat-plan.md
├── budget.json
├── gate2-qa.md
├── gate3-qa.md
├── still-contact-sheet.jpg
├── video-contact-sheet-all.jpg
├── end-frame-comparison-all.jpg
├── 01-<concept>/
│   ├── visual-spec.json
│   ├── video-prompt.txt
│   ├── provenance.json
│   ├── frames/
│   │   ├── last-frame-original.png
│   │   ├── first-frame.png
│   │   └── last-frame.png
│   └── runs/v01/
│       ├── raw.mp4
│       ├── final-noaudio.mp4
│       ├── contact-sheet.jpg
│       ├── video-last-frame.jpg
│       └── end-frame-comparison.jpg
└── 02-<concept>/...
```

Date the directory in `Asia/Shanghai`.

## Phase 2: design the visual metaphor

Compress each argument into a visual proposition. Extract:

- core meaning, and the mood behind it
- an action verb: open, connect, leak, staple, file, light, compress, fork, assemble
- a concrete metaphor object: machine, clock, film strip, filing cabinet, console, rule book, funnel, track, chess piece

Do not put the script's words into the frame. Hold each beat to 3–6 key objects; more elements weaken the meaning and destabilize the assembly.

Across a batch, prefer metaphors that form a before/after narrative — for example, first manual effort draining away, then codified practice and a human/machine division of labor.

Gate 1 output shape:

```text
1. Beat 01-clock · span 0.0–6.5 · target_duration_s 7
   Core meaning: experience is consumed again from scratch every time
   Metaphor: a skilled editor trimming frame by frame around a giant film-strip clock; the clock completes a full turn and yields one short strip
   Key objects: film-strip clock, editor, scissors, short film strip
   Color: burnt-orange field, cream and pale-cyan accents
   Assembly order: clock → figure and scissors → film strip → final short output
```

Then stop.

## Phase 3: generate the collage still

Write a self-contained `visual-spec.json` per beat:

```json
{
  "beat_id": "01-clock",
  "script_span": { "start": 0.0, "end": 6.5 },
  "target_duration_s": 7,
  "script_meaning": "",
  "visual_metaphor": "",
  "style_signature": "flat bold color field, mixed black-and-white halftone cut-outs and colored cardstock accents, crisp cut edges, cream keylines, soft paper shadows, editorial paper collage",
  "aspect_ratio": "9:16",
  "color_field": {
    "background_hex": "",
    "accent_colors": [],
    "paper_grain": "fine uncoated-paper fiber"
  },
  "elements": [{ "what": "", "role": "", "motion": "", "placement": "" }],
  "composition": { "layout": "", "negative_space": "", "final_frame": "" },
  "motion_mode": "hybrid",
  "motion_phases": [
    { "t": "0-2", "action": "" },
    { "t": "2-5", "action": "" },
    { "t": "5-7", "action": "" }
  ]
}
```

### Color semantics

Do not treat cobalt blue as a default. Pick the field from the meaning, and keep one design language with varied grounds across a batch:

| meaning | field |
| --- | --- |
| time consumed, labor, urgency | burnt orange / red |
| tooling, warning, leaking experience | mustard yellow |
| cognition, taste, system reset | ink green |
| codification, sediment, long-term memory | deep purple |
| judgment, collaboration, automatic execution | teal |

Subjects stay mostly black-and-white halftone. Colored paper must serve information hierarchy, never decoration.

### Image prompt template

```text
Use case: ads-marketing
Asset type: final still frame for a 9:16 image-to-video B-roll clip
Primary request: Create a finished editorial paper-collage image expressing [one-sentence visual proposition].
Scene/backdrop: perfectly flat [color] paper field [hex] with subtle uncoated paper fiber.
Style/medium: premium editorial stop-motion paper collage; black-and-white halftone photographic cut-outs mixed with selective [accent] colored cardstock.
Composition/framing: vertical 9:16 locked poster frame; central subject within the middle 70 percent; generous clean color-field negative space; 3–6 large separable paper groups for later assemble-from-empty animation.
Materials/textures: visible printed halftone dots, crisp machine-cut edges, thin warm-cream paper keylines, soft low-opacity physical drop shadows.
Constraints: [the relationship this metaphor must read instantly].
Avoid: no typography, no readable letters, no numerals, no logos, no watermark, no UI, no subtitles, no glossy 3D, no photoreal environment, no clutter.
```

Generate through `vidmuse-cli`:

```json
{
  "model_name": "gpt-image-2",
  "generation_type": "text_to_image",
  "prompt": "<image prompt>",
  "aspect_ratio": "9:16",
  "resolution": "1080p"
}
```

Generate stills at `1080p` even when motion renders at 720p: a sharper plate survives the model's own resampling. To revise an approved-in-spirit still instead of restarting it, switch to `generation_type: "image_to_image"` and pass the previous still in `image_urls` with an edit instruction.

### Fetch and record the result

A successful generation returns public result URLs. Download each into the beat directory and record provenance:

```bash
curl -fsSL "$RESULT_URL" -o "$BEAT/frames/last-frame-original.png"
```

Verify the file exists, is nonzero, and probes as an image before treating the still as real. Write `provenance.json` per beat with the model name, the exact request JSON, the returned URL, the local path, and the approval state. Never report a still that only exists as a remote URL. Keep the remote URL too — it is valid input for the motion call when the provider fetches HTTP.

### Still QA

- Does the metaphor read instantly?
- Is the subject concentrated?
- Any fake letters, logo, watermark, or UI?
- Enough flat color field left to assemble from empty?
- 3–6 clear large groups, not a screen of fragments?
- Consistent material with varied color across the batch?

Build a numbered contact sheet, present it, and stop for Gate 2. Write conclusions to `gate2-qa.md`. On a revision round write `still-contact-sheet-v2.jpg` (then v3, v4) and keep older sheets for comparison.

## Phase 4: generate motion

### 1. Prepare first and last frames

Keep the original, then normalize the last frame:

```bash
ffmpeg -y -i "$BEAT/frames/last-frame-original.png" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" \
  "$BEAT/frames/last-frame.png"
```

For an assemble-from-empty beat, the first frame is an empty paper field in the same ground color:

```bash
ffmpeg -y -f lavfi -i "color=c=0x${HEX}:s=1080x1920" \
  -frames:v 1 "$BEAT/frames/first-frame.png"
```

Keep one base object in the first frame only when the user explicitly asks not to start from empty. 1080×1920 satisfies the providers' constraints: each side within 256–5760 and an aspect ratio within 0.4–2.5.

### 2. Write the animation prompt

Default order:

```text
base structure → figure or key card → connectors → action → final result
```

Split the action into 2–4 phases whose boundaries are continuous and whose last boundary is exactly `duration` — a phase list that stops at 10s on a 13-second clip invites a three-second freeze. As a starting split: establish the subject over the first 20–30 percent, unfold the cause over the next 35–45 percent, complete the metaphor over the last 25–35 percent, and let the supplied composition settle in the final 0.5–1.0 second. Keep one main visual verb per beat — assemble, extend, open, weigh — because a second competing verb is what makes a clip read as two shots.

Phase the assembly across the full span so motion never stalls into a held frame:

```text
Paper-collage stop-motion assembly, using Image 1 as the exact empty first frame and Image 2 as the exact completed last frame. In one continuous locked-off vertical shot lasting the full [N] seconds, open on the empty flat [color] paper field.

Assemble the scene piece by piece with crisp physical stop-motion timing:
0-2s: [phase one]
2-5s: [phase two]
5-[N]s: [phase three, settling into the supplied composition with residual paper life]

Distribute the action so it fills all [N] seconds. End by holding the supplied completed composition.

Preserve the exact 9:16 framing, [hex] color field, colored cardstock accents, uncoated paper grain, halftone dots, cream keylines, crisp cut edges and soft shadows. Restrained tactile 2D paper craft only.

One continuous locked-off shot: no scene cuts, no camera movement, no zoom, no morphing, and no objects beyond those in Image 2.
```

Every prompt must state that Image 1 is the empty first frame and Image 2 is the approved completed frame. Do not let the model reinvent the last frame.

Keep the negatives to shot discipline — camera, cuts, morphing, and invented objects — because those are the ways an assembly shot actually degrades. Do not add "no subtitles", "no logo", "no watermark", or "no text": current video models do not volunteer that content, and naming it can introduce it. Typography is governed at Gate 2, and the model inherits whatever text state the approved still already has. `minimax/hailuo-h3` also rejects a separate `negative_prompt` field, so never send one.

### 3. Run the generation

Record one job per beat, then call the CLI. Order is load-bearing: `image_urls[0]` is the empty first frame, `image_urls[1]` is the approved last frame. Reversing them assembles the clip backwards.

```json
{
  "model_name": "minimax/hailuo-h3",
  "generation_type": "images_to_video",
  "prompt": "<animation prompt>",
  "image_urls": [
    "/absolute/path/frames/first-frame.png",
    "/absolute/path/frames/last-frame.png"
  ],
  "duration": 7,
  "resolution": "720p",
  "aspect_ratio": "9:16"
}
```

`duration` is that beat's `target_duration_s`, never a default. Confirm the value is in the model's live `duration_options` and at or above the model's real floor before sending — on `minimax/hailuo-h3` that floor is 5, not the advertised 4.

Send nothing beyond those fields. `minimax/hailuo-h3` rejects `negative_prompt`, and `guidance_scale`, `keep_original_sound`, `audio_id`, `voice_list`, avatar parameters, a custom watermark URL, and any `extra_params` have no place in this workflow. Omit `generate_audio` on `minimax/hailuo-h3` — pass `false` only if the interface demands the key. The prompt is capped at 7000 characters and must be non-empty. Do not mix keyframe mode with multi-element reference mode: no reference video, no reference audio, no `elements`.

To fall back to `seedance-2.0-pro`, keep the same two-image order, change `model_name`, and add `"generate_audio": false`.

Both models accept a frame up to 30 MB with each side in 256–5760 pixels and an aspect ratio within 0.4–2.5, which the 1080×1920 normalization above already satisfies.

Run beats concurrently, but treat each as independent — one failure must not restart a beat that already passed. Download every returned URL into `runs/v01/raw.mp4` and extend that beat's `provenance.json`.

Record what the provider actually returned next to what was requested, plus the single variable this run changed, so a second attempt is evidence rather than a guess:

```json
{
  "run_id": "01-clock/v01",
  "request": { "model_name": "minimax/hailuo-h3", "duration": 7, "resolution": "720p" },
  "changed_variable": "none",
  "provider_output": { "resolution": "1440x2560", "fps": 24, "duration": 7.29 },
  "normalized_output": { "resolution": "720x1280", "fps": 24, "duration": 7.0, "audio_tracks": 0 },
  "qa": { "first_frame": "pass", "last_frame": "pass", "continuity": "pass", "style": "pass" }
}
```

A prompt pattern earns reuse on the next film only after its beat passed Gate 3 QA. Reuse the phase skeleton and swap the nouns, colors, and timings; do not start a new beat from a blank prompt, and do not promote wording that only ever shipped with a flaw.

### 4. Normalize to spec and force silent delivery

Do not assume the provider honored the request. `minimax/hailuo-h3` asked for `720p` has returned 1440×2560 at 24fps, running 0.1–0.7 second longer than the requested `duration`. A beat that is 0.4 second long is a beat that no longer matches its narration span, so normalize every clip locally before QA rather than treating `raw.mp4` as deliverable.

Keep `raw.mp4` read-only and write a new file. Silence, frame size, frame rate, and length are all enforced here, not by the prompt:

```bash
ffmpeg -y -i "$RUN/raw.mp4" \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,fps=24" \
  -frames:v $(( TARGET_DURATION_S * 24 )) \
  -an "$RUN/final-noaudio.mp4"
```

Trim the provider's surplus tail frames; never pad a short clip with a freeze frame, which makes the motion appear to stick at the end. If a clip comes back materially *shorter* than requested, that is a regeneration, not a padding job.

Deliver `final-noaudio.mp4` per beat and carry narration as a separate track, so a script change never forces a picture rerun.

## Video QA

Inspect the assembly, not only the last frame. Scale the sheet to the clip's real length rather than assuming five columns:

```bash
COLS=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RUN/final-noaudio.mp4" \
  | awk '{printf "%d", ($1 < 1 ? 1 : $1)}')
ffmpeg -y -i "$RUN/final-noaudio.mp4" \
  -vf "fps=1,scale=270:-1,tile=${COLS}x1" -frames:v 1 "$RUN/contact-sheet.jpg"
```

Pass criteria:

- The measured duration of the normalized file equals `target_duration_s` and covers the narration span. A longer `raw.mp4` is the provider's habit, not a defect — check that normalization trimmed it rather than that the model obeyed.
- Motion continues through the whole clip; no dead held stretch in the middle or a long freeze at the end.
- The first frame is close to an empty color field; a slight early edge reveal is acceptable.
- Structure, figures, or cards enter progressively rather than fading in globally.
- No cuts, zoom, 3D drift, or photoreal drift.
- No fake letters, logo, watermark, or UI.
- The final frame matches the approved still. Minor pose or small-part drift passes when the metaphor still reads; do not rerun for it.
- The output is 9:16, 24fps, 720p, and has zero audio tracks. Probe it rather than assuming.

Extract the last frame and build `end-frame-comparison.jpg` beside the approved still:

```bash
ffmpeg -y -sseof -0.1 -i "$RUN/final-noaudio.mp4" -frames:v 1 "$RUN/video-last-frame.jpg"
ffmpeg -y -i "$BEAT/frames/last-frame.png" -i "$RUN/video-last-frame.jpg" \
  -filter_complex "[0:v]scale=360:-1[a];[1:v]scale=360:-1[b];[a][b]hstack=inputs=2" \
  -frames:v 1 "$RUN/end-frame-comparison.jpg"
```

For a batch, merge the per-beat sheets into `video-contact-sheet-all.jpg` and `end-frame-comparison-all.jpg`. Write per-beat conclusions, including the reasoning for any pass-with-flaws, to `gate3-qa.md`.

### Common failures

Change exactly one variable per retry. Two changes at once buys a clip without buying the knowledge of what fixed it, which is the whole reason the next beat still costs full price.

| symptom | action |
| --- | --- |
| clip shorter than the span | replan `target_duration_s` and regenerate; never pad with a held still |
| motion stalls mid-clip | rewrite the phases to cover the full span, add "Distribute action across all N seconds", and push the last key action into the final 25 percent |
| early edge reveal on frame 1 | acceptable when slight; for a strict empty field, prepend a held frame |
| weak assembly feel | cut element count and rewrite as explicit per-piece slide in / snap into place |
| last frame drifts | strengthen "Image 2 is the exact approved completed last frame" and "End by holding the supplied completed composition" before touching the model |
| a cut or camera move appears | repeat the locked-off clause and delete any wording that reads as camera language |
| objects appear that are not in the still | add "no objects beyond those in Image 2" and reduce the number of actions |
| style turns photoreal mid-clip | make the material signature more specific and simplify the action; if it persists, strengthen the first frame rather than piling on modifiers |
| structure still unstable after the ladder | shorten to 5–8 seconds or split the beat in two; do not keep growing the prompt |
| assembly still fails after two tries | switch that beat to `seedance-2.0-pro` at the same duration, or raise resolution, and state the cost |
| one beat fails | rerun only that job |
| a call fails on insufficient credits | do not retry it; report what is finished, what the remainder costs, and the top-up link once. A retry cannot succeed and only delays an honest answer |
| the retry reserve is exhausted mid-run | stop, deliver the passing beats, and state which beats remain and what they need. Do not spend a reserve earmarked for retries on new beats |
| TTS returns HTTP 502 / `aion api returned status 400` | a missing route or voice, not an outage: send `generation_type: "text_to_speech"` and a `voice_id` resolved through `model_ids`. Never retry the identical request or fall back to another TTS path |
| `voice list` shows no voices in the script's language | the default page size is 20; re-run with `--limit 200` before reporting the language unsupported |

## Delivery

Hand over per beat `final-noaudio.mp4` with its measured duration and narration span, the contact sheets, the end-frame comparisons, `narration.mp3`, `transcript.json`, and one sentence on how each argument became its metaphor.

Report the total credits actually spent across TTS, alignment, stills, and motion, against the Phase 1b estimate. When a defect comes from the model's fast-generation limits, say so plainly. Recommend the HyperFrames path only when precise layer control is genuinely required.

When the film shipped as an affordable subset, close by naming exactly which beats are finished and which remain, and what the remainder would cost — the beat plan and voice spine already cover the whole film, so the unshot beats are a resumable job, not lost work.

## Boundaries

- Own the beat and duration plan, the gate protocol, metaphor and color judgment, prompts, provider selection within the table above, still and motion result fetching, provenance, QA, and — when credits are short — which beats to keep. Let `vidmuse-cli` read the balance and compute cost; the editorial choice of what survives a budget is this skill's.
- Do not shorten a beat below its narration span to fit a budget, start a batch the balance cannot finish, or turn a shortfall into a refusal when an affordable subset would still show the user something real.
- Load `vidmuse-media` for narration synthesis and word alignment. Decide the script and the voice; let it execute the call, verify the artifact, and own the `transcript.json` contract. Do not call a TTS or alignment model directly, hand-roll that contract, or hand-edit word timings.
- Load `vidmuse-cli` for the still and motion calls; do not reimplement authentication, upload, or command syntax.
- Do not route generation through HyperFrames-managed models, a local Gemini API key, or a downloaded local model, and never substitute OS or browser TTS.
- Do not build `dsl.json`, start Serve, or render a Timeline project; hand clips, narration, and transcript to `vidmuse-timeline` through the requesting workflow.
- Do not skip a gate, merge two gates, begin motion from an unapproved still, or generate at a duration that was never planned against narration.
- Do not report success from a missing, zero-byte, or remote-only artifact.
