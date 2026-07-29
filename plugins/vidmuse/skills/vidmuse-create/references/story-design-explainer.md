# Story design — create path `explainer`

Adapted from HyperFrames `faceless-explainer` story-design for **VidMuse Create**.
Timing truth is the flat ATA `transcript.json` materialized from Media Use's
`audio_meta.json` voice words. Delivery is
**VidMuse Timeline**, not HF Studio-only.

**Load when:** `create_path: explainer` ([path-routing.md](path-routing.md)).
**Do not load for:** `vox`, or `/vidmuse-recut`.

## Core rule

An article or topic dump is information. A video is a guided act of understanding.

**Do not follow paragraph order.** Reorder, merge, omit, compress. The single most
common failure is paraphrasing the source in order.

## Method

### 1. Extract teaching truth

- **Audience** — who, and what they already (don't) know
- **Gap / stakes** — confusion or "why care"
- **Thesis** — one line the viewer walks away with
- **Spine** — 3–6 mechanisms / steps / items that build to the thesis
- **Evidence** — numbers, examples, comparisons (only real ones)
- **Landing** — takeaway or call to think / try

### 2. Choose one structure

| Structure | Use when | Body shape |
| --- | --- | --- |
| `concept-explainer` | one idea / term | name → mechanism layers → implication |
| `how-to-process` | ordered procedure | 3–6 steps on one consistent stage |
| `listicle` | parallel co-equal items | hook → N items → wrap |
| `story-explainer` | case / history | setup → tension → turn → resolution → lesson |

Name the structure on the film plan (`structure:`). Compounds only when explicit
(e.g. `concept-explainer with process`).

### 3. Layout beats with roles

Each beat has **one job**. Use shared `path_role` enum, **repurposed for teaching**:

| Teaching job | `path_role` |
| --- | --- |
| Hook / curiosity gap | `hook` |
| Why-care / confusion | `pain_point` |
| Name the core idea | `product_intro` |
| Mechanism / step / item | `feature_showcase` |
| So-what / implication | `benefit_highlight` |
| Example / data grounding | `social_proof` |
| Thesis / principle land | `branding` |
| Call to think / try | `cta` |

Body is usually a **run** of `feature_showcase` interleaved with
`benefit_highlight` / `social_proof` — not one isolated body card.

### 4. Hook (first 3–5s of VO)

Pick one: shocking stat · rhetorical question · counterintuitive claim · pain
validation · visceral metaphor · concept announcement · direct address ·
imagine/scenario · stakes. **Never** open with a dictionary definition.

Thesis / message should land by beat 2; later beats are evidence.

### 5. Write VO as intent cues (anti-PPT)

- 1–2 sentences per spoken beat; usually 6–20 words when drafting VO
- Segment only where the picture, reading state, or edit intent changes. Give
  every cue a role; speech alone does not create a reveal:
  `[{text: "First the snowball", role: event}, {text: "then the hill", role: carry}, {text: "then the speed", role: read}]`
- A sentence may have one `event` cue and several `carry` / `read` cues. Do not
  atomize every phrase just to manufacture animation windows.
- Prefer concrete teaching over article paraphrase
- Silent beats allowed for diagram/self-building holds — leave VO empty, leave
  cues empty, still write `shot_sequence` paced to the beat

If user locked **verbatim** script: do not rewrite words; only segment at sentence
/ clause boundaries into beats and cues.

### 6. Blueprint candidates (soft)

For each beat, open
`../../hyperframes-animation/blueprints-index.md` and tag a candidate
`blueprint:` when a shape fits. **Story truth first** — never invent/drop a beat
to fit a blueprint. Vary shapes across the film; do not stamp `kinetic-type-beats`
on every card.

Faceless defaults that often fit:

- concept name / takeaway → `kinetic-type-beats`, `titlecard-reveal`
- layered mechanism → `spatial-pan-stations`, compose diagram
- stat / evidence → `dataviz-countup` or `/vidmuse-motion`
- process steps → consistent stage + `push-slide` between beats

### 7. Continuity strategy

Multi-beat body sequences share:

1. A film-level `continuity_strategy`: object, world, camera, editorial, or
   rhythm. State both the invariant and what may vary.
2. Neighbor relations in `continuity_in`; cuts may be motivated by idea,
   action, gaze, direction, scale, or sound—not only by a persistent object.
3. An optional `hero_throughline` only when the selected treatment genuinely
   follows one named object changing state. Never invent a line/rail/ribbon
   merely to satisfy continuity.

Cover test: a mid-beat freeze has one winning focal subject and no more than
three active elements.

Transforms of one element across two ideas stay **inside one beat's shot_sequence**,
not across a hard slide seam. SSOT + fails: [path-routing.md](path-routing.md).

### 8. Transitions (between beats)

Only: `cut | crossfade | blur-crossfade | push-slide LEFT/RIGHT/UP/DOWN | zoom-through | squeeze`

Pick 2–3 types for the whole film and repeat. Beat 1 uses `cut`. Ordered steps →
consistent `push-slide`; chapter jump → `zoom-through` or `cut`.

## PPT autopsy (fail here)

- One centered title per sentence
- Paragraph order retained end-to-end
- No quiet/ground-led passages on a standard explainer
- Body is a single card, not a cumulative run
- VO and picture both dump at once then freeze
- No authored continuity strategy; every body beat a brand-new centered graphic
- Sticker pile (>3 active) with no exits

## Output

Write into the **film plan**. Every beat must satisfy
[path-routing.md](path-routing.md) before visual design, then become real
storyboard frame images + `STORYBOARD.md` and a full-duration approved animatic
under [agency-preproduction.md](agency-preproduction.md).
