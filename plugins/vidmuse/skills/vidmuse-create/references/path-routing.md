# Create path routing

**Purpose:** choose which craft stack loads for a create film. Prevents mixing
Vox/paper-collage production with the HyperFrames-style shot-sequence stack,
and keeps `/vidmuse-recut` completely out of this doc.

**Authority (SSOT):** this file is the **single source of truth** for
`create_path` routing, the non-Vox **beat contract**, non-Vox **hard fails**,
**shot-card deck** policy, **continuity strategy**, **audio delivery**, and
**UI proof path** rules. `../SKILL.md`, [promo-recipes.md](promo-recipes.md),
[story-design-*.md](story-design-explainer.md), and
[shot-cards/README.md](shot-cards/README.md) must **point here** — do not
re-enumerate contract or fail lists elsewhere. If those files disagree with
this one, **this file wins**.

Vox craft lives only in [vox-collage.md](vox-collage.md). Explainer/promo craft
lives in the siblings listed below. Taste / FRAME / Timeline delivery still
come from `../vidmuse-recut/references/`.

**Isolation (read first):**

| Surface | This file applies? |
| --- | --- |
| `/vidmuse-create` · `explainer` / `promo` | **Yes** — full contract |
| `/vidmuse-create` · `vox` | **No** for hard fails / hero / SFX-BGM / UI tree — only vox-collage + voice spine |
| `/vidmuse-recut` | **Never** — do not load or enforce |

## Paths

| path id | when | craft stack | non-Vox hard fails |
| --- | --- | --- | --- |
| **`vox`** | Vox / 纸拼贴 / halftone collage / `collage-broll` / recipes `vox-collage-*` | **only** [vox-collage.md](vox-collage.md) | **off** — do not apply |
| **`explainer`** | knowledge / how-to / listicle / concept / topic from text; default when no product UI hero | [story-design-explainer.md](story-design-explainer.md) → [visual-design.md](visual-design.md) → [motion-language.md](motion-language.md) → [cut-catalog.md](cut-catalog.md) | **on** |
| **`promo`** | product launch, SaaS promo, site-to-video, brand sizzle, UI-as-hero | [story-design-promo.md](story-design-promo.md) → [visual-design.md](visual-design.md) → [motion-language.md](motion-language.md) → [cut-catalog.md](cut-catalog.md) + [shot-cards](shot-cards/README.md) when UI | **on** |

Record on `video-context.json`:

```json
{
  "create_path": "explainer" | "promo" | "vox",
  "structure_recipe": "…",
  "creative_direction_id": "direction-b",
  "primary_device": "the film-wide directorial action",
  "spatial_model": "the coherent world or editorial form",
  "continuity_strategy": {
    "mode": "object | world | camera | editorial | rhythm",
    "invariant": "what makes adjacent shots belong to one film",
    "variation": "what is allowed to change"
  },
  "hero_throughline": "optional — only when the treatment selects a literal recurring object",
  "audio_delivery": { "vo": true, "bgm": "path|none", "sfx_cues": [] }
}
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
- **Do not** require `shot_sequence`, blueprint ids, hero throughline, SFX/BGM
  contract, UI decision tree, or non-Vox hard fails.
- **Do not** open shot-cards / frame-preset seed unless the user asks.

### `explainer` / `promo` (anti-PPT craft)

Before HTML:

1. Set `create_path`; run grounding/evidence capture, then
   [agency-preproduction.md](agency-preproduction.md) Gates P0–P3: truth →
   brief → three treatments → selected direction → script.
2. Run the voice spine + ATA and Semantic Asset Pass; pick the structure
   recipe (`promo-recipes.md`).
3. Write film plan beats with the **beat contract** (below) + film-level
   **continuity strategy** / **audio_delivery**.
4. Read path story-design → complete arc / roles / cue-cut VO.
5. Read [picture-design.md](picture-design.md) → lock focal hierarchy,
   screenshot treatment, text surface, depth, and motif policy. Then read
   visual-design → every beat gets an intentional `shot_sequence`.
6. Name motion from motion-language; within-beat seams from cut-catalog.
   For implementation code paths, shortlist `/vidmuse-motion` **shot recipes**
   (`motion_recipes.py --tag shot`: cue-paced-reveal, collapse-merge-morph,
   pullback-reveal, ui-strip-away-lock) alongside dataviz recipes.
   `line-carry-transition` is not a default continuity device; open it only
   when the approved treatment's literal line passes picture-design's motif
   gate.
7. Seed FRAME from brand capture and/or one
   `../hyperframes-creative/frame-presets/<name>/` preset (never blank black + white type as the whole system).
8. Write the working `film-plan.json`, then complete agency Gates P4–P5: real
   storyboard frames → full-duration animatic → approval receipt/hash.
9. After animatic approval, run `film_plan.py --resolve`, scaffold per
   **Execution trace** (below), then
   implement **HyperFrames/GSAP** by filling the scaffold (not a second Stage
   runtime); deliver on VidMuse Timeline (not HF MP4-only).
10. Run the fast static `check_motion.py --skip-render` preflight before the
    first Timeline picture. Promo proof additionally runs S5 alignment from
    [alignment-contract.md](alignment-contract.md). Rendered analysis is
    optional unless a specific diagnostic or explicit strict gate is requested.

Thin process gate (non-Vox, non-stub): after user confirms film plan (or
autonomous heads-up), write `$WORK_DIR/direction-approved.md` with path,
recipe, one-line user/autonomous confirmation, and `continuity_strategy`
(plus optional `hero_throughline` when mode is `object`). Do not
claim finished without it unless light-stub waiver.

## Beat contract (explainer + promo only) — SSOT

Every beat in the film plan **must** carry:

| field | meaning |
| --- | --- |
| `ata_range` | `[start_s, end_s]` from `transcript.json` (never equal slices by default) |
| `path_role` | shared type enum: `hook \| pain_point \| product_intro \| feature_showcase \| benefit_highlight \| social_proof \| branding \| cta` (explainers **repurpose** — see story-design-explainer) |
| `key_message` | one sentence the viewer should leave with |
| `vo_cues` | phrase cues from the spoken line as `{text, role}` where role is `event \| carry \| read \| prelap \| offscreen`; only `event` promises a visible state change. Plain strings remain legacy input and resolve as `event`. |
| `visual_kind` | `type \| diagram \| real-ui \| dataviz \| quiet \| abstract` |
| `blueprint` **or** `shot_ref` **or** `compose` | proven shape id from `../../hyperframes-animation/blueprints-index.md`, or `shotcraft:<id>`, or explicit `compose` + one-line signature move |
| `transition_in` | between-beat seam: `cut \| crossfade \| blur-crossfade \| push-slide LEFT/RIGHT/UP/DOWN \| zoom-through \| squeeze` |
| `world_id` | selected treatment's coherent space/editorial world; reuse ids rather than inventing one world per sentence |
| `continuity_in` | one-line neighbor relation and reason: same-space / object-handoff / match-move / graphic-match / motivated-cut / chapter-reset |
| `camera_intent` | viewer position at start/end and what changes; `locked — internal action carries beat` is valid |
| `focal_subject` | the single subject that wins the frame |
| `layer_map` | perceptual roles for field / evidence / reading surface / optional accent; see picture-design |
| `screenshot_treatment` | required on real-UI beats: `exhibit \| editorial-crop \| isolated-detail \| split-composition \| background-texture \| hybrid-slices` |
| `storyboard_frames` | approved project-local image path(s) for this beat's hero/start/end state |
| `shot_sequence` | ≥1 authored window covering the beat. One lockoff/read window is valid; add windows only for real state changes. |
| `active_elements` | optional but checked: list of on-screen **active** subjects in the densest window (≤3) |
| `ui_proof_path` | **promo proof beats only:** `screenshot-camera` \| `hybrid-slices` \| `full-html-rebuild` (see UI proof path) |
| `asset_refs` | stable opportunity ids from a transcript-stamped `asset-plan.json`; every approved file opportunity must be bound by at least one beat |
| `asset_candidates` | legacy/site-capture-only list of curated filenames — expected on visual beats when a capture inventory exists; semantic entities use `asset_refs` |
| `sfx` | optional per-beat SFX cues `[{t: beat-local s, role}]` — resolved to absolute times by `film_plan.py`; assembled as Timeline sound entries (see Audio delivery) |

### Film-level fields (explainer + promo)

| field | when |
| --- | --- |
| `continuity_strategy` | **Required:** `{mode, invariant, variation}`. Mode is `object`, `world`, `camera`, `editorial`, or `rhythm`; coherence does not require a persistent line/object. |
| `hero_throughline` | Optional implementation field only when `continuity_strategy.mode: object` and the selected treatment names a literal recurring subject. |
| `audio_delivery` | **Required** before claim finished: `{ vo, bgm, sfx_cues }` — see Audio delivery |
| `asset_plan` | `asset-plan.json`; required on substantial films even when deliberately empty, with a completed pass receipt matching the current transcript SHA-256 |
| `creative_direction` | **Required:** selected direction id, `single_minded_proposition`, `primary_device`, `spatial_model`, `continuity_rule`, `camera_grammar`, and project `negative_motifs`. |
| `preproduction` | **Required:** project-relative paths for brief, three directions, selection, director treatment, storyboard index + frame images, animatic, approval, and exact animatic SHA-256. |

Minimal `shot_sequence` shape:

```yaml
shot_sequence:
  - { t: [0.0, 5.0], kind: "read", on_screen: "approved product proof with title in separate region", move: "locked — evidence carries the beat", layout: "split composition" }
