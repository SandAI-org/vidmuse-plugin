# Camera and Transition Craft

Treat motion as shot direction, not a collection of entrances.

## Motion language

Principles first, then anchors. Each anchor number is an expert starting
point, not a law: it exists because the alternative to a stated default is
the training-set average, which is exactly what machine-packaged video looks
like. **Deviation clause:** any departure from an anchor is fine — write the
one-sentence reason into the self-audit so the choice stays a choice.

**Law source:** once the project `FRAME.md` exists, its `motion` tokens are
the single runtime authority (taste-authority rank 3) — composition HTML
reads durations and eases from FRAME, never from this table. This section is
consumed *while writing* FRAME's motion tokens and during self-audit of
frames FRAME left unspecified; if FRAME's tokens and these anchors disagree,
FRAME wins and this table is only grounds for questioning FRAME at review,
not for a second value at runtime.

### Easing carries meaning

Enter with deceleration (ease-out), leave with acceleration (ease-in). An
entrance is an invitation — it should arrive fast and settle while the viewer
is looking; ease-in on an entrance delays exactly the moment of attention.
An exit is yielding the floor — it clears quickly because attention has
already moved to what is next. Reserve linear for mechanical motion (scrolls,
counters, camera drift) and overshoot/bounce for the rare beat whose meaning
is playful; overshoot on evidence reads as sloppy.

*Anchor:* a strong ease-out of the `cubic-bezier(0.16, 1, 0.3, 1)` family for
confident arrivals; exits at roughly **60–70% of the entrance duration**.

### Duration follows weight

The time a motion takes tells the viewer how much the moment weighs. A small
emphasis is a glance; a panel is a beat; a hero is a breath. Duration is
proportional to the reading burden the element carries — a number the viewer
must absorb holds longer than a label they only register.

*Anchors (at speech pace; scale with the speaker's energy):*

| move | duration |
| --- | --- |
| word/keyword emphasis, small labels | 200–400ms |
| panels, comparisons, PiP arrivals | 400–700ms |
| hero takeover, orchestrated multi-element entrance | 700–1200ms |
| stagger between sibling elements | 40–80ms per item |

Anything under ~150ms is invisible at 30fps except as a pop; anything over
~1.5s that isn't a hero reads as latency.

### Attention is single-threaded

A viewer tracks one, at most two, moving things. Choreograph multi-element
scenes as sequences — causes before effects, steps in order — not as
simultaneous launches. Simultaneity is reserved for genuinely simultaneous
ideas.

*Anchor:* at any instant, **≤2 elements in significant motion**; the second
must be subordinate (smaller amplitude, lower contrast) to the first.

### Asymmetric pacing

Slow where the viewer is deciding, fast where the film is confirming. The
build-up to a claim can take its time; the resolution after it should be
brisk. Films that are uniformly fast feel anxious; uniformly slow, inert.

### One authored moment

An orchestrated signature beat lands harder than the same energy scattered
across twenty entrances. When the motion budget is tight, spend it on the one
moment the film will be remembered by and let the rest stay quiet — a dense
passage earns a quiet one.

These principles are judged in the rendered reel, not in the timeline source
(see [motion-review.md](motion-review.md)); the charter dimensions they serve
are Undisturbed (8), Felt (7), and Intent (1) in
[aesthetic-charter.md](aesthetic-charter.md).

## Camera verb

Give each substantial scene one principal verb: push, pull, drift, orbit,
track, fold, reveal, capture, settle, or snap. Supporting element motion should
agree with or deliberately counter that verb.

The opening frame should already be inside a visual event unless deliberate
stillness is the hook. Avoid the common sequence “blank frame, fade in,
elements stop.”

## Five phases

- **Entry:** establish direction and weight.
- **Development:** change information, depth, or composition after arrival.
- **Hold:** let the viewer read the proof.
- **Exit:** release or redirect energy.
- **Handoff:** define what the next scene inherits.

Exits are authored with the same care as entrances. A scene whose timeline
ends before its master slot can disappear early and flash black; pad the
timeline and verify its final visible frame.

## Transition families

- **Hard contrast:** use for capability, material, or argument changes that
  benefit from impact.
- **Velocity continuation:** preserve direction and perceived speed across the
  cut.
- **Matched geometry:** let one object, mask, or frame become the next scene's
  ground.
- **Semantic answer:** cut because the next image proves or contradicts the
  prior line.
- **Deliberate stop:** resolve motion and use stillness or silence as the cut.

Chapter boundaries the chapter map confirms as real **default to a marked
transition** from one of these families; in Packaging mode on a continuous
plate this can be as light as a source-state change, a brief matched-geometry
wipe, or a chapter-mark update on the progress rail with a beat of
punctuation. An unmarked real chapter turn is a missed orientation beat.
Content without real chapters gets no manufactured boundaries.

## Frame discipline

Quantize scene boundaries to output fps. Review at least the final two frames
before a boundary, the boundary frame, and the first two frames after it.
Check black flashes, repeated frames, scale jumps, direction reversals, early
hides, and accidental audio discontinuities.

Ease names are not craft by themselves. Judge sampled velocity and perceived
weight in the rendered reel.
