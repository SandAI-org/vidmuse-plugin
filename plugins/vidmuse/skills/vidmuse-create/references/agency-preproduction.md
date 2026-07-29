# Agency pre-production — create before compose

**Purpose:** stop `/vidmuse-create` from treating a URL, script, or asset folder
as a ready-made shot list. A professional-looking film is decided while
changes are still cheap: brief → competing concepts → script → keyframes →
animatic. HyperFrames/GSAP production starts only after those decisions are
locked.

**Load when:** every user-facing `create_path: promo` or `explainer`.

**Skip when:** `create_path: vox` (use `vox-collage.md`) or an explicitly
labelled ≤20s light stub. Existing projects may resume from equivalent signed
artifacts; record the mapping instead of recreating work that is already
approved.

This is a compact agency simulation, not a six-week calendar. One agent may
play all roles in sequence, but the veto passes must remain separate. An
autonomous request removes waiting, not the gates: save the artifacts and the
internal verdicts, then continue.

## Contents

- Central distinction and role vetoes
- Gate P0: discovery and product truth
- Gate P1: creative brief
- Gate P2: three treatments
- Gate P3: script and director treatment
- Gate P4: storyboard keyframes
- Gate P5: animatic sign-off
- Production, feedback, and pre-compose contracts

## The central distinction

Website capture, logos, screenshots, and generated plates are **evidence**.
They are not a concept.

Before production, the film needs:

1. one commercial or teaching proposition;
2. one directorial device that makes the proposition visible;
3. one coherent world and camera/transition grammar;
4. a timed animatic proving the idea survives as a film.

If the plan can be described as “show screenshot A, then card B, then title C,”
the concept is still missing. Adding easing, particles, parallax, or more
assets will only create an animated deck.

## Role stack and real vetoes

Run the passes in this order and write the verdicts into the stage artifact.

| role | optimizes | must veto when |
| --- | --- | --- |
| Strategist | one audience, one proposition | the film is a feature list or the audience is “everyone” |
| Product-truth reviewer | demonstrable claims | a line or frame cannot be traced to verified evidence |
| Creative Director | a distinctive concept | the direction is a website recap, effect sampler, or familiar category default |
| Director / AD | screen grammar and continuity | shots have no spatial relation, camera reason, or motivated cut |
| Editor | rhythm and comprehension | the animatic drags, front-loads, or changes shots faster than ideas |
| Producer | feasibility and reuse | the idea depends on untested generation, fake UI, or unaffordable rebuilds |
| Brand reviewer | recognizable but not literal brand world | the film copies page layout instead of translating brand character |

The later role is allowed to send work back. A review that only praises the
previous pass did not happen.

## Gate P0 — discovery and product truth

For a URL promo, run the full site capture and source audit first. For an
explainer, gather the subject's real diagrams, notation, visual history, and
material culture. Write `<project>/discovery.md`:

- intended audience and playback surface;
- desired action or learning outcome;
- verified claims / facts and their evidence;
- uncertainty and explicit assumptions;
- product or generation limits that must constrain the script;
- the category's most common visual clichés;
- available human, product, brand, and Creator Library material.

For an AI or new-technology product, test every hero capability that the film
may promise. If a capability cannot produce broadcast-worthy evidence, change
the concept or script. Never solve a truth problem with generated packaging.

**Gate P0 passes when:** the truth reviewer can trace every candidate proof,
the producer has a fallback, and the anti-pattern list names this category's
median output.

## Gate P1 — creative brief

Write `<project>/creative-brief.md` before the narration script:

```yaml
audience:
  definition: "one concrete group"
  not_for: "who this film deliberately excludes"
viewer_resistance: "why they do not believe / understand / act today"
single_minded_proposition: "one sentence; no feature conjunction"
reason_to_believe:
  - "ranked proof 1"
  - "ranked proof 2"
desired_response: "what the viewer should think, feel, or do"
tone:
  do: []
  dont: []
mandatories: []
prohibitions: []
assumptions: []
```

The Strategist challenges the first draft. Features that do not support the
single proposition become proof, another deliverable, or are cut.

## Gate P2 — three genuinely different treatments

Write `<project>/creative-directions.md`. Produce three treatments without
letting one become a recolor of another. Vary at least three of these axes:

- emotional opening: pain / desire / direct proof;
- protagonist: person / product / idea or object;
- visual source: real world / interface / designed diagram;
- spatial model: continuous world / montage / transformation / stage;
- editorial device: journey / experiment / comparison / accumulation /
  reveal / reversal.

Each treatment must contain:

```yaml
id: direction-a
title: "memorable working title"
concept: "one sentence"
promise_proof: "how the form proves the proposition"
narrative_device: "the film-wide action, not an effect"
spatial_model: "where the film physically happens"
camera_grammar: "how and why viewer position changes"
material_mix: "real UI / people / diagrams / generated plates / type"
opening_hook: "first 3 seconds"
payoff: "what changes or resolves at the end"
risk: "what could make this fail"
anti_ppt_test: "why this cannot be replaced by a stack of slides"
```

Then run a small panel:

1. Strategist: proposition clarity.
2. CD: distinctiveness and category cliché distance.
3. Director: spatial and editorial continuity.
4. Producer: evidence, feasibility, and asset risk.

Select one direction or explicitly hybridize parts. Record the losing
directions and why they lost; this prevents them from leaking back as random
effects during production. Save the selection to
`<project>/direction-selected.md`.

**Hard reject:** three directions that share the same shot silhouette, scene
order, and protagonist but differ in palette, typography, or transition pack.

## Gate P3 — script and director treatment

Lock the script only after the direction. Use the selected device to decide
what the film shows; do not write VO first and decorate each sentence later.

