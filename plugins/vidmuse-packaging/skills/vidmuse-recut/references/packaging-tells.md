# Packaging Tells

The recognizable defaults of machine-packaged video. Each tell is legitimate
somewhere; appearing **unexamined**, it reads as generated. The test is never
"is this device banned" but "was this chosen for this film" — a tell used with
a written, footage-grounded reason stops being a tell.

Check this list at three moments: while writing `packaging-analysis.md`, in
the FRAME.md Pre-Render Self-Audit, and during motion review. Each entry names
the charter dimension it violates ([aesthetic-charter.md](aesthetic-charter.md)).

## Temporal tells (rhythm and choreography)

**T1 — Metronome spacing.** Interventions land at near-equal intervals, spaced
by the clock rather than by where the argument turns. *Why it reads as AI:*
real editors cut to the argument; only a generator cuts to a grid. Violates
Intent (1) and Felt (7).

**T2 — A card per sentence.** Every transcript point gets its own overlay, so
information density never varies and nothing reads as more important than
anything else. *Why:* uniform emphasis is no emphasis; the viewer's attention
budget is spent on filler before the claim that matters arrives. Violates
Restraint (4) and Clearer (5).

**T3 — One entrance for everything.** All entrances share one direction and
one ease regardless of what each intervention means. *Why:* direction and ease
are meaning-carriers (a conclusion should not arrive like a footnote); reusing
one move for all meanings says no one was choosing. Violates Intent (1).

**T4 — No quiet passage.** The film never goes unpackaged for more than a few
seconds. *Why:* silence is what makes the hero moment audible; wall-to-wall
packaging flattens the energy curve. Violates Restraint (4) and Felt (7).

**T5 — Choreographed entrances, identical fades out.** Exits are an
afterthought — every element leaves by the same fade. *Why:* an exit is the
handoff to the next idea; abandoning it breaks scene grammar. Violates One
world (2).

**T6 — Clock-fixed durations.** Hold times are constants unrelated to speech
rhythm or the weight of the moment. *Why:* a number the viewer must absorb
needs longer than a label; equal holds mean nobody weighed the content.
Violates Clearer (5).

**T7 — Graphics in a separate universe.** Overlays hold perfectly still while
the camera or subject moves, as if frame and footage lived in different
spaces. *Why:* it exposes the overlay as a sticker on top of the video rather
than a thing in the room. Violates Authenticity (9).

**T8 — Per-word bouncing captions everywhere.** Karaoke-style word-pop
subtitles run the entire film regardless of tone. *Why:* it is the loudest
current template in short-form feeds; on a calm founder monologue it costumes
the film as someone else's genre. Violates Authenticity (9) and Undisturbed (8).

## Visual tells (frame and skin)

**V1 — Night canvas by default.** Full-screen dark takeovers with grid lines
and glow appear without the beat earning a takeover. *Why:* the room's own
palette is the film's identity; replacing it wholesale is the video analogue
of the web's dark-dashboard default. Violates Authenticity (9). (Enforced by
the proof-density cap and Taste Gate 1.)

**V2 — English status chrome inflation.** `EXPIRED` / `STALE` / `ACTIVE`
chips, SaaS ops widgets, and fake terminal dressing accumulate on a
Chinese-language film. *Why:* status chrome borrows authority from an
aesthetic the content does not own; judgment lines drawn from the transcript
carry more meaning in less ink. Violates Content specificity (3). (Taste Gate
4 caps distinct status tokens at two.)

**V3 — Fake precision.** Invented decimals, made-up version strings, decorative
progress percentages, or charts whose numbers appear nowhere in the transcript.
*Why:* the viewer cannot tell styled fiction from evidence, so real numbers
lose their force too. Violates More convincing (6) — and the Numerals & Claims
hard rule makes this one non-negotiable.

**V4 — Diagram inflation.** Cascade nets, pressure loops, module stacks, and
architecture diagrams multiply beyond the one or two relations the plate
cannot show. *Why:* each diagram spends a full-frame takeover; spent on
restatement rather than relation, it dilutes the ones that matter. Violates
Restraint (4) and More convincing (6).

**V5 — Template composition with content poured in.** Swapping the transcript
to any other topic would leave the frame equally plausible. *Why:* this is the
core template test; if content does not constrain form, form was never chosen.
Violates Content specificity (3). (Also enforced in hero-frame review.)

**V6 — Decorative structure.** Numbered indexes (01/02/03), chapter marks,
or segmented rails on content that has no real sequence or chapters. A
**plain** time-progress rail is exempt — it promises only elapsed time,
which is always true, and is default-on per
[device-craft.md](device-craft.md); the tell is chapter/segment chrome
without chapters. *Why:* structure chrome promises an order the argument
does not have; the viewer notices the promise breaking. Violates Clearer (5).

## Using this list

- In the packaging analysis and self-audits, run the film against each tell
  and either clear it or write the one-sentence reason the device is chosen
  here.
- Tells are cheap to add and expensive to argue with — when in doubt, the
  source-led alternative wins.

## Growing this list

This list compounds through project feedback. When `evaluation.json`
`feedback.events` shows the same rejection pattern across projects — a device
users repeatedly remove or tone down — distill it into a new tell here, with
its *why* and charter dimension. A rejected choice is a higher-value taste
signal than an accepted one; this file is where those signals accumulate.
