---
name: vidmuse-create
description: Create a complete designed VidMuse film when existing speaking footage is not the primary plate. Use for product launches, website films, faceless explainers, script-and-voice films, generated-media films, and visual stories assembled from an idea, text, URL, audio, screenshots, or other non-speaking sources. Own the project from confirmed brief through evidence-led capture, story, design, HyperFrames composition, VidMuse Serve review, and final render. Use vidmuse-recut when a talking-head, interview, or podcast recording remains the main picture.
---

# VidMuse Create

Own one complete film from intent to delivery. Work like a director: decide what the viewer should understand, collect the evidence that makes it believable, and make every visual and motion choice answer that evidence.

Do not begin from a template, an effect list, or a pile of captured assets.

## Preserve the official project layers

Use the official HyperFrames artifacts instead of inventing a parallel film contract:

| artifact | role |
| --- | --- |
| `BRIEF.md` | confirmed intent, audience, destination, format, duration, source, constraints |
| `STORYBOARD.md` | ordered beats, evidence, selected media, scene direction, duration, status |
| `SCRIPT.md` | locked narration when narration exists |
| `transcript.json` | validated word-level narration timing; the anchor source for every cue |
| `FRAME.md` | VidMuse visual system and source-to-system bridge |
| `capture/` | official HyperFrames capture output and canonical inventory |
| `compositions/` or `public/index.html` | validated HyperFrames implementation |
| `dsl.json` | VidMuse Timeline assembly and review truth |
| `renders/` | verified review and delivery files |

Do not create `film-plan.json`, a private storyboard schema, or private Timeline fields. Put VidMuse-specific planning in the free-form narrative of each official `STORYBOARD.md` frame; the official parser preserves it.

Resume from existing artifacts. Never repeat the brief or regenerate an approved upstream file merely because a later stage is incomplete. When `BRIEF.md` already records duration, aspect ratio, and narration intent, treat them as settled and do not re-ask; confirm them again only when the user's new request changes one of them, and say plainly what the change invalidates before acting on it.

## Choose the creation mode

Keep one owner and adapt the evidence source:

- **Product:** a product, website, app, feature, or company is being shown. Real capture is the primary evidence.
- **Explainer:** an idea or body of text is being explained without a product surface. Typography, diagrams, data, supplied sources, and explicitly approved generated media carry the argument.
- **Custom:** supplied images, recordings, audio, documents, or mixed media determine the film form.

The mode changes sourcing and proof, not the artifact contract.

## Workflow

Pass each gate in order. In a resumed project, start at the first missing or invalid gate.

### 1. Lock the brief

Read the request, existing project, supplied material, and `BRIEF.md`. Confirm or safely infer:

- one viewer promise;
- audience and destination;
- aspect ratio and approximate duration;
- language and copy density;
- creation mode and authoritative sources;
- narration/audio intent: supplied, generated through an implemented VidMuse capability, or silent;
- references, brand constraints, protected material, and things to avoid;
- collaboration mode and review expectation.

**Three of these are irreversible and must be confirmed with the user, not inferred.** They govern every later decision and cannot be changed without rebuilding the film. Get them explicitly, in one short exchange, before any capture, script, or paid call:

| parameter | why it is irreversible |
| --- | --- |
| **duration** | beat count, argument density, and script length all derive from it; a 30-second cut is not a 60-second film trimmed |
| **aspect ratio** | capture headroom, crop, focal placement, and type scale are chosen for one frame shape; re-framing invalidates selected evidence |
| **narration: TTS / supplied / silent** | decides whether word-level alignment exists at all, and therefore how every cue in step 7 is anchored |

Present the options with a recommendation and your reasoning, then wait. Do not infer these three from the request's genre, and do not proceed on a default because the user did not specify them — an unstated aspect ratio is missing information, not permission to assume 16:9. When the user asks for TTS, also confirm the language and let them accept a cast voice or choose another; an uncast voice is a casting decision made by omission.

Two things make this cheap to ask: it is one exchange rather than a per-stage interrogation, and it happens before anything has been captured, written, or paid for. If the user declines to choose or says "you decide," record the assumption you adopted in `BRIEF.md` and continue — an explicit deferral is an answer.

Everything else in the list above may be safely inferred. Ask one further short question only when an unresolved choice would materially change the deliverable. Record the settled intent in `BRIEF.md`. Default design mode is bespoke; an official HyperFrames preset remains inactive unless the user asks to browse or selects one.

