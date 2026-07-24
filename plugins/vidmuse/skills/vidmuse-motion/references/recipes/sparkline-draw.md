---
id: sparkline-draw
title: Sparkline / retention path draw
tags: [dataviz, line, chart, sparkline, svg, trend]
production_cost: medium
registry_required: false
recut_ok: false
---

# sparkline-draw

## When

- Communicate **shape of a series** (retention, realtime curve), not every y-value.
- One primary series per beat.

## Avoid

- Unlabeled fake precision to decimals when VO never said them.
- Animating dozens of series at once.
- Optional scrub cursors unless you also load `chart-scrub-readout`.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `path_d` | string | SVG path for the line (precomputed) |
| `area_d` | string? | closed path for soft fill under line |
| `duration_s` | number | default `1.4–1.6` |
| `grid_labels` | string[] | High/Avg/Low etc.; must meet contrast |

## Compose

| | |
| --- | --- |
| **rules** | `svg-path-draw` |
| **related** | `chart-scrub-readout` only if scrub needed later |
| **registry_optional** | [] |
| **example** | `examples/dataviz-semantic/index.html` (`#spark-line`) |

## Steps

1. Static grid lines + axis labels (SVG `<text>` or HTML). Label fill opacity on dark bg **≥ ~0.7** for check AA.
2. Line path: `const len = line.getTotalLength();`  
   `strokeDasharray = len; strokeDashoffset = len` (initial hidden).
3. Soft area path under line starts `opacity: 0`.
4. End marker dot `opacity: 0`, `scale: 0`.
5. Tween `strokeDashoffset → 0` with `power2.inOut` over duration.
6. Fade area in mid-draw (~+0.55s).
7. Pop dot at end (`back.out` mild OK on marker only).
8. Hold ≥0.8s.

## Forbid

- Drawing by shuffling random points each seek.
- Hiding axis labels to dodge contrast (fixgrant fail).
- CSS transitions on stroke-dash (not seek-linked).

## Verify

| time | expect |
| --- | --- |
| mid-draw | partial stroke visible |
| end | full curve + dot + area; labels legible |

Suggested snapshot on trio demo: ~5.5s, ~8s.
