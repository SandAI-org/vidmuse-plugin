---
name: vidmuse-recut
description: "Direct and package an existing talking-head, interview, podcast, founder, course, or presentation video from its spoken content and visible composition. Use for creator-aware decisions about which ideas deserve graphics, packaging density, safe placement around people, subtitles, products, screens, and platform UI, plus a project-specific original HTML design preview, timed cards, kinetic titles, lower-thirds, data callouts, quotes, side panels, picture-in-picture, reframing, and visual polish while the source clip plays completely and unchanged. Do not use for plain subtitles, transcription, trimming, reordering, or a film made without primary speaking footage."
---

# VidMuse Recut

Act as the video's content-packaging director, not a card generator. Read what the creator says, inspect what the viewer sees, and add only graphics that improve comprehension, credibility, memory, emotion, or attention.

## Compatibility invariant

- Play the source clip in full, in its original order, with its program audio preserved.
- Add only synchronized graphic cards and intentional visual framing around or over the source.
- Preserve the official artifact names, Storyboard v3 shape, card HTML contract, zones, animation declarations, layout/frame recipe compatibility, font assets, and master GSAP timeline behavior. Compatibility does not require activating a visual template.
- Do not introduce `edit-plan.json` or another VidMuse timeline schema. The only additional project-local artifact is `design-preview/index.html`, a user-facing review surface that does not alter any official data or render contract.

## Protocol precedence

Read [official-protocol.md](./references/official-protocol.md) completely before executing a recut. Use it as the pinned technical and rendering contract. Do not read [legacy-creative-heuristics.md](./references/legacy-creative-heuristics.md) — it preserves the replaced official Step 6/7 creative workflow and applies only when the user activates the shipped design gallery.

This skill replaces the official Step 6/7 creative heuristics for card selection, card count, placement, and mandatory template selection:

- Let selected semantic beats determine card count. Card count is an output of beat selection, never an input: do not compute the official duration-and-density formula, and never add a card to meet the official five-card floor. Judge pacing from the beats themselves — alternating quiet and emphasized passages — not from a per-minute number.
- Analyze the transcript and source frames before recommending layout, style, or density. Do not ask the user to choose a card count before analysis.
- Choose layouts per moment when needed; do not force one global layout onto every beat.
- Default to a bespoke `FRAME.md` derived from the source audit. Do not ask the user to choose an official style, layout, frame, or preset as a prerequisite and do not auto-select one.
- Make the bespoke direction visible through this project's original `design-preview/index.html` before building final packaging. This is a VidMuse review artifact, not a change to the official storyboard, card, or render contract.
- Surface the shipped design gallery as an optional capability only after presenting the original project preview. Open it only when the user asks to browse, compare, or explicitly use a shipped design.

Keep every official schema, asset, HTML, animation, validation, and rendering rule unchanged. When a creative rule here conflicts with the pinned creative heuristic, follow this skill; when a technical contract conflicts, follow the official protocol.

Only when the user activates the shipped gallery, read the selected files from:

- [DESIGN_INDEX.md](./references/DESIGN_INDEX.md) for the style × layout × frame matrix
- [legacy-creative-heuristics.md](./references/legacy-creative-heuristics.md) for the official card-count formula, visual-direction questionnaire, and layout recipes
- `references/styles/<key>.html` for the chosen card style
- `references/layouts/<key>.html` for the chosen composition layout
- `references/frames/<key>.html` for the chosen video frame

Do not approximate a shipped reference after the user explicitly selects it. When no reference is selected, design the visual system independently; official zone and animation contracts may still support a bespoke composition.

## Direct the content first

Base decisions primarily on the corrected transcript and its timing. Also account for the audience, publishing platform, creator identity, video goal or CTA, source footage, and available evidence. Infer low-risk missing context; ask only when an answer would materially change the film.

