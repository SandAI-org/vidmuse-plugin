---
name: vidmuse-mv
description: "Create complete generative AI music videos from supplied music, audio, lyrics, performer references, or a selected song window. Use for AI MV, music video, lyric MV, performance MV, song visualization, beat-synced video, 卡点 MV, 歌词动画, or a long H3 music-led film assembled from generated clips. Own master-audio lock, music analysis, timestamped lyrics, a treatment-level MV script, visual-style approval, production-design continuity, image-reference generation, H3 shot planning and prompt compilation, cost approval, sequential generation, incremental Timeline review, final normalization, and delivery. Use vidmuse-ip instead when an existing reusable IP Kit leads the film."
---

# VidMuse AI MV

Own one music-led generative film from supplied audio to delivery. Treat the song as the immutable timeline, make one useful directorial decision per shot, and let the user see the film grow in Timeline as soon as each H3 clip returns.

Do not turn this workflow into a one-shot mega-prompt or a hidden autonomous batch. H3 creates shots; VidMuse owns the sequence, continuity, master audio, review state, and final technical consistency.

## Non-negotiable rules

- Keep one local master-audio file as the timing spine. Never stretch it, regenerate it, or replace it as a side effect of visual work.
- Analyze musical structure and resolve timestamped vocals before paid video generation.
- Keep one human-readable planning file for a new MV: `MV-SCRIPT.md`. Grow it from brief to treatment, visual direction, production bible, shot plan, and generation log instead of creating separate planning Markdown files.
- Approve its treatment from the lyrics and full music analysis before reducing the song to provider-sized shots. A story section is a musical or dramatic passage and may later contain several generated clips.
- Approve one visual direction and its production-design logic before generating continuity references. Do not let the first attractive image silently become the film's style.
- H3 audio-reference generation also requires at least one visual reference. Audio alone is not a valid H3 reference-video request.
- Plan each H3 generation within the model's live duration limits, currently integer clips of 5–15 seconds. Let the exact Timeline span remain musical; generate enough source duration and trim only the surplus.
- Distinguish performance shots from narrative, atmosphere, typography, and transition shots. A subject may sing or speak when the shot calls for it; do not force lip movement across the whole film.
- Generate chronologically, one shot at a time by default. After a successful download and structural probe, append that shot to the same Timeline before any Agent visual inspection.
- Do not watch a new candidate, extract frames, build a contact sheet, score it, or retry it autonomously before the user can review it. The user is the first visual reviewer.
- Keep visible lyrics exact. Generated lyric typography is a creative candidate; spelling-critical delivery text becomes a deterministic overlay after approval if H3 renders it incorrectly.
- Ask once before the first paid generation batch. Quote the live model prices, balance, planned shots, reference cost, and one visible retry allowance. Ask again only if the approved scope or estimated spend materially expands.

## Project artifacts

Use a stable project directory and preserve these artifacts when applicable:

| Artifact | Role |
| --- | --- |
| `transcript.json` | validated word-level vocal timing |
| `music-analysis.json` | beats, downbeats, phrases, sections, energy, and other model-returned music structure |
| `MV-SCRIPT.md` | the single planning contract: scope, locked lyrics, song-driven treatment, visual direction and Style receipt, production bible, chronological shot plan, prompts, continuity state, and spend/generation log |
| `media/master-audio.mp3` | immutable program-audio spine |
| `media/segments/` | exact per-shot H3 reference-audio segments |
| `references/` | approved character, scene, object, wardrobe, and typography references |
| `clips/` | downloaded generated candidates and approved normalized shots |
| `dsl.json` | continuously updated Timeline review truth |
| `renders/` | verified review and delivery files |

For a new MV, do not create separate `BRIEF.md`, `FRAME.md`, or `STORYBOARD.md`. When resuming an older project that already has them, treat them as legacy inputs, merge their still-valid decisions into the matching `MV-SCRIPT.md` sections when that can be done safely, and do not create additional copies. Do not regenerate an approved upstream decision because a later stage is incomplete.