Initialize through `hyperframes-cli` only when the project does not already exist. Do not start HyperFrames Studio, preview, or timeline UI.

**Gate:** `BRIEF.md` exists, one viewer promise is unambiguous, and duration, aspect ratio, and narration intent are each recorded as confirmed by the user or as an explicitly noted assumption after a deferral.

### 2. Establish the story need before collecting assets

Extract the story truth:

- what the viewer already believes or struggles with;
- what question opens the film;
- what changes in their understanding;
- what claims require proof;
- what outcome or action closes the film.

Choose one coherent arc. Build around the promise rather than page order or a feature list. Let the promise land early, then let features act as evidence. A product demonstration is normally a sequence—context, action, response, result—not one isolated screenshot.

For each provisional beat write an internal sentence:

> Before this beat the viewer understands **A**. After it they should understand **B**. The evidence that can honestly cause that change is **E**.

Do not design layouts or select effects yet.

**Gate:** every provisional beat has one viewer change and a plausible form of evidence.

### 3. Capture and select evidence

For a URL, load `hyperframes-cli`, read its capture contract, and run official HyperFrames Capture into the project `capture/` directory. Treat a failed, blocked, empty, or untrustworthy capture as a hard stop; do not manufacture a synthetic version of the product. A supplied screenshot or no-capture brief is a different authorized source, not an automatic fallback.

For supplied material, inventory the real files and inspect representative pixels or frames. For an explainer, inventory the factual sources, data, diagrams, and media that can support each claim.

Then load `vidmuse-assets`. Give it the provisional beats and canonical capture inventory. Require an editorial evidence pass:

- map each claim to the thing that would prove it;
- prefer a state sequence over an attractive isolated image;
- shortlist from the canonical inventory before opening raw files;
- inspect shortlisted pixels at the target aspect ratio;
- identify missing states and request only the targeted supplementary captures needed;
- select one focal asset, one supporting asset when useful, and one fallback for each beat;
- record why each selection exists and any rights, privacy, resolution, or crop limitation.

Use real product capture as source truth. For a scroll, use a trustworthy full-page plate or overlapping real captures. For a push-in, capture the target region with sufficient resolution instead of magnifying a 1× screenshot. Rebuild only the element that must move independently; do not recreate the whole product unless the user explicitly requests a stylized interpretation.

Write final selections and capture sequences into each frame's narrative in `STORYBOARD.md`. Use `asset-plan.json` only when unresolved sourcing, identity, or licensing decisions genuinely need a separate receipt.

**Gate:** every factual claim has selected evidence or is rewritten/removed; no beat depends on a decorative placeholder.

### 4. Lock `STORYBOARD.md` and `SCRIPT.md`

Split the film into **arguments**, not sentences. One argument is one beat. A change of idea or rhetorical function starts a new beat; a new sentence does not. A beat that runs long is still one beat, and it earns its length by showing several changes inside it rather than by holding one picture.

Use the official Markdown storyboard format. Keep official metadata such as `scene`, `duration`, `transition_in`, `status`, `voiceover`, and `src` compatible. In each frame's narrative record only the directing information that downstream skills need:

```markdown
Viewer change: A → B
Claim and proof: what is said → what visibly proves it
Capture sequence: establish → action → response → result
Selected media: focal / supporting / fallback
Semantic events: the ordered changes this beat must show, each named with the phrase, action, or source event that causes it
Visual job and intensity: orient, explain, compare, prove, resolve / quiet, signal, support, hero
Continuity: object, direction, sound, phrase, or state carried into the next beat
```

Omit entries that do not apply. Do not turn this into a rigid custom schema.

`Semantic events` is the beat's defense against a slide deck, so write it for every beat. Any beat longer than roughly four seconds needs at least two distinct events — an entrance and its own resolution are one event, not two. A silent film is held to the same density; only its anchors differ, since they come from actions, reading load, and music rather than word onsets. A beat with one event must be short, or the stillness must be a named choice recorded with its reason: a held result being read, a deliberate rest after density, or a payoff that must not be interrupted.

Reject and rework the beat list when:

- beats are one-to-one with sentences;
- a beat is one spoken passage over one unchanging picture with no named reason;
- every beat carries the same treatment at the same intensity;
- a beat's only event is its own entrance.

