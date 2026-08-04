---
name: vidmuse-design
description: Direct the aesthetic system for a VidMuse film and write or revise FRAME.md. Use inside vidmuse-create or vidmuse-recut, or directly when the user asks for visual direction, taste, style, art direction, colors, typography, composition language, caption identity, media treatment, motion temperament, or intentional selection of official HyperFrames styles, layouts, frames, blocks, and components. Ground every choice in the content, creator, audience, platform, brand, and visible footage rather than a generic preset.
---

# VidMuse Design

Act as the film's visual director. Answer one question with evidence: **why should this film look and feel this way?**

Convert content and context into a coherent visual language, then express it as a concise `FRAME.md` that the film owner and HyperFrames implementation skills can execute. Do not merely select a fashionable style or decorate every available space.

## Authority and evidence

Resolve design decisions in this order:

1. Follow the user's explicit intent, supplied references, brand system, and approved prior work.
2. Read the film's meaning: viewer promise, argument, emotional arc, transcript or script, and the owner's beat plan.
3. Fit the creator's persona, audience expectations, publishing platform, output ratio, duration, and viewing distance.
4. Derive from the medium: representative source frames, locations, wardrobe, lighting, products, screenshots, photography, existing captions, and available assets.
5. Extend recognizable visual language already present in the footage or brand before imposing a foreign aesthetic.
6. Respect accessibility, protected regions, licensing, deterministic rendering, and the capabilities actually available in the target project.

Treat hard constraints as constraints, not inspiration. When evidence conflicts, explicit user and brand direction wins unless it would make the result unreadable or technically invalid; record that tradeoff in `FRAME.md`.

## Read before directing

Read the smallest available set that establishes the film:

- the request and `BRIEF.md`, when present;
- `SCRIPT.md`, corrected transcript, `film-plan.json`, or official recut `storyboard.json`;
- representative frames across the film, including visual-space findings from `vidmuse-recut`;
- brand assets, creator references, existing episodes, approved designs, and the current asset inventory;
- target platform, aspect ratio, duration, caption plan, and delivery constraints;
- the live official HyperFrames catalog and the manifests or source of serious candidates.

Do not require every artifact. Infer low-risk gaps and state the assumption. Ask one short question only when two plausible answers would lead to materially different visual identities.

For source footage, inspect actual pixels rather than trusting filenames or prose. Sample changes in shot, crop, location, subject, subtitle state, and lighting. Never let design override protected people, objects, source text, burned-in source subtitles, motion paths, or platform-safe areas established by the film owner. Planned captions follow the top-layer overlay policy below; they are not a hard empty rail that the rest of the composition must avoid.

## Assimilate the source

For recut, read the source visual audit from `vidmuse-recut` before selecting a visual direction. If it is missing or only says generic things such as “warm,” “clean,” or “subject centered,” stop and complete it from contact sheets and full-resolution frames.

Translate the audit into design decisions with visible causality:

- derive the neutral temperature from the location and lighting;
- derive one or two accents from recurring environmental, clothing, product, brand, or screen colors;
- derive shape language from repeated source geometry, architecture, props, interface chrome, or framing;
- derive materiality from the source's real surfaces and image character;
- derive placement from stable whitespace, look room, and protected-region motion;
- derive motion from camera behavior, gesture rhythm, rhetorical pace, and the physical behavior of a source-native motif;
- define which source elements remain untouched so the package still belongs to this person and place.

Distinguish stable evidence from transient states. Record exact representative color values and their roles, but do not mechanically copy a dominant-color histogram: skin, blown highlights, compression noise, and large blank walls need semantic interpretation. Test overlays on more than one frame so a palette that works on the opening does not fail after a lighting or camera change.

Require a **source-to-system bridge** in `FRAME.md`: name at least three observed source facts and the exact design choice each one causes. Require each major treatment to cite at least one source cue. A direction that merely places a foreign interface theme on top of the footage fails, even if the interface itself is polished.

## Establish the design read

Write one sentence before selecting colors or components:

> Reading this as: a **[film kind]** for **[audience]** on **[platform]**, where **[content or creator evidence]** calls for a **[specific visual character]** language built from **[subject-native materials, structures, or behavior]**.

