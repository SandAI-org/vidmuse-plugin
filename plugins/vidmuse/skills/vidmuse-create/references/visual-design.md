# Visual design — time-coded shot sequence (create non-Vox)

Adapted from HyperFrames explainer/promo visual-design for **VidMuse Create**.
You enrich each film-plan beat with how it **looks and moves**. You write **no
requirement** to spawn HF frame-workers — but you **must** write the same unit
they would receive: a **time-coded shot sequence** paced to ATA VO cues.

This file executes a selected treatment; it does not invent the treatment.
Read [agency-preproduction.md](agency-preproduction.md) first. The approved
storyboard images are visual truth, and the approved animatic is timing truth.
Read [picture-design.md](picture-design.md) before this file; hierarchy,
surface, screenshot treatment, and motif policy are decided before motion.

**Load when:** `create_path` is `explainer` or `promo`.  
**Skip when:** `vox` ([vox-collage.md](vox-collage.md) owns plates).  
**Motion doctrine:** [motion-language.md](motion-language.md).  
**Within-beat seams:** [cut-catalog.md](cut-catalog.md).  
**Shapes menu:** `../../hyperframes-animation/blueprints-index.md`.

## The unit is an authored shot, not a cue counter

A beat may be one strong lockoff, a cut, or a sequence of states. Use as many
time windows as the visual argument needs, including one:

```
Scene 1 (0.0–end): approved composition; locked while evidence is read
```

- Times are **beat-local seconds** (0 = `ata_range[0]`).  
- `vo_cues` carry roles. Only `role: event` promises a visible change.
- `carry`, `read`, `prelap`, and `offscreen` cues may leave the picture alone.
- A developed frame may appear at the start when the viewer needs to inspect
  evidence; front-load is a problem only when the shot then has no authored
  reason to hold.
- Prefer stillness to bad motion (breathing, jitter, lazy pan).
- Silent beats: pace windows to the argument, not equal thirds.

### PPT failure

The PPT tell is not stillness itself. It is a repeated grammar of centered
content blocks, speech-triggered entrances, and identical exits with no
designed relation between frames. A deliberate locked product proof is film;
a card that fades up because a sentence began is a slide.

## Pick the shape

1. Open blueprints-index; match `path_role` → blueprint (or confirm story candidate).
2. Read `blueprints/<id>.md` — time-coded template + **signature move**.
3. **Reproduce** / **Adapt** (state keep/change; never drop signature move) /
   **Compose** (`blueprint: compose` + name the signature move yourself).
4. Promo UI may use `shot_ref: shotcraft:<id>` as motion prior — still flesh into
   Scene lines; still FRAME-skin; never paste Remotion demos.

## What each beat gains

Keep story fields. Append:

- `blueprint:` id + `(Reproduce|Adapt)` or `compose` or `shot_ref:`
- `focal:` hero element (invented type/diagram node, or real-ui surface)
- `layer_map:` field / evidence / reading surface / optional accent
- `screenshot_treatment:` on real-UI beats
- `world_id:` the coherent space/editorial world this beat belongs to
- `continuity_in:` same-space / object-handoff / match-move / graphic-match /
  motivated-cut / chapter-reset, with a one-line reason
- `camera_intent:` viewer position at start/end and what the move changes
  (knowledge, scale, focus, relationship, emotion); `locked` is valid
- `storyboard_frames:` approved local start/hero/end frame paths
- `shot_sequence:` Scene lines with on_screen + move + layout inline
- optional `sfx:` names only (do not embed random `<audio>` in overlay HTML)

Example:

```yaml
- id: beat-03
  path_role: feature_showcase
  ata_range: [12.4, 18.1]
  vo_cues:
    - { text: "First the snowball", role: event }
    - { text: "then the hill", role: event }
    - { text: "then the speed", role: read }
  visual_kind: diagram
  blueprint: compose
  focal: snowball with labeled rings
  transition_in: push-slide LEFT
  shot_sequence:
    - t: [0.0, 1.2]
      on_screen: "hill field dim; small snowball seats upper-left"
      move: "spring-pop entrance → settle"
      layout: "centered ~45%"
    - t: [1.2, 4.0]
      on_screen: "one labeled ring per cue; total ticks"
      move: "layer-reveal + count-up on cue"
      layout: "asymmetric 60/40, 3 depth layers"
    - t: [4.0, 5.7]
      kind: read
      on_screen: "final ring + total held"
      move: "locked stillness"
      layout: "hold center"
```

The relation fields matter more than the transition name. A `crossfade`
between unrelated centered layouts is still a deck. A hard cut can be
cinematic when object, direction, gaze, action, or idea motivates it.

## Explainer — invent the visual

No capture required. First-class treatments:

- **Type / kinetic** — hero word, coined term, short enumeration (often primary)
- **Abstract graphic** — metaphor the script names (snowball, spotlight)
- **Diagram / dataviz** — build across Scenes; KPI beats prefer `/vidmuse-motion`
  or blueprint `dataviz-countup`, not a static chart PNG

