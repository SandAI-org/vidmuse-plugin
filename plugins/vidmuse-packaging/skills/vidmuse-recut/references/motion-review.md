# Motion Review

Review rendered motion, not timeline source or easing labels.

## Motion reel

Before full-film assembly, render a 10–20 second reel containing:

- the opening promise;
- one central visual proof;
- the signature sequence;
- the highest-risk transition;
- the ending or return to source.

Include authorized provisional sound. The reel is a production gate, not a
marketing trailer.

## Scene review

For each included scene, inspect:

- whether motion begins with intent;
- whether elements enter in the order the logic demands — causes before
  effects, steps in sequence — rather than all at once;
- whether something develops after entry;
- whether the proof remains readable long enough;
- whether velocity and scale feel weighted at delivery fps;
- whether the exit prepares the handoff;
- whether source and graphics occupy one perceived space;
- whether sound lands on the visual cause.

## Temporal review (film level)

Judged across the reel and act renders, against the motion-language anchors
in [camera-and-transition-craft.md](camera-and-transition-craft.md) and the
temporal tells in [packaging-tells.md](packaging-tells.md):

- **See, then hear** *(charter 5)* — visuals that illustrate a spoken claim
  arrive slightly before the words; a build completes with the sentence, not
  before or after it.
- **Energy curve** *(charter 7)* — sketch the film's packaging energy over
  time; it should rise, breathe, and land. Equal beats at equal spacing is
  tell T1; no quiet passage is tell T4.
- **Attention thread** *(charter 8)* — at each dense moment, count elements
  in significant motion; more than two, or two of equal weight, splits the
  thread.
- **Exit craft** *(charter 2)* — sample several exits: if every element
  leaves by the same fade while entrances are choreographed, exits were not
  authored (tell T5).
- **Entrance diversity (count)** *(charter 1)* — this is where Taste Gate 7's
  deferred count actually runs, now that tweens exist: tabulate rendered
  entrances by direction × ease family. One combination owning every
  treatment class is tell T3 unless FRAME declared the uniformity with
  intent.

## Transition review

Inspect the five-frame boundary sample described in
`camera-and-transition-craft.md`. Compare the declared handoff in
`scene-plan.json` with the rendered relationship. A clean render can still
fail when it expresses the wrong motion.

For aperture, split, stack, and picture-in-picture exits, inspect whether the
outgoing proof surface has actually cleared before the full-screen source
returns. If both coexist without a declared composite purpose, the viewer sees
duplicate or triple imagery. Sequence the exit and source return, then inspect
the encoded boundary again rather than trusting timeline ownership.

Apply the same rule beyond source returns. An outgoing title, causal state,
audit panel, module surface, or proof world must clear before its successor
becomes the semantic owner unless the overlap is an intentional composite with
one readable focal hierarchy. Inspect entry, developed hold, exit, and at least
five encoded frames around the handoff; a clean DOM, valid timeline, or passing
hero still cannot prove state ownership through motion.

## Failure response

Fix conceptual failures by changing the proof, camera verb, source mode, scene
duration, or handoff. Do not hide a weak scene behind more particles, blur, or
faster timing. Record the finding and correction in `evaluation.json`.