Then write:

- **Design thesis:** one sentence describing the governing visual idea.
- **Signature:** one memorable device that embodies the thesis and could not be pasted unchanged onto an unrelated film.
- **Restraint:** what stays quiet so the signature can matter.

Ground the direction in the subject's own world. Borrow its instruments, artifacts, diagrams, textures, proportions, language, or behaviors. Do not translate “premium,” “tech,” “creator,” or “cinematic” directly into a default palette.

Explore two or three materially different directions internally before locking one. Reject directions that are attractive but weakly tied to the brief. Spend boldness in one place and keep the supporting system disciplined.

## Keep official frame presets optional

This skill carries the official HyperFrames frame-preset library at `references/frame-presets/`. The current set is:

- restrained/editorial: `biennale-yellow`, `blue-professional`, `cartesian`, `code-editorial`, `cobalt-grid`, `editorial-forest`;
- bold/graphic: `blockframe`, `bold-poster`, `broadside`, `coral`, `creative-mode`;
- playful/soft: `capsule`, `daisy-days`.

Each preset contains:

- `FRAME.md`: normative color, typography, spacing, component, edge, depth, and behavior rules;
- `frame-showcase.html`: a contact-sheet preview for choosing by eye, never a project template;
- `caption-skin.html`: the preset's caption treatment and implementation reference;
- local fonts only when that preset ships them.

The bundled files are preserved upstream references. Some showcase files link to Google Fonts and some caption skins include a CDN GSAP tag for standalone demonstration. Never copy those remote URLs into a render composition. Resolve fonts through the project's deterministic font path and use the project-pinned HyperFrames/GSAP runtime.

Default to **bespoke design**. Do not inspect, shortlist, auto-select, or inherit a preset before writing the source-derived design read, thesis, signature, restraint, palette roles, type roles, geometry, material, and motion temperament. A preset must never become the silent starting point merely because it is polished, available, or superficially close.

Use three explicit modes:

1. **Bespoke — default.** Build the complete project `FRAME.md` independently from the content, creator, source, audience, platform, and brand. Keep every official preset inactive.
2. **Gallery comparison — user asks to browse or compare.** Show at most three materially relevant preset previews after the bespoke direction exists. Explain what each changes and keep the bespoke direction active until the user chooses otherwise.
3. **User-selected preset.** Only when the user explicitly names or selects a preset, inspect its showcase and full `FRAME.md`, then treat its coordinated relationships and prohibitions as normative unless a brand, source, legibility, or protected-region conflict is documented.

When first presenting a bespoke direction, add one unobtrusive sentence that an official HyperFrames preset gallery is also available and that the current direction does not use it. In a Recut workflow, let the owner present the bespoke direction first through the project-specific `design-preview/index.html`; place the gallery notice there or beside it. Do not turn that notice into a mandatory choice or interrupt a build to ask for a template selection.

If a preset becomes active, use it as a **coordinated visual grammar, not a scene layout and not a complete video template**:

- Preserve its neutral temperature, accent scarcity, display/body contrast, geometry family, edge character, surface behavior, depth model, and caption relationship rather than copying isolated tokens.
- Adapt composition for the actual video and source footage. Let content control layout, density, timing, and graphic placement; in recut, let the person remain the primary focal point.
- Remove showcase copy, fake metadata, decorative English, sample numbers, and preset ornaments that do not explain this film. Never copy `frame-showcase.html` into a project.
- Do not mix the palette from one preset, typography from another, containers from a third, and motion from a fourth. Borrow at most one compatible secondary device and record why it belongs.

Coordinate the complete film with two layers:

- **Invariant spine:** canvas/ink/accent roles, typography roles and weight contrast, geometry and edge family, depth/material model, caption identity, and one signature motif. These remain recognizable across scenes.
- **Adaptive expression:** crop, layout, focal scale, graphic form, source/graphic balance, density, and motion. These change with the meaning of each beat.

Assign every visible layer a job:

- background establishes atmosphere, separation, or a source-native environment;
- midground carries the current argument, evidence, or subject;
- foreground directs attention, labels a fact, or maintains navigation/captions.

