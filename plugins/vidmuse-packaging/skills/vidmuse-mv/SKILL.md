---
name: vidmuse-mv
description: "Create complete generative AI music videos from supplied music, audio, lyrics, performer references, or a selected song window. Use for AI MV, music video, lyric MV, performance MV, song visualization, beat-synced video, 卡点 MV, 歌词动画, or a long H3 music-led film assembled from generated clips. Own master-audio lock, music analysis, timestamped lyrics, H3 shot planning and prompt compilation, character and scene continuity, cost approval, sequential generation, incremental Timeline review, final normalization, and delivery. Use vidmuse-ip instead when an existing reusable IP Kit leads the film."
---

# VidMuse AI MV

Own one music-led generative film from supplied audio to delivery. Treat the song as the immutable timeline, make one useful directorial decision per shot, and let the user see the film grow in Timeline as soon as each H3 clip returns.

Do not turn this workflow into a one-shot mega-prompt or a hidden autonomous batch. H3 creates shots; VidMuse owns the sequence, continuity, master audio, review state, and final technical consistency.

## Non-negotiable rules

- Keep one local master-audio file as the timing spine. Never stretch it, regenerate it, or replace it as a side effect of visual work.
- Analyze musical structure and resolve timestamped vocals before paid video generation.
- H3 audio-reference generation also requires at least one visual reference. Audio alone is not a valid H3 reference-video request.
- Plan each H3 generation within the model's live duration limits, currently integer clips of 5–15 seconds. Let the exact Timeline span remain musical; generate enough source duration and trim only the surplus.
- Distinguish performance shots from narrative, atmosphere, typography, and transition shots. A subject may sing or speak when the shot calls for it; do not force lip movement across the whole film.
- Generate chronologically, one shot at a time by default. After a successful download and structural probe, append that shot to the same Timeline before any Agent visual inspection.
- Do not watch a new candidate, extract frames, build a contact sheet, score it, or retry it autonomously before the user can review it. The user is the first visual reviewer.
- Keep visible lyrics exact. Generated lyric typography is a creative candidate; spelling-critical delivery text becomes a deterministic overlay after approval if H3 renders it incorrectly.
- Ask once before the first paid generation batch. Quote the live model price, balance, planned shots, reference cost, and one visible retry allowance. Ask again only if the approved scope or estimated spend materially expands.

## Project artifacts

Use a stable project directory and preserve these artifacts when applicable:

| Artifact | Role |
| --- | --- |
| `BRIEF.md` | confirmed song window, output, creative mode, references, constraints, and spend approval |
| `transcript.json` | validated word-level vocal timing |
| `music-analysis.json` | beats, downbeats, phrases, sections, energy, and other model-returned music structure |
| `STORYBOARD.md` | chronological shot plan, exact lyrics, master-audio spans, compiled prompts, and continuity state |
| `media/master-audio.mp3` | immutable program-audio spine |
| `media/segments/` | exact per-shot H3 reference-audio segments |
| `references/` | approved character, scene, object, wardrobe, and typography references |
| `clips/` | downloaded generated candidates and approved normalized shots |
| `dsl.json` | continuously updated Timeline review truth |
| `renders/` | verified review and delivery files |

Resume from valid existing artifacts. Do not regenerate an approved upstream artifact because a later stage is incomplete.

## Workflow

### 1. Lock the MV brief

Read the audio and supplied materials. Confirm or safely infer:

- full song or one selected window;
- aspect ratio, destination, and intended delivery resolution;
- MV mode: performance, narrative, lyric, visualizer, or hybrid;
- visual world, emotional arc, desired realism or stylization, and references;
- whether the lead is a supplied performer, a newly created project-local character, an object, or no recurring subject;
- exact lyrics when the user has them, and whether visible lyric typography is desired;
- collaboration pace: one-shot approval, small batches, or user-authorized continuous generation.

If the user delegates a quick capability test, recommend a 15-second hook containing both a clear vocal phrase and a musical accent. Record assumptions in `BRIEF.md`; do not repeatedly ask for choices the user already delegated.

An existing approved `ip-kits/<ip-id>/IP.md` keeps ownership in `vidmuse-ip`, even for a music-led episode. A performer or character created only for this MV remains project-local and belongs here.

**Gate:** the exact master-audio window, aspect ratio, creative mode, identity source, and review cadence are recorded.

### 2. Lock master audio and vocal timing