Write:

- `<project>/script.md` — timed VISUAL / AUDIO columns;
- `<project>/director-treatment.md` — the film's world, camera, lenses/focus
  metaphor, depth layers, transition law, sound behavior, and negative motifs.

The treatment must define:

```yaml
worlds:
  - id: world-main
    description: "one coherent place or graphic system"
primary_device: "one film-wide directorial action"
continuity_rule: "what persists, transforms, or motivates each cut"
camera_rules:
  - "viewer position and reason for movement"
focus_rules:
  - "what sharp/soft means; depth must communicate hierarchy"
transition_rules:
  - "small repeated grammar; no anonymous slide changes"
negative_motifs:
  - "full-frame cue flashes"
  - "periodic ambient scans"
  - "centered card per sentence"
```

Camera is not a mandatory zoom on every shot. It is the viewer's position in
the world. A static locked-off shot can be cinematic when the staging and cut
are motivated; an endless Ken Burns move can still be a slideshow.

For continuous spatial concepts, add `<project>/space-map.md` (or an image)
with world coordinates, stations, camera path, focus target, direction, and
time. This is the composition team's source of truth.

## Gate P4 — storyboard keyframes

Storyboard frames are **pictures**, not prose rows in `film-plan.md`.

1. Draw rough thumbnails to test silhouette and order.
2. Produce at least one readable hero frame per beat.
3. For every complex move, also produce a start and end keyframe.
4. Save the images under `<project>/storyboard/` and index them in
   `<project>/STORYBOARD.md`.
5. Review the frames without motion:
   - proposition and product world recognizable;
   - one focal subject;
   - foreground / midground / background relationships;
   - adjacent frames are connected by object, direction, space, or idea;
   - personal or brand-specific material appears where it adds meaning;
   - no frame is merely a website section placed in a rounded card.

Do not start detailed GSAP authoring to discover the layouts. Approved static
layouts are the landing states; animation enters, transforms, or exits those
states.

## Gate P5 — animatic sign-off

Build `<project>/animatic.mp4` (or an equivalent Timeline-reviewable animatic)
from the approved keyframes at full film duration:

- real VidMuse TTS + ATA may serve as scratch VO and can remain final;
- use temporary music or a deliberate `none`;
- include rough camera blocking and cut timing, not polished animation;
- show captions / burn-ins needed for silent comprehension;
- use the final aspect ratio.

Review the whole film, not isolated frames. Record
`<project>/animatic-review.md`:

- where attention drops or comprehension breaks;
- whether the proposition is proven without reading the website;
- whether each cut is motivated;
- whether camera movement changes knowledge, scale, focus, or emotion;
- whether quiet holds are long enough to read;
- whether any repeated device becomes mechanical;
- producer risk and final decision.

Sign-off is `<project>/animatic-approved.md` with the exact reviewed artifact,
hash, approval/autonomous verdict, selected direction id, and requested
changes closed. A working `film-plan.json` may drive the animatic, but only
after sign-off may it be treated as production-approved, scaffold the
production composition, or trigger expensive plates.

## Production rule

Production **reproduces an approved animatic**. It does not reopen concept
search.

When a machine check fails, diagnose the missing intended action:

1. identify the object and semantic verb that should change;
2. repair that local action or correct the plan;
3. re-render and review in context.

Never add a global flash, ambient scan, breathing loop, or camera drift merely
to increase pixel difference. Machine gates detect omissions and regressions;
they do not grant aesthetic approval.

## Feedback ledger

Translate review comments from proposed solutions into the underlying
problem, then preserve both:

```yaml
- feedback: "不要规律性的淡绿色全屏闪烁"
  underlying_problem: "cue response is global, repetitive, and semantically unrelated"
  rejected_motif: "full-frame cue flash / periodic wash"
  replacement_rule: "animate the named local object: card, connector, cursor, asset, or mark"
  scope: "this project"
```

Append project feedback to `<project>/creative-memory.md`. Promote a lesson to
a reusable VidMuse reference only after it recurs across projects; do not
turn one client's taste into a universal law.

## Pre-compose checklist

- [ ] `discovery.md` + verified product/subject evidence
- [ ] `creative-brief.md` with one audience and one proposition
- [ ] `creative-directions.md` with three materially different treatments
- [ ] `direction-selected.md` with panel verdict
- [ ] `script.md` and `director-treatment.md`
- [ ] real storyboard images indexed by `STORYBOARD.md`
- [ ] full-duration animatic reviewed on the final aspect ratio
- [ ] `animatic-approved.md` exists
- [ ] selected direction, negative motifs, and continuity rules are mirrored
      into `film-plan.json`

Machine-readable mirror:

```json
{
  "creative_direction": {
    "id": "direction-b",
    "single_minded_proposition": "one sentence",
    "primary_device": "one film-wide action",
    "spatial_model": "one coherent world/editorial form",
    "continuity_rule": "what persists or motivates cuts",
    "camera_grammar": "viewer-position rules",
    "negative_motifs": ["full-frame cue flash", "periodic ambient scan"]
  },
  "preproduction": {
    "contract": "agency-preproduction.v1",
    "brief": "creative-brief.md",
    "directions": "creative-directions.md",
    "selected_direction": "direction-selected.md",
    "director_treatment": "director-treatment.md",
    "storyboard": "STORYBOARD.md",
    "direction_ids": ["direction-a", "direction-b", "direction-c"],
    "storyboard_frames": ["storyboard/b01-hero.png"],
    "animatic": "animatic.mp4",
    "animatic_approval": "animatic-approved.md",
    "animatic_sha256": "64 lowercase hex characters"
  }
}
```