Do not satisfy a layer by adding decoration. A flat field is valid when the footage provides depth; one focal point is valid when the person must lead. Official density and ambient-motion suggestions are subordinate to semantic necessity, human presence, and source protection.

After authoring, run a coordination audit against the approved project `FRAME.md`: colors, type families and weights, corner/edge behavior, spacing rhythm, depth/material treatment, accent allocation, caption identity, and explicit avoidance rules. Fix undocumented per-scene invention before review.

### Make a bespoke Recut direction previewable

When called by `vidmuse-recut`, give the owner enough executable direction to author an original `design-preview/index.html` from real source frames. Identify representative quiet, busy, and support/hero conditions; the exact source-derived tokens; the caption and persistent signature; one signal treatment; the likely support/hero treatment families; and one complete motion lifecycle worth demonstrating.

Do not provide or select a showcase template. Do not reuse an official preset's `frame-showcase.html`. The Recut owner authors the project-local HTML, keeps `FRAME.md` normative, and uses the preview only as the user-facing approval surface before final card construction. Omit this handoff outside Recut.

## Tune four film dials

Set each dial from `1–10` using evidence; there is no universal default.

| dial | low | high | governs |
| --- | --- | --- | --- |
| `VISUAL_VARIANCE` | repeated, stable geometry | asymmetric, surprising composition | how far layouts may depart from the base grid |
| `MOTION_ENERGY` | nearly still, deliberate reveals | kinetic, layered choreography | the temperament of movement, not the amount of animation |
| `INFORMATION_DENSITY` | one idea with generous air | compact proof, labels, and data | how much a viewer must parse at once |
| `MATERIALITY` | flat typographic surfaces | tactile, photographic, textured, dimensional | how physically present the visual world feels |

Use the dials as a coherence test, not a style generator. A serious technical film can have high variance; an emotional film can have low motion. State the content evidence for any extreme value.

Map the film owner's intensity to the same system:

- `quiet`: footage or scene leads; typography and surfaces recede.
- `signal`: one restrained cue uses the accent or signature.
- `support`: a structured visual shares attention with the source.
- `hero`: the visual system takes focus for a justified payoff.

In recut, these correspond to packaging levels `0–3`; the recut owner still decides which beat receives which level and when.

## Construct a layered editorial language

Do not reduce “video design” to intermittent cards. Compose from four scales:

1. **Persistent system:** captions, progress, chapter state, safe margins, finish, and recurring navigation.
2. **Signature system:** one source-native motif that can evolve without becoming a logo stamp.
3. **Moment treatments:** semantic visuals that explain, prove, compare, emphasize, or reframe a specific beat.
4. **Punctuation:** transitions, camera/depth changes, masks, color events, and quiet returns that articulate structure.

Select a treatment family by communicative job:

| job | useful visual language | HyperFrames realization |
| --- | --- | --- |
| orient in time or structure | progress line/ring, chapter rail, index, timeline, countdown, ticker | SVG draw/fill, indexed states, persistent composition |
| identify or headline | title, lower-third, section opener, source label, pull quote | Registry lower-third/title, kinetic or masked type |
| make speech readable | stable captions, keyword emphasis, phrase replacement, embedded climax | caption components, timed word spans, weight/color/clip changes |
| compare or reverse | split screen, before/after, two-column contrast, shared-element move, visual switch | split/stack layout, FLIP-like authored states, scale swap |
| explain causality or process | arrows, paths, nodes, steps, funnel, chain, branch, hierarchy | SVG path draw, progressive reveal, flowchart, connected nodes |
| show evidence | number, count-up, chart, map, citation, screenshot, social post, UI/code proof | data/map/social/code Registry blocks or custom SVG/DOM |
| integrate with the frame | object callout, tracked label, spotlight, mask, matte, cutout, frame-within-frame | positioned annotation, clip-path/SVG mask, picture-in-picture |
| change focus or scale | punch-in, pan, parallax, rack focus, 3D card, world zoom | viewport transform, depth layers, blur/focus, CSS 3D |
| create editorial texture | freeze-frame dressing, grain, vignette, light leak, color isolation, duotone | official VFX/finish components or deterministic CSS/SVG |
| punctuate a real change | push, wipe, morph, blur, flash, whip, iris, glitch, light event | HyperFrames transition family or a custom seek-safe handoff |

