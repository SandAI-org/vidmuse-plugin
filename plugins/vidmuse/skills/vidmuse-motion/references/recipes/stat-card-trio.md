---
id: stat-card-trio
title: Stat card trio orchestration
tags: [dataviz, cards, layout, entrance, orchestration]
production_cost: low
registry_required: false
recut_ok: false
---

# stat-card-trio

## When

- Three (or two) **evidence cards** share one beat or one scene: KPI + bars + line,
  or three variants of the same system.
- Need a single chassis so child recipes do not fight on layout.

## Avoid

- More than three fullscreen cards at once on 1080p without design intent.
- Each card using a different entrance grammar (chaos).
- Using this alone without child content recipes.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `card_ids` | string[] | DOM ids of cards |
| `child_recipes` | string[] | e.g. kpi-glow-count, weekly-bar-rise, sparkline-draw |
| `stagger_s` | number | default `0.12` |
| `gap_px` | number | default `36` |

## Compose

| | |
| --- | --- |
| **rules** | entrance via simple from opacity/y/scale (no special rule id required); optional `spring-pop-entrance` if playful |
| **blueprint** | `dataviz-countup` multi-instrument framing (optional) |
| **children** | nest other motion-recipes on each card |
| **example** | `examples/dataviz-semantic/index.html` (`.stage`) |

## Steps

1. Flex `.stage` center; each `.card` fixed width/height; FRAME radius/border/surface.
2. `gsap.set(cards, { opacity: 0, y: 40, scale: 0.96 })`.
3. `tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out", stagger }, 0.15)`.
4. **Sequence child recipes in reading order** (L→R or as VO):  
   - start child beats **after** cards are mostly visible (~0.5s+)  
   - or stagger children if VO is sequential and film plan wants one hero at a time (then consider full-bleed single card instead of trio).
5. Global `data-duration` must cover last child hold.

## Forbid

- Animating `.clip` display/visibility.
- Different gap/radius systems per card unless FRAME defines variants.
- Starting heavy child path-draw before card opacity > 0.5 (feel of jank).

## Verify

| time | expect |
| --- | --- |
| ~0.5s | cards rising in |
| after children | all three final states readable in one frame |

Gold trio demo `data-duration="9"` is a verified whole-board orchestrateass.
