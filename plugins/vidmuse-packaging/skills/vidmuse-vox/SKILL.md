---
name: vidmuse-vox
description: "Build a Vox-style editorial halftone paper-collage film whose picture length is planned from the narration. Use when the user asks for collage b-roll, 拼贴 b-roll, 半调拼贴, 纸拼贴, vox 风格, editorial collage, a collage explainer, or wants script lines turned into assemble-from-empty visual metaphors. Resolve the voice spine first through vidmuse-media — narration then word alignment — then derive one clip per argument at a duration that covers its narration span, and enforce three approval gates: metaphor, still, then motion. Do not use for talking-head packaging, for real product-UI proof, or when an editable layered timeline is required."
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
| narration | `minimax/speech-2.6-hd` | `vidmuse-media` | Chinese-forward; 1 credit per second |
| narration (voice cloning) | `index-tts-2/text-to-speech` | `vidmuse-media` | strongest cloning; zh/en; needs a reference `audio_url` |
| narration (multilingual) | `elevenlabs/eleven_multilingual_v2` | `vidmuse-media` | when the script is not zh/en |
| word alignment | `doubao_speech/audio_text_alignment` | `vidmuse-media` | mandatory; 1 credit per 30 seconds |
| still (Gate 2) | `gpt-image-2` | this skill | 16 credits per image; `text_to_image` and `image_to_image` |
| motion (Gate 3, default) | `seedance-2.0-pro` | this skill | 4–15 second integers; 20 credits/second at 720p |
| motion (fallback) | `minimax/hailuo-h3` | this skill | 5–15 second integers; 12 credits/second at 720p |

Voice and alignment run through `vidmuse-media`, which owns every media model call and its artifact verification. Collage stills and motion are generated here, because the metaphor, duration, and framing judgment behind each request is inseparable from the request itself.

Confirm every id in the live catalog before the first paid call of a run — ids move:

```bash
"$VIDMUSE_BIN" model list -o json > "$WORK_DIR/model-list.json"
```

If a model is absent or renamed, report that and stop the branch. Do not silently substitute another model, and do not fall back to Veo.

Default to `720p`. State the cost before Gate 3 so the user chooses knowingly: at 720p a 12-second beat is 240 credits on `seedance-2.0-pro` and 144 on `minimax/hailuo-h3`. At 1080p `seedance-2.0-pro` jumps to 50 credits/second, so raise resolution only when the user asks and knows the multiplier.

`minimax/hailuo-h3` cannot go below 5 seconds. When a beat is planned at 4 seconds and the run switches to the fallback, either replan that beat to 5 seconds or keep it on `seedance-2.0-pro`; never silently ship a 5-second clip against a 4-second plan.

## Always set `generation_type`

A model's `options.required_params` keys **are** its legal `generation_type` values. Multi-mode models return 400 without one, so pass it explicitly in the `--param` JSON:

| model | legal values |
| --- | --- |
| `gpt-image-2` | `text_to_image`, `image_to_image` |
| `seedance-2.0-pro` | `image_to_video`, `images_to_video`, `reference_to_video` |
| `minimax/hailuo-h3` | `image_to_video`, `images_to_video`, `reference_to_video`, `text_to_video` |

Text-to-video on Seedance is a separate id (`seedance-2.0-pro-t2v`), not a mode of the pro model. Re-read `required_params` after `model list` rather than trusting this table, and never invent a value that is not a key on that model.

The voice and alignment models currently expose empty `required_params`. Omit `generation_type` for them; if a call fails asking for one, pass exactly what the error names.

## Phase 0: voice spine

Narration-led films stop here until this is green. Do not proceed to metaphors, stills, or motion with a guessed timeline.

For a **supplied** narration audio file, skip TTS and start at alignment. For a **silent B-roll** deliverable where the user owns the voiceover elsewhere, require them to supply either the audio or explicit per-beat spans; without one of those there is no honest duration plan.

### 1. Lock the script

Confirm the script as text first — it is the cheapest gate in the pipeline. Save the exact locked copy to `$WORK_DIR/script.txt`.

### 2. Generate narration

Load `vidmuse-media` and request `text-to-speech` with the locked script and the chosen voice model. It owns the model call, the response shape, and file verification; decide the voice here and let it execute. Expect `narration.mp3` and its measured duration back.

Pick the voice from the script's language, not habit: `minimax/speech-2.6-hd` for Chinese-forward narration, `index-tts-2/text-to-speech` when the user supplies a reference voice to clone, `elevenlabs/eleven_multilingual_v2` outside zh/en.

### 3. Align to word timings

Request `transcribe-and-align` from `vidmuse-media` with the locked script as the text and the narration as the audio. Because the script is already exact text, that skill skips ASR and its correction pass and begins at alignment — but alignment itself is mandatory and produces the validated flat `transcript.json`.