Treat these as a vocabulary, not a checklist. Translate After Effects concepts into browser primitives: layers become DOM/SVG/canvas planes; track mattes become clip paths, masks, alpha/luma-like composites, or nested overflow; shape animation becomes SVG path and transform choreography; camera and depth become a transformed world, parallax planes, blur, and CSS/WebGL perspective; animation presets become reusable Registry items or HyperFrames motion rules. Use Lottie only for a supplied or approved After Effects export, never as a substitute for design reasoning.

For each moment, use at most one primary structural treatment and one supporting emphasis, plus the film's persistent system. A richer film comes from meaningful changes across time, not many simultaneous effects. Make the motion itself carry syntax:

- cause draws or propagates into effect;
- sequence advances rather than appearing all at once;
- accumulation grows or stacks;
- comparison separates and then aligns;
- replacement preserves an anchor while state changes;
- hierarchy expands from parent to child;
- uncertainty flickers or destabilizes briefly, then resolves;
- emphasis attacks quickly, holds long enough to read, and returns attention cleanly.

Set a repetition budget. Recurring rails and signatures may repeat because continuity is their job. Major `support` and `hero` moments may not share the same container silhouette, placement, and entrance in succession unless the repetition encodes a real series. If three important frames collapse to “dark rounded card in one corner,” redesign before implementation. Across a typical one-to-two-minute explanatory recut, semantic variety should normally produce several treatment families; never force a count when the content does not support it.

Plan the energy arc across the whole film. Reserve the largest scale change, most dimensional treatment, or most distinctive transition for a genuine thesis, proof, reversal, or payoff. Follow it with visual recovery. A progress rail can remain calm while a hero takeover becomes bold; captions can remain consistent while cards, diagrams, source framing, and transitions change role.

## Build human presence

Human presence is the visible result of observation, judgment, touch, and response. It does not come from adding round corners, grain, wobble, particles, or spring motion indiscriminately. The package should feel as though a director watched this person, noticed this moment, and made one specific choice because of it.

Use these principles together:

1. **Anchor design to human behavior.** Give every major treatment a perceptible cause: a phrase begins, a hand lands, the gaze shifts, an object is named, an argument turns, or the source camera changes. Let graphics answer the performance rather than run on an unrelated schedule. Never route decorative lines, masks, or labels through a face, expressive hand, product, or other protected subject.
2. **Compose an edge spectrum.** Decide what must be `crisp`, what may be `softened`, and what should `dissolve`. Keep type, data, and the current focal cue crisp. Let surrounding surfaces transition through feathered masks, translucent scrims, tinted shadows, light falloff, photographic depth, or a brief blur handoff. A frame made entirely from hairlines and hard rectangles feels diagrammed; a frame with everything blurred feels weak. Use one decisive edge and let secondary edges yield.
3. **Preserve physical continuity.** Motion begins from a believable origin and retains direction, mass, and momentum. Use responsive deceleration for arrivals, continuous easing for on-screen travel, quick exits, restrained overshoot only when the material calls for it, and small follow-through between related parts. Do not make objects appear from `scale(0)`, stop mechanically, or share one fade-and-slide preset. Bridge difficult state changes with a shared anchor, occlusion, or momentary blur rather than a discontinuous swap.
4. **Use authored asymmetry.** Optical alignment may override mathematical centering when the subject, gaze, crop, type shape, or empty space demands it. Vary crop, scale, and negative space intentionally; allow one justified overlap or broken-grid moment. Random offsets and fake imperfection are not authorship.
5. **Leave a human trace.** Choose at most one recurring sign of attention—a content-specific underline, tracked note, imperfect path, crop mark, highlight, cursor, or source-native physical motif. It must point to something a human actually noticed. Remove generic English micro-labels, index numbers, and editorial chrome when they carry no information.
6. **Let the film breathe.** Not every sentence deserves a treatment. Hold on expression, gesture, silence, or an unadorned source frame after dense explanation and before a major payoff. Vary attack, hold, and recovery instead of keeping every layer active. Human rhythm includes anticipation, emphasis, hesitation, and rest.

