# Shot cards (video-shotcraft bridge)

Curated **motion recipe** priors for `/vidmuse-create`. Source knowledge from
[video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (Apache-2.0).
See [NOTICE.md](NOTICE.md).

| | |
| --- | --- |
| **Upstream catalog** | 106 recipe cards |
| **This extract** | **32** cards (create-first subset) |
| **Executable code** | none — HyperFrames/GSAP at assemble time |
| **Previews** | https://vincentwei1021.github.io/video-shotcraft/ (external) |

## Layout

```text
shot-cards/
├── NOTICE.md
├── README.md                 # this file — agent menu
├── bridge.jsonl              # compact index (always read this first)
└── cards/<id>.md             # full recipe text (read after shortlist)
```

## When the agent opens this deck (auto)

**SSOT:** open/close rules — including promo auto-open,
`data-beat` **optional on explainer**, Vox closed, recut never — live only in
[../path-routing.md](../path-routing.md) § *Shot-card deck policy*.
Do not maintain a second open-list here.

This extract sets `recut_ok: false` on all cards. Mode default: **auto** when
path-routing says open. User may say `shot-cards off`.

## How to shortlist (agent)

```bash
# from skills/vidmuse-create/
python3 scripts/shot_cards.py --index
python3 scripts/shot_cards.py --recipe recipe:saas-promo-30s
python3 scripts/shot_cards.py deck-deal-flyin,spotlight-hero-card --get
```

Rules:

1. Read `bridge.jsonl` via `scripts/shot_cards.py --index` (or `--recipe`).
2. Shortlist **≤5** ids per film; **≤1** with `production_cost: very-high`.
3. Prefer **one signature** proof family; vary transitions/type lightly.
4. For each shortlisted id, read `cards/<id>.md` **before** writing GSAP —
   parameters and 已知坑 are the truth, not the card name alone.
5. Write into film plan beats as:
   `shot_ref: shotcraft:<id>` + one-line why + HF implement note.
6. Map using bridge fields:
   - `hf_blueprint` → load that blueprint if useful
   - `registry_hypotheses` → verify with `effects.py` then `hyperframes add`
   - else compose native GSAP from recipe parameters
7. **FRAME skins everything.** Do not ship ink/amber paper look unless the
   product world is that look.
8. Record chosen refs in `video-context.json` → `shot_refs: ["shotcraft:…"]`.

## Role legend

| role | job on the arc |
| --- | --- |
| `open` | cold open / brand entrance energy |
| `proof` | product UI or capability proof (hero material) |
| `type` | title / kinetic line treatments |
| `data` | numbers, charts, live readouts |
| `transition` | scene-to-scene handoff |
| `outro` | strip-to-logo / brand resolve |

## Extract inventory (32)

| role | count | ids |
| --- | ---: | --- |
| open | 4 | brand-frame-snap, brand-ink-open, crane-rise-reveal, dataviz-landscape-open |
| proof | 14 | spotlight-hero-card, neon-frame-orbit-drop, deck-deal-flyin, row-embed, command-palette-summon, scroll-brake-moves, panel-grid-moves, list-stack-press, skeleton-reveal, ai-stream-response, collab-cursor-moves, card-flip-reveal, before-after-slider-scrub, integration-hub-map |
| type | 5 | letterspace-materialize, gradient-word-sweep, marker-underline-title, slam-entrance-moves, scene-locked-title |
| data | 2 | odometer-digit-roll, chart-live-moves |
| transition | 5 | circle-match-iris, color-block-step-wipe, wipe-transitions, bottom-push-stack-wipe, line-carry-transition |
| outro | 2 | ui-strip-away-outro, ui-to-brand-morph |

## Non-goals

- Not a second skill entry and not a Remotion project.
- Not a dump of all 106 upstream cards (expand bridge deliberately).
- Gallery mp4s are **never** vendored into the plugin zip.