1. State the viewer promise, one core message, intended audience outcome, and creator tone.
2. Split the transcript at changes of idea or rhetorical function, not punctuation alone.
3. Label each beat: `hook`, `setup`, `claim`, `contrast`, `evidence`, `number`, `process`, `example`, `story`, `emotion`, `summary`, or `cta`.
4. Select a beat only when a visual can clarify, prove, compress, locate, compare, or make it easier to remember.
5. Leave emotional delivery, personal confession, humor, pauses, and facial reaction face-led unless a minimal cue adds clear value.

Use this treatment map as guidance, not a quota:

| spoken beat | preferred treatment |
| --- | --- |
| hook or promise | one compressed headline that delivers the promise |
| identity, organization, or product introduction | one lower-third, logo, or source image |
| number, fact, or evidence | data callout, chart, citation, or proof asset |
| abstract concept | diagram, relationship map, or concrete visual metaphor |
| contrast, misconception, or reversal | side-by-side comparison or visual switch |
| process or list | progressive steps; reveal only the current item |
| example, place, person, product, or interface | B-roll, image, screenshot, or picture-in-picture |
| personal, emotional, humorous, or climactic line | clean face or one restrained emphasis cue |
| summary or CTA | concise recap or end card |

Assign one packaging level per beat:

- `0 clean`: source video only.
- `1 signal`: short emphasis, subtle caption cue, pointer, or punch-in.
- `2 support`: lower-third, quote, number, small diagram, image, or screenshot.
- `3 takeover`: split, stack, picture-in-picture, full card, or dense diagram.

Alternate quiet and emphasized passages. Do not sustain maximum intensity. Show one primary focal treatment at a time, and never repeat the full spoken sentence merely to make the frame look busy.

## Start Serve immediately after subtitles

Make the first user-visible checkpoint happen as soon as word timing is valid, before art direction or card design:

1. Use `vidmuse-media` to run ASR for text, correct obvious names and terms, then run the mandatory `doubao_speech/audio_text_alignment` ATA model on the corrected text and same audio. Build `transcript.json` only from explicit ATA word timing; ASR-only segmentation is forbidden.
2. Derive `subtitles.timeline.json` from those ATA-aligned words with a target of 15 and hard maximum of 16 characters per cue. Prefer punctuation, word boundaries, and real pauses; no cue may exceed 16.
3. Use `vidmuse-timeline` to create or incrementally update `dsl.json` with the user's original video, its program audio, the subtitle cues, and an empty graphics track.
4. Validate the DSL, then use `vidmuse-cli` to start `vidmuse serve <absolute-dsl-path> --read-only` on loopback.
5. Keep the Serve process alive and report the clickable local URL to the user as a progress update.

Treat this as mandatory workflow behavior, not an optional preview. Do not continue to source art direction, beat packaging, or HyperFrames construction until the original video and subtitles are visible in Serve. If valid word timing is unavailable or Serve cannot start, report the exact blocker instead of silently proceeding. The early captions are horizontally centered, top-layer transcript-review overlays; later design may move or restyle them, but must preserve corrected text and timing. They do not create a hard empty rail that packaging must avoid.

## Audit the source before art direction

Complete a source visual audit before choosing a style, palette, frame recipe, or Registry item. A transcript explains what the speaker means; it does not explain what the film already looks like. Do not approve `FRAME.md` from transcript evidence alone.

Use `vidmuse-media` to extract a baseline contact sheet across the full duration, then add event samples at every shot, crop, location, lighting, subtitle, camera, gesture, prop, or screen-content change. For a stable take longer than one minute, inspect at least one baseline frame every 8–12 seconds. For every candidate package, also inspect its start, quarter, midpoint, three-quarter, and end frames at full resolution. Increase sampling until movement and occupancy are no longer surprising.

Record the compact audit in `FRAME.md`; do not create a separate audit artifact or schema. Cover:

- **Visual structure:** shot map, recurring framing, camera behavior, subject scale and position, gaze, headroom, foreground/background layers, and chapter-level visual changes.
- **People and performance:** faces, hands, gestures, pose changes, expression peaks, movement amplitude, eyeline, and moments where performance should remain visually dominant.
- **Environment and objects:** set, architecture, furniture, products, screens, props, clothing, logos, practical lights, and any object that can become a source-native motif.
- **Palette by role:** stable background neutrals, subject/clothing color, environmental accent, existing brand/UI color, skin-tone protection, luminance range, contrast, white balance, and temporal stability. Capture exact representative values from pixels; do not treat skin as a brand accent by default.
- **Material and geometry:** soft versus hard edges, repeated lines, circles, frames, grids, depth, texture, glass, paper, metal, fabric, or screen chrome already visible in the source.
- **Existing graphics:** subtitles, type, watermarks, labels, interface language, border treatment, and their hierarchy.
- **Image character:** sharpness, noise, compression, depth of field, exposure, saturation, and the amount of finish the source can tolerate.
- **Spatial atlas:** stable whitespace, look room, protected regions, burned-in subtitle regions, planned caption overlay position, platform UI, and how these change through time.
- **Native hooks:** two to four specific colors, forms, objects, spatial relationships, or behaviors the package will extend.
- **Foreign-language warning:** visual clichés that would detach the package from this source, such as an unrelated black SaaS dashboard, neon HUD, glass card, luxury serif, or paper collage.

Separate stable identity from transient accidents. A single orange object may be a useful accent when it recurs and holds the room together; a one-frame compression artifact is not a design token. If the proposed direction could have been created without seeing the video, the audit has not influenced the design and the direction fails.

## Map protected and usable space per interval

Use the audit frames to inspect the actual pixels throughout every candidate window. Build protected regions from the union of occupied areas and stable whitespace from the intersection of free areas across the interval. A region is safe only when it stays safe for the entire visible interval.

For each interval, identify:

- **People:** face, hair, body silhouette, hands, gestures, eyeline, and expected movement.
- **Primary subjects:** held products, demonstrations, screens, slides, documents, UI, or other objects the speech refers to.
- **Existing text:** burned-in subtitles, lower-thirds, labels, watermarks, logos, and source UI.
- **Reserved rails:** burned-in source subtitle regions and the target platform's UI-safe area. Planned Timeline or HyperFrames captions are not reserved rails.
- **Stable whitespace:** visually quiet space that remains unoccupied across the interval.
- **Crop limits:** headroom, face, hands, products, and source text that must survive reframing.

Treat people, primary subjects, existing source text, burned-in source subtitles, and platform UI as exclusion regions. Expand them by a visible safety margin so graphics do not touch a face, silhouette, source subtitle, or important object. Never infer safe placement from aspect ratio or a single frame. Planned captions are a soft overlay constraint: packaging may continue beneath them because the caption renders above it.

Apply these placement rules:

- Prefer stable whitespace. When two regions are equally safe, use the look room in front of the speaker's gaze instead of crowding the back of the head.
- If subtitles are burned in, treat their occupied region as immutable and do not place a lower-third or card over it.
- Render planned captions above all packaging and default them to horizontal center. Do not move, shrink, or crop the entire package merely to keep their area empty. Avoid a competing primary text line directly behind an active caption, and add local caption contrast when the underlying footage or graphic is busy.
- Keep critical text inside the platform's documented safe zone. If the platform is unknown, use a conservative inner canvas and avoid edge-dependent placement.
- Do not place opaque graphics over a person or primary subject. Decorative non-text marks may cross a noncritical area only when deliberate and clearly harmless.
- Do not crop a face, hairline, active hands, held product, screen content, or source text merely to make room. Override `object-fit: cover` with a contain-like or custom crop when necessary.
- Keep text and its referenced object spatially close without covering the object.
- Re-check the static hero frame and every entry/exit motion path; an animation may not travel through protected content even if its resting position is safe.

When no stable safe region exists, resolve in this order:

1. Shorten or simplify the treatment.
2. Move it to another verified region.
3. Use a transparent pointer or small anchored label.
4. Reframe only if all protected content remains visible throughout the interval.
5. Switch to split, stack, or picture-in-picture so the graphic receives its own space.
6. Use a full-screen card only when the information matters more than the speaker's expression at that moment.
7. Drop the graphic when none of the above improves the video.