Treat softness as hierarchy, not a theme. A useful default is: crisp message, dimensional subject, softened support, dissolved atmosphere. Derive the exact mixture from the source. Preserve the hard edge of a chart when precision matters; soften the edge of a floating surface when it must coexist with a person.

Actively reject synthetic taste defaults unless the evidence specifically earns them:

- warm cream canvas + high-contrast serif + terracotta accent as instant “editorial taste”;
- full-frame graph paper, broadsheet hairlines, corner indexes, and tiny uppercase English used as decoration;
- every idea placed in a bordered card or every inset given the same radius and shadow;
- identical entrances, synchronized movement, constant ambient loops, or gratuitous bounce;
- fake handmade wobble, arbitrary grain, random misalignment, or roundedness used as a shortcut to friendliness;
- decorative orbit lines, arrows, progress bars, or diagrams that neither follow the subject nor explain the argument.

One frame should contain one piece of evidence that it was **observed rather than merely laid out**. Name that evidence in `FRAME.md` before implementation.

## Build one visual grammar

Define only choices that another agent can execute.

### Typography

- Assign display, body, utility/data, and caption roles; combine roles when one family can carry them.
- Choose type from the subject, brand, language, and viewing distance. Verify the actual font is available locally before specifying it.
- Name the communicative register before naming a family: institutional, intimate, technical, irreverent, archival, or another content-specific voice. Do not reduce editorial to serif, technical to mono, or friendly to rounded type.
- Use one expressive voice and let the supporting face recede. Make contrast visible across form, width, weight, rhythm, or register; avoid two near-identical sans or serif families.
- Treat time as typography: sequence establishes hierarchy, entrance behavior changes the voice, and reading duration limits word count. A viewer should finish the message before the treatment exits.
- Use a clear scale, line-height, width, weight, case, and emphasis rule. Treat Chinese and mixed-language line breaks deliberately.
- Avoid arbitrary family mixing. Use weight, width, italic, scale, or spacing before adding another typeface.
- Make typography carry personality; do not use oversized type as a substitute for hierarchy.
- Never rely on a showcase's remote font stylesheet or an undeclared local-machine font. Use a renderer-bundled family or embed a licensed `@font-face`; document any role-equivalent substitution from an official preset.

#### Use the bundled open font pack

This skill carries a deliberately small OFL-1.1 font pack at `assets/fonts/`. Read `assets/fonts/font-pack.json` for exact faces, supported scripts and weights, sources, licenses, reserved names, and hashes. Inspect the available roles with:

```bash
node <vidmuse-design-skill>/scripts/stage-fonts.mjs --list
```

Stage only the families approved in `FRAME.md` into the actual film project:

```bash
node <vidmuse-design-skill>/scripts/stage-fonts.mjs \
  --project <film-project> \
  --font noto-sans-sc \
  --font instrument-serif
```

Then link `assets/fonts/vidmuse/fonts.css`. The staging command verifies every binary, copies the corresponding OFL text, and writes a provenance receipt. It never requires a render-time network request.

- Use `Noto Sans SC` as the dependable Simplified Chinese body, caption, and information face.
- Use `Smiley Sans` only for short, expressive Chinese titles or kinetic emphasis; its oblique display voice is not a paragraph or default-caption face.
- Use `Instrument Serif` for concise Latin display, `Newsreader` for editorial Latin reading, and `Space Grotesk` for supporting Latin sans, utility, or data roles.
- Continue using HyperFrames' embedded JetBrains Mono or IBM Plex Mono for mono roles when appropriate.
- Do not stage the whole pack by default, invent unavailable weights/styles, or copy a remote stylesheet from a preset.
- Distribute these files unmodified with their license texts. Do not rename, modify, subset, convert, or reserialize a bundled font without separately resolving its OFL reserved-name and redistribution obligations.

### Color and light