Grow `MV-SCRIPT.md` in place with only the sections the project needs, in this order: `## Scope`, `## Locked Lyrics`, `## Creative Treatment`, `## Visual Direction`, `## Production Bible`, `## Shot Plan`, and `## Generation Log`. Keep sections concise and update them rather than appending duplicate revisions.
Do not create aliases such as `TREATMENT.md`, `STYLE-BIBLE.md`, `CONTINUITY.md`, `SHOTLIST.md`, or `COSTS.md`; put that information in the matching section or an existing machine-readable artifact.

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

If the user delegates a quick capability test, recommend a 15-second hook containing both a clear vocal phrase and a musical accent. Create a lean `MV-SCRIPT.md` skeleton and record these decisions under `## Scope`; do not repeatedly ask for choices the user already delegated.

An existing approved `ip-kits/<ip-id>/IP.md` keeps ownership in `vidmuse-ip`, even for a music-led episode. A performer or character created only for this MV remains project-local and belongs here.

**Gate:** `MV-SCRIPT.md` exists and its `## Scope` records the exact master-audio window, aspect ratio, creative mode, identity source, review cadence, constraints, and current spend-approval state.

### 2. Lock master audio and vocal timing

Load `vidmuse-media` and `vidmuse-cli`. Probe the supplied file and create one local master-audio file in a supported editing format without changing its speed or pitch. If the user selected a window, extract that exact window and treat its zero point as Timeline time `0`.

Run `analyze-music` when rhythm or section structure will guide the edit. Preserve the complete result as `music-analysis.json`; do not reduce it to BPM alone.

Resolve vocals separately:

- If the user supplied the exact matching lyrics, preserve them verbatim under `## Locked Lyrics` in `MV-SCRIPT.md`, run `align-transcript` against those exact words and the master audio, and later copy the relevant words exactly into each shot row.
- Otherwise run `transcribe` with `scribe-v2`, preserve its native word timings, and let the user correct uncertain words before any spelling-critical lip-sync or lyric shot.
- For instrumental music, skip ASR and record instrumental intervals explicitly.
- If the audio or locked lyrics change, regenerate the alignment. Never hand-edit word timestamps.

Record candidate visual cut anchors at phrase endings, breaths, downbeats, section changes, and meaningful accents, but do not decide provider-sized shots before the MV treatment exists. Later shot boundaries must not cut through a held syllable merely to obtain equal lengths.

**Gate:** the master audio is non-empty and immutable, `music-analysis.json` exists when useful, and vocal sections have validated word timing.

### 3. Write the MV treatment

Extend `MV-SCRIPT.md` from the locked lyrics, word timing, and complete `music-analysis.json`. Its `## Creative Treatment` is the plan a director, production designer, and artist can all understand; that section is not the provider shot list and not a verbose screenplay.

Start with a compact concept block:

- one-sentence creative premise and the lyric/music evidence behind it;
- emotional and visual arc from opening state to final resolution;
- lead and supporting character roles, or an explicit no-character approach;
- recurring motif and the rules for how it develops;
- realism or stylization target, narrative/performance balance, and what the film must avoid.

Then divide the selected song window into only the story sections the song earns. Let verse, chorus, bridge, instrumental turn, lyrical perspective, energy curve, and narrative causality determine the count. For each section record:

- approximate master-audio span, music section, lyric meaning, and emotional turn;
- character presence and relationship state;
- location, time, atmosphere, and the main visible action or event;
- scene-level plot change and visual payoff;
- provisional wardrobe, hair/makeup, hero props, and practical effects when useful;
- visual treatment, palette/light shift, motif state, and transition idea;
- likely coverage such as establishing, performance, action, detail, or aftermath without enumerating H3 clips.

One treatment section may become several H3 shots; several musical phrases may share one section when the scene and dramatic objective remain unchanged. Do not create one section per fixed model duration, one row per beat, or a sequence of unrelated beauty shots. Favor cause and effect: establish the motif, complicate it through the middle, and resolve it by the end.

Treat production design as motivated rather than mandatory. A location, costume, hair/makeup look, or hero prop changes only when the lyrics, story, time, performance setup, or musical escalation benefits from it. Real MVs may return to one setup, alternate performance and narrative worlds, or change several looks; all are valid when the logic is explicit.

**Gate:** `MV-SCRIPT.md` has a readable `## Creative Treatment` with song-derived sections rather than provider chunks, enough character/world/plot/visual information to direct the film, and no premature shot-level prompt detail.

