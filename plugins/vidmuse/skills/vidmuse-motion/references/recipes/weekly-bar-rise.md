---
id: weekly-bar-rise
title: Weekly / category bar rise
tags: [dataviz, bars, growth, weeks, stagger]
production_cost: medium
registry_required: false
recut_ok: false
---

# weekly-bar-rise

## When

- Show **ordered categories** rising (weeks, tiers, stages).
- Viewer’s job is trend/accumulation, not reading a spreadsheet.

## Avoid

- >8 bars in one beat.
- Tweening `height` / `width` for growth (use **scaleY**).
- Leaving bars at full height before the motion beat (false “growth”).

## Inputs

| key | type | notes |
| --- | --- | --- |
| `labels` | string[] | e.g. W1…W6 |
| `values` | number[] | same length; drives **CSS height**, not GSAP height |
| `value_labels` | string[] | e.g. "3 days" |
| `stagger_s` | number | default `0.08` |
| `bar_dur_s` | number | default `0.75` |

Map max(values) → max pixel height (e.g. 300px); others proportional. Heights are **layout constants**.

## Compose

| | |
| --- | --- |
| **rules** | `stat-bars-and-fills` (Growth Bars section) |
| **registry_optional** | [] |
| **example** | `examples/dataviz-semantic/index.html` (`#bars`) |

## Steps

1. Flex row `align-items: flex-end`; each `.bar` has inline/CSS **height** in px.
2. Gradient/fill from FRAME accent. `transform-origin: bottom center` in CSS is OK; **do not set `transform:` in CSS**.
3. At timeline build:  
   `gsap.set(bars, { scaleY: 0, transformOrigin: "bottom center" })`.
4. Hide value labels (`opacity: 0`) until bars ≥80% up.
5. `tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration, ease: "power3.out", stagger, immediateRender: false }, t0)`.
6. Fade value labels with same stagger, delay ~0.45s; week labels earlier/opac in.
7. Hold full chart ≥0.8s.

## Forbid

- CSS `transform: scaleY(0)` combined with GSAP scale (lint: `gsap_css_transform_conflict`).
- Relying only on `immediateRender: false` without `gsap.set` when `t0 > 0`.
- Overshoot ease on sober metrics (`back.out` reserved for playful brand).

## Verify

| time | expect |
| --- | --- |
| just before t0 | bars not fully FETI—should be empty/hidden if set correctly |
| t0 + bar_dur + stagger*n | all bars full; labels readable |

Suggested snapshot on trio demo: ~3.2s.
