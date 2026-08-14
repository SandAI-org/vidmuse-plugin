---
name: vidmuse-mv
description: "Create complete generative AI music videos from uploaded music, audio, lyrics, performer references, a selected song window, or a song idea that first needs Suno music generation. Use for AI MV, music video, lyric MV, performance MV, song visualization, beat-synced video, 卡点 MV, 歌词动画, or a long music-led film assembled from Seedance 2.5 chapters. Own song-source and MV-coverage confirmation, master-audio lock, music analysis, timestamped lyrics, a treatment-level MV script, visual-style approval, production-design continuity, image-reference generation, Seedance 2.5 audio-reference planning and prompt compilation, cost approval, resilient async generation, incremental Timeline review, final normalization, and delivery. Use vidmuse-ip instead when an existing reusable IP Kit leads the film."
---

# VidMuse AI MV

Own one music-led generative film from song acquisition to delivery. The song may be uploaded or generated first through the VidMuse CLI. Once selected, treat it as the immutable timeline, give every Seedance 2.5 generation chapter a musical arc and every internal shot a useful visual change, and let the user see the film grow in Timeline as soon as each chapter returns.

Default an excerpt or climax up to the live model limit to one Seedance 2.5 multi-shot generation driven by the exact audio window. For a longer MV, divide the song into musically complete chapters—usually 20–30 seconds when the live schema allows—and generate one chapter at a time. VidMuse owns the complete sequence, continuity, master audio, review state, and final technical consistency.

## Non-negotiable rules

- Keep one local master-audio file as the timing spine. Never stretch it, regenerate it, or replace it as a side effect of visual work.
- Resolve the song source before locking video duration. When no playable song exists, offer two clear paths: upload one or generate one with a live Suno model through the VidMuse CLI.
- Default a new general-purpose MV to `16:9`. Use `9:16`, `1:1`, or another canvas only when the user or an explicitly named destination requires it.
- Confirm whether the MV covers the complete song or a representative excerpt. Never silently turn “make an MV” into an arbitrary 15-second test, and never invent an excerpt timestamp before the song has been acquired and analyzed.
- Analyze musical structure and resolve timestamped vocals before paid video generation.
- Keep one human-readable planning file for a new MV: `MV-SCRIPT.md`. Grow it from brief to treatment, visual direction, production bible, shot plan, and generation log instead of creating separate planning Markdown files.
- Approve its treatment from the lyrics and full music analysis before reducing the song to provider-sized shots. A story section is a musical or dramatic passage and may later contain several generated clips.
- Approve one visual direction and its production-design logic before generating continuity references. Do not let the first attractive image silently become the film's style.
- Prefer `seedance-2.5` for MV picture generation when the live catalog still exposes the required reference, duration, aspect-ratio, and resolution controls. A user-named model overrides this default; an unavailable or incompatible model requires a disclosed fallback rather than silently returning to the legacy short-clip workflow.
- Seedance audio-reference generation needs visual reference context. Bind the minimum stable identity, recurring prop, wardrobe, or scene references as ordered elements; audio alone is not enough for identity-led MV work.
- Prefer one musically complete Seedance chapter over many short provider clips. A representative hook or climax that fits the live limit should normally be one request with several ordered `[Shot N]` shots, actions, camera moves, transitions, and performance states.
- When the provider cannot accept the full audio window as a direct audio input, wrap the exact audio in a compliant pure-black reference video. Use its embedded audio as the timing, lyric, lip-sync, and edit spine while explicitly telling Seedance to ignore every black visual frame.
- Treat generated lyric typography as competing with lip-sync and performance attention. Keep model-native words few and high-value; when accurate spelling matters, preserve the better performance take and add deterministic typography only after review.
- Distinguish performance, narrative, atmosphere, typography, visualizer, and transition functions inside each clip. A subject may sing or speak only in the internal shots that call for it; do not force lip movement across the whole film.
- Do not seed a new generation clip from the previous clip's extracted tail frame by default. Bridge independent clips with beat-placed hard cuts, match action, screen direction, camera vector, color, light, shape, props, or foreground occlusion. Tail-frame continuation is a rare exception only for an explicitly requested uninterrupted take, because it often creates a frozen opening or cadence hitch at the seam.
- Generate chronologically, one chapter at a time by default. After a successful download and structural probe, append that chapter to the same Timeline before any Agent visual inspection.
- Do not watch a new candidate, extract frames, build a contact sheet, score it, or retry it autonomously before the user can review it. The user is the first visual reviewer.
- Treat workflow gates as internal readiness checks unless a real unresolved choice, paid call, or visual result needs the user. Do not convert every Character, Look, Location, Prop, prompt, or file into a separate confirmation. Honor the review cadence already recorded in `## Scope`.
- Keep visible lyrics exact. Generated lyric typography is a creative candidate; spelling-critical delivery text becomes a deterministic overlay after approval if Seedance omits or misspells it.
- Treat song generation and visual production as separate possible spend stages. Before each stage's first paid call, quote its live model, expected outputs, cost, balance, and relevant allowance; do not re-ask within an approved scope unless the estimate materially expands.

