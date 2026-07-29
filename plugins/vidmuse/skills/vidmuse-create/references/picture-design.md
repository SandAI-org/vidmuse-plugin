# Picture design — hierarchy before motion

**Purpose:** turn grounded material into a designed picture before animation.
Create is closer to designing a strong editorial page than decorating a
transcript: establish hierarchy, surfaces, depth, typography, and media
treatment first; motion only develops those decisions.

Read after a treatment is selected and before storyboard frames. This file
applies to `explainer` and `promo`; Vox keeps its own material system.

The decision structure is informed by Emil Kowalski's
[design-engineering skills](https://github.com/emilkowalski/skills) and
Leonxlnx's [taste-skill](https://github.com/leonxlnx/taste-skill), adapted for
linear film rather than copied from interface animation. The transferable
idea is **context → hierarchy → purpose → mechanism**. Web hover recipes,
layout-variety quotas, and long pre-flight lists do not transfer.

## 1. Write one Film Design Read

Before FRAME tokens, shot cards, or effects, write this compact read into
`director-treatment.md` and mirror it in `film-plan.json`:

```yaml
film_design_read:
  audience: "who must understand or desire this"
  promise: "the one thing the film makes believable"
  visual_language: "the named editorial / material world"
  focal_strategy: "how the eye finds the subject"
  media_treatment: "how captures / images enter the world"
  typography_role: "narrator, label, evidence, or rare hero"
  composition_variance: 4       # 1 stable grammar → 10 deliberately volatile
  motion_energy: 3              # 1 mostly cuts/holds → 10 kinetic spectacle
  information_density: 5        # 1 one thought → 10 dense evidence
  depth_separation: 7           # 1 deliberately flat poster → 10 deep staged space
  persistent_motif: none        # or a named, semantically justified object
  # required only when persistent_motif is not none:
  # motif_rationale:
  #   semantic_role: "the real relation it encodes"
  #   state_change: "how its meaning changes"
  #   yield_rule: "when it exits, rests, or gives focus to proof"
```

Infer the dials from the brief; do not default them high. They are design
constraints, not quality scores. A calm product proof can be excellent at
`4/3/5/7`; a flat poster film may intentionally set depth low.

## 2. Frame decision order

For every storyboard frame, answer in this order:

1. **What is the single focal subject?**
2. **What must remain readable evidence?**
3. **Where does text live without fighting the evidence?**
4. **What creates separation between foreground, subject, and field?**
5. **What, if anything, needs to move to explain a change?**

Do not start with “which effect fits this beat?” If step 1 has two answers,
edit the frame before animating it.

## 3. Focal hierarchy contract

Every non-quiet shot declares:

```yaml
focal_subject: "one subject"
supporting_evidence: ["0–2 subordinate items"]
layer_map:
  field: "background / atmosphere"
  evidence: "capture, image, diagram, or object"
  reading_surface: "where title / labels remain legible"
  accent: "optional focus cue, never a second hero"
```

`layer_map` describes perceptual roles, not a requirement for four DOM
wrappers. A simple shot may use a solid field, one product image, and type.

Build separation with at least two applicable cues:

- luminance or color contrast;
- scale difference;
- controlled blur / focus;
- occlusion or crop;
- edge light / shadow;
- parallax or camera distance;
- negative space.

Busy composite shots with screenshot, title, captions, and annotation must not
leave all four at the same luminance and depth plane.

## 4. Screenshot and captured-media treatments

A screenshot is evidence, not a finished composition. Choose one treatment:

| treatment | use when | text policy |
| --- | --- | --- |
| **Exhibit** | the whole interface is the proof | UI owns the frame; title/copy stays outside or in reserved negative space |
| **Editorial crop** | one region proves the claim | crop decisively; retain enough context to remain truthful |
| **Isolated detail** | one control/result matters | enlarge the detail; soften or dim context; annotation remains subordinate |
| **Split composition** | explanation and UI need equal time | text and capture receive separate regions, not overlapping planes |
| **Background texture** | UI only establishes product world | blur/dim/grade strongly; it no longer counts as readable proof |
| **Hybrid slices** | a few UI elements must move | keep a real capture base; separate only the moving targets |

### Text over screenshots

Body copy or a title may sit over a screenshot only when one readable surface
is deliberately created:

- local gradient or scrim;
- solid / translucent panel with a reason;
- darkened or defocused image region;
- high-contrast reserved whitespace inside the capture;
- restrained stroke/shadow for short display type.

If none fits, move the text off the screenshot. Do not lower screenshot
opacity until both screenshot and text become weak. Continuous subtitles keep
their dedicated Timeline/caption band and never become another floating layer
over product proof.

### Truth and crop

Do not crop away the context needed to substantiate a claim. A close-up can
direct attention; it cannot turn unrelated UI into proof. Keep the uncropped
source registered and use the approved alignment contract for annotations.

## 5. Typography is a spatial role

Use four possible roles, not four simultaneous type treatments:

- **Narrator:** continuous caption system, visually quiet.
- **Statement:** rare hero line; may own the frame.
- **Label:** short annotation attached to evidence.
- **Evidence:** real product copy, code, number, or quote that must remain true.

The same words must not render as Narrator and Statement simultaneously.
Hierarchy needs more than font size: combine weight, size, leading, contrast,
position, or surface. Avoid tiny pseudo-system labels, decorative metadata,
and “control-room” copy added only to make a frame look sophisticated.

## 6. Persistent motif gate

Default `persistent_motif` is `none`. Coherence may come from the same world,
camera law, typography, crop logic, edit rhythm, or object state; it does not
require one literal DOM object across the film.

A line, rail, ribbon, cursor trail, node, or glowing path may persist only
when all are true:

1. It encodes a real relation such as sequence, causality, routing, growth, or
   transformation.
2. Removing it would reduce comprehension, not merely decoration.
3. The selected treatment names it as the primary device.
4. It yields the focal position to product proof, people, and key type.
5. It has an exit or rest state; it is not wallpaper under every shot.

“Continuity,” “living thread,” and “it ties the film together” are not
sufficient semantic roles. A connector must not cross body text, captions, or
the proof region it is supposed to clarify.

When a motif fails the gate, delete it. Do not replace it with a different
decorative motif.

## 7. Motion opportunity gate

Apply the gate before naming a recipe:

1. **Purpose:** explanation, state change, spatial continuity, focus transfer,
   transition, or emotional punctuation?
2. **Subject:** which named object performs which semantic verb?
3. **Cost:** does motion compete with reading or product proof?
4. **Restraint:** would a cut, hold, crop, or focus change communicate better?

If purpose or subject is missing, use no motion. Prefer corrections in this
order:

```text
Delete → Reduce → Clarify hierarchy → Fix timing/easing → Polish
```

Do not measure quality by move count, easing-family count, motion recipe
count, or visual-kind variety.

## 8. Storyboard as the design authority

Storyboard frames are full-resolution interface comps for the film:

- build the developed frame first;
- judge focal order at normal viewing size and as a small contact sheet;
- inspect screenshot treatment, text surface, depth separation, and captions;
- then define the minimum motion needed to reach or develop that frame.

The contact sheet is valuable because repetition becomes visible. Reject when:

- one literal motif dominates most frames;
- every frame shares the same black field / centered screenshot / white title;
- proof, title, and accent repeatedly fight for first place;
- screenshot treatment changes randomly rather than following one system;
- all frames have equal energy.

Production translates approved frames. Code authoring is not a second design
phase.

## 9. Review ownership

Use three tiers:

### Tier 0 — automatic correctness

Fast and blocking: missing media, invalid timing, unresolved assets, broken
composition, missing beat/label bindings, unsafe alignment, or export
duration/resolution mismatch.

### Tier 1 — Timeline user review

Default aesthetic gate. Attach the first playable picture to VidMuse Timeline
as early as possible and give the user:

- the full film with real VO/captions;
- shot boundaries and meaningful review markers;
- a contact sheet or storyboard link for frame-level comparison.

The user accepts, rejects, or comments on hierarchy, composition, motif,
material, pacing, and taste. Do not run repeated autonomous aesthetic passes
before showing a watchable version.

### Tier 2 — optional diagnostic

Run rendered frame sampling, motion analysis, or a deep internal review only
when the user requests it or Tier 0/Timeline reveals a specific risk. The
diagnostic reports evidence; it does not overrule the user.

## Pre-compose check

- [ ] Film Design Read is specific to this audience and subject
- [ ] Every composite frame has one focal subject
- [ ] Screenshot treatment is named; proof remains truthful
- [ ] Text has a readable surface or separate region
- [ ] Layer separation is intentional, including deliberately flat shots
- [ ] Persistent motif is `none` or passes the semantic gate
- [ ] Motion candidates name a purpose, subject, and verb
- [ ] Contact sheet shows designed rhythm rather than one repeated template
- [ ] First playable version goes to Timeline before optional deep diagnostics
