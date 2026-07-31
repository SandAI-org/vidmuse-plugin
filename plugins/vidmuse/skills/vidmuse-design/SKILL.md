---
name: vidmuse-design
description: >
  Own VidMuse visual direction for film workflows: private taste atoms and
  profiles, preset frame packs, project FRAME.md, caption identity, treatment
  design, and the real-footage frame-showcase gate. Load inside
  vidmuse-recut or vidmuse-create when a film needs a visual system, or for an
  explicit request to inspect or revise a VidMuse film's design direction.
  Return the approved design artifacts to the owning film workflow. Do not
  route films, source semantic media assets, choose editorial timing, implement
  animation mechanics, or render.
---

# VidMuse Design

Create one inspectable visual authority for a VidMuse film without loading the
whole design library into context. This is a capability skill: the active
`vidmuse-recut` or `vidmuse-create` workflow owns the film and calls this skill
only for its direction layer.

All design intelligence and preset bytes used by this capability live under
this skill. Runtime decisions must not depend on another creative skill.
Historical source fields in the catalog are provenance, not runtime imports.

Run the commands below from this skill directory. Film artifacts still belong
under the owning project's work directory.

## Ownership

| Decision or artifact | Owner |
| --- | --- |
| Audience, proposition, chapters, beats, intervention timing, quiet passages | active film workflow |
| Semantic logos, icons, photos, fonts, licenses, local asset receipts | `vidmuse-assets` + `media-use` |
| Visual direction, tokens, treatment grammar, caption identity, showcase | `vidmuse-design` |
| Effect mechanism and Registry installation | active film workflow + `hyperframes-registry` |
| Seek-safe composition and animation implementation | HyperFrames technical skills |
| Timeline, evaluation, render, final delivery | active film workflow |

Do not reopen routing or rewrite editorial coverage. Consume the workflow's
BRIEF, source analysis, representative frames, packaging/film plan, approved
asset references, aspect, and density budget; return `FRAME.md` and
`frame-showcase.html`.

## Context discipline

Load only the slice needed for the current decision:

| Need | Read or run |
| --- | --- |
| What good means and who wins conflicts | `references/aesthetic-charter.md`, then `references/taste-authority.md` |
| Choose Preset vs Composed and author tokens | `references/style-composition.md` |
| Resolve frame composition, type, or motion character | `references/video-frame-craft.md`, `references/typography-craft.md`, or `references/motion-temperament.md` |
| Run the fresh-project three-direction gate | `references/direction-picker.md` and `templates/direction-picker.html` |
| Inspect available looks | run `scripts/taste.py --index` for one domain |
| Inspect a candidate | run `scripts/taste.py <ids> --get --domain <domain>` |
| Validate project design tokens | run `scripts/frame_md.py <project>/FRAME.md --check` |
| Confirm direction on real footage | `references/frame-showcase.md` |
| Check the implementation against the authority | `references/design-adherence.md` |
| Design captions, information devices, or layout | only the applicable craft reference |
| Diagnose visual/temporal template tells | only the relevant sections of `references/packaging-tells.md` |

Scripts may read the complete JSONL catalog mechanically; their compact output
is the context surface. Do not open every JSONL record, every preset, or every
showcase HTML in the model context.

## 1. Establish inputs

Require enough owner-supplied evidence to make a grounded visual decision:

- project brief and audience;
- source or subject grounding;
- representative real frames when footage exists;
- transcript or locked copy;
- `film_mode`: `recut-packaging`, `recut-director`, or `create`;
- `create_path` when `film_mode: create`;
- aspect and caption band;
- planned treatment classes and intervention density;
- verified brand/media assets when relevant.

If the owner has not decided coverage or timing yet, return control instead of
using visual style to invent the film plan.

## 2. Choose the design route

Read `references/style-composition.md`.

### Preset

Use when the user names or approves a ready look:

```bash
python3 scripts/taste.py --index --domain packs
python3 scripts/taste.py pack:<id> --get --domain packs
```

After selection, read only the record's `source.resolved_frame_md`. Use the
other `source.resolved_*` fields for its caption skin and optional showcase.
The portable `source.frame_md` and siblings are relative to
`source.skill_root`; never resolve them against the caller's cwd. Open a
packaged showcase only when a visual precedent is necessary; it is never
composition input.

### Composed

Use when the film needs a source-specific system:

```bash
python3 scripts/taste.py --index --domain atoms
python3 scripts/taste.py --index --domain profiles
python3 scripts/taste.py <shortlist> --get --domain profiles
python3 scripts/taste.py <selected-atoms> --get --domain atoms
```

Name the obvious category rut before selecting. Use zero or one profile anchor,
derive exact tokens from the film evidence, and record why serious alternatives
lost. Profiles are precedents, not token templates.

Read only the craft references needed by the decision. For every fresh Recut
project without a previously approved named look, follow
`references/direction-picker.md` before authoring `FRAME.md`. The user's choice
from the single three-candidate `frame-showcase.html` is the only blocking
direction stop. Self-selection is allowed only when the user explicitly asks
VidMuse to auto-select the visual direction; a general autonomous or
"show me what you can do" request is not enough. Skip the comparison only for
a pre-approved direction/preset or a resumed project with an approved
`FRAME.md`. Fixed palette rows in `data/palettes/` are exploration seeds, never
defaults or a replacement for source-derived color.

## 3. Author the project authority

After the direction is selected, write `<project>/FRAME.md` using schema
`vidmuse.design.frame.v1` and the contract in
`references/style-composition.md`. It is the sole authored token law for:

- colors, type, spacing, material and depth;
- motion temperament rather than implementation tweens;
- component and treatment grammar;
- captions, safe zones, aspect behavior and signature move;
- Director-only film spine and act-world differences when supplied by owner.

Validate its mechanical shape:

```bash
python3 scripts/frame_md.py "<project>/FRAME.md" --check
```

The validator proves shape, not taste.

## 4. Prove it on real content

Read `references/frame-showcase.md`. Author
`<project>/frame-showcase.html` from `FRAME.md` tokens and real project
content. When the file already carried the three-direction gate, keep that
comparison visible, mark the winner, and append the selected direction's full
proof surface in the same file; do not replace it or emit a second HTML. For
footage-led films, use real keyframes from the exact treatment ranges. Show two
or three caption identities, the recommended aspect/layout, and the planned
density.

Run the counted Taste Gate before presenting. Apply feedback to `FRAME.md`
first, then update the showcase so the two artifacts cannot disagree.
Before handoff, apply `references/design-adherence.md` to the representative
artifact.

## 5. Return control

Report to the owning workflow:

- mode: `preset` or `composed`;
- selected anchor or explicit no-anchor;
- footage/subject evidence behind the direction;
- `FRAME.md` and `frame-showcase.html` paths;
- the successful `frame_md.py --check` report;
- recommended caption identity, aspect/layout, and density;
- pack `effect_affinity` or treatment constraints the implementation must
  respect;
- unresolved direction questions or failed gate items.

Do not select final effect code, change beat timing, render, or claim film
approval. Registry-reference integrity is a plugin-maintenance seam owned by
`vidmuse-recut/scripts/effects.py --check-affinity`; Design does not load that
implementation during a film task.