## Project artifacts

Use a stable project directory and preserve these artifacts when applicable:

| Artifact | Role |
| --- | --- |
| `transcript.json` | validated word-level vocal timing |
| `music-analysis.json` | beats, downbeats, phrases, sections, energy, and other model-returned music structure |
| `MV-SCRIPT.md` | the single planning contract: song source and generation brief/receipt, MV coverage, locked lyrics, song-driven treatment, visual direction and Style receipt, production bible, chronological shot plan, prompts, continuity state, and spend/generation log |
| `media/master-audio.mp3` | immutable program-audio spine |
| `media/segments/` | exact per-chapter Seedance reference-audio segments |
| `media/reference-videos/` | compliant audio-wrapper videos when direct audio cannot carry the complete chapter |
| `references/` | approved character, scene, object, wardrobe, and typography references |
| `clips/` | downloaded generated candidates and approved normalized shots |
| `dsl.json` | continuously updated Timeline review truth |
| `renders/` | verified review and delivery files |

For a new MV, do not create separate `BRIEF.md`, `FRAME.md`, or `STORYBOARD.md`. When resuming an older project that already has them, treat them as legacy inputs, merge their still-valid decisions into the matching `MV-SCRIPT.md` sections when that can be done safely, and do not create additional copies. Do not regenerate an approved upstream decision because a later stage is incomplete.

Grow `MV-SCRIPT.md` in place with only the sections the project needs, in this order: `## Scope`, `## Locked Lyrics`, `## Creative Treatment`, `## Visual Direction`, `## Production Bible`, `## Shot Plan`, and `## Generation Log`. Keep sections concise and update them rather than appending duplicate revisions.
Do not create aliases such as `TREATMENT.md`, `STYLE-BIBLE.md`, `CONTINUITY.md`, `SHOTLIST.md`, or `COSTS.md`; put that information in the matching section or an existing machine-readable artifact.

## Workflow

### 1. Lock the MV brief

Start with the decisions needed to obtain the song and establish the viewing format. Do not design a video duration around a song that does not exist yet.

If no playable audio was supplied, say directly that either path is supported:

1. the user uploads an existing MP3, WAV, M4A, or video containing the intended song; or
2. VidMuse generates an original song with a live Suno model first.

Ask one compact confirmation that covers the unresolved essentials: song source, complete-song MV versus a representative excerpt, and any required non-default destination. Default the canvas to `16:9` and state that default; do not ask the user to choose an aspect ratio unless their named platform or request conflicts with it. Do not infer complete versus excerpt unless the user explicitly delegates that decision.

A suitable first reply when all three are unresolved is: “可以，默认做 16:9。歌曲你想上传，还是让我用 Suno 生成？MV 是做整首，还是先做一个精华段看效果？如果先看效果，我会拿到歌曲并分析后再推荐最合适的一段，不先预设 15 秒。” Adapt it to fields already answered instead of repeating the whole prompt.

Record or confirm:

