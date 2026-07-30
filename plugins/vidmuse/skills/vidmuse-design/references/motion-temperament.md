# Motion Temperament

This reference defines how a visual world should move. It does not prescribe
GSAP calls or own timeline implementation.

## Meaning

Easing is emotional language: confident motion arrives decisively, gentle
motion settles, playful motion may overshoot, and solemn motion needs time.
Speed communicates weight. Fast motion feels urgent or light; slow motion
feels heavy, luxurious, contemplative, or atmospheric.

Use enter, move, and exit behavior consistently:

- entrances normally decelerate into place;
- exits normally accelerate away;
- movement between established positions normally eases at both ends;
- exits are usually shorter than entrances.

## Scene rhythm

Design a scene as Build, Breathe, Resolve.

- **Build:** introduce hierarchy in importance order, with overlapping entries.
- **Breathe:** keep the content readable; at most one ambient behavior should
  compete for attention.
- **Resolve:** leave decisively, land a final state, or hand an object into the
  next scene.

Vary pace, direction, and stillness across a film. Repeating the same
translation, duration, stagger, or ambient zoom makes the mechanism visible.
Stillness after motion is a valid emphasis.

## Transition semantics

- continuation may crossfade or preserve an object;
- disruption may hard cut or break the established geometry;
- reflection may dissolve or drift;
- causality should let an action, shape, word, or camera move create the next
  state.

Choose the transition because of the relationship between beats, not because
it is available in a catalog.

## Handoff

Write qualitative temperament and a small set of duration/ease tokens in
`FRAME.md`. The film workflow maps those intentions to beats.
`hyperframes-animation` implements them with seek-safe timelines, and
`vidmuse-motion` supplies named semantic mechanisms when a beat needs one.
