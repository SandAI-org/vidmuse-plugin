---
id: pullback-reveal
title: Detail-first pullback reveal
tags: [shot, camera, reveal, opener, create]
production_cost: medium
registry_required: false
recut_ok: false
---

# pullback-reveal

## When

- Hooks and product entrances: start **inside** a detail (a waveform, one UI
  control, one word) and pull back to reveal what it belongs to.
- Replaces the "title card fades up on black" opener.

## Avoid

- Starting on the full composition and zooming *in* (reads as screensaver).
- Pulling back to a frame that was never designed as a poster — lock the
  end-state layout first.
- Continuous zoom for the whole beat; the pullback is **one** move with a
  start, an arrival, and a settle.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `stage` | string | selector of the camera wrapper (single transform parent) |
| `from` | object | `{scale: 2.2–3.5, x, y}` framing the detail at t=0 |
| `arrive_label` | string | scaffold label where the wide frame must be readable |
| `ease` | string | default `power2.inOut`; `expo.out` for a snap-arrival |

## Compose

| | |
| --- | --- |
| **rules** | `multi-phase-camera`, `coordinate-target-zoom` |
| **registry_optional** | [] |

## Steps

1. Build the **wide** end-state layout in CSS (this is the hero frame).
2. Wrap everything that "the camera sees" in one `stage` div;
   `transform-origin` at the detail's coordinates.
3. `gsap.set(stage, from)` — first frame is already inside the event; no
   fade-from-black unless the plan says `cut` from black.
4. One tween `stage → {scale: 1, x: 0, y: 0}` ending at `arrive_label`
   (duration = window span). Transform + opacity only — no layout props.
5. Elements that only make sense wide (headline, chrome) reveal **during**
   the pullback at their cue times, not after arrival.
6. Arrival settle: ≤0.3s micro-ease (98%→100%), then stillness for the hold.

## Forbid

- Zoom on a raster screenshot past its native resolution (blurry proof).
- Rotating the stage while pulling back (nausea camera).
- A second pullback in the same film without written intent.

## Verify

| time | expect |
| --- | --- |
| t=0 | detail fills frame, already legible — no empty black |
| mid-pullback | context growing; motion continuous, single direction |
| arrive_label | wide poster frame readable and still |
