---
id: line-carry-transition
title: Line-carry scene transition
tags: [shot, transition, svg, throughline, create]
production_cost: medium
registry_required: false
recut_ok: false
---

# line-carry-transition

## When

- A drawn line / stroke / underline is the film's `hero_throughline` and must
  **carry the viewer across a beat boundary** instead of an anonymous
  crossfade.
- Beat plans whose `transition_in` is owned by a persistent graphic element.

## Avoid

- Drawing a line inside one beat that dies at the beat edge (decoration, not
  a throughline).
- The line changing style (weight/gradient) mid-flight with no intent.
- Two overlapping carry lines.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `path_el` | string | selector of one continuous SVG path spanning both compositions |
| `depart_label` | string | scaffold label in the outgoing beat where the draw accelerates |
| `arrive_label` | string | label in the incoming beat where the line docks (edge of a card, underline, orbit) |
| `swap_style` | string | how the outgoing content leaves **behind** the line: `wipe` \| `push` \| `defocus` |

## Compose

| | |
| --- | --- |
| **rules** | `svg-path-draw` |
| **registry_optional** | [] |

## Steps

1. One SVG path crossing the full frame; `stroke-dasharray/-offset` prepared
   with exact `getTotalLength()`-equivalent constants (deterministic).
2. Draw-on with `strokeDashoffset` tween starting at `depart_label`
   (`power2.inOut`) — transform/stroke only, never layout.
3. As the head of the line travels, the **transition executes behind it**:
   outgoing beat content wipes/pushes/defocuses in the line's wake
   (clip-path inset or masked wrapper keyed to the same timeline position).
4. Line docks at `arrive_label`: its end becomes a real element of the new
   beat (border edge, underline, orbit ring) — set the incoming element's
   stroke/border to continue the exact gradient so the weld is invisible.
5. Trailing tail fades to the line's resting opacity; the docked segment
   persists (throughline held).

## Forbid

- Drawing the line *and* crossfading the whole frame anyway (double
  transition).
- Dashoffset animation on a path that also gets transformed per-frame
  (shimmering artifacts).
- Killing the line with `autoAlpha: 0` after docking.

## Verify

| time | expect |
| --- | --- |
| depart_label + 0.2s | line head visibly traveling; old content starts yielding |
| boundary | no frame where both beats are fully opaque on top of each other |
| arrive_label + 0.3s | line docked as a structural element of the new beat |