### 4. Approve the visual direction and Style

Load `vidmuse-design` and `vidmuse-cli`. Append a concise `## Visual Direction` to `MV-SCRIPT.md` from its treatment, lyrics, the music's texture and energy, supplied references, platform, aspect ratio, and desired realism. Define the invariant visual spine and the allowed differences between performance setups, narrative scenes, and wardrobe looks. Do not create `FRAME.md` for a new MV.

Use the live VidMuse Style catalog as a visual comparison and approval surface:

1. Fetch the complete `style list --scope all --view summary` catalog, including all pages.
2. After the bespoke design read exists, shortlist no more than three materially different candidates whose subject treatment, medium, palette, lighting, texture, and camera language fit this song. Inspect each with `style get <styleId> --view full`.
3. Recommend one candidate with a song-specific reason and explain the meaningful tradeoff of the alternatives. Do not paste a catalog `promptSample` as the film direction.
4. Load `vidmuse-timeline`, assemble or preserve a minimal valid `dsl.json` with the immutable master audio, validate it, and start one loopback read-only Serve session. Tell the user to open the top-right **Styles** palette, inspect the visual cards, and use **Copy for Agent** or copy the Style ID for the chosen direction.
5. Keep the recommendation provisional until the user selects a Style. If the user explicitly delegates the choice, select the top recommendation and record that delegation instead of blocking.

Record the chosen Style's exact receipt under `MV-SCRIPT.md` → `## Visual Direction`: `id`, `name`, `scope`, `tags`, `imageUrl`, `description`, `analysis`, and `promptSample`, plus why it fits, which traits become invariants, and which sample-specific content must not be copied. A live VidMuse generation Style is distinct from an optional HyperFrames frame preset; neither selection silently activates the other.

If Serve cannot load the catalog, present the same short list from CLI results with preview links and retain the approval gate. Do not start paid image generation from an unapproved visual direction.

**Gate:** `MV-SCRIPT.md` → `## Visual Direction` names one approved generation look, its evidence and invariants, the user's selection or delegated-choice state, and the allowed scene/look variation.

### 5. Design the shot sequence and production continuity

Add `## Production Bible` and `## Shot Plan` to the same `MV-SCRIPT.md` before video generation. Each H3 shot records:

- parent `MV-SCRIPT.md` section and exact Timeline span on the master audio;
- integer H3 request duration sufficient to cover that span;
- shot function: performance, narrative, atmosphere, lyric typography, or transition;
- story change and visual payoff;
- music/lyric anchors that must land;
- character ID, location ID, look ID, prop IDs, palette, light, lens, and movement state entering and leaving the shot;
- reference assets and their single explicit roles;
- continuity handoff to the next shot;
- what H3 may invent freely.

Maintain one compact continuity bible with stable identifiers:

- **Character ID:** invariant face, hair identity, body proportions, age read, and silhouette.
- **Look ID:** one approved wardrobe + hair/makeup + accessory combination. Reusing the ID means no unplanned change; a motivated change creates a new ID and reference.
- **Location ID:** persistent geography, architecture, time-of-day/light logic, palette, and weather state. Returning to the ID restores those invariants.
- **Prop ID:** recognizable shape, material, color, wear, ownership, and state when the object recurs or changes.

Keep identity stable while allowing intentional production changes. A costume, prop, location, or lighting shift is a named story event, never accidental model drift. Repeat only the invariants that matter; allow composition, metaphor, camera, and performance to change with the music.

Use match action, screen direction, light, color, shape, object state, or sound accents to bridge adjacent clips. Do not force a cut on every detected beat: use strong accents for state changes, lighter beats for gestures and internal motion, and phrase boundaries for cuts.

**Gate:** every shot traces to one treatment section, has one clear function, exact audio span, beat or lyric anchors, explicit continuity IDs and in/out state, and an intended degree of model freedom.

### 6. Resolve and generate references, then approve cost

Use supplied references first. Give each reference one explicit role: character identity, location, wardrobe/look, prop, composition, or typography. Do not pass every reference into every image or video shot.

