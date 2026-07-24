---
id: kpi-glow-count
title: KPI glow count-up
tags: [dataviz, kpi, counter, glow, money]
production_cost: medium
registry_required: false
recut_ok: false
---

# kpi-glow-count

## When

- One **hero metric** (revenue, users, %) must land as the emotional proof.
- VO/on-screen claim is a single number the viewer should remember.

## Avoid

- More than one simultaneous hero count in the same frame.
- Inventing the number; bounce/overshoot on evidence metrics.
- Animating `font-size` (causes reflow). Use **scale**.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `label` | string | e.g. "My Monthly AdSense Income" |
| `prefix` | string | e.g. `"$"` |
| `value` | number | integer preferred; from user/script |
| `duration_s` | number | default `1.5–1.8` |
| `start_scale` | number | default `0.72` |

## Compose

| | |
| --- | --- |
| **rules** | `counting-dynamic-scale` |
| **blueprint** | `dataviz-countup` (optional framing) |
| **registry_optional** | [] |
| **example** | `examples/dataviz-semantic/index.html` (`#kpi`) |

## Steps

1. Layout final type size in CSS on `.kpi` (`font-size` static). `tabular-nums`.
2. Fixed-width `.kpi-wrap` so digit growth does not shift layout.
3. Glow via layered `text-shadow` (decoration). **Solid `color` must pass contrast** on the card background (prefer light lavender/white on dark, e.g. `#e9d5ff`).
4. `gsap.set(kpi, { scale: start_scale, opacity: 0 })`.
5. Same-time tweens (`power2.out`, ~1.65s):
   - proxy `{ value: 0 → target }` with `onUpdate` → `prefix + Math.round(v).toLocaleString()`
   - `scale: start_scale → 1`
   - short opacity fade-in 0.25s
6. Hold final readout ≥0.8s.

## Forbid

- CSS `transform` on the same element GSAP scales (lint conflict).
- `Math.random` decor around digits.
- Karaoke-ing every digit.

## Verify

| time | expect |
| --- | --- |
| mid-count | partial number visible, readable |
| end | exact final formatted value, scale 1, hold |

Suggested snapshot: mid (~1.5s on 9s trio demo), end of count.