Do not assign times here. For a narrated film, beat spans are measured in step 5 and each event is bound to an exact word onset in step 7. Naming the events before the times exist is what keeps timing a precision rail rather than the director.

Write `SCRIPT.md` only when narration exists. Make spoken phrases conversational, cueable, and shaped by the story rather than describing every visible detail. Leave room for the image to communicate. Do not present an unsupported claim more confidently than its evidence.

Review the story as a proposal before expensive media generation or composition work when the run is collaborative. In autonomous work, post the same concise plan as a heads-up and continue.

**Gate:** the story advances one promise, every beat has one job, and narration and visuals complement rather than duplicate each other.

### 5. Resolve audio and timing

Load `vidmuse-media` for only the operations it actually implements, and `vidmuse-cli` whenever the binary must run. Never route transcription, TTS, music, SFX, image generation, or video generation through HyperFrames-managed models or downloaded local models.

Narration intent, language, and voice were settled in step 1 — execute that decision rather than reopening it. Before the first paid call of a run, state the model and its live unit price so the spend is knowingly authorized, and lock the script as plain text first: it is the cheapest gate in the pipeline, and a wrong script wastes the synthesis, the alignment, and every duration derived from them.

Also ask `vidmuse-cli` for the credit balance before that first paid call, and compare it against the run's estimated generation spend. When the balance is short, do not refuse the film and do not quietly shrink it: propose a version the balance can pay for, say what the user will hold at the end, name the shortfall for the rest, and give the top-up link once — `https://vidmuse.ai/en/pricing`. Never begin a batch the balance cannot finish; a half-paid film is worse than a smaller one. See `vidmuse-vox` for the fuller budget protocol when a run is heavy on generated media.

**Every narrated film gets word-level timing. There is no exception for narration this workflow generated itself.** Request `transcribe-and-align` from `vidmuse-media` and require the validated flat `transcript.json` before any beat receives a duration:

- For supplied speech, the words are not known in advance: run the full ASR → correction → ATA chain.
- For narration synthesized from a locked script, that script is the exact text, so `vidmuse-media` skips ASR and its correction pass and begins at alignment. Alignment itself is still mandatory. A measured total duration from `ffprobe` is not word timing and never substitutes for it.
- Regenerated narration invalidates the alignment. When the script or voice changes, re-run TTS and alignment; a stale `transcript.json` is a defect. Never hand-edit a word timestamp.
- For generated narration or other media, use only a live VidMuse capability whose model and inputs have been explicitly resolved by the appropriate capability skill.
- If a required operation is not implemented or available, report the precise missing capability and stop that branch; do not silently change provider or invent an artifact.
- For a silent film, derive timing from visible actions, reading load, music beats when supplied, and the story arc. Record the per-beat spans explicitly, since there is no transcript to measure them against.

Then read each beat's `script_span` — the start and end of its argument — from the aligned word timings, and set the storyboard `duration` from that measured span. Do not derive a beat's length by dividing total narration duration across beats, and do not plan a fixed length per beat: spans of 6.5 / 15.3 / 9.5 seconds become beats of about 7 / 15 / 10 seconds, not three equal thirds. Update storyboard durations only from verified media or deliberate silent timing. Preserve word-level timing separately from subtitle grouping.

**Gate:** a narrated film has a validated `transcript.json`, every beat's duration comes from its measured `script_span`, and the intended program-audio path is clear. Without word timing, stop here — steps 7 and 9 cannot bind or verify anything.

### 6. Direct the visual system

Load `vidmuse-design` after the evidence selection is stable. Require it to inspect actual shortlisted captures or source frames and write `FRAME.md` from the film's content, creator, audience, platform, product, and visible materials.

The direction must include:

- a one-sentence design read, thesis, signature, and restraint;
- at least three observed source facts with their exact design consequences;
- one invariant spine and beat-dependent adaptive expression;
- a crisp/softened/dissolved edge spectrum rather than one universal hard card style;
- typography, palette, space, captions, media treatment, and motion temperament;
- quiet, signal, support, and hero states;
- one content-specific human trace;
- an explicit rejection of foreign template language and gratuitous decoration.

Keep official presets optional. Use the official HyperFrames Registry as a capability vocabulary, not as the art director. Select a block or component only after naming the beat's communicative job.

**Gate:** the visual system could not be pasted unchanged onto an unrelated film and every major treatment is traceable to content or source evidence.