- song source: supplied file or Suno generation;
- MV coverage intent: complete song or representative excerpt;
- `16:9` aspect ratio by default, plus destination and intended delivery resolution when known;
- MV mode: performance, narrative, lyric, visualizer, or hybrid;
- visual world, emotional arc, desired realism or stylization, and references;
- whether the lead is a supplied performer, a newly created project-local character, an object, or no recurring subject;
- exact lyrics when the user has them, and whether visible lyric typography is desired;
- collaboration pace: one-shot approval, small batches, or user-authorized continuous generation.

If the user wants to see the effect first, record “representative excerpt” without guessing its duration or timestamp. After the song exists, analyze it and recommend the shortest musically complete passage that demonstrates the concept — usually a hook, chorus, instrumental turn, or the transition into one — with an exact span and reason. If the user delegates the choice, select that evidence-based span and report it before paid visual generation.

If Suno is selected, gather only the missing song decisions that materially affect the result: theme or story, lyric language, vocal or instrumental, genre/mood, vocal character when relevant, energy arc, tempo/groove, key instrumentation, intended musical duration when the live model supports it, and must-have or excluded elements. Do not demand a fully specified music brief when the user has delegated creative judgment.

Create a lean `MV-SCRIPT.md` skeleton and record these decisions and any pending fields under `## Scope`; do not create a second song-brief Markdown file and do not repeatedly ask for choices the user already answered or delegated.

An existing approved `ip-kits/<ip-id>/IP.md` keeps ownership in `vidmuse-ip`, even for a music-led episode. A performer or character created only for this MV remains project-local and belongs here.

**Human checkpoint when unresolved:** `MV-SCRIPT.md` exists and its `## Scope` records the song-source path, complete-song or excerpt intent, `16:9` or an explicit override, creative mode, identity source, review cadence, constraints, unresolved song decisions, and current spend-approval state. One compact answer or explicit delegation resolves this checkpoint.

### 2. Acquire the song, then lock master audio and vocal timing

Load `vidmuse-media` and `vidmuse-cli`.

For a supplied song, localize and probe it without changing speed or pitch. For Suno generation:

1. Query the live audio catalog and identify compatible `suno/` music models. Prefer the newest capable live entry — currently `suno/V5_5` when it remains available and supports the required controls — but let live metadata win over remembered names.
2. Use Custom Mode and build two distinct prompt surfaces. The Suno **Style (music)** direction is a coherent, prioritized musical description: dominant genre/subgenre, mood and energy arc, tempo/groove, instrumentation and arrangement, vocal character, and production texture. Write natural detailed direction when useful instead of an unranked tag pile or a named-artist imitation. This music field is separate from the VidMuse visual Style selected later in Serve.
3. Put song structure and singable lyrics in the lyric/prompt surface. Use clear section labels such as `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`, and `[Outro]`; keep section instructions sparse, lines performable, language deliberate, and the main hook memorable. Preserve user-supplied lyrics exactly unless revision was requested, and confirm the user is entitled to use third-party lyrics.
4. Put unwanted instruments, genres, vocal qualities, or production elements in the model's exclusion control when the live schema exposes one; do not pollute the positive Style direction with a long negative list. Use `vocalGender`, duration, Style Influence/`styleWeight`, or other controls only when the selected live schema exposes them. If `styleWeight` is available, treat the catalog's `0.6–0.8` guidance as a starting range, not a universal constant.
5. Show the user the proposed title, Suno music Style direction, lyrics/structure, important exclusions, live model, expected candidate count, live price, and balance before the paid song call. Approval for song generation covers only that song batch, not later image or video spend.
6. Generate through `text_to_music`, localize every returned candidate with the host Agent's native download capability, and load `vidmuse-media` to probe each file. Preserve the candidates and their receipt, then let the user choose the master song unless they explicitly delegated selection. Do not begin the MV treatment while the song choice is unresolved.

Record the song brief and proposed prompt under `## Scope`, exact chosen or supplied lyrics under `## Locked Lyrics`, and the model, resolved request fields, candidate paths, selection state, and song-generation cost under `## Generation Log`. Keep this inside `MV-SCRIPT.md`; do not create `SONG-BRIEF.md`, `SUNO-PROMPT.md`, or another planning document.

Once a song is selected, resolve the MV coverage:

- For a complete-song MV, use the whole chosen track.
- For a representative excerpt, analyze the complete chosen track first, recommend an exact musically complete span from its real sections and accents, and confirm it unless the user delegated selection. Never default to the first N seconds.

Create `media/master-audio.mp3` from the approved full track or exact approved window and treat its zero point as Timeline time `0`. This is the first point at which the video duration becomes locked.

Run `analyze-music` when rhythm or section structure will guide the edit. Preserve the complete result as `music-analysis.json`; do not reduce it to BPM alone.

Resolve vocals separately:

- If the user supplied the exact matching lyrics, preserve them verbatim under `## Locked Lyrics` in `MV-SCRIPT.md`, run `align-transcript` against those exact words and the master audio, and later copy the relevant words exactly into each clip's internal shot map.
- Otherwise run `transcribe` with `scribe-v2`, preserve its native word timings, and let the user correct uncertain words before any spelling-critical lip-sync or lyric shot.
- For instrumental music, skip ASR and record instrumental intervals explicitly.
- If the audio or locked lyrics change, regenerate the alignment. Never hand-edit word timestamps.

Record candidate visual cut anchors at phrase endings, breaths, downbeats, section changes, and meaningful accents, but do not decide provider-sized shots before the MV treatment exists. Later shot boundaries must not cut through a held syllable merely to obtain equal lengths.

**Internal readiness check:** one supplied or generated song is selected, complete-song or exact excerpt coverage is resolved, the master audio is non-empty and immutable, `music-analysis.json` exists when useful, and vocal sections have validated word timing. Pause only for an unresolved song choice or a materially uncertain lyric correction.

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
- likely coverage such as establishing, performance, action, detail, or aftermath without prematurely enumerating Seedance chapters.

One treatment section may become one Seedance chapter or share a chapter with an adjacent section, and one chapter may contain several internal shots. Several musical phrases may share one section when the scene and dramatic objective remain unchanged. Do not create one treatment section per fixed model duration, one request per beat, or a sequence of unrelated beauty shots. Favor cause and effect: establish the motif, complicate it through the middle, and resolve it by the end.

Treat production design as motivated rather than mandatory. A location, costume, hair/makeup look, or hero prop changes only when the lyrics, story, time, performance setup, or musical escalation benefits from it. Real MVs may return to one setup, alternate performance and narrative worlds, or change several looks; all are valid when the logic is explicit.

**Internal readiness check:** `MV-SCRIPT.md` has a readable `## Creative Treatment` with song-derived sections rather than provider chunks, enough character/world/plot/visual information to direct the film, and no premature shot-level prompt detail. Present it together with visual direction rather than asking for a separate treatment confirmation.

### 4. Approve the visual direction and Style

Load `vidmuse-design` and `vidmuse-cli`. Append a concise `## Visual Direction` to `MV-SCRIPT.md` from its treatment, lyrics, the music's texture and energy, supplied references, platform, aspect ratio, and desired realism. Define the invariant visual spine and the allowed differences between performance setups, narrative scenes, and wardrobe looks. Do not create `FRAME.md` for a new MV.

Use the live VidMuse Style catalog as a visual comparison and approval surface:

1. Fetch the complete `style list --scope all --view summary` catalog, including all pages.
2. After the bespoke design read exists, shortlist no more than three materially different candidates whose subject treatment, medium, palette, lighting, texture, and camera language fit this song. Inspect each with `style get <styleId> --view full`.
3. Recommend one candidate with a song-specific reason and explain the meaningful tradeoff of the alternatives. Do not paste a catalog `promptSample` as the film direction.
4. Use the current official CLI resolved by `vidmuse-cli`; install it when missing, target production explicitly, and confirm the required Serve/Style surface from live help. Load `vidmuse-timeline`, assemble or preserve a minimal valid `dsl.json` with the immutable master audio, validate it, and start one loopback read-only Serve session. Tell the user to open the top-right **Styles** palette, inspect the visual cards, and use **Copy for Agent** or copy the Style ID for the chosen direction. Do not render catalog `imageUrl` values or remote thumbnails in chat.
5. Keep the recommendation provisional until the user selects a Style. If the user explicitly delegates the choice, select the top recommendation and record that delegation instead of blocking.

