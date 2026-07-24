# Create path routing

**Purpose:** choose which craft stack loads for a create film. Prevents mixing
Vox/paper-collage production with the HyperFrames-style shot-sequence stack,
and keeps `/vidmuse-recut` completely out of this doc.

**Authority (SSOT):** this file is the **single source of truth** for
`create_path` routing, the non-Vox **beat contract**, non-Vox **hard fails**,
and **shot-card deck open/close** policy. `../SKILL.md`,
[promo-recipes.md](promo-recipes.md), and [shot-cards/README.md](shot-cards/README.md)
must **point here** — do not re-enumerate the contract or fail list elsewhere.
If those files disagree with this one, **this file wins**.

Vox craft lives only in [vox-collage.md](vox-collage.md). Explainer/promo craft
lives in the siblings listed below. Taste / FRAME / Timeline delivery still
come from `../vidmuse-recut/references/`.

## Paths

| path id | when | craft stack | non-Vox hard fails |
| --- | --- | --- | --- |
| **`vox`** | Vox / 纸拼贴 / halftone collage / `collage-broll` / recipes `vox-collage-*` | **only** [vox-collage.md](vox-collage.md) | **off** — do not apply |
| **`explainer`** | knowledge / how-to / listicle / concept / topic from text; default when no product UI hero | [story-design-explainer.md](story-design-explainer.md) → [visual-design.md](visual-design.md) → [motion-language.md](motion-language.md) → [cut-catalog.md](cut-catalog.md) | **on** |
| **`promo`** | product launch, SaaS promo, site-to-video, brand sizzle, UI-as-hero | [story-design-promo.md](story-design-promo.md) → [visual-design.md](visual-design.md) → [motion-language.md](motion-language.md) → [cut-catalog.md](cut-catalog.md) + [shot-cards](shot-cards/README.md) when UI | **on** |

Record on `video-context.json`:

```json
{ "create_path": "explainer" | "promo" | "vox", "structure_recipe": "…" }
```

## Decision order (first match wins)

1. **Vox** — user or film plan names Vox / 纸拼贴 / collage-broll / `vox-collage-*`.
2. **Promo** — URL / live product UI / launch / sizzle / site tour is the brief.
3. **Explainer** — everything else under `/vidmuse-create` that is not a light stub.

Recipe → path (see [promo-recipes.md](promo-recipes.md)):

| recipe | path |
| --- | --- |
| `knowledge-explainer` | explainer |
| `saas-promo-30s` | promo |
| `site-to-video` | promo |
| `brand-sizzle` | promo |
| `hook-proof-outro` | promo (short) or explainer if no product |
| `data-beat` | explainer *or* promo (match surrounding brief); always open **motion** craft (`/vidmuse-motion` / dataviz blueprints) — shot-card deck is **not** auto-required on explainer |
| `vox-collage-broll` / `vox-collage-explainer` | **vox** |

## What each path must load

### `vox` (frozen)

- Read [vox-collage.md](vox-collage.md) only for visual production.
- Still run VidMuse TTS → ATA → Timeline (SKILL voice spine).
- **Do not** require `shot_sequence`, blueprint ids, or non-Vox hard fails.
- **Do not** open shot-cards / frame-preset seed unless the user asks.

### `explainer` / `promo` (anti-PPT craft)

After voice spine + grounding, before HTML:

1. Pick recipe (`promo-recipes.md`) and set `create_path`.
2. Write film plan beats with the **beat contract** (below).
3. Read path story-design → complete arc / roles / cue-cut VO.
4. Read visual-design → every beat gets a time-coded `shot_sequence`.
5. Name motion from motion-language; within-beat seams from cut-catalog.
6. Seed FRAME from brand capture and/or one
   `../hyperframes-creative/frame-presets/<name>/` preset (never blank black + white type as the whole system).
7. Implement HyperFrames/GSAP; deliver on VidMuse Timeline (not HF MP4-only).

## Beat contract (explainer + promo only) — SSOT

Every beat in the film plan **must** carry:

| field | meaning |
| --- | --- |
| `ata_range` | `[start_s, end_s]` from `transcript.json` (never equal slices by default) |
| `path_role` | shared type enum: `hook \| pain_point \| product_intro \| feature_showcase \| benefit_highlight \| social_proof \| branding \| cta` (explainers **repurpose** — see story-design-explainer) |
| `key_message` | one sentence the viewer should leave with |
| `vo_cues` | phrase-segmented cues from the spoken line (reveal units) — not one run-on breath |
| `visual_kind` | `type \| diagram \| real-ui \| dataviz \| quiet \| abstract` |
| `blueprint` **or** `shot_ref` **or** `compose` | proven shape id from `../../hyperframes-animation/blueprints-index.md`, or `shotcraft:<id>`, or explicit `compose` + one-line signature move |
| `transition_in` | between-beat seam: `cut \| crossfade \| blur-crossfade \| push-slide LEFT/RIGHT/UP/DOWN \| zoom-through \| squeeze` |
| `shot_sequence` | ≥2 time windows across the beat; last window is a **hold read** unless the beat is intentionally continuous motion under VO |

Minimal `shot_sequence` shape:

```yaml
shot_sequence:
  - { t: [0.0, 1.2], on_screen: "only what VO says now", move: "per-word reveal", layout: "centered ~50%" }
  - { t: [1.2, 3.4], on_screen: "next cue piece", move: "layer-reveal", layout: "asymmetric 60/40" }
  - { t: [3.4, 5.0], on_screen: "resolved hero", move: "stillness", layout: "hold" }
```

Times are **local to the beat** (0 = beat start = `ata_range[0]`). Map to absolute ATA when composing.

## Non-Vox hard fails (explainer + promo) — SSOT

Fail the film plan or craft pass if any:

1. Beat missing `shot_sequence` with ≥2 windows and a terminal hold (or written continuous-motion exception).
2. Front-load: t≈0 of a beat shows the **full** canvas of that beat (everything that will ever appear).
3. ≥3 consecutive beats are centered title-cards only (`visual_kind: type` with no diagram/UI/dataviz/quiet rest).
4. Whole film uses one entrance template (`y+30` + opacity + `power2.out`) with no written mono-ease intent.
5. **Promo + reachable URL/product surface:** all proof is generated UI; no real capture on at least one proof beat.
6. VO line is a single undivided breath with no `vo_cues` (nothing to pace reveals to).
7. Standard explainer lacks quiet/ground-led passages (Taste Gate 2 / ground-led share).
8. Generated-video beats omit `target_duration_s` under a long ATA span (still padding the rest).

**Vox ignores the entire list.** Light stubs (SKILL light path) ignore when labeled stub.

Checklist shorthand “hard fails 1–8 clean” means this section.

## Shot-card deck policy — SSOT

Operates only under `/vidmuse-create`. Never under `/vidmuse-recut`.

**Auto-open (agent shortlists)** when **any** is true:

1. User names a card, pastes gallery ids, or asks for Ink Press / film-grade product-promo shot language.
2. `create_path: promo` with UI/site/launch surface, **or** `structure_recipe` ∈
   `saas-promo-30s` · `site-to-video` · `brand-sizzle` · `hook-proof-outro` (when that
   recipe resolved to promo).
3. Brief is product-UI-hero / launch / website→film before a recipe id is set.

**`data-beat` special case:**

- Path may be **explainer or promo** (match surrounding brief).
- Always open **motion** craft: `/vidmuse-motion` and/or `dataviz-countup` / restore dataviz blueprints.
- Shot-card deck: **optional on `create_path: explainer`**; on **`create_path: promo`**, deck may open as useful priors (still optional if every beat already has `blueprint` / `compose`). Do **not** treat `data-beat` alone as a global deck force-open on explainers.

**Keep closed** for: quiet `knowledge-explainer` defaults, all `create_path: vox`, light stubs, `/vidmuse-recut`.

On **promo UI** paths, a shortlist is **required** (or substitute `blueprint` /
`compose` on every beat) — “I thought about cards” is not enough.

User may say `shot-cards off` to force closed (blueprint/compose still required on non-Vox).

## Isolation rules

- `/vidmuse-recut` never reads this file or create craft refs.
- Create may **read** recut taste/timeline/asset refs; it must not **edit** recut skill files for create-only logic.
- Do not soft-link upstream HeyGen workflow SKILL.md as the runtime path — craft here is VidMuse-adapted (ATA + Timeline).
- Do not run official HF worker dispatch as a requirement in Phase 1; one agent may build frames, but **must** obey shot_sequence + doctrine.

## Checklist before assemble (non-Vox)

- [ ] `create_path` set and matches recipe
- [ ] Required story-design + visual-design + motion-language read
- [ ] Every beat has contract fields + shot_sequence (this file)
- [ ] Hard fails 1–8 checked (this file)
- [ ] Shot-card open/close followed deck policy (this file)
- [ ] FRAME seeded (preset and/or brand tokens)
- [ ] Delivery path still VidMuse Timeline (`write_dsl` + `vidmuse serve`)