## Build the original design preview

After the source audit and bespoke `FRAME.md` exist, create `design-preview/index.html` before authoring final card HTML. Treat it as a living style specimen for this one recut, not a reusable template and not a miniature finished film.

Author the page from scratch around the current creator, footage, transcript, audience, platform, and approved direction. Never copy a shipped `frame-showcase.html`, style reference, demo layout, sample metadata, or placeholder language. An explicitly selected official preset may inform the coordinated grammar, but the preview must still use this project's real content and newly composed layouts.

Make the HTML self-contained except for project-local source frames, fonts, and approved assets. Do not use remote fonts, render-time network requests, generic stock, or fabricated product evidence. Keep `FRAME.md` as the design source of truth; the preview demonstrates it and never silently overrides it.

Show the system in context rather than as a token dump. Use enough representative source states to expose real variation—normally a quiet frame, a visually busy or gesture-heavy frame, and a likely support/hero interval. Include only specimens the planned film may actually use:

- the design thesis and source-to-system bridge;
- source treatment against real footage, including protected people and objects;
- display, body/information, utility, and caption typography with real project language;
- functional palette, edge spectrum, depth/material behavior, and local contrast;
- the persistent caption/navigation treatment and recurring signature;
- one restrained signal treatment;
- one or two likely support/hero treatments such as a lower-third, evidence callout, relationship diagram, split, or picture-in-picture;
- one short deterministic motion lifecycle showing origin, semantic trigger, readable hold, resolution, and return to the source.

Do not showcase every possible component. The page should communicate one authored visual world, not resemble a UI kit or a template marketplace. Use real transcript phrases and real planned evidence; remove decorative English, fake numbers, arbitrary indices, and effects that the film has not earned.

Open the HTML in a browser when local browser control is available and inspect it at the target ratio plus a narrower viewport. Require no console errors, missing local assets, font fallbacks, overflow, unreadable text, or protected-region collisions. Also capture a static overview or representative screenshots so the direction remains reviewable when the live page is closed.

Present the original preview to the user as the design-approval checkpoint before bulk card construction. Keep the already-running VidMuse subtitle Serve session alive; the design page complements it and does not replace Timeline review. In collaborative work, revise `FRAME.md` and the preview together until the direction is accepted. In autonomous work, publish the page and overview as a visible checkpoint, then continue without converting it into a template choice.

**Gate (blocking): the design gate is `FRAME.md` plus `design-preview/index.html`, accepted together.** Both must exist, and the preview must use real source material, visibly demonstrate the bespoke system across representative conditions, and agree with `FRAME.md`. Present both to the user and wait: the preview is the reviewable surface, `FRAME.md` is the normative one, and accepting a preview whose `FRAME.md` disagrees with it approves nothing. Final card construction may not begin before this gate. If the user asks for changes, revise both and re-present; do not carry an unaccepted direction into bulk card construction.

## Build a film system, not a row of cards

Plan the complete viewing experience in five layers. Not every film needs every layer, but every selected layer needs a content or viewing reason:

1. **Source treatment:** crop, matte, finish, focus, or restrained reframing that makes the footage feel intentional.
2. **Persistent navigation:** captions, progress, chapters, or section state that helps viewers stay oriented.
3. **Recurring signature:** one source-native line, shape, color behavior, object, or transition logic that creates continuity.
4. **Semantic moments:** titles, quotes, evidence, diagrams, charts, comparisons, masks, split screens, picture-in-picture, or takeovers chosen for specific beats.
5. **Editorial punctuation:** a transition, impact, freeze-frame dressing, camera move, color event, or quiet return used only at a real change or payoff.

For every selected beat, decide this tuple before implementation:

`communicative job → relationship to encode → spatial mode → surface/material → motion verb → source cue → exit/return`