Record the chosen Style's exact receipt under `MV-SCRIPT.md` → `## Visual Direction`: `id`, `name`, `scope`, `tags`, `imageUrl`, `description`, `analysis`, and `promptSample`, plus why it fits, which traits become invariants, and which sample-specific content must not be copied. A live VidMuse generation Style is distinct from an optional HyperFrames frame preset; neither selection silently activates the other.

If Serve cannot load the catalog, disclose the failure and keep the visual approval gate unresolved. Continue only when the user supplies an exact Style or explicitly delegates the choice; do not fall back to preview links, thumbnail galleries, or broken remote images in chat. Do not start paid image generation from an unapproved visual direction.

**Human checkpoint when not delegated:** present the treatment recommendation and visual Style together. `MV-SCRIPT.md` → `## Visual Direction` then names one selected generation look, its evidence and invariants, the user's selection or delegated-choice state, and the allowed scene/look variation.

### 5. Design the shot sequence and production continuity

Add `## Production Bible` and `## Shot Plan` to the same `MV-SCRIPT.md` before video generation. Each Seedance generation chapter records:

- parent `MV-SCRIPT.md` section and exact Timeline span on the master audio;
- live-supported Seedance request duration sufficient to cover that span, preferring a musically complete 20–30 second chapter over short fragments when possible;
- clip function mix: performance, narrative, atmosphere, lyric typography, visualizer, or transition;
- story change and visual payoff;
- music/lyric anchors that must land;
- an internal shot map: ordered `[Shot N]` entries naming composition, visible action or state change, camera movement, music/lyric cue, and cut logic. For an audio-referenced clip, cues are semantic and timestamps stay out of the generation prompt; for a clip without reference audio, exact clip-relative cut times may be planned when needed;
- character ID, location ID, look ID, prop IDs, palette, light, lens, and movement state entering and leaving the clip;
- reference assets and their single explicit roles;
- continuity handoff to the next clip without relying on an extracted tail frame;
- ordered element roles, including any black audio-wrapper reference video;
- what Seedance may invent freely.

Maintain one compact continuity bible with stable identifiers:

- **Character ID:** invariant face, hair identity, body proportions, age read, and silhouette.
- **Look ID:** one approved wardrobe + hair/makeup + accessory combination. Reusing the ID means no unplanned change; a motivated change creates a new ID and reference.
- **Location ID:** persistent geography, architecture, time-of-day/light logic, palette, and weather state. Returning to the ID restores those invariants.
- **Prop ID:** recognizable shape, material, color, wear, ownership, and state when the object recurs or changes.

Keep identity stable while allowing intentional production changes. A costume, prop, location, or lighting shift is a named story event, never accidental model drift. Repeat only the invariants that matter; allow composition, metaphor, camera, and performance to change with the music.

Use match action, screen direction, light, color, shape, object state, camera vector, foreground occlusion, or sound accents to bridge adjacent clips. Inside a clip, let a cut introduce genuinely new information—viewpoint, space, subject, state, or time; use camera motion when only distance or angle changes. Do not force a cut on every detected beat: use strong accents for state changes and cuts, lighter beats for gestures and internal motion, and phrase boundaries for larger scene changes.

**Internal readiness check:** every generation clip traces to one treatment section, has an exact master-audio span, an energy-appropriate internal shot map, beat or lyric anchors, explicit continuity IDs and in/out state, and an intended degree of model freedom. Every later internal shot has a real reason to exist. Audio-referenced prompts use shot order and musical cues rather than redundant timestamps; any intentionally timed non-audio cuts are valid and increasing. Do not ask the user to approve every technical row unless that review cadence was requested.

### 6. Reuse or fill continuity references, then approve one batch

Use supplied references first, including assets uploaded after the brief. Give each one an explicit role such as character identity, wardrobe/look, location, prop, composition, or typography, then mark every planned continuity ID as one of:

- `use supplied`: the uploaded asset is already sufficient;
- `derive only if needed`: a crop, white-background isolation, or targeted change-only edit would materially improve the shots that consume it;
- `generate missing`: the required continuity evidence does not exist;
- `no separate reference`: prose or another approved asset is sufficient for the actual shots.

