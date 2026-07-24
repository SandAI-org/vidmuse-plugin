---
id: ui-strip-away-lock
title: UI strip-away brand lock
tags: [shot, outro, cta, branding, create]
production_cost: medium
registry_required: false
recut_ok: false
---

# ui-strip-away-lock

## When

- Endings/CTAs where the product surface must **resolve into** the brand:
  interface layers exit by semantic group until only mark + payoff remain.
- Replaces the "black slide with centered logo fades up" ending.

## Avoid

- Cutting to a fresh CTA composition that shares nothing with the previous
  beat (orphan ending).
- Stripping in random order — order is an argument: chrome → periphery →
  content → control, so the last thing standing is the thing that matters.
- Payoff lines appearing all at once when the plan cues them phrase-by-phrase.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `layers` | list | selectors in strip order (each = one semantic group) |
| `keeper` | string | selector of the surviving element (mark / capsule) that becomes the lock anchor |
| `payoff_cues` | list | `{text, t}` from the resolved plan — one tween per phrase |
| `exit_style` | string | `perimeter` (default: layers leave away from keeper) \| `dissolve-depth` |

## Compose

| | |
| --- | --- |
| **rules** | `scale-swap-transition`, `ambient-glow-bloom` |
| **registry_optional** | [] |

## Steps

1. The outgoing beat's real UI stays on stage into this beat (throughline);
   the strip works on those live elements, not a re-built copy.
2. Strip layers in order with short overlaps (`0.25–0.4s` each, stagger
   `0.12–0.2`): move **away from the keeper** + fade — direction encodes
   "everything folds back into the product".
3. `keeper` travels/scales to its lock position **while** stripping — one
   continuous move, arriving as the last layer leaves.
4. Payoff builds per `payoff_cues`: one tween per phrase at its cue time
   (weight/reveal — not the same fade for each phrase).
5. Lock: rule/URL/button enter in ≤2 quiet moves; final hold is genuinely
   still (terminal `hold` window — this stillness is the point).

## Forbid

- `autoAlpha: 0` on the whole previous section as "strip" (that is a fade).
- Confetti/particle spam at the lock.
- Any motion after the final payoff settle (the hold is sacred).

## Verify

| time | expect |
| --- | --- |
| strip start + 0.3s | first layer visibly leaving; keeper already moving |
| mid | keeper mid-flight, frame getting quieter each step |
| payoff_cues[i] + 0.3s | phrase i readable; phrase i+1 not yet |
| end − 0.2s | mark + payoff + CTA only, perfectly still |