Vary the tuple when the meaning changes. Available spatial modes include in-scene annotation, edge rail, lower-third, open-whitespace composition, object-attached label, split, stack, picture-in-picture, framed source, full-screen takeover, and clean face-led footage. Available motion verbs include reveal, track, draw, grow, accumulate, compare, replace, connect, branch, compress, focus, pivot, and resolve. Choose verbs that express the spoken relationship rather than generic fade-and-slide animation.

Earn surface with content. Reserve a side-panel, whiteboard, or full-screen zone only when the payload actually fills it: at least three parallel items, a diagram, a chart, an image, or a real comparison. One phrase or one or two short bullets take a lower-third, an anchored label, or a content-sized composition in verified whitespace — never a large panel that is mostly empty surface. Treat the shrunk-video-plus-panel composition as a high-cost takeover, not a default rhythm: use it only when the speaker and a dense payload need sustained parallel attention, choose which side receives the panel from the interval's look room and stable whitespace instead of one habitual side, and return the source to full frame as soon as the panel's content expires. If the same shrink-plus-panel silhouette would appear on three or more beats, redesign at least one of them into a different spatial mode.

Budget spatial-state switches across the whole film, not per card. The composition has a small set of global spatial states — full-frame source, source-with-overlay, split/panel, picture-in-picture, takeover — and every transition between them moves the viewer's entire world, so it costs attention even when each individual card is justified. Demoting the speaker to a small picture-in-picture window is specifically a demonstration state: use it when the graphic, screen, or evidence is genuinely the primary content the speech is walking through, not as the default home for any card with a diagram. Before implementation, list the film's cards in time order with their spatial states and count the full-frame ↔ shrunk transitions. When adjacent or near-adjacent beats keep flipping between full-frame and shrunk states, consolidate: group consecutive graphic-led beats into one sustained chapter that enters the shrunk state once and exits once, move light payloads back onto the full frame as overlays or lower-thirds, or drop the weaker treatment. A viewer should experience a few deliberate spatial chapters, not a per-card toggle.

Treat source-camera motion as a high-attention spatial decision because it moves the viewer's whole world. Use `vidmuse-motion` to test whether the beat calls for a brief source-detail focus, a stable side-by-side explanation, or no reframing. When both the speaker and detailed content must remain understandable across several phrases, prefer a settled picture-in-picture, split, or stack relationship over repeated zoom corrections.

After selecting the spatial mode, load `vidmuse-motion` and build a cue chain from exact ATA word anchors plus relevant pauses, gestures, and source events. A card window defines availability, not one simultaneous entrance: reveal claims, branches, values, and consequences when the speaker reaches them, then hold and resolve intentionally. Hand the approved motion brief to `hyperframes-animation`; never select animation rules or effects before the semantic and temporal reason exists.

Keep each packaging moment atomic. A treatment opens when its own payload is ready and closes when its referent expires; it does not open early as an empty shell waiting for later speech. When a chapter or claim will only be substantiated much later, split it into separate treatments — a brief self-contained chapter marker that enters, reads, and exits, then a later evidence treatment at its own anchor — instead of one long card whose first state is a bare heading. From its first rendered frame to its last, every visible state of a card must read as complete: no unexplained empty panel, no lone kicker above blank surface, no region reserved for content that has not arrived. If an intermediate state would look unfinished as a thumbnail, restructure the reveal or split the card.

Repeated geometry is allowed only when it is an intentional named system such as a chapter rail or returning title. Do not place adjacent important beats in the same floating-panel silhouette merely with different copy. If three or more `support` or `hero` moments in the film still read as the same rectangle at a glance, redesign their spatial mode or relationship encoding. Do not solve flatness by stacking effects on one panel; create contrast between clean footage, integrated annotation, spatial re-composition, evidence, and justified takeovers.

Review a contact sheet of all selected hero frames at thumbnail size. It should show a coherent family with distinct silhouettes and energy states, not a template grid. Also inspect the motion arc: quiet passages establish trust, signals redirect attention, support moments explain, and hero moments pay off. Return clearly to the source after an intervention.

## Freeze static hero frames before choreography