```

Times are **local to the beat** (0 = beat start = `ata_range[0]`). Map to absolute ATA when composing.

## Non-Vox hard fails (explainer + promo) — SSOT

Fail the film plan or craft pass if any:

1. Beat missing an authored `shot_sequence` that covers its ATA span. One
   `read` / `hold` lockoff is valid; invented windows added only to create
   activity fail the design review.
2. A window promises a reveal/build but t≈0 already shows its final developed
   state. A deliberate `read` / `hold` lockoff may begin fully composed.
3. ≥3 consecutive beats are centered title-cards only (`visual_kind: type` with no diagram/UI/dataviz/quiet rest).
4. Whole film uses one entrance template (`y+30` + opacity + `power2.out`) with no written mono-ease intent.
5. **Promo + reachable URL/product surface:** all proof is generated UI; no real capture on at least one proof beat.
6. VO cues omit intent roles, or a `carry` / `read` / `prelap` / `offscreen`
   cue is implemented as a mandatory reveal merely because speech occurred.
   Legacy string cues are accepted for migration, not recommended for new plans.
7. Standard explainer lacks quiet/ground-led passages (Taste Gate 2 / ground-led share).
8. Generated-video beats omit `target_duration_s` under a long ATA span (still padding the rest).
9. **Cover / density:** in any shot window, **>3 active** on-screen subjects with no exit/dim plan for extras (cover test: a random mid-beat freeze should read as a single clear poster, not a sticker pile).
10. **Continuity:** no film-level `continuity_strategy`, adjacent shots share
    no authored invariant, **or** a literal line/rail/ribbon is used as
    wallpaper to satisfy continuity without a semantic role. A new focal
    object is allowed when world, camera, editorial, or rhythm continuity
    motivates the cut.
11. **Audio delivery (non-stub):** finished claim without `audio_delivery` where `vo` matches reality and `bgm` is either a real Timeline/music path **or** explicit `none` with user/plan reason — silent full-film BGM default is not allowed to “forget music.”
12. **Promo UI path:** a proof beat claims product UI but uses `full-html-rebuild` / generated chrome when `screenshot-camera` or `hybrid-slices` was viable (reachable URL or supplied screenshots).
13. **Execution trace:** `film-plan.json` missing/unresolved, scaffold window
    labels dropped from shipped HTML, the fast static
    `check_motion.py --skip-render` preflight fails, or promo precision
    overlays violate the shared-space/normalized-anchor contract. Rendered
    motion analysis is optional diagnosis; Timeline user review owns aesthetic
    approval.
14. **Pre-production skipped:** no one-proposition brief; fewer than three
    materially different treatments; storyboard exists only as prose; no
    full-duration animatic; or `animatic-approved.md` does not identify the
    exact reviewed artifact/hash.
15. **Unmotivated global motion:** repeated full-frame cue flashes, periodic
    color washes/scans, breathing loops, or camera drift were added to satisfy
    R1/R2 rather than express a named object + semantic verb. `check_motion.py`
    R3 flags repeated luminance washes, but a human/director review remains the
    authority. **Declared grammar is exempt:** beat seams (`ata_range` starts
    and ends) and windows whose `kind` is `exit` / `morph` / `camera` are
    approved whole-frame events. A planned crossfade, dissolve, stage
    transformation, or travelling camera must live in such a window — an
    undeclared full-frame change inside a `reveal` / `move` / `hold` window is
    what R3 exists to catch.

**Vox ignores the entire list.** Light stubs (SKILL light path) ignore when labeled stub.

Checklist shorthand “hard fails 1–15 clean” means this section.

## Execution trace (explainer + promo) — SSOT

**Why:** the observed failure mode is a correct film plan followed by a
generic fade-up implementation — plan and code are two separate generations,
and nothing used to force them to reconcile. This section makes the approved
`shot_sequence` machine-traceable from plan to pixels. All three steps are
**required** on non-Vox, non-stub films; scripts live in
`vidmuse-create/scripts/`.

1. **Structured mirror** — when the film plan is written (step 4), also write
   `$WORK_DIR/film-plan.json`: same beats as film-plan.md with `id` (`b01`…),
   `ata_range`, `path_role`, `key_message`, role-tagged `vo_cues`,
   `visual_kind`, `transition_in`, `focal_subject`, `layer_map`,
   `screenshot_treatment` where applicable, and `shot_sequence` windows
   (`{t, kind, on_screen, move}`, kinds
   `reveal|move|morph|camera|exit|hold|read`). One still read/hold window is
   valid. Add film-level
   `film_design_read`, `continuity_strategy: {mode, invariant, variation}`,
   optional `hero_throughline: {name, dom_selector, min_coverage}` when mode is
   `object`, and
   `ui_proof_path` / `asset_refs` per beat. `film_plan.py` cross-checks every
   asset ref against a resolved, non-suppressed entry in `asset-plan.json`,
   verifies query fingerprint/identity/variant, and rejects approved file
   opportunities that no beat binds. Use this working mirror to build the
   storyboard/animatic. After `animatic-approved.md` exists and the
   `preproduction` fields/hash are complete, run:

   ```bash
   python3 scripts/film_plan.py "$WORK_DIR" --resolve
   ```

   This validates the beat contract and resolves cue strings to absolute
   times from ATA `transcript.json` (never guessed) →
   `film-plan.resolved.json`.

   The structured mirror must include `creative_direction` and
   `preproduction`. `film_plan.py` verifies that their referenced files are
   project-local, storyboard frames exist, and the animatic SHA-256 matches
   the approved artifact. A valid beat plan cannot waive hard fail 14.

2. **Scaffold, then fill** — generate the GSAP skeleton before writing any
   composition code:

   ```bash
   python3 scripts/shot_scaffold.py "$WORK_DIR"     # -> public/index.html
   ```

   The skeleton carries one `tl.addLabel("bXX.wY", t_abs)` per approved
   window plus the window's on_screen/move/cue text as FILL comments.
   Implementation = fill the slots (tweens positioned at the labels), style
   with FRAME tokens, keep every label. Uniform per-section fade-in/out
   helpers (`appear()` templates) are banned — `transition_in` owns entries
   and exits.

3. **Fast correctness preflight, then Timeline review** — after the first
   picture bed exists:

   ```bash
   python3 scripts/check_motion.py "$WORK_DIR" --skip-render
   # optional diagnosis after a specific freeze/flash complaint:
   python3 scripts/check_motion.py "$WORK_DIR" --render-analysis
   ```

   Static: sections per beat, labels survived + used, `ui_proof_path` beats
   reference a real capture from `asset-sources.json`, hero selector coverage,
   and S5 alignment (proof beat has a shared transform space; every declared
   anchor resolves, uses normalized raster geometry, and does not move
   independently from its target).
   The static pass is the blocking machine gate. Attach the result to
   VidMuse Timeline immediately; the user judges hierarchy, composition,
   motif, material, and pacing.

   Optional rendered analysis samples for missing planned motion and repeated
   full-frame luminance washes. It checks visible events only for cues whose
   role is `event`; `carry`, `read`, `prelap`, and `offscreen` cues are exempt.
   It reports diagnostic evidence and does not justify adding screensaver
   motion or delaying the first user-visible review.

## Continuity strategy; literal hero is optional

**Goal:** the film has an authored grammar without forcing one decorative
object to occupy every shot.

- Choose one continuity mode: object, world, camera, editorial, or rhythm.
- State the invariant and allowed variation. The invariant may be a crop law,
  light direction, typography system, camera axis, edit cadence, or material
  world.
- Use `hero_throughline` only for a real recurring subject whose changing
  state carries meaning. Implement with shared DOM ids or recomposed
  continuity; it is not a requirement to draw a line.
- Product marks and UI may recur, but proof is allowed to own the frame without
  a connector crossing it.
- **Vox:** not required (clip-per-argument collage is a different material system).

## Audio delivery (non-Vox) — SSOT

Timeline sounds on create non-Vox films:

| Layer | Rule |
| --- | --- |
| **VO** | Always from VidMuse TTS → `audio.mp3` / `narration.mp3` (voice spine; monolithic or **segmented** — SKILL Gate B). |
| **BGM** | Must be **decided**: real underscore on Timeline **or** `bgm: none` + one-line reason (user asked silent / dialogue-only). Forgetting BGM is a defect. |
| **SFX** | Optional but preferred on **mech beats**: number land, UI click/submit, logo lock, chapter hit, transition whoosh/riser. Name cues on plan (`sfx_cues: [{t, role}]` film-level, or per-beat `sfx` in `film-plan.json` with beat-local `t`). |

**SFX sourcing ladder** (same spirit as the asset ladder — never invent loud
stock spam): **(1)** user-supplied SFX assets → **(2)** `/media-use` skill
catalog when installed (resolve BGM/SFX from its audio references; register
what you adopt) → **(3)** a small local library under `$WORK_DIR/assets/sfx/`
reused across cues (one impact, one whoosh, one riser, one click, one chime
covers most promos — reuse files across events, don't fetch ten variants) →
**(4)** skip with a one-line reason on the plan. Register adopted files in
`asset-sources.json`.

**Timeline placement:** each SFX cue is its own entry on a Timeline sound
track at its absolute time — level well under VO (impacts ~0.3–0.5, UI ticks
~0.15–0.3), trimmed tight (≤1.5s tails). Cues serve the film's **mech
moments** (something lands, clicks, locks, transitions) — an SFX with no
on-screen event is noise; an on-screen hero moment with no sound reads
cheaper than silence chosen on purpose.

Finished evaluate must allow Timeline scrub with **VO audible**; if BGM present, it must sit **under** VO (duck/level by ear — no need for full mastering pipeline).

**Vox:** still uses VO spine; **does not** inherit SFX/BGM mandatory contract from this section (collage i2v sound design stays optional/user-led).

## UI proof path (promo only) — SSOT

When the picture’s hero is a product/site interface, pick the **cheapest true** path:

```text
UI must appear
 ├─ only needs to be SEEN (tour/pan/hold) → screenshot-camera
 │     real capture + light device chrome + craft camera
 ├─ few elements must move on a real surface → hybrid-slices
 │     real capture base + sliced/DOM accents
 └─ UI is the narrative machine (typing, multi-state) → full-html-rebuild
       only with written spend reason; FRAME-skin; never fake dashboard as sole proof
