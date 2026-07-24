# Taste data

Active aesthetic selection has two legitimate surfaces.

## Compositional (default)

- `style-atoms.jsonl` — single-dimension choices. Each record changes one design
  decision and never owns exact runtime tokens or effect ids.
- `style-profiles.jsonl` — reviewed combinations of atom ids. Profiles are
  references and candidate anchors, not templates to copy.
- `patterns.jsonl` — editorial expression structures.
- `cases.jsonl` — precedent and review evidence.

## Official kits (preset-friendly)

Mapped into the same `taste.py` browse surface:

| file | kind | what it is |
| --- | --- | --- |
| `style-packs.jsonl` | `style-pack` | 12 premade frames from [hyperframes.dev/design](https://www.hyperframes.dev/design); each points at a vendored `library/frame-packs/<name>/FRAME.md` and carries `anchor_atoms`, `default_motion`, and `effect_affinity` so Agent can adopt the look and cast Registry effects |
| `example-kits.jsonl` | `example-kit` | Official `npx hyperframes init --example` starters — structure & motion grammar references (demo content is locked) |
| `showcase-kits.jsonl` | `showcase-project` | HeyGen launch compositions (hyperframes-launches) — production multi-act / multi-runtime references, not talking-head packs |

## Effect overlay

- `effects-overlay.jsonl` — editorial and compatibility metadata over the live
  HyperFrames Registry. Exact effect selection after a pack is chosen is
  constrained by that pack's `effect_affinity.prefer` / `.avoid`.

Exact colors, fonts, type scale, motion values, and selected effects for a film
belong only in the project's authored `FRAME.md`.