Build in two passes. First author every card's final resting state as static HTML with no animation: real content, final position, final typography, final colors, loaded fonts. Snapshot each card's static hero state at output ratio over its real source interval and review them together as a contact sheet against `FRAME.md`, protected regions, contrast, and silhouette variety. Fix face collisions, surfaces touching the subject, connector paths crossing protected content, font fallbacks, and contrast failures here, while a fix is a CSS edit rather than a choreography rewrite.

Only after the static set passes does `hyperframes-animation` implement the approved motion brief on top of it. Animation may change how elements arrive, develop, and leave; it may not change where they finally rest or what they finally say. If choreography requires moving a resting position, re-review that card's static frame.

## Write the official storyboard

Keep Storyboard v3 unchanged. Use each card's existing `intent` to state the rhetorical purpose and why packaging is justified. Use the free-form `contentHints` to carry only the planning context needed to build the card, such as:

- `beatType`
- `coreMessage`
- `packagingReason`
- `visualTreatment`
- `emphasisLevel`
- `keepFaceVisible`
- `evidence`
- `sourceCue`
- `relationshipEncoding`
- `spatialMode`
- `surfaceMode`
- `motionVerb`
- `cueAnchors`
- `motionLifecycle`
- `sourceTransformReason`
- `protectedRegions`
- `spatialIntent`, for example `stable left whitespace; avoid burned-in subtitle rail`

Do not add required top-level fields. Keep exact bounds, HTML styling, and GSAP placement in the official composition implementation, not in a new schema.

## VidMuse adapters

Keep the official data and rendering contracts; replace only these execution providers:

1. Use `vidmuse-media` for metadata, frame extraction, audio extraction, transcription, and safe subtitle grouping. Require `transcript.json` to remain a flat word array of `{ text, start, end }` objects, with timestamps clamped to media duration.
2. Use `vidmuse-timeline` and `vidmuse-cli` to assemble, validate, and start the mandatory original-video-plus-subtitles Serve checkpoint.
3. Use `vidmuse-design` to establish a bespoke `FRAME.md` by default. Treat the official style × layout × frame library as an optional user-visible gallery, not a required foundation. Retain ownership of beat selection, timing, density, and placement.
4. Use the bespoke `FRAME.md`, source audit, and real representative frames to author `design-preview/index.html`; inspect it in a browser and return its path plus overview before building final cards.
5. Use the pinned HyperFrames domain skills for composition, animation, validation, snapshots, and local render.
6. Use snapshots and the already-running `vidmuse-timeline` Serve session for review. Never start HyperFrames Studio, `hyperframes preview`, or the HyperFrames Timeline UI.
7. Never use HyperFrames TTS, transcription, background-removal, vision, or locally downloaded model paths.

## Required artifacts

- `metadata.json`
- `audio.mp3`
- `asr.raw.json`
- `ata.raw.json`
- `transcript.json`
- `subtitles.timeline.json`
- `dsl.json`
- `storyboard.json`
- `design-preview/index.html` — project-specific VidMuse design-review artifact; not a render source
- `public/cards/card-XX.html`
- `public/index.html`
- `output.mp4`

Treat `storyboard.json` as the official agent planning artifact; no CLI parses it. Treat `public/index.html` as the render source of truth.

Presence is not sufficient for `dsl.json`. It must expose one Timeline item per approved packaging moment, reconciled against `storyboard.json` and the implemented hosts per the Timeline synchronization gate. Add `timeline-overlay/index.html` (or the per-card hosts it replaces) whenever an overlay-safe host was derived.

## Visual QA gate

Before rendering, snapshot the start, hero/midpoint, and end of every card window and inspect them at output ratio. For any card window longer than 12 seconds or with a staged reveal, also snapshot each intermediate reveal state, including the state immediately after entrance. Pass only when all are true:

- No overlay or motion path unintentionally covers a person, primary subject, burned-in source subtitle, watermark, or source UI while that source content is meant to remain visible; a justified full-screen takeover is explicit, not accidental overlap.
- Reframing preserves faces, headroom, gestures, products, screens, and source text.
- Platform UI and burned-in source subtitle regions remain clear. Planned captions render above the package, stay readable throughout changing backgrounds, and do not require an empty rail beneath them.
- The primary focal point is unambiguous and the graphic is readable before it exits.
- Every card has a content reason; removing it would reduce comprehension, credibility, memory, emotion, or attention.
- Palette, material, geometry, placement, or motion visibly inherits specific evidence from the source audit; it does not feel pasted over an unrelated video.
- The visual direction is independently authored unless the user explicitly selected a shipped design; no preset was silently inherited.
- The final package still matches the accepted `design-preview/index.html`; any material departure is visible and justified in `FRAME.md`.
- Important moments use relationship-appropriate spatial modes and motion verbs instead of repeating one generic card silhouette.
- Source reframing has a named focal or rhetorical reason, settles long enough to become useful, and does not substitute repeated zooming for a stable explanatory layout.
- Semantic payloads arrive at their own spoken, performance, or source anchors instead of every layer entering at the card boundary; each treatment has a readable hold and intentional exit.
- A thumbnail contact sheet shows meaningful variation in silhouette, scale, source/graphic balance, and intensity while retaining one coherent visual grammar.
- Quiet face-led passages remain available, and adjacent cards form an intentional low/medium/high rhythm.
- Every snapshot state, including intermediate reveal states, reads as a complete frame: no empty or near-empty panel, no heading waiting alone over blank surface, and no visible region reserved for content that has not arrived.
- Diagrams grow causally: in every intermediate snapshot, each visible connector already joins two visible endpoints (or is mid-draw toward one that lands with it); no snapshot shows a pre-drawn skeleton of lines or empty containers awaiting content.
- Surface area matches payload: no large zone whose content could fit a lower-third or anchored label, and any shrunk-video-plus-panel state carries a payload dense enough to justify displacing the source.
- When the interval has verified stable whitespace, the treatment uses it before displacing, shrinking, or covering the source; displacement of the primary subject is a deliberate, named takeover.
- The shrunk-video-plus-panel silhouette does not dominate the film: across all cards it appears only where parallel attention is genuinely required, not as the default treatment.
- Spatial-state switching is chaptered, not oscillating: reading the cards in time order, full-frame ↔ shrunk/PIP transitions form a few sustained chapters, and no passage flips the viewer's world back and forth on consecutive beats without a demonstration-grade reason.

Fix, downgrade, reposition, change layout, or remove any failing card. Then run the official HyperFrames lint, browser check, snapshots, and render steps.

## Timeline synchronization gate (blocking, before render)

The film has two user-visible delivery surfaces, not one: a playable cut, and packaging the user can see and edit as discrete segments on the Timeline. A correct `output.mp4` does not make the project complete. This gate is fail-closed — an omission must make delivery impossible, not merely undocumented.

The subtitle-review DSL is provisional. Its empty `graphics` track is correct only before packaging implementation begins, and is never an acceptable final state once the approved storyboard contains packaging moments. Before final render, result reporting, or delivery:

1. Map every approved storyboard card to exactly one timed HyperFrames item on the DSL `graphics` track, preserving a stable ID, absolute `startTime`, `duration`, `endTime`, and `params.sourceStartTime`.
2. Make every packaging moment individually visible. One full-span graphics item is allowed only when the user explicitly asks for a consolidated, non-editable representation.
3. Use an overlay-safe host whenever the DSL already owns the main video, program audio, or captions. Such a host must not contain duplicate source video, program audio, or Timeline-owned subtitles.
4. Reconcile `storyboard.json`, the implemented HyperFrames card hosts, and `dsl.json`. Counts must match and no start time or duration may differ by more than one output frame.
5. Run the HyperFrames host check and the DSL validator, restart Serve, and confirm from the live Timeline that every packaging item is exposed.
6. **Present the Timeline to the user and let them review the packaging points there before rendering.** This is the render gate: the user sees the packaging as segments on the graphics track, at their real times, and confirms them.

