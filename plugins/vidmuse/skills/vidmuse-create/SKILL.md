---
name: vidmuse-create
description: >
  Create a complete designed film when no real speaking-footage plate exists:
  knowledge explainers, script-and-TTS films, website or product promos, and
  Vox-style collage. Use media-use instead when the user wants only one media
  result such as TTS, transcription, generation, trimming, or grading.
compatibility: VidMuse CLI on PATH and authenticated for model-backed work;
  Node.js 22+, ffmpeg/ffprobe, Python 3, and HyperFrames CLI for full films.
---

# VidMuse Create

Direct a film whose primary material must be made. `/vidmuse` owns routing;
this skill owns the film until delivery even when it calls asset, media,
HyperFrames, or motion skills for one layer.

The goal is a truthful, directed film that can be reviewed on VidMuse Timeline.
Do not turn a URL or narration into a sequence of decorated cards.

## Working principles

1. **Ground the direction in evidence.** Real product UI, brand language, or
   the subject's material culture informs the film, but never dictates its
   scene order.
2. **Design before composing.** For non-Vox films, select a directorial
   treatment and prove it with storyboard images plus a full-duration animatic
   before detailed HyperFrames/GSAP work.
3. **Make timing auditable.** Narration-led films use VidMuse TTS and
   audio-text alignment (ATA). Never invent word times or substitute
   OS/browser TTS.
4. **Let the chosen path own its craft.** Load only the references for
   `promo`, `explainer`, or `vox`; do not combine their rule sets.
5. **Review the film, not the checklist.** Run deterministic correctness
   checks, then put the first playable cut on Timeline. The user owns taste
   approval; validators do not.

## Start or resume

Read
[`../vidmuse/references/runtime-policy.md`](../vidmuse/references/runtime-policy.md)
once at the start. It defines the plugin namespace, vendored-skill policy,
safe HyperFrames initialization, work directories, and Timeline review
surface. Do not update bundled skills or auto-open HyperFrames Studio.

Resume an existing project from its artifacts instead of recreating approved
work. If real speaking footage becomes the primary material, return to
`/vidmuse` so `/vidmuse-recut` can take ownership.

An explicitly requested muted motion probe of at most 20 seconds may use the
light stub path below. All other work follows the film workflow.

## Film workflow

### 1. Choose one create path

Use
[`references/path-routing.md`](references/path-routing.md)
as the single source of truth:

- `vox` for Vox, paper-collage, halftone-collage, or collage B-roll;
- `promo` for a product, website, UI, launch, or brand film;
- `explainer` for knowledge, how-to, concept, or topic films.

Record `create_path` in `video-context.json`. For `vox`, load only
[`references/vox-collage.md`](references/vox-collage.md) for visual
production. Do not apply the non-Vox beat contract or craft stack to it.

### 2. Build the evidence bank

For a URL or product promo, follow
[`references/site-capture.md`](references/site-capture.md) and capture the
reachable product rather than fabricating proof:

```bash
npx hyperframes capture "<URL>" -o "$WORK_DIR/capture"
```

For an explainer, gather the subject's real diagrams, notation, era, palette,
and visual culture. Record claims, uncertainties, source limits, and
grounding evidence in the project. Ask one focused question only when the
missing context would materially change the film.

### 3. Select the direction and lock the script

For `promo` and `explainer`, follow
[`references/agency-preproduction.md`](references/agency-preproduction.md)
through discovery, a one-proposition brief, three materially different
treatments, direction selection, and script/director treatment.

Autonomous execution removes waiting, not the comparison: save the alternatives
and selection rationale, then continue. Interactive runs confirm the selected
script as text before generating voice.

For `vox`, plan argument-length collage clips from the supplied or approved
script using its dedicated reference; skip the non-Vox agency gates.

### 4. Create the truthful voice spine

Load `/media-use`, read its audio reference, and use its shared engine.
First verify the environment:

```bash
MEDIA_DIR="<sibling-media-use-skill-dir>"
node "$MEDIA_DIR/scripts/resolve.mjs" --doctor
```

Save the exact approved narration to `transcript-source.txt`, author
`audio_request.json`, then run:

```bash
node "$MEDIA_DIR/audio/scripts/audio.mjs" \
  --request "$WORK_DIR/audio_request.json" \
  --project "$WORK_DIR" \
  --out "$WORK_DIR/audio_meta.json" \
  --only tts
```

