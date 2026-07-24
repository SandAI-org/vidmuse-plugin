---
id: cue-paced-reveal
title: Cue-paced sequential reveal
tags: [shot, reveal, vo-pacing, create, anti-ppt]
production_cost: low
registry_required: false
recut_ok: false
---

# cue-paced-reveal

## When

- A beat names several things in VO (features, inputs, steps) and each must
  appear **when it is spoken**, not all at t=0.
- The direct fix for the PPT signature: "everything staggers in during the
  first second, then the frame freezes while VO catches up."

## Avoid

- One `stagger` call that finishes long before the last cue is spoken.
- Reveal order that differs from spoken order.
- Filling silence between cues with screensaver drift — settled elements
  hold still (long-tail settle), the **next cue** brings the next motion.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `cues` | list | `{text, t}` absolute seconds from `film-plan.resolved.json` (ATA-resolved, never guessed) |
| `elements` | list | one selector per cue, same order as spoken |
| `entrance_axis` | string | per element; vary family across the beat (slide / scale / mask / draw) |
| `settle_s` | number | default `0.45–0.7`; element is fully readable ≤0.3s after its cue |

## Compose

| | |
| --- | --- |
| **rules** | `dynamic-content-sequencing`, `discrete-text-sequence` |
| **registry_optional** | [] |
| **pairs with** | scaffold labels from `vidmuse-create/scripts/shot_scaffold.py` |

## Steps

1. Lock the fully-revealed static layout in CSS first; every element sits at
   its final position (hero-frame review judges this state).
2. For each cue `i`: `tl.fromTo(elements[i], {…hidden…}, {…final…, duration: settle_s}, cues[i].t - 0.1)` —
   position by absolute time or the matching window label (`"bXX.wY"`).
3. Vary the entrance family across elements (≥2 families inside the beat;
   ≥3 across the film) — same *timing discipline*, different *motion*.
4. Already-revealed elements may dim/scale-down slightly (≤6%) when a new
   element takes focus — one focus at a time, ≤3 active subjects.
5. After the last cue, hold the resolved composition for the read
   (the plan's terminal `hold` window) — no exit tweens; the next beat's
   transition owns the exit.

## Forbid

- Revealing element `i+1` before cue `i+1` "to keep things moving".
- A shared `y+30 / opacity / power2.out` clone for every element.
- Re-hiding elements to re-reveal them for fake activity.

## Verify

| time | expect |
| --- | --- |
| cue[i] − 0.3s | element i not yet (or barely) present |
| cue[i] + 0.4s | element i fully readable; earlier elements still on stage |
| beat end − 0.2s | complete composition, still, readable |

`check_motion.py` R2 samples exactly these crossings on the render.