Load `vidmuse-assets` to decide the minimum project-local reference set. Read [image-reference-compiler.md](./references/image-reference-compiler.md) before compiling paid image prompts. Query the live image catalog, schema, price, and input limits; for production identity, wardrobe, location, and scene references, prefer the strongest compatible live image model rather than an older default. `gpt-image-2` and Nano Banana Pro / `gemini-3-pro-image` are current examples to check, not aliases to invent or proof that the account exposes them. Choose from live capabilities, identity/edit fidelity, multi-reference support, latency, price, and the actual reference job; if a preferred model is unavailable, disclose the fallback before spending.

Create character identity references without a story environment whenever the lead recurs:

- one isolated face close-up on pure white or neutral seamless background, even neutral light, unobstructed face, neutral expression, natural skin/hair detail, and no props, text, logos, scenery, or dramatic grading;
- one isolated full-body three-view turnaround on the same blank background: front, clean side profile, and back, same scale and neutral pose, head-to-toe with feet visible, consistent anatomy and base identity;
- keep changing costumes out of the base identity pack when practical. Use neutral fitted base clothing for body shape, then create one separate isolated wardrobe/look card per approved `Look ID`.

For a supplied real performer, preserve exact likeness and confirm authorized use. If the source has a distracting environment, create the isolated identity pack as a change-only edit: change the background/framing needed for the reference, keep face, skin tone, hair, body proportions, and identity unchanged. Do not let a source background become an accidental location reference.

Create separate location cards that establish geography, palette, light, and weather without a competing face; wardrobe/look cards that show materials, fit, accessories, hair/makeup, and front/back logic; and prop cards only for recurring story-critical objects. Generate one approved anchor per stable ID, then derive scene stills through targeted edits or carefully bound multi-reference composition. Do not regenerate identity from prose for every scene.

Before the first paid reference or video call:

1. Query the live H3 and chosen image-model catalog entries and supported request fields.
2. Query both live prices and the account balance.
3. Estimate all planned image references and video seconds, plus one user-visible retry allowance.
4. State the image models, reference count, video plan, expected deliverables, and total estimate; wait for approval.

After approval, generate the minimum reference set first and let the user approve identity, Style fidelity, look/location separation, and continuity coverage before any H3 shot. Iterate with one targeted change while restating invariants; do not replace an approved reference because a later shot fails.

Do not rely on remembered resolution, duration, aspect-ratio, input-count, or file-format options. Live model metadata is authoritative.

### 7. Compile each H3 shot

Read [h3-mv-compiler.md](./references/h3-mv-compiler.md) before writing prompts. Build prompts from shot variables and the actual references; do not paste one universal prose template into every request.

Choose the H3 input mode by the shot's job:

- **Performance or lyric delivery:** use `reference_to_video` with the exact per-shot audio segment and an identity image. Bind mouth, jaw, breath, expression, and gesture to the locked vocal phrase. Include the exact lyric in its original language.
- **Narrative, atmosphere, visualizer, or beat shot:** use audio plus the relevant visual reference when the soundtrack should guide motion, editing energy, or semantics. Explicitly state that no character mouths the lyric unless that is desired.
- **Strict visual continuation or match transition:** use `image_to_video` with the approved outgoing or tail frame and no reference audio. The master Timeline audio still carries the music. Do not claim H3 can combine exact first/last-frame control with its multi-modal audio-reference mode when the live schema forbids it.
- **Pure prompt-led establishing shot:** use `text_to_video` only when identity and incoming-frame continuity are not important.

For complex multi-reference shots, compile the prompt into H3's full-reference sections: subject definitions, shot summary, retention analysis, detailed description, overall soundscape, and non-diegetic music. The detailed description should follow time order and name only the lyric, beat, gesture, camera, typography, or transition events that must land. Preserve useful creative room everywhere else.

Bind every still by stable ID and role. When the character reference uses a white-background face or turnaround, say that the blank background and sheet layout are isolation aids only and must not appear in the shot; take the environment exclusively from the named Location reference or shot description. Carry the approved Character, Look, Location, and Prop invariants into retention analysis, and name any intentional state change explicitly.

Use an English control wrapper for reliable instruction following, while preserving lyrics and intended visible words exactly in their original language. Do not request duplicate generated soundtrack; Timeline owns the master audio.

