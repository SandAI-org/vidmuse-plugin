---
name: vidmuse-shotcraft
description: Discover, inspect, install, adapt, and validate VidMuse's local library of 162 HyperFrames shot-* blocks. Use whenever vidmuse-create or vidmuse-recut needs an installable transition, title treatment, camera move, UI entrance, interaction, data beat, impact, rhythm device, opening, or outro after the beat's communicative job and cue chain are known. Also use when a user asks to search the Shotcraft catalog, install a shot-* item, or decide whether a block is recut-safe. This local library uses install-local.mjs rather than hyperframes add and must never be mounted raw in VidMuse Timeline.
---

# VidMuse Shotcraft

Use this skill as a local, installable motion vocabulary. It carries 162 standalone
HyperFrames blocks translated from the Shotcraft source library. Each block owns a
1920×1080 canvas, a finite duration, editable variables when available, and one paused
timeline registered under its `shot-*` composition ID.

Shotcraft answers **which existing block may implement an approved job**. It does not own
the story, art direction, cue timing, or final film. Name the communicative job and motion
cause first through `vidmuse-design` and `vidmuse-motion`; then search this library.

## Choose the correct registry

- For a `shot-*` name or a Shotcraft search hit, use this skill's local scripts.
- For official HyperFrames blocks and components, use `hyperframes-registry` and
  `hyperframes add` as usual.
- Do not change `hyperframes.json#registry` to point at this skill. The current
  HyperFrames CLI loads one HTTP registry and cannot read this filesystem registry.
- Do not install a tag or the full library into a film. Install only an exact selected
  item after inspecting it.

## Discover by job

Read [SHOT-INDEX.md](./SHOT-INDEX.md) when the beat needs a treatment and no exact name is
known. Use the deterministic catalog for the actual shortlist. Resolve the absolute
directory containing this `SKILL.md`, then run:

```bash
node <skill-dir>/scripts/catalog.mjs search --query "扫描式转场" --json --limit 3
node <skill-dir>/scripts/catalog.mjs search --tag transition --recut safe --json
node <skill-dir>/scripts/catalog.mjs inspect shot-clock-wipe
```

Search follows this order:

1. the beat's communicative job, relationship, intensity, and spatial mode;
2. bilingual job aliases in `indexes/by-job.json`;
3. exact manifest names, descriptions, and tags;
4. up to three compact candidate summaries for that one job;
5. inspection of the likely winner's manifest and HTML before install.

`--limit 3` limits only the summaries returned for one job. Search still ranks the full
catalog, and the limit does not cap the number of searches, installed blocks, or effects in
the film. Compare names, descriptions, tags, durations, and policy first. Read full HTML
only for the candidate most likely to be used; if none fits, refine the job query once or
return to the owning workflow for a custom treatment.

Prefer a better-fitting official block when one exists. Shotcraft is not a monopoly and
its demo content is never evidence.

## Respect the recut policy

Each catalog result carries one policy value generated from `policies/recut.json`:

- `recut:safe` — suitable for a brief punctuation, overlay-safe adaptation, or explicit
  short takeover after source-occupancy review;
- `recut:adapt` — usable only after substantial structural adaptation and full QA;
- `create-only` — the fail-closed default for heavy UI, multi-surface, or unlabeled shots.

`create-only` is not a quality judgment. It means the block is not pre-cleared to coexist
with authoritative talking-head footage. Never infer recut safety from tags alone.

## Install locally

The local installer is the only supported v1 path for `shot-*` blocks:

```bash
node <skill-dir>/scripts/install-local.mjs shot-clock-wipe \
  --dir <absolute-project-dir> --json
```

It performs a complete preflight before writing, then:

- installs the composition under the project's configured `paths.blocks`;
- copies every asset into
  `<paths.assets>/vidmuse-shotcraft/<shot-name>/...` and rewrites the installed HTML;
- keeps each block's assets independent, so adapting one block cannot mutate another;
- refuses to overwrite a changed file unless the caller explicitly passes `--force`;
- writes `shotcraft-lock.json` with source and installed hashes;
- prints a complete `class="clip"` sub-composition snippet.

