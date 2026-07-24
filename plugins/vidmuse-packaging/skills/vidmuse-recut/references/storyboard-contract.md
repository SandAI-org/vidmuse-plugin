# Storyboard Contract

`STORYBOARD.md` is the human-readable directing contract for Director mode.
Write it before choosing exact effects. The later `scene-plan.json` is its
machine-readable execution form.

## Scene fields

Every substantial scene records:

- id and exact start/end;
- spoken line, or an explicit silent/source-only state;
- narrative job and intended viewer response;
- visual proof;
- source mode and act world;
- energy from 1 to 5;
- one camera verb;
- entry, development, hold, exit, and handoff;
- primary sound cue or intentional silence;
- hero-frame time;
- material implementation risks.

## Complete-shot test

A scene is not complete because its elements have entered. Describe what
changes after entry, what deserves the hold, how the scene leaves, and what the
next scene inherits. Stillness is valid when it is the dramatic action and is
named as such.

## Visual-proof test

Reject a proposed scene when its visual proof could be replaced by “show the
sentence with animation.” Rewrite the proof around evidence, structure,
transformation, spatial relation, or an honest source-image moment.

## Coverage

Cover the complete timeline. Quiet passages are explicit scenes with
`source_only: true`; silence is explicit with `silent: true`. There are no
implicit gaps. Overlap is allowed only for a planned transition and must be
represented without giving two scenes conflicting source states.

## Handoff

Describe the relation between adjacent scenes: continued velocity, counter
motion, deliberate stop, matched geometry, shared color, sound bridge, semantic
answer, or hard contrast. “Fade out, fade in” is insufficient unless fading is
the motivated relationship.

## Approval

Show the storyboard when the user wants direction control. When the user has
authorized an autonomous or effect-first run, record the skip and continue;
the storyboard still exists so later corrections remain traceable.
