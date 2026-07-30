# Layout Vocabulary

How cards and the source video share the canvas. Distilled from upstream `talking-head-recut` (provenance: distilled:talking-head-recut) — this is engineering vocabulary, not design direction; which layouts a given video uses is decided by the design system and edit plan.

## Canvases

| aspect | canvas | notes |
| --- | --- | --- |
| 16:9 | 1920 × 1080 | landscape source, TV / YouTube / desktop |
| 9:16 | 1080 × 1920 | portrait / short-form mobile |
| 4:5 | 1080 × 1350 | feed near-portrait; derive bounds from portrait by scaling vertical values × 1350/1920 ≈ 0.703 |

Recommend from the source aspect: `width/height ≥ 1.5` → 16:9, `≤ 0.7` → 9:16, else 4:5.

## Zones (card placement)

Resolve each slot's `zone` into pixel bounds on the card-host wrapper:

| zone | resolved bounds | use |
| --- | --- | --- |
| `fullscreen` | whole canvas | hero moments, big numbers, statements |
| `whiteboard-area` | inset 40px margin (landscape) or bottom 45% (portrait) | dense data, annotated content |
| `lower-third` | bottom 30% band | annotation over visible video |
| `side-panel` | right 42% (landscape) or bottom 40% (portrait) | data beside speaker |
| `video-overlay` | full canvas, mostly-transparent card | glass layer on full-bleed video |

### The caption band is reserved

The bottom-centered caption band is not one of the zones above — it is carved
out before they are resolved. Its geometry per aspect ratio is defined once,
in [captions-and-golden-lines.md](captions-and-golden-lines.md) ("The default
zone is bottom-centered"); do not restate the numbers here or in a slot.

`lower-third` (bottom 30 % band) **overlaps it**. So a lower third either
sits in the part of that band above the caption zone, or takes a beat when no
caption is on screen. Never both in the band at once: two text systems
stacked in the same strip is the collision that pushes captions off their
zone. `whiteboard-area` (portrait) and `side-panel` (portrait) also reach
into the band — clear the caption zone from their resolved bounds rather than
relocating the caption.

## Composition layouts (video + effect together)

The source `<video id="source-video">` must remain a direct child of the root, so
it is not placed inside an animated crop wrapper. Give it fixed full-canvas
geometry and express reframing from the host timeline with compositor-safe
channels: `x`, `y`, `scale`, `clipPath`, `borderRadius`, and `opacity`.

| layout | effect zone | source-video treatment |
| --- | --- | --- |
| `split` | `side-panel` | keep fixed geometry; clip to the speaker side and adjust `x`/`scale` only when the subject requires reframing |
| `stack` | `lower-third` | clip to the upper region while preserving the face and source attribution |
| `pip` | `fullscreen` | scale and translate the full-canvas video into a corner; use `clipPath` when the target window changes aspect; add restrained radius/ring |
| `overlay` | `video-overlay` | full canvas, neutral transform, no decorative chrome |
| hide video | `fullscreen` | fade the source-video opacity or move it fully off-canvas at an explicit beat |

Transition rules:

- Build and snapshot the visible end state for every reframe before adding motion; derive transform values from the actual canvas, source aspect, and subject position rather than copying fixed coordinates.
- Tween `#source-video` visual channels during a gap or deliberate handoff; do not animate `width`, `height`, `top`, or `left`.
- Keep `object-fit:cover`; use `clipPath` and transforms for split/stack/PiP treatment.
- Apply chrome through seek-safe `borderRadius`/shadow/ring treatment without wrapping the media in a timed container.
- Full-bleed layouts suppress decorative chrome; pip carries its own pill treatment.

## Effects sharing canvas with visible video

When the source remains visible behind or beside an effect (`overlay`, `pip`, `lower-third`, `video-overlay`), the effect root must not paint a full opaque background. Opaque backgrounds are appropriate only when the selected panel owns its region or the effect intentionally takes the full frame.

## Intervention budget

Slots are visual interventions, not cards. Every recipe carries a `weight` in the library index; the plan is budgeted by weight, not by count:

| weight | what it is | examples |
| --- | --- | --- |
| `bare-text` | typography directly on footage, no backing surface | calm captions, margin quotes, count-up numbers |
| `emphasis` | a treatment applied to words already on screen | inline keyword color, marker strokes, word glow |
| `line-mark` | hairline graphics anchored to the frame | callout bubbles, index tags, lower-thirds, tracking brackets |
| `camera` | manipulating the source frame itself | push-in, crop punch, spotlight mask, focus zoom |
| `diagram` | drawn structures that develop over time | charts, maps, progress rings |
| `panel-card` | an opaque or near-opaque backing surface with content | editorial notes, compare tables, chapter cards, device stages |
| `grammar` | entrance / exit / transition language, not an intervention itself | rise-settle, stagger builds, dissolves |

In Packaging mode, the budget constrains heavy surfaces only. Light weights (`bare-text`, `emphasis`, `line-mark`, `camera`, `diagram`) carry no count or coverage cap — density is an editorial call, and near-continuous light packaging is a legitimate style:

- `panel-card` slots: **at most 2** per video (scale proportionally past ~5 min), summed duration ≤ **20%** of the video, and never two in a row.
- If the plan has more `panel-card` slots than `camera` + `emphasis` combined, it is a slide deck, not a packaged video.

Director-mode full-frame narrative scenes are complete shots, not panel cards,
and do not count against this limit. They are constrained instead by the act
energy contour, visual-proof requirement, complete timeline coverage, and
source-return/handoff rules in `scene-plan.json`. An opaque card used inside a
Director scene still counts as a panel-card intervention when it behaves like
one; renaming a card a scene does not evade the budget.

A slot holding longer than ~15 s needs internal development (multi-step reveal, staggered sub-points); a static one-liner goes stale past 8 s. When many slots exceed 30 s, split the timeline into sub-compositions per chapter to keep each file's timeline manageable.

## Portrait type scaling

The same pixel size reads smaller on a phone held close. When the canvas is portrait, scale type up from landscape values: titles × 1.35 (up to × 1.4 for heroes), body and labels × 1.3, small meta × 1.2; keep line-height multipliers; floor results to a 4px multiple. Horizontal padding narrows to 24–36 px. For a card that must work in both orientations, prefer container-query `clamp()` sizing over hard-coded pixels.

Caption type scales with body (× 1.3), and the portrait caption band is
already sized for it — the band lifts off the bottom edge rather than growing
downward, so a taller caption grows *upward* inside its zone.
