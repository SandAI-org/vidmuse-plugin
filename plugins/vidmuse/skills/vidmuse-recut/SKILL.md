---
name: vidmuse-recut
description: >
  Recut or package existing speaking footage into a designed VidMuse film.
  Use for talking-heads, interviews, podcasts, founder or product explainers,
  and launch-film treatments that need captions, visual proof, kinetic type,
  reframing, PiP, or mixed media. Start in source-grounded Director mode;
  Packaging is an explicit restrained alternative, not the silent default.
  Use media-use for standalone transcription, trimming, cropping, or another
  single media result. Use vidmuse-create when no speaking footage exists.
---

# VidMuse Recut

Direct existing speaking footage into a coherent film that helps the viewer
understand and feel the argument. `/vidmuse` owns routing; this skill owns the
film through Timeline delivery even when it calls media, asset, motion, or
HyperFrames skills for one layer.

The source is evidence, not a background to decorate. It may remain
full-frame, reframe, enter PiP, combine with graphics, or leave during a
justified proof scene.

## Working principles

1. **Preserve truth.** Derive words, timing, claims, identity, and source state
   from the recording and approved material. Never invent word times, data, UI
   proof, or brand assets.
2. **Direct by default; spend density deliberately.** Director mode plans the
   complete film but may still choose quiet, source-only scenes. It does not
   authorize constant full-frame graphics. Use Packaging when the user asks
   for a restrained overlay-led treatment.
3. **Direct before selecting effects.** Map the argument, relations, energy,
   quiet passages, and visual proofs before browsing mechanisms.
4. **Keep one visual authority.** User intent and source footage lead;
   `FRAME.md` becomes the token law; references supply precedent; Registry
   supplies mechanisms.
5. **Review pixels, not compliance prose.** Validators protect mechanical
   contracts. Real keyframes, rendered motion, and the VidMuse Timeline decide
   whether the film works.

## Autonomy and approval

Read
[`../vidmuse/references/runtime-policy.md`](../vidmuse/references/runtime-policy.md)
once at the start. Treat this skill directory as read-only and place every
project artifact under `videos/<project-name>/` or a user-named work directory.

Proceed without asking for safe, in-scope local work: inspection, transcript
alignment, deterministic asset resolution, planning, composition, and
validation. Coverage may be skipped when the user explicitly requests an
autonomous run. The fresh-project direction gate is stricter: pause unless the
user already approved a named look/preset or explicitly asked VidMuse to
auto-select the visual direction. Generic requests such as "直接做", "看看实力",
"完整做完", or "在隔离环境试跑" do not authorize a direction skip.

- **coverage:** production mode, chapters/acts, proposed interventions, quiet
  passages, and any generated-video proposal;
- **direction:** on a fresh project, the user's choice from exactly three
  project-grounded worlds in `frame-showcase.html`; that choice authorizes the
  single winning `FRAME.md` and the selected-system version of the same HTML.

Record any authorized skip in the relevant artifact. Generated video inside a
recut needs per-instance approval unless the BRIEF already authorizes it.
Export `final.mp4` only after Timeline approval. If ASR fails, ask for text
once; do not loop.

## Load references by phase

Do not read the entire reference library up front.

| Phase or need | Read |
| --- | --- |
| Probe, transcript artifacts, staging, assembly, render commands | [`references/pipeline.md`](references/pipeline.md) |
| Packaging vs Director, proof density, source-state ownership | [`references/director-pass.md`](references/director-pass.md) |
| Coverage analysis and user-facing proposal | [`references/packaging-analysis.md`](references/packaging-analysis.md) |
| Director scenes and act worlds | [`references/storyboard-contract.md`](references/storyboard-contract.md), [`references/act-worlds.md`](references/act-worlds.md) |
| Visual direction, FRAME.md, captions, layout, showcase | Load `/vidmuse-design`; it owns private taste data and reads only the applicable design references |
| External media or generated material | [`references/asset-sourcing.md`](references/asset-sourcing.md) |
| Effect selection and adaptation | [`references/registry-integration.md`](references/registry-integration.md), [`references/composition-contract.md`](references/composition-contract.md) |
| Director motion and correction loop | [`references/camera-and-transition-craft.md`](references/camera-and-transition-craft.md), [`references/sound-design.md`](references/sound-design.md), [`references/motion-review.md`](references/motion-review.md), [`references/iteration-loop.md`](references/iteration-loop.md) |
| User preview, write-back, and export | [`references/vidmuse-timeline.md`](references/vidmuse-timeline.md) |

## Core artifacts

Keep decisions inspectable:

