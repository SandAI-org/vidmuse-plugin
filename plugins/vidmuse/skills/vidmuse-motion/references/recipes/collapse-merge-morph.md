---
id: collapse-merge-morph
title: Collapse / merge into one hero
tags: [shot, morph, merge, hero, create, anti-ppt]
production_cost: medium
registry_required: false
recut_ok: false
---

# collapse-merge-morph

## When

- Several revealed elements (mode cards, steps, inputs) must **become one
  thing** — a unified control, a summary chip, the product mark — instead of
  fading out so the next slide can start.
- The main tool for keeping a `hero_throughline` alive across beats: the
  hero is *made from* the previous beat's parts, not swapped in.

## Avoid

- Fading the group out and fading the merged element in (that is a slide
  transition wearing a costume — the viewer must see the parts travel).
- Merging while a VO cue still needs one part readable.
- More than one merge per beat.

## Inputs

| key | type | notes |
| --- | --- | --- |
| `parts` | list | selectors of the elements that collapse |
| `target` | string | selector of the merged hero (pre-laid-out, hidden) |
| `merge_window` | string | scaffold label `bXX.wY` of the planned morph window |
| `travel_s` | number | default `0.7–1.0`; stagger parts by `0.05–0.09` |

## Compose

| | |
| --- | --- |
| **rules** | `card-morph-anchor`, `scale-swap-transition` |
| **registry_optional** | [] |

## Steps

1. Lay out `target` at its final position in CSS, `autoAlpha: 0`.
2. Compute each part's delta to the target center once (`getBoundingClientRect`
   at build time or hand-measured constants — deterministic, no `Math.random`).
3. At the merge window label: tween each part `x/y → delta, scale → 0.2–0.35,
   autoAlpha → 0.9` with `power3.inOut`, small stagger, **converging** paths.
4. Cross the handoff at ~70% travel: `target` scales up `0.8 → 1` and fades in
   while parts finish shrinking into it — one continuous mass, no dead frame.
5. Optional single accent on landing (glow pulse / 2% overshoot) — once.
6. Target then **persists** into the next window/beat as the throughline
   carrier; do not delete it at beat end.

## Forbid

- `display: none` swaps mid-merge (kills seekability).
- Parts flying off-screen instead of into the target.
- A second "bounce" after the landing accent.

## Verify

| time | expect |
| --- | --- |
| merge start + 0.2s | parts visibly in flight toward one point |
| merge end | single hero readable; no leftover ghost parts |
| next window | the merged hero still on stage (throughline held) |