The gate is green only when the selected voice is verified, the audio is
non-empty, and ATA returned real words. Materialize:

- `audio.mp3` — the final narration;
- `transcript.json` — one flat ATA-truthful word array;
- `audio_request.json` and `audio_meta.json` — the execution receipt;
- `metadata.json` — duration probed from the final audio.

Segmented narration is allowed. Offset whole segments by the deterministic
concat plan; never hand-shift individual words. Regenerating voice invalidates
the transcript and requires ATA again.

As soon as audio and transcript exist, create the audio-mode DSL with the
shared recut script and serve it:

```bash
python3 ../vidmuse-recut/scripts/write_dsl.py "$WORK_DIR" --mode audio
vidmuse serve "$WORK_DIR/dsl.json"
```

The user should be able to hear the real voice and scrub real captions before
expensive visual production.

### 5. Plan semantic assets

Load `/vidmuse-assets` and run its Semantic Asset Pass over the full approved
script. Save `asset-plan.json` even when no asset deserves screen time:

```bash
node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project "$WORK_DIR" --complete-pass
node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project "$WORK_DIR" --validate
node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project "$WORK_DIR" --resolve
```

Bind approved assets to beats with stable `asset_refs`. The film decides what
belongs on screen; the asset skill resolves identity and legal source;
`media-use` performs the exact I/O or generation.

### 6. Prove the film before production

For non-Vox work, continue the selected path in
[`references/path-routing.md`](references/path-routing.md). It owns the beat
schema, continuity and audio decisions, path-specific craft references,
execution trace, and blocking failure conditions.

Create actual storyboard images, review them as a contact sheet, and cut a
full-duration animatic using the real voice, ATA captions, and temporary BGM
or an explicit `none` decision. Put the animatic on Timeline and record the
reviewed artifact/hash in `animatic-approved.md`.

Do not begin detailed GSAP composition, expensive generation, or final polish
until this gate passes. A prose-only storyboard does not pass.

For `vox`, follow the clip-duration and image-to-video process in
`vox-collage.md`; the voice and Timeline contracts still apply.

### 7. Produce from the approved plan

For non-Vox work:

```bash
python3 scripts/film_plan.py "$WORK_DIR" --resolve
python3 scripts/shot_scaffold.py "$WORK_DIR"
```

Fill the scaffold from the approved storyboard and resolved beat windows.
Use the path-selected story, picture, motion, cut, and UI references only when
they apply. Registry blocks, shot cards, `/vidmuse-motion`, HyperFrames
blueprints, and GSAP are implementation supplies; they do not choose the
film's direction or skin.

For all paths, freeze generated or downloaded media with receipts and keep
provenance in project manifests. Prefer real UI proof over reconstructed or
generated product chrome when real proof is available.

### 8. Validate and deliver on Timeline

For non-Vox work, run the blocking static preflight before the first playable
picture:

```bash
python3 scripts/check_motion.py "$WORK_DIR" --skip-render
```

Use HyperFrames `lint`, `check`, `snapshot`, and `keyframes` for targeted
craft verification. Rendered analysis is optional diagnosis unless the user
requests a strict render gate.

Refresh the DSL in layered mode once program picture exists. Timeline should
contain picture, narration, BGM or the recorded `none` decision, optional SFX,
and ATA subtitles. Never leave the main track pointing at a missing source
video.

The film is ready to report only when:

- voice, ATA transcript, duration, and receipts agree;
- grounding and any product claims are traceable;
- `asset-plan.json` validates and every used asset has a receipt;
- non-Vox pre-production, animatic approval, resolved film plan, scaffold
  trace, and static preflight are complete;
- promo proof uses real capture when reachable, with readable UI treatment;
- the first playable picture has been reviewed through `vidmuse serve`;
- no competing workflow, bundled-skill refresh, or automatic Studio preview
  took over the run.

## Light stub

Use this only when the user explicitly asks for a disposable muted probe of at
most 20 seconds and accepts that it is not a finished film:

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init …
```

Build the smallest seek-safe composition, run the relevant HyperFrames checks,
and label the result `stub`. If speech is promised, use the real voice spine;
never fake a transcript. Do not silently downgrade an explainer, promo,
launch, or client deliverable to this path.

## Handoff

Report the work directory, `create_path`, grounding basis, selected direction
or Vox recipe, voice and ATA models, important asset/shot choices, Timeline
URL, and material caveats. Do not claim completion while a voice, evidence,
animatic, plan, or validation gate is unresolved.