Reconciliation is owner-level semantic validation. `validate-dsl` checks structural legality and must keep allowing a legitimately zero-packaging project, so it cannot detect "storyboard has 8 cards, graphics has 0" — only this workflow can.

If any reconciliation or UI check fails, the project is incomplete. Do not render, do not report success, and never describe delivery as complete.

### Packaging-point DSL shape

Write packaging into a `type: "sub"` graphics track using the `videos` collection, one item per packaging point:

```json
{
  "id": "graphics",
  "type": "sub",
  "videos": [
    {
      "id": "card-01",
      "type": "hyperframes",
      "startTime": 0.32,
      "duration": 5.48,
      "endTime": 5.8,
      "htmlSourceFilePath": "timeline-overlay/index.html",
      "params": { "sourceStartTime": 0.32, "enabled": true }
    }
  ]
}
```

`params.sourceStartTime` depends on which host the item points at, and getting it wrong silently shifts the packaging:

- **One shared overlay host on the film's clock** (above): `sourceStartTime` equals the item's `startTime`. The host's finite duration must cover `sourceStartTime + duration`, so a shared host has to span the whole film.
- **A per-card host whose internal time starts at 0**: `sourceStartTime` is `0`.

When the same long host backs several items, set the intended source time on every item rather than relying on shared-source inference.

Invariants:

- `type: "sub"` on the graphics track, so items are placed by absolute `startTime`.
- New projects use `videos`; never populate both `videos` and the legacy `items`.
- `duration > 0` and `endTime = startTime + duration`.
- IDs are unique project-wide and should match the `storyboard.json` card IDs.
- `htmlSourceFilePath` points at a complete, independently renderable host — never a card fragment such as `public/cards/card-01.html`, and never a raw Registry template.
- Pointing at `public/index.html` is wrong whenever that file still carries the source video, program audio, or the same captions the DSL owns: mounting it duplicates media. Derive an overlay-safe host from the validated composition instead — keep the cards and the one GSAP master timeline, remove the source video, program audio, subtitles, and opaque background, keep the transparent canvas plus local fonts, then re-run the HyperFrames check on it.
- All timings within one frame of the storyboard and HyperFrames implementation.

An empty `graphics` track when `storyboard.json` already holds packaging moments is an unfinished state, never a deliverable one.

## Verify the rendered film

Treat `output.mp4` as the final QA subject; passing HTML checks does not certify the film. After rendering, verify the actual file:

- probe duration, resolution, frame rate, and audio track against the composition contract, and decode fully with zero errors;
- detect black or frozen frames outside intentional design;
- extract frames from the rendered file at each card's entrance, intermediate reveal states, hero, and exit, plus a sample of subtitle boundaries, and re-run the visual QA conditions on them — empty-panel, causality, occlusion, and oscillation failures must be caught on real output pixels, not only pre-render snapshots;
- spot-check caption text and timing against `subtitles.timeline.json`, including the last displayed frame of fading text for contrast.

Fix at the source and re-render on any failure. Do not deliver a file whose rendered frames were never inspected.

Delivery is fail-closed across both surfaces. Before claiming completion, confirm the rendered film passed inspection **and** that the Timeline still exposes every packaging item. A verified `output.mp4` beside an empty or unreconciled `graphics` track is an incomplete delivery, and reporting it as finished is the defect this gate exists to prevent.

## Ownership and boundaries

- Own content analysis, beat selection, packaging density, placement, visual strategy, composition, QA, review, and final output.
- Let capability skills execute narrow operations without changing official artifact shapes or taking over the film.
- Resume from the first missing or invalid official artifact.
- Route plain subtitles, transcription, a single trim, or another standalone media result to `vidmuse-media`.
- Route requests that require selecting, deleting, or reordering spoken footage outside this version; the official protocol does not perform editorial cutting.
- Route films without primary speaking footage to `vidmuse-create`.
- Do not enter the HyperFrames router or update/install HyperFrames skills during a run.