Load `vidmuse-media` and `vidmuse-cli`. Probe the supplied file and create one local master-audio file in a supported editing format without changing its speed or pitch. If the user selected a window, extract that exact window and treat its zero point as Timeline time `0`.

Run `analyze-music` when rhythm or section structure will guide the edit. Preserve the complete result as `music-analysis.json`; do not reduce it to BPM alone.

Resolve vocals separately:

- If the user supplied the exact matching lyrics, preserve them in `STORYBOARD.md` and run `align-transcript` against those exact words and the master audio.
- Otherwise run `transcribe` with `scribe-v2`, preserve its native word timings, and let the user correct uncertain words before any spelling-critical lip-sync or lyric shot.
- For instrumental music, skip ASR and record instrumental intervals explicitly.
- If the audio or locked lyrics change, regenerate the alignment. Never hand-edit word timestamps.

Cut visual shot boundaries at phrase endings, breaths, downbeats, section changes, and meaningful accents. Do not cut through a held syllable merely to obtain equal shot lengths.

**Gate:** the master audio is non-empty and immutable, `music-analysis.json` exists when useful, and vocal sections have validated word timing.

### 3. Design the sequence and continuity system

Build `STORYBOARD.md` before video generation. Each shot records:

- exact Timeline span on the master audio;
- integer H3 request duration sufficient to cover that span;
- shot function: performance, narrative, atmosphere, lyric typography, or transition;
- story change and visual payoff;
- music/lyric anchors that must land;
- subject, location, wardrobe, props, palette, light, lens, and movement state entering and leaving the shot;
- reference assets and their roles;
- continuity handoff to the next shot;
- what H3 may invent freely.

Use a small continuity bible across the sequence: identity, silhouette, wardrobe logic, recurring objects, color progression, movement direction, and one visual motif. Repeat only the invariants that matter; allow shot composition, metaphor, camera, and performance to change with the music.

Favor visual cause and effect over unrelated beauty shots. Establish a motif, transform or complicate it through the middle, and resolve it by the end of the selected window. Use match action, screen direction, light, color, shape, or sound accents to bridge adjacent clips.

Do not force a cut on every detected beat. Use strong accents for state changes and transitions, lighter beats for gestures and internal motion, and phrase boundaries for cuts.

**Gate:** every shot has one clear function, exact audio span, beat or lyric anchors, continuity in/out, and an intended degree of model freedom.

### 4. Resolve references and cost

Use supplied references first. Give each reference one explicit role: character identity, scene, wardrobe/object, or typography. Do not pass every reference into every shot.

Every audio-driven H3 shot needs a visual reference. When none exists, load `vidmuse-assets` to decide the minimum project-local reference set, then use the live image capability through `vidmuse-cli` to create only the approved stills. Character or performer references should be clear enough to preserve face, hair, silhouette, and wardrobe; scene cards should clarify space, palette, and lighting without competing with identity.

Before the first paid call:

1. Query the live H3 catalog entry and supported request fields.
2. Query the live price and account balance.
3. Estimate all planned image references and video seconds, plus one user-visible retry allowance.
4. State what the user will receive for that amount and wait for approval.

Do not rely on remembered resolution, duration, aspect-ratio, input-count, or file-format options. Live model metadata is authoritative.

### 5. Compile each H3 shot

Read [h3-mv-compiler.md](./references/h3-mv-compiler.md) before writing prompts. Build prompts from shot variables and the actual references; do not paste one universal prose template into every request.

Choose the H3 input mode by the shot's job:

- **Performance or lyric delivery:** use `reference_to_video` with the exact per-shot audio segment and an identity image. Bind mouth, jaw, breath, expression, and gesture to the locked vocal phrase. Include the exact lyric in its original language.
- **Narrative, atmosphere, visualizer, or beat shot:** use audio plus the relevant visual reference when the soundtrack should guide motion, editing energy, or semantics. Explicitly state that no character mouths the lyric unless that is desired.
- **Strict visual continuation or match transition:** use `image_to_video` with the approved outgoing or tail frame and no reference audio. The master Timeline audio still carries the music. Do not claim H3 can combine exact first/last-frame control with its multi-modal audio-reference mode when the live schema forbids it.
- **Pure prompt-led establishing shot:** use `text_to_video` only when identity and incoming-frame continuity are not important.

For complex multi-reference shots, compile the prompt into H3's full-reference sections: subject definitions, shot summary, retention analysis, detailed description, overall soundscape, and non-diegetic music. The detailed description should follow time order and name only the lyric, beat, gesture, camera, typography, or transition events that must land. Preserve useful creative room everywhere else.

