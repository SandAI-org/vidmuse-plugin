---
name: vidmuse
description: >
  Mandatory VidMuse entry point and intent router. Read first for any request
  to create, package, recut, caption, edit, or render a video with VidMuse, and
  for standalone media requests such as ASR/transcription, ATA word alignment,
  TTS/voiceover, music/SFX, image/video generation, logo/icon/font sourcing,
  grading, trimming, reframing, or transcript-driven cuts. Route by the
  requested deliverable: existing speaking-footage films to vidmuse-recut,
  films whose primary material must be made to vidmuse-create, semantic
  asset/library work to vidmuse-assets, and exact standalone media operations
  to media-use. Resume existing VidMuse projects from their artifacts and
  never force a simple media task through a film workflow.
compatibility: VidMuse CLI on PATH and authenticated for model-backed work;
  Node.js 22+, ffmpeg/ffprobe, and Python 3 for full film workflows.
---

# VidMuse

VidMuse has one front door and several owners. This skill identifies the
requested **deliverable**, selects one owner, and then leaves the run. It does
not create media or author a film itself.

## 1. Start from project state

Apply the first matching row:

| State | Action |
| --- | --- |
| The user requests one exact operation on an existing project | Perform only that operation through the matching domain skill. Do not reopen film discovery. |
| VidMuse artifacts already identify an owner (`packaging-analysis.md`, `edit-plan.json`, `scene-plan.json`, `film-plan.json`, `asset-plan.json`) | Resume that owner and preserve its decisions. |
| A specific edit belongs to an active `/vidmuse-recut` or `/vidmuse-create` run | Return to that workflow; load a domain skill only for the requested layer. |
| Fresh request | Route once with § 2. |

If the subject, input, or requested output is genuinely missing, ask one
routing question. Do not run a film brief interview for a standalone media
operation.

## 2. Route by deliverable

Use the first matching row. A mentioned file type or technique does not
override the output the user actually wants.

| Priority | Requested deliverable | Owner |
| --- | --- | --- |
| 1 | A designed package, recut, or director treatment of existing talking-head, interview, podcast, or other speaking footage | `/vidmuse-recut` |
| 2 | A complete film whose primary material must be created: script/TTS explainer, website or product promo without a speaking plate, generated-media film, or Vox-style collage | `/vidmuse-create` |
| 3 | Semantic asset planning, entity identity, logo/icon/font sourcing, Core Pack or Creator Library management, license/provenance decisions, or a proactive in-film asset pass | `/vidmuse-assets` |
| 4 | One standalone media result with no film deliverable: transcription, ASR-only text, ATA alignment, TTS/voiceover, BGM/SFX, image/video generation, trim, crop, reframe, transform, grading, or transcript-driven cut | `/media-use` |
| 5 | Inspect, lint, check, snapshot, preview, or render an existing HyperFrames composition without changing VidMuse product intent | `/hyperframes-cli` plus the required HyperFrames domain skill |

Plain captions burned or layered onto existing speaking footage currently stay
with `/vidmuse-recut` in restrained Packaging mode. If captions become a
separate VidMuse product later, add a workflow owner here rather than hiding it
inside `media-use`.

## 3. Resolve common ambiguities

- A video **input** does not imply recut. “Transcribe this video” produces text,
  so `/media-use` owns it.
- Text **input** does not imply create. “Read this paragraph in a Chinese
  voice” produces audio, so `/media-use` owns it.
- “Make a film from this script and narrate it” produces a film, so
  `/vidmuse-create` owns the run and calls `/media-use` for its voice spine.
- A logo mentioned inside a film does not transfer film ownership.
  `/vidmuse-assets` plans the opportunity, `/media-use` resolves the file, and
  the active film workflow places it.
- “Find the official OpenAI logo and record its source” is semantic
  asset/library work, so `/vidmuse-assets` owns it. “Download this already
  approved asset URL into the project” is an exact `/media-use` operation.
- Cutting a specified time range, reframing one clip, or transcribing speech is
  a media operation. Editorially redesigning the argument and presentation of
  speaking footage is recut.

## 4. Ownership law

Workflow skills own end-to-end video deliverables:

- `/vidmuse-recut` owns existing speaking-footage films.
- `/vidmuse-create` owns films whose primary material must be made.

Capability skills own one layer and then return control:

- `/vidmuse-assets` owns semantic asset intelligence and source/license policy.
- `/media-use` owns exact media execution and standalone media results.
- `/hyperframes-*`, `/vidmuse-motion`, and `/gsap-*` own composition,
  animation, rendering, or implementation knowledge.

Once a workflow owns a film, do not re-route merely because it loads a domain
skill. Domain skills never take over the final deliverable.

## 5. Enter the owner

Before entering a film workflow, read
[`references/runtime-policy.md`](references/runtime-policy.md). It defines the
plugin namespace, vendored-skill, HyperFrames update, and preview rules once
for both create and recut.

For a standalone capability request, load only that capability:

| Need | Skill |
| --- | --- |
| ASR, ATA, TTS, audio, generated media, deterministic media operation | `/media-use` |
| Entity/logo/icon/font planning, libraries, license/provenance | `/vidmuse-assets` |
| HyperFrames project operation | `/hyperframes-cli` |

Return the requested artifact and its receipt. Do not create `FRAME.md`,
storyboards, film plans, or Timeline projects unless the requested deliverable
is a film.