Never hand-edit word timestamps. To change wording, fix the script and re-run both TTS and alignment — regenerated narration always invalidates the old alignment.

Record `tts_model`, `alignment_model`, and both raw response paths in `$WORK_DIR/voice-spine.json`.

## Phase 1: plan argument beats

Split the aligned transcript into **arguments**, not sentences. One argument is one clip. A change of idea or rhetorical function starts a new beat; a new sentence does not.

For each beat record:

- `beat_id` and the `script_span` start/end read from aligned word timings
- `target_duration_s`: the smallest value in the model's live `duration_options` that covers the span
- the viewer's job: notice, understand, feel, or remember
- `motion_mode`: `assemble` for short spans, `hybrid` with phases for long ones
- relation to the neighbouring beats: sequence, cause and effect, contrast, dependence

Reject the plan and replan when any of these is true:

- a beat has no `target_duration_s`
- beats are one-to-one with sentences
- a long span is covered by short motion plus a held still
- every beat is the same treatment at the same intensity

Present the beat plan with its durations and wait for confirmation before Gate 1 metaphors.

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

Only after the still is approved, and only at that beat's `target_duration_s`. Do not ask which video model to use — go to `seedance-2.0-pro` unless the user named another or a retry rule applies.

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

For a long beat, phase the assembly across the full span so motion never stalls into a held frame:

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
  "model_name": "seedance-2.0-pro",
  "generation_type": "images_to_video",
  "prompt": "<animation prompt>",
  "image_urls": [
    "/absolute/path/frames/first-frame.png",
    "/absolute/path/frames/last-frame.png"
  ],
  "duration": 7,
  "resolution": "720p",
  "aspect_ratio": "9:16",
  "generate_audio": false
}
```

`duration` is that beat's `target_duration_s`, never a default. Confirm the value is in the model's live `duration_options` before sending.

To fall back to `minimax/hailuo-h3`, keep the same two-image order and change `model_name`, but drop `generate_audio` and honor its 5-second floor. Never send `negative_prompt`, `guidance_scale`, `extra_params`, or a custom watermark URL, and do not mix keyframe mode with multi-element reference mode.

Run beats concurrently, but treat each as independent — one failure must not restart a beat that already passed. Download every returned URL into `runs/v01/raw.mp4` and extend that beat's `provenance.json`.

### 4. Force silent delivery

Silence is enforced by the request and by ffmpeg, not by the prompt. Leave `generate_audio` false, then strip any track that still arrives:

```bash
ffmpeg -y -i "$RUN/raw.mp4" -map 0:v:0 -c:v copy -an "$RUN/final-noaudio.mp4"
```

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

- The measured duration equals `target_duration_s` and covers the narration span.
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

| symptom | action |
| --- | --- |
| clip shorter than the span | replan `target_duration_s` and regenerate; never pad with a held still |
| motion stalls mid-clip | rewrite the prompt with explicit per-second phases covering the full span |
| early edge reveal on frame 1 | acceptable when slight; for a strict empty field, prepend a held frame |
| weak assembly feel | cut element count and rewrite as explicit per-piece slide in / snap into place |
| last frame drifts | strengthen "Image 2 is the exact completed last frame" and "End by holding the supplied completed composition" |
| fake lettering | return to the still and regenerate; never patch it in the video prompt |
| assembly still fails after two tries | switch that beat to `minimax/hailuo-h3` at the same duration, or raise resolution, and state the cost |
| one beat fails | rerun only that job |

## Delivery

Hand over per beat `final-noaudio.mp4` with its measured duration and narration span, the contact sheets, the end-frame comparisons, `narration.mp3`, `transcript.json`, and one sentence on how each argument became its metaphor.

Report the total credits spent across TTS, alignment, stills, and motion. When a defect comes from the model's fast-generation limits, say so plainly. Recommend the HyperFrames path only when precise layer control is genuinely required.

## Boundaries

- Own the beat and duration plan, the gate protocol, metaphor and color judgment, prompts, provider selection within the table above, still and motion result fetching, provenance, and QA.
- Load `vidmuse-media` for narration synthesis and word alignment. Decide the script and the voice; let it execute the call, verify the artifact, and own the `transcript.json` contract. Do not call a TTS or alignment model directly, hand-roll that contract, or hand-edit word timings.
- Load `vidmuse-cli` for the still and motion calls; do not reimplement authentication, upload, or command syntax.
- Do not route generation through HyperFrames-managed models, a local Gemini API key, or a downloaded local model, and never substitute OS or browser TTS.
- Do not build `dsl.json`, start Serve, or render a Timeline project; hand clips, narration, and transcript to `vidmuse-timeline` through the requesting workflow.
- Do not skip a gate, merge two gates, begin motion from an unapproved still, or generate at a duration that was never planned against narration.
- Do not report success from a missing, zero-byte, or remote-only artifact.