- Name functional tokens such as `canvas`, `surface`, `ink`, `muted`, `accent`, and `signal`; give exact values and uses.
- Lock one coherent neutral temperature and an intentional accent policy. Add colors only when they encode information or belong to the source identity.
- Preserve sufficient contrast at the final output ratio and over changing footage. Define scrims or solid fallbacks where necessary.
- Reject stock AI palettes, glows, gradients, or warm-paper treatments unless the evidence actually supports them.

### Composition and space

- Define the base grid, margins, alignment behavior, focal hierarchy, whitespace character, and corner/edge system.
- Keep one shape language. State when radii, strokes, rules, shadows, or depth communicate hierarchy.
- Vary composition to follow meaning, not to demonstrate variety. Repeating one layout forever and changing layout on every beat are both failures.
- Keep critical type within the platform-safe region. Treat source-footage protected regions and burned-in source subtitles as immutable inputs. Treat planned captions as an independent overlay layer, not reserved geometry.

### Captions and information graphics

- Define caption position, type role, line count, emphasis behavior, background treatment, and relationship to other cards.
- Render planned captions on the topmost visual layer and default them to horizontal center. Let footage, surfaces, images, and supporting graphics continue behind the caption area; do not shrink, reflow, or relocate the whole composition merely to preserve an empty caption rail.
- Protect readability locally. When the underlying frame is busy, use a compact scrim, backplate, outline, shadow, blur, or other `FRAME.md`-approved contrast treatment around the active words. Do not place a second critical text message directly behind an active caption, but decorative and supporting layers may pass beneath it.
- Burned-in source subtitles remain protected pixels. Never treat a new top-layer caption as permission to cover, duplicate, or make the source subtitle unreadable.
- Let words remain words when words are clearest. Use structure, numbering, labels, and diagrams only when they encode something true.
- Keep one primary focal message. Do not repeat the full spoken sentence as decorative text.

### Media treatment

- Define crop, matte, border, grading relationship, screenshot chrome, image aspect behavior, cutout treatment, and how B-roll enters the same visual world.
- Preserve product details, faces, hands, screens, text, and evidence. Do not make footage harder to understand for stylistic consistency.
- Specify an asset need; let `vidmuse-assets` decide identity and provenance and `vidmuse-media` resolve or transform the approved file.

### Motion temperament

- State what motion means in this film: reveal, explain, compare, direct attention, mark hierarchy, or bridge a real narrative change.
- Prefer one orchestrated causal sequence over scattered effects. Leave frequently recurring elements calmer than rare hero moments, and treat source-camera changes as expensive attention transfers rather than ambient punctuation.
- Define rhythm, weight, direction, source-camera temperament, picture-in-picture behavior, continuity anchors, and restraint here. Let `vidmuse-motion` derive speech-synchronized cue chains and complete lifecycles, then let `hyperframes-animation` choose the exact seekable GSAP or supported runtime implementation.

## Use the HyperFrames libraries with intent

Treat the official HyperFrames Registry and local `vidmuse-shotcraft` library as component
vocabularies and this skill as the art director. The catalogs show what can be built; they
do not decide what the film should say.

1. Read `hyperframes-registry` before discovery and `hyperframes-core` before implementation.
2. Query the target project's configured catalog with `npx hyperframes catalog --json`. Do not rely on a memorized list when the live catalog is available.
3. Search by the beat's communicative job, then inspect the exact candidate's `registry-item.json`, source, dimensions, duration, variables, dependencies, and demo content.
4. Score serious candidates on semantic fit, thesis fit, source-space fit, aspect-ratio fit, adaptation cost, and repetition risk. Reject a visually exciting item when it explains the wrong thing.
5. Prefer a close official block or component to recreating it. Install the exact named item with `hyperframes add <name>` only after selecting it.
6. Adapt content, variables, palette, typography, timing, crop, and composition to `FRAME.md`; preserve the official item contract and deterministic behavior.
7. Use a custom HyperFrames composition when no official item expresses the idea accurately. Do not distort a library item beyond recognition merely to claim reuse.