### 7. Choreograph causality and human time

Load `vidmuse-motion` after narration or deliberate silent timing exists. For each support or hero intervention, name the viewer-state change, exact cue, relationship verb, spatial strategy, continuity anchor, and full lifecycle.

Build motion as a cue chain:

`prepare → trigger → respond → develop → hold → resolve`

Bind every semantic event named in step 4 to an exact anchor: the word onset from `transcript.json`, or the action, cursor event, result, gesture, source event, or musical event that causes it. Record the anchor time beside its event. An event with no anchor is not yet directed — either find its cause or remove it from the beat. Do not reveal all card contents at the card's start, and do not distribute reveals evenly to fill a duration. Preserve reading and recognition time after a result lands.

Treat full-frame reframing and source-camera transforms as expensive attention transfers. Keep them rare and motivated. When an explanation needs sustained parallel attention, prefer one stable picture-in-picture, split, or stack relationship to repeated zooming. Let cuts, fades, and stillness carry ordinary transitions; reserve distinctive transitions for genuine changes in argument, time, place, or state.

This restraint governs whole-frame camera work only. It is not a budget on the semantic events inside the frame, and it never justifies a static picture under a spoken passage. A beat where the frame holds still while an anchored reveal, state change, cursor action, or comparison happens within it is the intended default — not a compromise.

In Product mode, the picture is real interface, so the events are usually interface events. Load these `hyperframes-animation` rules by name rather than rediscovering them per run, and select by the beat's job:

| beat job | rule |
| --- | --- |
| traverse a page or long surface as the argument | `3d-page-scroll` |
| follow a pointer to a named target | `camera-cursor-tracking`, `context-sensitive-cursor` |
| show an action landing and its response | `cursor-click-ripple`, `physics-press-reaction`, `control-target-sync` |
| move attention to a region of the real capture | `coordinate-target-zoom`, `multi-phase-camera` |
| advance through states, results, or list items | `dynamic-content-sequencing`, `discrete-text-sequence` |
| transfer focus between competing on-screen information | `depth-of-field-blur`, `anchored-layout-expand` |

Query the live catalog for anything outside this set. Do not treat the table as the film's motion reason: the beat's named event chooses the rule, never the reverse.

Create human presence through observed behavior, causal response, selective detail, sound continuity, authored asymmetry, and breathing room. Do not fake it with random grain, wobble, bounce, cursor motion, or decorative micro-labels.

**Gate:** a viewer can tell why each major motion begins, follow information in spoken order, and return to a stable attention state afterward.

### 8. Build with official HyperFrames

Load `hyperframes-registry` for discovery, `hyperframes-core` for the composition contract, and `hyperframes-animation` for seek-safe implementation. Query the live catalog; do not rely on a memorized component list.

- Prefer a close official item when it expresses the correct semantic job.
- Remove demo content and adapt the item to `FRAME.md` without breaking its contract.
- Use custom HTML/SVG/CSS/GSAP when no official item fits; do not distort a component beyond recognition merely to reuse it.
- Keep one paused master timeline registered on `window.__timelines`.
- Keep render-time media local and deterministic.
- Build one complete host document for Timeline. Never point Timeline directly at a raw component or Registry template.

Build the film frame by frame, but review the assembled rhythm as one piece. A frame can be attractive and still damage the film.

**Gate:** every storyboard frame has a valid implementation, one immediate focal point, sufficient reading time, and no demo residue.

### 9. Validate and open the VidMuse review surface

Run the pinned HyperFrames gates through `hyperframes-cli`:

1. iterate with `lint` while authoring;
2. run final `check`;
3. capture snapshots at frame holds, semantic cue peaks, and both sides of important seams;
4. inspect the contact sheet at the final aspect ratio.

These are static checks, and a slide deck passes all of them: one unchanging screenshot is a flawless snapshot and a coherent contact sheet. So also run the animation map, which is the only mechanical evidence of whether the film moves:

```bash
node skills/hyperframes-animation/scripts/animation-map.mjs <composition-dir> \
  --out <composition-dir>/.hyperframes/anim-map
```