```

Default start: **screenshot-camera**. Generated “SaaS mock chrome” as the only proof when a URL or screenshots exist → hard fail 5 + 12.

## Short promotional runtime (guidance, not a hard fail)

For `saas-promo-30s` / `hook-proof-outro` / sub-45s promos: prefer a **~18–30s** film with a clear 4–6 beat spine (hook → stakes/process → proof → payoff → lockup). Stretching a single claim to a multi-minute title stack is a plan smell — rewrite tighter rather than pad.

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
- Always open **motion** craft: `/vidmuse-motion` and/or `dataviz-countup` / dataviz blueprints.
- Shot-card deck: **optional on `create_path: explainer`**; on **`create_path: promo`**, deck may open as useful priors (still optional if every beat already has `blueprint` / `compose`). Do **not** treat `data-beat` alone as a global deck force-open on explainers.

**Keep closed** for: quiet `knowledge-explainer` defaults, all `create_path: vox`, light stubs, `/vidmuse-recut`.

On **promo UI** paths, a shortlist is **required** (or substitute `blueprint` /
`compose` on every beat) — “I thought about cards” is not enough.

User may say `shot-cards off` to force closed (blueprint/compose still required on non-Vox).

## Isolation rules

- `/vidmuse-recut` never reads this file or create craft refs; never inherits
  hero / SFX / shot_sequence / UI tree obligations from create.
- Create may **read** recut taste/timeline/asset refs; it must not **edit**
  recut skill files for create-only logic.
- Vox path never loads this file’s craft stack or hard fails 1–15 (the
  execution-trace scripts are non-Vox only).
- Do not soft-link upstream HeyGen or third-party design-skill SKILL.md as the
  runtime path — craft here is VidMuse-adapted (ATA + HyperFrames + Timeline).
- Engine note: non-Vox picture builds stay on **HyperFrames/GSAP**; do not
  introduce a second Stage/rAF video runtime for create delivery.

## Checklist before assemble (non-Vox)

- [ ] `create_path` set and matches recipe
- [ ] Agency pre-production complete: brief, three directions, selected
      treatment, director treatment, real storyboard frames, approved animatic
- [ ] Required story-design + picture-design + visual-design + motion-language read
- [ ] Every beat has contract fields + shot_sequence (this file)
- [ ] Semantic Asset Pass ran; `asset-plan.json` has a current completed receipt (a deliberate stamped empty plan is allowed)
- [ ] Every used semantic asset is bound by `asset_refs`, not a remote URL
- [ ] Every approved file asset survives as a real `data-asset-ref` DOM binding in its assigned beat
- [ ] Hard fails 1–15 checked (this file)
- [ ] `film-plan.json` written + `film_plan.py --resolve` green (Execution trace)
- [ ] `animatic-approved.md` hash matches the animatic before
      `shot_scaffold.py` generates the production skeleton
- [ ] `continuity_strategy` set; literal `hero_throughline` only when the
      selected treatment earns an object motif
- [ ] `audio_delivery` decided (VO + BGM path or `none`)
- [ ] Promo proof beats have `ui_proof_path` + real capture when URL exists
- [ ] Promo precision overlays follow `alignment-contract.md`; S5 green
- [ ] `direction-approved.md` present (non-stub)
- [ ] Shot-card open/close followed deck policy (this file)
- [ ] FRAME seeded (preset and/or brand tokens)
- [ ] Delivery path still VidMuse Timeline (`write_dsl` + `vidmuse serve`)