| Stage | Artifacts |
| --- | --- |
| Truth | `metadata.json`, `audio.mp3`, `transcript-source.txt`, `transcript-receipt.json`, `transcript.json`, `video-context.json` |
| Editorial | `asset-plan.json`, `packaging-analysis.md`, and Director-only `STORYBOARD.md` |
| Direction | `FRAME.md`, `frame-showcase.html` |
| Plan | Packaging `edit-plan.json` or Director `scene-plan.json` |
| Production | `effect-sources.json`, `asset-sources.json`, `public/` |
| Review and delivery | `evaluation.json`, `dsl.json`, optional `output.mp4`, final `final.mp4` |

Resume from valid artifacts instead of restarting approved work.

## Workflow

### 1. Set up and establish truth

Read `BRIEF.md` when present. On the first run after plugin installation—or
when a tool or authentication check fails—run the one-time host setup:

```bash
bash scripts/setup.sh
```

Do not validate the complete taste library or Registry overlay for each film;
those are maintainer checks documented in `README.md`. Probe and extract the
source according to `references/pipeline.md`.

Load `/media-use` and follow its `references/audio.md`. Prefer approved text
when available; otherwise run ASR automatically, then ATA. Materialize the
receipt's exact `text` and flat `words` array, preserve provenance, and clamp
all downstream times to media duration. Corrections update the source text and
rerun ATA; never hand-edit word timing.

Start the layered Timeline as soon as source media and transcript exist:

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered --no-overlay
vidmuse serve "$WORK_DIR/dsl.json" &
```

Show ASR text with its source label during this early handoff without blocking
the rest of the run.

### 2. Understand the film

Build `video-context.json` from the full transcript, metadata, request, brand
material, and representative frames. Inspect frames when composition, subject
position, shot changes, demonstrations, or safe zones affect a decision.

Use `references/director-pass.md` to confirm production mode:

- start in **Director** so acts, source states, quiet passages, proof, handoffs,
  and sound are deliberately planned;
- use **Packaging** only when the user explicitly asks for restrained,
  source-led overlay treatment or the approved brief already fixes that mode.

Director is the planning default, not a density quota. A mostly static speaking
plate may remain source-led for most of its runtime.

Mode controls density and artifacts, not permission to generate media.

Run the `/vidmuse-assets` Semantic Asset Pass over the complete transcript and
inspected source. Write and validate `asset-plan.json` even when deliberately
empty. Resolve only approved deterministic opportunities:

```bash
node ../vidmuse-assets/scripts/asset_plan.mjs --project "$WORK_DIR" --complete-pass
node ../vidmuse-assets/scripts/asset_plan.mjs --project "$WORK_DIR" --validate
node ../vidmuse-assets/scripts/asset_plan.mjs --project "$WORK_DIR" --resolve
```

### 3. Propose and confirm coverage

Follow `references/packaging-analysis.md`. Analyze the complete transcript and
distributed source frames before selecting a style or effect. Plan continuous
systems, timed interventions, visual proofs, source-state changes, deliberate
silence, and chapter/act energy. Treat sequence, causality, comparison, and
dependency as relations to stage—not a list of sentences to decorate.

Write `packaging-analysis.md` with trustworthy time ranges, editorial reasons,
source/transcript evidence, approved `asset_refs`, risks, and explicit quiet
passages. There is no effect quota. Apply the proof-density cap in
`references/director-pass.md` to locked-off footage.

In Director mode, write `STORYBOARD.md` after coverage confirmation. Every
substantial scene needs a narrative job, visual proof, source mode, developed
state, handoff, and sound intent; animated repetition of the spoken line is
not proof.

Present the essential proposal and wait at the coverage gate unless autonomy
was authorized.

### 4. Compose and confirm direction

After coverage is settled, load `/vidmuse-design`. Give it the BRIEF,
`video-context.json`, representative real frames, transcript, approved
packaging analysis, aspect/caption band, treatment classes, density budget, and
approved asset references. Pass `film_mode: recut-packaging` or
`film_mode: recut-director` from the active Recut mode.

`vidmuse-design` privately owns the taste catalogs, preset frame packs,
`FRAME.md` contract, caption identity, and real-footage showcase gate. On every
fresh Recut project without a previously approved named look, it follows
`references/direction-picker.md`: before the one direction stop, it emits only
one `frame-showcase.html` containing exactly three showcase-grade candidates.
Present its path and the three names, then end the turn; do not write
`FRAME.md`, choose a winner, or start production until the user replies. The
user's choice satisfies the direction gate. Design then writes the single
winning `FRAME.md`, preserves the three-way comparison in the same HTML, adds
the selected-system proof below it, and returns:

- project `FRAME.md` and `frame-showcase.html`;
- a successful `frame_md.py --check` report;
- preset/composed mode and selected anchor;
- recommended caption identity, aspect/layout, and density;
- pack `effect_affinity` and treatment constraints.

Do not load a second look source or browse another preset library. Browse the
effect catalog only after the design capability returns and
the editorial need is known:

```bash
python3 scripts/effects.py --index
```

Prefer `curated` records — especially `native:*` items, which are proven
in-house mechanisms — before adapting an unreviewed registry item, and before
writing any effect from scratch. Hand-rolled effects regress to the model's
mean; the library exists so films inherit wins instead of re-deriving them.

For any beat that should land on speech (hero lines, list reveals, quiet
passages), resolve the exact word timings first — never guess:

```bash
python3 scripts/word_sync.py "$WORK_DIR/transcript.json" --find "<phrase>"
python3 scripts/word_sync.py "$WORK_DIR/transcript.json" --gaps 0.5
```

Do not stop at a second direction gate when the selected-system HTML faithfully
implements the chosen candidate. Apply later direction feedback through
`/vidmuse-design` so `FRAME.md` remains the single visual authority.

### 5. Plan and build

Write `edit-plan.json` for Packaging. In Director mode, translate the
storyboard into `scene-plan.json` and validate it:

```bash
python3 scripts/scene_plan.py "$WORK_DIR/scene-plan.json" --check
```

Keep plans semantic—time, intent, content, source state, treatment, effect
source, and constraints—not HTML or tweens.

Source media through the ladder in `references/asset-sourcing.md`. Official
identity and evidence stay real. Bind every approved file opportunity to an
actual local `data-asset-ref` before overlay delivery:

```bash
python3 scripts/asset_gate.py "$WORK_DIR" --check
```

Install and inspect selected Registry items, then adapt their mechanisms to
real content and `FRAME.md`:

```bash
npx hyperframes add <upstream-id> --dir "$WORK_DIR/registry-source" --no-clipboard --json
```

Record adaptations and pinned dependencies in `effect-sources.json`. Assemble
`public/index.html` under `references/composition-contract.md`. Use
`../hyperframes-animation/SKILL.md` for runtime-specific motion. The host owns
one paused timeline; each sub-composition owns an independent registered
timeline.

Refresh the Timeline overlay as production lands:

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered
```