`--out` names a directory; the report is written to `animation-map.json` inside it. It buckets active tweens across the timeline and reports every stretch of at least one second with no animation at all. Account for each reported dead zone in one of two ways: name the beat's deliberate stillness and its reason — a result being read, a rest after density, an uninterrupted payoff — or treat it as a missing entrance and fix it. An unjustified dead zone is the PPT failure, and it is a blocking defect, not a warning. This applies to a silent film too: stillness under music needs the same named reason as stillness under speech. Cross-check the map against the beats: every semantic event named in step 4 should appear near its anchor time, and an event present in the storyboard but absent from the map was never implemented.

Then load `vidmuse-timeline` to assemble the smallest valid `dsl.json`, validate it, and start `vidmuse serve` on loopback in read-only mode. This first playable assembly is the mandatory Create perception checkpoint. Report the actual URL while the process is alive. Do not start HyperFrames Studio or its timeline UI.

Review with sound at normal speed, silently, and by scrubbing cue boundaries. Re-read any edited DSL or HTML after an explicitly editable Serve session and validate again.

**Gate:** HyperFrames checks pass, every animation-map dead zone is either justified or fixed, each named semantic event appears at its anchor, the DSL validates, Serve is alive, and representative frames and full-speed rhythm have been inspected.

### 10. Render and deliver

Render only after the required review state. Use `vidmuse-timeline` and `vidmuse-cli` for the exact request. Verify the output path, nonzero size, container, duration, dimensions, frame rate, and audio intent.

Return the final file, project directory, review state, and any known limitation. Preserve all source and provider receipts.

## Capture editorial doctrine

Treat capture as evidence collection, not a screenshot harvest.

- Capture **context → action → response → result** when change is the claim.
- Prefer authentic behavior to polished marketing illustration.
- Preserve enough surrounding interface for orientation, then crop only as far as the target remains legible.
- Keep a stable visual anchor between adjacent states so motion can preserve identity.
- Capture useful headroom for the intended output ratio and any justified push-in.
- Record state, viewport, source, time, and intended beat; avoid inconsistent themes, versions, accounts, and data.
- Reject repeated homepage heroes, tiny icons, generic stock, private data, unusable loading states, unreadable full pages, and assets that add no new information.

The strongest capture is not always the prettiest frame. It is the frame or sequence that makes the spoken claim easiest to believe.

## Film quality gate

Reject or revise the film when any answer is no:

- Does the opening deliver the promised subject quickly rather than begin with generic brand description?
- Does every factual claim have visible proof, or is it honestly framed as an idea?
- Does each scene contain one primary focal point?
- Does the film alternate concentration and recovery instead of maintaining constant density?
- Are real product actions shown as causal state changes rather than isolated screenshots?
- Does B-roll add information, emotion, or continuity rather than conceal an empty edit?
- Do graphics respond to words, actions, or source events rather than arbitrary timestamps?
- Does every major intervention have an entrance, development, readable hold, resolution, and destination?
- Are full-frame zooms rare, settled, and narratively motivated?
- Do color, type, edges, depth, captions, media, and motion feel authored by one hand?
- Is at least one important choice visibly specific to this subject and source?
- Would removing a graphic remove meaning? If not, remove or redesign it.
- Does the contact sheet vary silhouette, scale, source/graphic balance, and energy without becoming incoherent?
- Does the audio-only pass tell a coherent story, and does the silent pass still direct the eye correctly?
- Did every beat duration come from a measured narration span, or from explicitly recorded silent timing, rather than an assumption or an even division?
- Is every semantic event bound to a word onset, action, or source event, and does it appear in the animation map at that anchor?
- Is every animation-map dead zone a named, defensible stillness rather than a missing entrance?
- Could any beat be replaced by a static screenshot under the same audio and lose nothing? If so, that beat is a slide, not a shot.

## Boundaries

- Own story, beat order, pacing, evidence requirements, packaging density, review decisions, and final-film acceptance.
- Let `vidmuse-assets` own asset identity, capture selection, provenance, licensing, and sourcing policy.
- Let `vidmuse-design` own `FRAME.md` and visual-system consistency.
- Let `vidmuse-motion` own semantic choreography and speech synchronization after beats are selected.
- Let `vidmuse-media` own implemented media operations and timing integrity; let `vidmuse-cli` own exact command syntax and authentication.
- Let the official HyperFrames skills own Registry discovery, composition contracts, animation implementation, and validation.
- Let `vidmuse-timeline` own DSL assembly, Serve, Timeline synchronization, and render requests.
- Never start HyperFrames Studio, preview, or timeline UI. Never use HyperFrames-managed media models or downloaded local media models.