Treat `--force` as destructive replacement. Use it only after inspecting the exact
conflicts and intentionally choosing the Registry copy over project edits.

## Adapt the installed copy

An installed block is a motion recipe, not a finished film frame:

1. Replace fake dashboards, placeholder copy, pilot colors, demo screenshots, numbers,
   and logos with project-owned content and evidence.
2. Apply the approved `FRAME.md`: typography, palette, surface, edge spectrum, source
   treatment, and motion temperament.
3. Set declared `data-composition-variables` first. Edit source only when variables cannot
   express the approved adaptation.
4. Keep the installer-created namespaced assets. When changing an asset, edit that
   block-specific copy; never redirect it to another block's installed asset.
5. Recheck protected regions, source visibility, captions, and output aspect ratio.

All shipped blocks are native 16:9. For a non-16:9 film, do not scale the whole 1920×1080
stage and call it adapted. Re-author the layout for the target frame and pass full QA, or
select another treatment.

## Retiming is source work

The manifest duration and internal GSAP timeline describe one complete playable recipe.
The host's `data-duration` only controls how long the sub-composition remains mounted; it
does not compress the internal timeline. Shortening a 5-second mount to 1.2 seconds simply
cuts the animation off at 1.2 seconds.

When a beat needs a different span, retime the installed block's GSAP positions and tween
durations, its internal root `data-duration`, and the host mount together. Confirm that the
last semantic action and resolution land inside the new duration. The vendored manifest
remains the source-recipe receipt; project adaptation lives in the installed copy and its
film artifacts.

## Wire only through a complete host

The installer emits the starting mount:

```html
<div
  class="clip"
  data-composition-id="shot-clock-wipe"
  data-composition-src="compositions/shot-clock-wipe.html"
  data-start="0"
  data-duration="5"
  data-track-index="1"
  data-width="1920"
  data-height="1080"
></div>
```

Set the real `data-start` and track in the film host. `data-composition-id` must match the
block's internal ID. Never point VidMuse Timeline `htmlSourceFilePath` at the Registry
payload or the installed raw block. Timeline receives a complete, independently renderable
host; a recut host must also be overlay-safe and omit duplicated source video, program
audio, captions, and opaque background.

## Create and recut boundaries

For `vidmuse-create`, use the complete library only after story, evidence, `FRAME.md`, beat
duration, and cue chain exist. For obvious support or hero jobs, prefer one quick catalog
search before custom implementation; do not search every quiet beat or create a separate
selection artifact. A shot name is an implementation hint, not a storyboard premise.
Prefer one recurring primary language and a small number of earned accents across a film.

For `vidmuse-recut`, prefer a quick `--recut safe` search for likely support, hero, or
editorial-punctuation moments. Keep the source plate authoritative and use shots mainly for
earned editorial punctuation, evidence, data, or type moments. An `adapt` candidate needs
an explicit overlay/takeover plan; `create-only` remains unavailable unless it is fully
redesigned and re-reviewed as a new host.

## Validate

Before selection work, the packaged library itself can be checked with:

```bash
node <skill-dir>/scripts/verify-registry.mjs --require-indexes
node <skill-dir>/scripts/verify-runtime.mjs --concurrency 4 --cli-version 0.7.90
```

The runtime audit installs every block into its own temporary project so global CSS from
one effect cannot contaminate another. It fails on every new install, Lint, or Runtime
error. `policies/runtime-check.json` records known authored Layout/Contrast/seek-sweep
findings; those entries are not waivers for a film and require manual visual QA during
adaptation. A block that resolves a recorded finding may pass without retaining the debt.

After project adaptation:

1. run the pinned HyperFrames lint and full check on the project;
2. snapshot the start, semantic peaks, hold, and resolved end of the shot;
3. verify the internal timeline completes inside the mounted duration;
4. inspect final-ratio pixels for demo residue, clipping, occlusion, and contrast;
5. for recut, reconcile the complete overlay host with Storyboard and Timeline before
   render, using the existing fail-closed synchronization gate.

Do not report the shot as complete because it installed successfully. Installation proves
file integrity; the owning film workflow proves meaning, adaptation, timing, and delivery.