For a transition, title, camera, UI entrance, interaction, data, impact, rhythm, opening,
or outro job, load `vidmuse-shotcraft` after the job and cue chain are named. Query its
bilingual job index, inspect no more than three serious candidates, and apply the same
semantic-fit score above. Install a selected `shot-*` through the Shotcraft local installer,
not `hyperframes add`; the official Registry remains configured for upstream items. Respect
the catalog's fail-closed recut policy and the block's native 16:9 adaptation cost.

Choose the unit correctly:

- Use a **block** when the visual needs its own canvas, duration, and internal timeline: a chart, map, post, code demonstration, device scene, lower-third, or designed transition.
- Use a **component** when the treatment belongs inside an existing composition: caption emphasis, grain, vignette, shimmer, mask, or local motion treatment.
- Use an **example** only as a project starting point, never as an installable component or a style authority.

Use these semantic families as search seeds, not a fixed catalog:

| content need | search direction |
| --- | --- |
| identity or role | lower-third, title, logo |
| number, proof, or geography | data, chart, map |
| quoted source or social proof | post, social, notification |
| product, interface, or code evidence | app, device, code, terminal |
| footage emphasis | freeze-frame, editorial overlay, camera treatment |
| caption emphasis | caption, highlight, kinetic text |
| atmosphere | grain, vignette, light, texture |
| genuine chapter change | transition family matching the narrative action |

For a talking-head recut, keep the shipped `style × layout × frame` gallery inactive by default. Read `vidmuse-recut/references/DESIGN_INDEX.md` only when the user asks to browse the gallery or explicitly selects one of its entries. Spatial recipes and Registry components may still be used as implementation primitives when they serve the bespoke `FRAME.md`; they do not activate a visual template. Do not approximate an explicitly selected shipped reference or make every card a registry showcase.

Use the library fluently:

- Mix capabilities, not aesthetics. A chart block and caption component may coexist when both obey the same `FRAME.md` tokens and hierarchy.
- Reuse the system, not the demo. Remove sample copy, placeholder data, arbitrary logos, and showcase-only effects.
- Keep one hero device per moment. Do not stack grain, glow, glass, glitch, ticker, and kinetic text merely because they exist.
- Reserve transitions for real changes in argument, time, place, or visual state; a cut is often the most tasteful transition.
- Record why each selected item exists and what changes make it belong to this film.

## Write `FRAME.md`

Keep `FRAME.md` concise enough to use while building. Use this structure:

```markdown
# FRAME

## Design read
- Audience / platform / goal:
- Evidence:
- Reading this as:

## Source assimilation
- Visual structure and performance:
- Native palette by role:
- Native geometry / material / objects:
- Stable space and protected motion:
- Source-to-system bridge: observed fact → design consequence
- Foreign language to avoid:

## Direction
- Design thesis:
- Signature:
- Restraint:
- Dials: variance _ / motion _ / density _ / materiality _

## Design origin and coordination
- Mode: bespoke / gallery comparison / user-selected preset
- Official preset active: none / name
- Independent system established before gallery inspection:
- Preset files inspected, if activated:
- Invariants adopted, if activated:
- Source or brand overrides and reasons:
- Compatible secondary device, if any:
- Invariant spine across scenes:
- Adaptive freedoms by beat:
- Layer roles: background / midground / foreground

## Human presence
- Human anchor: observed performance or source cue → designed response
- Edge spectrum: crisp / softened / dissolved roles
- Physical motion: origin, momentum, follow-through, recovery
- Authored asymmetry:
- Human trace:
- Breath and quiet returns:
- Synthetic defaults rejected:

## System
- Palette: token = value — use
- Type: role = family / weight / size behavior / use
- Font source: renderer-embedded / staged VidMuse ids / project-owned asset
- Composition: grid, margins, hierarchy, safe-space behavior
- Shape and material: radii, rules, shadows, texture
- Captions: top-layer ownership, horizontal anchor, vertical position, line count, emphasis, local contrast, collision policy
- Media: crop, matte, image/screenshot/B-roll treatment
- Motion: purpose, relationship verbs, rhythm, direction, weight, source-camera temperament, continuity anchors, limits

## Intensity states
- quiet:
- signal:
- support:
- hero:

## Editorial language
- Persistent system:
- Signature and its allowed evolution:
- Treatment families:
- Motion syntax:
- Transition / punctuation family:
- Repetition budget and recovery rhythm:

## HyperFrames plan
| scene or need | official item | type | adaptation | reason | fallback |

## Guardrails
- Preserve:
- Avoid:
```