Record each resolved prompt, live model receipt, output path, and generation cost beside its shot in `MV-SCRIPT.md` → `## Shot Plan`; keep a compact cumulative total under `## Generation Log`.

### 8. Generate one shot and reveal it immediately

Work chronologically unless the user explicitly chooses another order.

For each audio-driven shot:

1. Extract its exact master-audio interval to MP3 or WAV. Verify it is non-empty and satisfies the live H3 audio duration and size limits.
2. Submit the compiled H3 request through `vidmuse-cli` with an explicit canonical generation type.
3. Download the returned clip to `clips/` and use `vidmuse-media` only to probe structure: file exists, container is readable, dimensions and frame rate are known, and source duration covers the intended Timeline span.
4. Do not perform aesthetic inspection or autonomous retries.
5. Load `vidmuse-timeline`. Append or replace the stable shot ID in the same `dsl.json`, keep the generated clip muted, and let the full master audio remain the sole program-audio source.
6. Validate the DSL. Reuse the loopback read-only Serve session opened for Style selection when it is still alive; otherwise start one after the first clip. Report the URL, and for every later clip update the same Timeline and tell the user which span appeared.
7. Stop for the user's reaction after each shot. If the user explicitly authorized continuous generation, continue, but still append and surface every returned shot immediately.

Apply `vidmuse-timeline`'s existing incremental-update protocol directly. Append one ordinary muted video item to the main track, preserve stable IDs and unknown fields, keep the full master audio as an independent sound, and validate after every update. Use `source`, `720p`, `1080p`, or `4k` for the Timeline project resolution; it is the delivery tier, not necessarily the raw H3 response height.

When the user rejects a shot, change the smallest failed dimension—performance, timing, camera, continuity, style, or typography—generate a new candidate, and replace the same stable shot ID. Preserve the rejected file and receipt unless the user asks to delete them.

### 9. Finalize only after sequence approval

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
- Does the finished sequence still express the approved `MV-SCRIPT.md` premise, section-level dramatic arc, and final resolution?
- Does the selected window have a readable visual arc rather than unrelated generated clips?
- Does the result preserve the approved Style traits and `MV-SCRIPT.md` visual invariant spine without copying the catalog sample's subject or layout?
- Are lead identity, silhouette, wardrobe logic, props, and scene geography consistent enough across cuts?
- Are every costume, hair/makeup, prop-state, location, and lighting change motivated and represented by the correct continuity ID rather than model drift?
- Are character identity references isolated from scenery, and did H3 avoid reproducing their white background or turnaround-sheet layout inside story shots?
- Does each transition preserve at least one continuity anchor while introducing a meaningful change?
- Are generated words and lyrics exact where correctness matters, or replaced by deterministic typography?
- Does motion remain smooth at every source seam after final cadence normalization?
- Is the master audio unchanged, continuous, and the only program-audio path?
- Did the user see each candidate in Timeline before Agent-led aesthetic QA or autonomous replacement?

## Boundaries

- Own complete music-led generative films, treatment-level MV scripting, visual-Style approval, production-design continuity, sequence design, image-reference direction, H3 shot compilation, review cadence, and final acceptance.
- Let `vidmuse-ip` own music-led films whose approved reusable IP Kit is the lead identity.
- Let `vidmuse-create` own non-music-led generated films, product films, explainers, and visual stories where music is support rather than the master spine.
- Let `vidmuse-media` own probe, audio extraction, transcription, alignment, music analysis, and transcript validation.
- Let `vidmuse-assets` own reference identity, sourcing, provenance, licensing, and reference selection.
- Let `vidmuse-design` own the visual thesis, live Style recommendation, and cross-scene design system; for MV it writes the `## Visual Direction` section inside `MV-SCRIPT.md`, while this owner presents choices and records approval state.
- Let `vidmuse-cli` own binary discovery, live model schemas, costs, balance, generation execution, and process syntax.
- Let `vidmuse-timeline` own DSL mutation, validation, Serve, review synchronization, and rendering.
- Use HyperFrames only for approved deterministic packaging such as corrected lyric typography, titles, or captions. Never route H3 media generation through HyperFrames-managed models.
