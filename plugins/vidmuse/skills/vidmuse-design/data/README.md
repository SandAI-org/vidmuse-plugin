# Taste data

Active aesthetic selection has two legitimate surfaces.

## Compositional (default)

- `style-atoms.jsonl` — single-dimension choices. Each record changes one design
  decision and never owns exact runtime tokens or effect ids.
- `style-profiles.jsonl` — reviewed combinations of atom ids. Profiles are
  references and candidate anchors, not templates to copy.

## Private VidMuse kits (preset-friendly)

Mapped into the same `taste.py` browse surface:

| file | kind | what it is |
| --- | --- | --- |
| `style-packs.jsonl` | `style-pack` | 13 private, locally vendored frame packs; each points at `library/frame-packs/<name>/FRAME.md` and carries `anchor_atoms`, `default_motion`, `workflow_fit`, and `effect_affinity` so Agent can adopt the look and cast Registry effects |
| `example-kits.jsonl` | `example-kit` | Optional registry precedents for structure and motion grammar; provenance only, never required design input |
| `showcase-kits.jsonl` | `showcase-project` | HeyGen launch compositions (hyperframes-launches) — production multi-act / multi-runtime references, not talking-head packs |

`effect_affinity` is a design-to-implementation handoff. Design validates its
shape; plugin maintenance runs `vidmuse-recut/scripts/effects.py
--check-affinity` against a live or saved Registry catalog. This skill does not
load or own effect implementations.

Exact colors, fonts, type scale, motion values, and selected effects for a film
belong only in the project's authored `FRAME.md`.

`palettes/*.md` contains optional, privately owned color seeds grouped by
communicative register. They are indexed read-only by `vidmuse-assets`; use
them only when a user asks for options or source evidence does not provide a
better palette.