A stable Character, Look, Location, or Prop ID is a continuity label, not a demand for another generated file. Do not ask the user to re-approve an asset they just supplied unless its intended role is ambiguous or a proposed transformation would change it. Do not pass every reference into every image or video shot.

Load `vidmuse-assets` to decide the minimum project-local reference set. Read [image-reference-compiler.md](./references/image-reference-compiler.md) before compiling paid image prompts. Query the live image catalog, schema, price, and input limits; for production identity, wardrobe, location, and scene references, prefer the strongest compatible live image model rather than an older default. `gpt-image-2` and Nano Banana Pro / `gemini-3-pro-image` are current examples to check, not aliases to invent or proof that the account exposes them. Choose from live capabilities, identity/edit fidelity, multi-reference support, latency, price, and the actual reference job; if a preferred model is unavailable, disclose the fallback before spending.

When a recurring lead lacks adequate supplied coverage, generate exactly one primary identity-and-look reference rather than separate portrait and turnaround approvals:

- one native `16:9` landscape canvas on a pure white, edge-to-edge background with even neutral light;
- one large face-and-shoulders close-up on the left, with neutral expression, unobstructed face, and natural identity detail;
- exactly three full-body views on the right in front, clean side profile, and back order, aligned to one baseline at equal scale and in the same neutral pose, head-to-toe with both feet visible;
- the same face, hair, age read, body proportions, rendering Style, and approved primary `Look ID` across all four depictions. Wearable signature accessories may stay with that Look; a separate story prop does not belong on the sheet;
- generous white gutters and no tiles, borders, labels, captions, dividers, fake UI, scenery, logos, watermarks, extra expressions, extra limbs, or duplicate views.

Generate the sheet natively in one image, not as several paid renders followed by a collage. Prefer a live model that can produce the requested `16:9` sheet; if the preferred model cannot, disclose the limitation and choose a compatible live model before spending. Its single approval covers face identity, body views, the primary wardrobe, hair/makeup, and wearable accessories shown on it.

Do not force supplied character or styling images into this layout when they already cover the intended shots. For a supplied real performer, preserve exact likeness and confirm authorized use. If a distracting background creates a real leakage risk, make one change-only isolation edit while preserving face, skin tone, hair, body proportions, wardrobe, and identity; otherwise use the upload as-is.

The primary generated sheet may carry the default MV Look. Create an additional Look card only for a materially different costume/hair/makeup setup that appears in planned shots and is not already supplied. Likewise, create a Location card only when recurring geography must persist, and a Prop card only for a recurring or state-changing hero object whose exact design matters. Incidental props, one-off scenery, and optional design ideas must not create extra files or checkpoints.

Before the first paid reference or video call:

1. Query the live `seedance-2.5` and chosen image-model catalog entries and supported request fields.
2. Query both live prices and the account balance.
3. Estimate all planned image references and video seconds, plus one user-visible retry allowance.
4. State which supplied assets will be reused, which true gaps will be generated, the image models, reference count, video plan, expected deliverables, and total estimate; obtain one spend approval for the batch.

After spend approval, generate only the missing set. Present all newly generated continuity references together, alongside a compact reminder of the supplied assets being reused, as one visual checkpoint before Seedance. Do not pause separately for the face, the three views, the primary Look, each prop, or each location. If the user delegated continuity acceptance, proceed without another stop; if they request a correction, make one targeted change while preserving the rest. Reopen the checkpoint only when a later request changes a locked identity or production-design invariant.

Do not rely on remembered resolution, duration, aspect-ratio, input-count, or file-format options. Live model metadata is authoritative.

### 7. Compile each Seedance 2.5 multi-shot chapter

Read [seedance-mv-sop.md](./references/seedance-mv-sop.md) completely before preparing media or writing prompts. Build prompts from chapter variables, the internal shot map, and the actual references; do not paste one universal prose template into every request.

Choose the Seedance input mode by the chapter's job:

- **Performance or lyric delivery:** use `reference_to_video` with ordered identity/prop elements and the exact chapter audio, directly when accepted or inside a compliant black reference video. Bind mouth, jaw, breath, expression, and gesture to the locked vocal phrases. Include each internal shot's exact lyric in its original language.
- **Narrative, atmosphere, visualizer, or beat-led clip:** use audio plus the relevant visual reference when the soundtrack should guide motion, editing energy, or semantics. Explicitly state that no character mouths the lyric unless that is desired.
- **Designed-keyframe clip:** use `image_to_video` or another live-supported keyframe mode only when an independently designed opening or ending composition matters more than audio response. Do not automatically extract the previous generated clip's tail frame as this input. The master Timeline audio still carries the music.
- **Pure prompt-led establishing clip:** use `text_to_video` only when identity and incoming-frame continuity are not important.

One Seedance request may contain several shots. Use an English control wrapper, bind each ordered `@ElementN` to one explicit role, and write `[Shot 1]`, `[Shot 2]`, and later shots in playback order. For audio-referenced chapters, describe cuts against audible phrases, breaths, drops, snares, bass hits, lyric stresses, and section lifts rather than redundant timestamps. Use explicit chapter-relative times only for text/keyframe requests without audio or when a fixed event time is genuinely required.

Make motion concrete rather than decorating the prompt with words like “dynamic” or “cinematic.” Within each internal shot, specify the current composition, subject/environment action, visible state change, and camera motion as type plus meaningful amplitude and speed. Across the clip, vary scale, angle, depth, staging, graphic layout, or environment when the music earns it. Use hard cuts, jump cuts, match cuts, whip-pan cuts, flash cuts, or motivated graphic transitions for energetic passages; retain a continuous evolving take when it better serves the phrase.

Bind every still or reference video by stable ID and one role. When the character reference is a white-background combined sheet or another isolated upload, say that the blank background and reference layout are identity aids only and must not appear in the chapter; take the environment exclusively from the named Location reference or internal shot description. When an element is a pure-black audio wrapper, say that its embedded audio is authoritative and its featureless frames must be ignored completely.

Use an English control wrapper for reliable instruction following, while preserving lyrics and intended visible words exactly in their original language. Do not request duplicate generated soundtrack; Timeline owns the master audio.

Record each resolved multi-shot prompt, internal cut map, wrapper metadata when used, live model receipt, task ID, output path, and generation cost beside its chapter in `MV-SCRIPT.md` → `## Shot Plan`; keep a compact cumulative total under `## Generation Log`.

### 8. Generate one chapter and reveal it immediately

Work chronologically unless the user explicitly chooses another order.

For each audio-driven chapter:

1. Extract its exact master-audio interval to MP3 or WAV. Verify it is non-empty and matches the planned chapter span.
2. If direct audio cannot carry the complete interval, create and probe the pure-black 1280×720 reference video defined by the Seedance SOP, then bind it as an ordered video element.
3. Submit the compiled `seedance-2.5` `reference_to_video` request asynchronously through `vidmuse-cli`; save the task ID before polling.
4. Poll the same task rather than resubmitting on a long-running or `did not complete within 1200 seconds` response. Use the SOP's credit-and-asset checks to distinguish pending work from a refunded terminal failure.
5. Download the returned chapter to `clips/` and use `vidmuse-media` only to probe structure: file exists, container is readable, dimensions and frame rate are known, and source duration covers the intended Timeline span.
6. Do not perform aesthetic inspection or autonomous retries.
7. Load `vidmuse-timeline`. Append or replace the stable chapter ID in the same `dsl.json`, keep the generated video muted, and let the full master audio remain the sole program-audio source.
8. Validate the DSL. Reuse the loopback read-only Serve session opened for Style selection when it is still alive; otherwise start one after the first chapter. Report the URL, and for every later chapter update the same Timeline and tell the user which span appeared.
9. Surface every returned chapter immediately, but pause only at the review cadence recorded in `## Scope`. For a normal efficient run, recommend reviewing the first continuity-risky chapter and then continue chronologically; use one-by-one review or uninterrupted generation when the user chose it. Do not silently revert to a stop after every chapter.