### 6. Render, evaluate, and correct

Build visible hero states first and inspect them before polishing motion. Run
the HyperFrames mechanical checks:

```bash
npx hyperframes lint
npx hyperframes check
npx hyperframes keyframes public --runtime all
npx hyperframes snapshot public --at <review-times>
```

Then run the VidMuse packaging lints on the same evidence. Both are blocking:
a failure is a named finding in `evaluation.json`, not a style opinion.

```bash
# Every font stack must resolve inside FRAME.md's resolved families; a CJK
# stack that can fall through to bare serif ships 宋体 and fails.
python3 scripts/packaging_lint.py fonts "$WORK_DIR/public/index.html" \
  --allow "<FRAME.md resolved families, comma-separated>"

# No overlay may cover a detected face (rendered frame vs clean source frame
# at the same timestamp, full frames at matching aspect).
python3 scripts/packaging_lint.py faces \
  --rendered <snapshot.png> --source <source-frame.jpg>
```

Packaging may proceed from confirmed hero frames to a full review. Director
mode follows the rendered loop: hero frames, motion reel, act review when
useful, full draft, correction review, and final polish. Correct narrative and
source-state failures before local timing or finish.

Evaluate exported pixels, transitions, audio, assets, and open findings in
`evaluation.json`, then validate:

```bash
python3 scripts/evaluation.py "$WORK_DIR/evaluation.json" --check
```

Do not report approval while a named failure remains open. HyperFrames Studio
is not the user surface and must not auto-open; use Timeline for review.

### 7. Deliver through VidMuse Timeline

Keep layered delivery by default: source on main, HyperFrames packaging on a
sub-track, program audio on sounds, and one owner for the spoken captions.
Re-read `dsl.json` before edits and preserve Timeline write-back by stable id.

After user approval:

```bash
vidmuse render "$WORK_DIR/dsl.json" \
  --output "$WORK_DIR/final.mp4" --quality standard
```

Verify duration, resolution, and fps with ffprobe. Use an optional HyperFrames
`output.mp4` bake for craft evidence or fallback delivery, not as a reason to
replace the layered Timeline workflow.

## Completion

Report the work directory, chosen direction and reason, intervention strategy,
Timeline URL, produced artifacts, and material caveats. If the project
generated substantial feedback, offer the taste-distillation pass in
[`references/taste-distillation.md`](references/taste-distillation.md).
Do not delete project files unless asked.