Invented hero fills **~40–60%** of frame. Not a postage stamp in empty dark.

## Promo — ground in real UI

- Proof beats: real screenshots / device chrome around **real** UI when URL exists.
- Capture early; put paths in work dir; reference in `on_screen`.
- Set `ui_proof_path` (`screenshot-camera` default) per path-routing.
- Choose a screenshot treatment from picture-design. Do not place title,
  screenshot, connector, and cursor at the same visual priority.
- Text over a capture needs a deliberate reading surface; otherwise use a
  split composition or reserved negative space.
- Before adding a tight frame, cursor, callout, or label tied to the UI, read
  [alignment-contract.md](alignment-contract.md). Put capture + precision
  overlays in one `data-vm-align-space`; animate that shared parent. Use
  screen-space overlays only when they are intentionally independent.
- Fake generated dashboards as sole proof → hard fails 5 + 12.

## Cover test + density

Non-Vox only (path-routing fails 9–10): a mid-window freeze should work as a
**poster** — one clear focal subject, **≤3 active** elements; new entries need
exits/dim. Prefer an authored continuity strategy over orphan title cards or
a literal connector pasted across every beat.

## Layout vocabulary (inline per Scene)

Framing: centered · rule-of-thirds · split · layered-depth · asymmetric 60/40 ·
triptych · full-width strip.  
Density: primary is large enough to read at delivery size.
Hierarchy: establish focal order through size / weight / contrast / position /
surface / focus; motion is not required.
Keep one framing grammar unless the treatment motivates a departure. Do not
turn layout variety into a quota.

## Space, camera, and focus

Camera is a narrative relationship, not an anti-PPT decoration:

- Push in when the viewer is learning or committing to a detail.
- Pull back when new context changes the meaning of what was already seen.
- Pan/travel only when moving between established stations in one world.
- Rack focus / depth blur only when attention passes between depth layers.
- Lock off when action inside the frame carries the beat.

For a continuous world, make a space map before animation and keep direction,
screen position, vanishing point, and focus logic consistent across beats.
Motion blur follows velocity; depth blur follows focus distance. A constant
slow zoom with no information change is a screensaver, not camera language.

## Storyboard gate

Before production HTML:

1. Save a hero frame for every beat and start/end frames for complex moves.
2. Inspect at delivery resolution and as a contact sheet. The full-size view
   catches readability; the contact sheet catches repeated motif/layout
   monoculture.
3. Cut them to full duration with VO/music and attach the animatic to the
   VidMuse Timeline.
4. In interactive mode, user review owns hierarchy, motif, and pacing. Do not
   spend multiple autonomous passes polishing before showing the Timeline.
5. Do not scaffold until `animatic-approved.md` identifies that reviewed cut.

Caption band: **reserved, bottom-centered** — plan primary content in the top
~83% (16:9) and keep the band clear. Graphics yield to the caption, not the
reverse; leaving the band needs a written reason. Exact bands per aspect:
`../../vidmuse-recut/references/captions-and-golden-lines.md`.

## `## Video direction` once

At top of film plan / STORYBOARD, write shared invariants once:

- palette system (from FRAME)
- motion grammar + VO-paced reveal model
- which beats are intentional held breathers
- negative list: front-load slideshow · screensaver floaters · default bounce ·
  catalog dump skins · decorative persistent line · text directly on busy UI

Per-beat lines are **deltas**, not restatements.

## FRAME / preset seed

Before pretty HTML:

1. If brand/site tokens exist → derive FRAME roles from them.
2. Else pick **one** preset under
   `../../hyperframes-creative/frame-presets/` whose look fits register
   (e.g. editorial for knowledge, bold-poster / blue-professional for SaaS).
3. Copy roles into FRAME.md; do not ship pure `#000` canvas + white Inter as the
   entire identity without a named intent.

## Compose checklist

- [ ] `## Video direction` written once
- [ ] Selected treatment, primary device, world, and negative motifs are fixed
- [ ] Actual storyboard frame files exist and were reviewed
- [ ] Full-duration animatic approved before composition scaffold
- [ ] Every non-Vox beat has an intentional shot_sequence; one read/hold is valid
- [ ] Every beat names world, continuity-in, camera intent, and storyboard frames
- [ ] Every composite frame has one focal subject and a layer map
- [ ] Screenshot treatment and text surface are explicit on real-UI beats
- [ ] Cover test / ≤3 active in densest windows; continuity strategy is authored
- [ ] Persistent motif is none or passes the semantic motif gate
- [ ] Blueprint / shot_ref / compose named; Adapt keeps signature move
- [ ] Moves named from motion-language (not raw ms recipes in the plan)
- [ ] Promo proof includes real-ui + `ui_proof_path` where required
- [ ] Precision overlays use the semantic alignment contract; no duplicated
      capture-space pixel coordinates
- [ ] Stillness holds allocated; not every beat busy