Apply `vidmuse-timeline`'s existing incremental-update protocol directly. Append one ordinary muted video item to the main track, preserve stable IDs and unknown fields, keep the full master audio as an independent sound, and validate after every update. Use `source`, `720p`, `1080p`, or `4k` for the Timeline project resolution; it is the delivery tier, not necessarily the raw Seedance response height.

When the user rejects a clip, change the smallest failed dimension—internal cut map, performance, timing, camera, continuity, style, or typography—generate a new candidate, and replace the same stable clip ID. Preserve the rejected file and receipt unless the user asks to delete them.

### 9. Finalize only after sequence approval

Once all clips are approved:

- choose one master canvas and frame rate from the brief or the first approved Seedance chapter;
- normalize approved sources to that cadence and canvas, preserving duration and motion cadence;
- trim provider surplus to exact musical boundaries;
- regenerate a short source rather than freezing its final frame to fill missing motion;
- mute all clip-native audio and keep only the unchanged master audio;
- add approved deterministic subtitles or lyric typography only when needed for exact spelling or accessibility;
- run final visual, continuity, lip-sync, beat-sync, seam, audio, and technical QA;
- render through `vidmuse-timeline` and `vidmuse-cli` and verify duration, dimensions, frame rate, and audio.

Return the final file, project directory, Timeline state, actual spend, and known limitations.

## Final QA

Reject final delivery when any answer is no:

- Do mouth shapes, breath, face, and gesture plausibly follow the locked phrase in performance shots?
- Do important motion changes land on justified beats, accents, words, or section changes without cutting mechanically on every beat?
- Does each Seedance chapter use an energy-appropriate number of internal shots, and does every cut reveal new visual information rather than merely changing crop?
- Does every internal shot contain observable subject, environment, camera, or graphic motion instead of a static reference image with vague motion adjectives?
- Does the finished sequence still express the approved `MV-SCRIPT.md` premise, section-level dramatic arc, and final resolution?
- Does the selected window have a readable visual arc rather than unrelated generated clips?
- Does the result preserve the approved Style traits and `MV-SCRIPT.md` visual invariant spine without copying the catalog sample's subject or layout?
- Are lead identity, silhouette, wardrobe logic, props, and scene geography consistent enough across cuts?
- Are every costume, hair/makeup, prop-state, location, and lighting change motivated and represented by the correct continuity ID rather than model drift?
- Are character identity references isolated from scenery, and did Seedance avoid reproducing their white background, turnaround-sheet layout, or black audio-wrapper frames inside story shots?
- Does each internal or cross-clip transition preserve at least one continuity anchor while introducing a meaningful change?
- Are generated words and lyrics exact where correctness matters, or replaced by deterministic typography?
- Does every source seam feel intentional, without a frozen first frame, cadence hitch, accidental motion reset, or tail-frame feedback artifact?
- Is the master audio unchanged, continuous, and the only program-audio path?
- Did the user see each candidate in Timeline before Agent-led aesthetic QA or autonomous replacement?

## Boundaries

- Own complete music-led generative films, treatment-level MV scripting, visual-Style approval, production-design continuity, sequence design, image-reference direction, Seedance 2.5 multi-shot chapter compilation, review cadence, and final acceptance.
- Let `vidmuse-ip` own music-led films whose approved reusable IP Kit is the lead identity.
- Let `vidmuse-create` own non-music-led generated films, product films, explainers, and visual stories where music is support rather than the master spine.
- Let `vidmuse-media` own probe, audio extraction, transcription, alignment, music analysis, and transcript validation.
- Let `vidmuse-assets` own reference identity, sourcing, provenance, licensing, and reference selection.
- Let `vidmuse-design` own the visual thesis, live Style recommendation, and cross-scene design system; for MV it writes the `## Visual Direction` section inside `MV-SCRIPT.md`, while this owner presents choices and records approval state.
- Let `vidmuse-cli` own binary discovery, live model schemas, costs, balance, generation execution, and process syntax.
- Let `vidmuse-timeline` own DSL mutation, validation, Serve, review synchronization, and rendering.
- Use HyperFrames only for approved deterministic packaging such as corrected lyric typography, titles, or captions. Never route Seedance media generation through HyperFrames-managed models.
