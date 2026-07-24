# Captions and Golden Lines

Captions are the only packaging element present in nearly every frame — the
film's continuous voice. Their craft ceiling therefore sets the whole film's
perceived quality floor. Golden lines are the opposite: the scarcest device,
whose force comes entirely from how rarely it fires. This reference covers
both because they form one gradient — from the quietest treatment of speech
to the loudest.

Charter dimensions served: Watchable on mute (11), Undisturbed (8),
Authenticity (9) — see [aesthetic-charter.md](aesthetic-charter.md).

## Captions as a continuous system

### Derive, don't design twice

Caption face, weight, color, and surface come from `FRAME.md` tokens — the
caption is the design system's smallest ambassador, not a separate decision.
In preset mode the pack's `caption-skin.html` is the starting point; in
composed mode the caption skin is written from the same tokens as everything
else. A caption that looks pasted on from another film breaks One world (2)
in every single frame.

### Placement is a contract

Pick the caption zone once per film (per aspect ratio) and keep it. The zone
never collides with the face, hands, or gaze line, and respects the safe
areas in [composition-contract.md](composition-contract.md). A caption that
jumps zones mid-film reads as a glitch — the one legitimate exception is a
declared act-world change in Director mode.

*Anchors:* one to two lines; comfortable line length for the face size (a
caption is read in one fixation, not scanned); never let the caption outweigh
the face in contrast — the person is the film's focal point, the caption is
its voice-track made visible.

### Rhythm follows speech, not the metronome

Cue boundaries come from the aligned transcript's utterance grouping — break
at phrase boundaries, not at character counts. A cue appears when its phrase
begins and yields when the phrase ends; it never lingers into the next
thought (the viewer re-reads stale text) and never arrives early (it spoils
the sentence). Entrance and exit are quiet — opacity or a few pixels of
settle. The caption is the one element whose motion should be *invisible*:
any entrance the viewer notices is attention stolen from the words
themselves. Per-word karaoke pop is a genre costume, not a default
(tell **T8** in [packaging-tells.md](packaging-tells.md)).

### Typographic care at caption scale

- Punctuation: real quotes and dashes, not typewriter approximations; in
  Chinese text, full-width punctuation with proper compression.
- Numbers inside captions use tabular figures when counting or comparing, so
  digits don't jitter between cues.
- Emphasis inside a caption is weight or color on the FRAME accent — never a
  second font, never underline (a web reflex), never more than one emphasized
  span per cue. If every cue has an emphasized word, none of them is
  emphasized (the mechanical check for this lives in the Taste Gate).

## Golden lines — the escalation gradient

A golden line is a sentence from the transcript that carries the argument's
judgment — the line a viewer would quote. Not every strong sentence is one.

### Qualification

The sentence must (a) be an actual judgment or claim, not context; (b) stand
alone without the surrounding sentences; (c) be something the film has earned
by that point — a conclusion before its evidence is an ad, not a golden line.
Most films have one to three. A film where every section ends in a "golden
line" has none (tell **T2** logic applied to emphasis).

### Three rungs, used in order

Escalate only as far as the line's weight demands; each rung is roughly an
order of magnitude rarer than the one below:

1. **Weight shift (many per film, but bounded):** the caption itself carries
   the moment — accent color or heavier weight on the key span, slightly
   longer hold. The film's default way of saying "this matters." "Many" still
   answers to Taste Gate 8: both accent and weight-shift spans count toward
   its ~1-in-5 cue anchor.
2. **Typographic moment (a few per film):** the line steps out of the caption
   zone — larger scale, composed placement, source may dim or reframe. The
   spoken caption for that span is absorbed into the treatment (never show
   the same words twice on screen).
3. **Hero treatment (bounded by the proof-density cap — on a short static
   plate that usually means exactly one):** a full-frame or near-full-frame
   composition built around the line — the signature-sequence candidates. At
   this rung the line must pass the qualification test *strictly*:
   transcript-verbatim, judgment-bearing, earned.

The rung is chosen by the line's role in the argument, not by how long ago
the last visual event happened — spacing emphasis by the clock is tell **T1**.

### Language of judgment

Prefer the speaker's own words, verbatim, in the speaker's language. Chinese
judgment lines outrank English status chrome (Taste Gate 4): a quote in the
speaker's voice carries authority that a translated or styled paraphrase
loses. Trimming for length is allowed; rewording is not — if the sentence
needs rewording to work as a golden line, it wasn't one.