Use an English control wrapper for reliable instruction following, while preserving lyrics and intended visible words exactly in their original language. Do not request duplicate generated soundtrack; Timeline owns the master audio.

Record each resolved prompt, live model receipt, output path, and generation cost beside its shot in `STORYBOARD.md`.

### 6. Generate one shot and reveal it immediately

Work chronologically unless the user explicitly chooses another order.

For each audio-driven shot:

1. Extract its exact master-audio interval to MP3 or WAV. Verify it is non-empty and satisfies the live H3 audio duration and size limits.
2. Submit the compiled H3 request through `vidmuse-cli` with an explicit canonical generation type.
3. Download the returned clip to `clips/` and use `vidmuse-media` only to probe structure: file exists, container is readable, dimensions and frame rate are known, and source duration covers the intended Timeline span.
4. Do not perform aesthetic inspection or autonomous retries.
5. Load `vidmuse-timeline`. Append or replace the stable shot ID in the same `dsl.json`, keep the generated clip muted, and let the full master audio remain the sole program-audio source.
6. Validate the DSL. After the first clip, start one loopback read-only Serve session and report the URL. For every later clip, update the same Timeline and tell the user which span appeared.
7. Stop for the user's reaction after each shot. If the user explicitly authorized continuous generation, continue, but still append and surface every returned shot immediately.

Apply `vidmuse-timeline`'s existing incremental-update protocol directly. Append one ordinary muted video item to the main track, preserve stable IDs and unknown fields, keep the full master audio as an independent sound, and validate after every update. Use `source`, `720p`, `1080p`, or `4k` for the Timeline project resolution; it is the delivery tier, not necessarily the raw H3 response height.

When the user rejects a shot, change the smallest failed dimension—performance, timing, camera, continuity, style, or typography—generate a new candidate, and replace the same stable shot ID. Preserve the rejected file and receipt unless the user asks to delete them.

### 7. Finalize only after sequence approval

Once all shots are approved:

- choose one master canvas and frame rate from the brief or the first approved H3 clip;
- normalize approved sources to that cadence and canvas, preserving duration and motion cadence;
- trim provider surplus to exact musical boundaries;
- regenerate a short source rather than freezing its final frame to fill missing motion;
- mute all clip-native audio and keep only the unchanged master audio;
- add approved deterministic subtitles or lyric typography only when needed for exact spelling or accessibility;
- run final visual, continuity, lip-sync, beat-sync, seam, audio, and technical QA;
- render through `vidmuse-timeline` and `vidmuse-cli` and verify duration, dimensions, frame rate, and audio.

Return the final file, project directory, Timeline state, actual spend, and known limitations.

## Quality gate

Reject final delivery when any answer is no:

- Do mouth shapes, breath, face, and gesture plausibly follow the locked phrase in performance shots?
- Do important motion changes land on justified beats, accents, words, or section changes without cutting mechanically on every beat?
- Does the selected window have a readable visual arc rather than unrelated generated clips?
- Are lead identity, silhouette, wardrobe logic, props, and scene geography consistent enough across cuts?
- Does each transition preserve at least one continuity anchor while introducing a meaningful change?
- Are generated words and lyrics exact where correctness matters, or replaced by deterministic typography?
- Does motion remain smooth at every source seam after final cadence normalization?
- Is the master audio unchanged, continuous, and the only program-audio path?
- Did the user see each candidate in Timeline before Agent-led aesthetic QA or autonomous replacement?

## Boundaries

- Own complete music-led generative films, sequence design, H3 shot compilation, continuity state, review cadence, and final acceptance.
- Let `vidmuse-ip` own music-led films whose approved reusable IP Kit is the lead identity.
- Let `vidmuse-create` own non-music-led generated films, product films, explainers, and visual stories where music is support rather than the master spine.
- Let `vidmuse-media` own probe, audio extraction, transcription, alignment, music analysis, and transcript validation.
- Let `vidmuse-assets` own reference identity, sourcing, provenance, licensing, and reference selection.
- Let `vidmuse-cli` own binary discovery, live model schemas, costs, balance, generation execution, and process syntax.
- Let `vidmuse-timeline` own DSL mutation, validation, Serve, review synchronization, and rendering.
- Use HyperFrames only for approved deterministic packaging such as corrected lyric typography, titles, or captions. Never route H3 media generation through HyperFrames-managed models.