Use exact values where consistency matters and prose where judgment must remain flexible. `FRAME.md` is a design contract, not a replacement for Storyboard v3, `film-plan.json`, HyperFrames HTML, or a Timeline schema.

## Taste gate

Reject or revise the direction when any answer is no:

- Can the thesis be traced to the specific content, creator, audience, or source world?
- If project names and nouns were removed, would this still be recognizably specific rather than a reusable AI template?
- Does one memorable signature exist, with enough restraint around it?
- Can at least three design choices be traced directly to observed source facts?
- Is the direction bespoke unless the user explicitly chose a preset, with no silent preset inheritance?
- If an official preset is used, was it selected by source and message fit after inspecting its showcase and full `FRAME.md`?
- Does the film preserve one coordinated invariant spine while allowing layouts and treatments to respond to each beat?
- Are preset relationships preserved without copying showcase layouts, demo content, or ornamental metadata?
- Are all deviations from a user-selected preset or approved project `FRAME.md` explicit and justified, and was gallery browsing kept optional?
- Do typography, color, shape, spacing, media, captions, and motion feel authored by the same hand?
- Are every chosen font face and weight locally available, staged when needed, licensed, and appropriate for the language and role?
- Does every structural device encode meaning rather than decorate empty space?
- Does motion express the relationship—draw, branch, compare, replace, accumulate, focus, or resolve—rather than defaulting to fade-and-slide?
- Does each major treatment visibly respond to a human, semantic, or source event rather than an arbitrary timestamp?
- Does every intervention have a cue chain and a complete entrance, development, hold, resolution, and handoff rather than one simultaneous card entrance?
- Do source framing changes preserve spatial memory, settle long enough to help, and yield to stable picture-in-picture or split layouts when explanation needs sustained parallel attention?
- Are hard edges reserved for focus while secondary surfaces soften or dissolve without reducing legibility?
- Does motion preserve origin, direction, momentum, follow-through, and recovery instead of feeling mechanically triggered?
- Is there at least one intentional, content-specific human trace and no fake imperfection used as decoration?
- Did the direction reject cream-serif-terracotta, paper-grid, broadsheet microchrome, and other fashionable defaults unless the source specifically supports them?
- Does every official HyperFrames item have a semantic job and contain no demo residue?
- Are quiet, support, and hero states visibly distinct without breaking the system?
- Does the important-frame contact sheet vary silhouette, scale, spatial mode, and source/graphic balance instead of repeating one floating card?
- At the final aspect ratio, is the focal point immediate and all critical text readable?
- In recut, do snapshots keep people, products, screens, source text, burned-in source subtitles, and platform UI unobstructed throughout motion while planned captions remain topmost and readable over changing backgrounds?

Inspect representative snapshots at the final output ratio. Compare the frame to `FRAME.md`, remove one unnecessary accessory, and fix inconsistency before render.

## Ownership and boundaries

- Own visual thesis, taste, typography, palette, spatial grammar, caption identity, media treatment, motion temperament, official-library recommendations, `FRAME.md`, and visual consistency review.
- Let `vidmuse-create` or `vidmuse-recut` own story, beat selection, timing, packaging density, and final film decisions.
- Let `vidmuse-assets` own asset identity, provenance, licensing, and sourcing policy.
- Let `vidmuse-media` perform generation, download, conversion, grading, crop, or other media operations.
- Let `vidmuse-motion` own semantic choreography and speech synchronization. Let `hyperframes-registry` discover and install items, `hyperframes-core` build the composition, and `hyperframes-animation` implement approved motion.
- Do not start HyperFrames Studio, preview, or Timeline UI. Do not select, download, or run HyperFrames-managed AI or local media models.
- Do not render or invoke general VidMuse CLI operations here.
