# Frame Showcase

`frame-showcase.html` is the direction-gate and design-evidence artifact: a
single self-contained HTML page, authored by you for this project, that lets
the user see the design system live and see it landing on their own footage —
before any timeline work.

The same file has two successive states on a fresh Recut project:

1. **Direction selection:** exactly three complete, project-grounded worlds
   share the page. Each renders the same three or more project moments: a
   source/caption state, a developed proof/treatment state, and another layout
   state with live motion temperament. One is recommended; the page is shown
   and work stops until the user chooses.
2. **Selected-system proof:** after the choice, keep the comparison visible,
   mark the winner, and append the full contract below from the winning
   `FRAME.md`. This is review evidence, not a second blocking gate when it
   faithfully implements the user's choice.

Candidate tokens in the first state are scoped comparison material, not three
project authorities. Do not create extra FRAME, JSON, or HTML artifacts for
them. Do not remove their comparison section after selection. The
one-source-of-truth rules below apply to the appended selected-system proof.

It replaces the old template-generated style board. There is no generator
script. The selection state follows `direction-picker.md`; after selection,
write the page the way the private VidMuse frame packs write theirs, driven
entirely by the work directory's `FRAME.md`.

## Selected-system proof contract

Everything from this heading onward applies only after the user has selected a
direction and the winning `FRAME.md` exists.

**One source of truth.** Every color, font, size, radius, and motion value on
the page comes from `FRAME.md` frontmatter, wired through CSS custom properties
in one `:root` block (the upstream packs label it `id="ds-tokens"`). Changing a
token there restyles the whole page. No second copy of the palette anywhere.

**Self-contained.** Inline CSS, Google Fonts (or the project's resolved fonts)
via `<link>`, keyframe images referenced by relative path from the work
directory. No build step; the file opens from disk.

**Live rendering, not screenshots, for the system itself.** Palette chips,
type specimens, component demos, and treatment mini-frames are real DOM styled
by the tokens. Mini-frames use `aspect-ratio` + `container-type: size` with
`cqw` units so they are true miniatures of the render canvas.

**Real footage for the packaging points.** The page must also show the design
on the user's video, not only on abstract specimens. Extract representative
keyframes and build the packaging-point section on top of them.

**Real content.** Text in specimens and mini-frames comes from the transcript
— actual headlines, actual quotes, actual speaker names. Numerals follow the
FRAME.md fabrication rule: transcript-backed or placeholder, never invented.

## Required sections

Order and naming are yours; a viewer must be able to find all seven.

1. **Direction** — project name, mode (preset / composed), the one-paragraph
   rationale, the anchor and why this design departs from it (composed mode),
   and the signature move stated as a sentence. Director mode also shows the
   film spine and the intended contrast between act worlds.
2. **Palette** — one chip per color token: swatch, name, hex, role.
3. **Typography** — one row per typography token, rendered at size in its real
   font, with the token name and metrics alongside.
4. **Components** — each `components:` entry from FRAME.md rendered as a live
   demo at realistic proportions.
5. **Treatments on footage** — the heart of the page. For each Frame Treatment
   in FRAME.md, one 16:9 (or project-aspect) frame that composes the treatment
   **over a real keyframe from the section of the video where it will be
   used**, with its time range and packaging intent labeled. A Registry effect
   that will carry the treatment appears here as its adapted hero state — the
   installed mechanism restyled with the project tokens and filled with real
   transcript content, not the upstream demo styling.
   In Director mode, include the hero state of every substantial scene,
   including full-frame takeovers; use real source frames wherever the scene
   retains or composites footage.
6. **Motion temperament** — the motion tokens shown as values (durations,
   eases, stagger), plus, when it clarifies the temperament, a small looping
   CSS/GSAP demo of the enter/exit grammar. A static page with clearly stated
   values is acceptable; fake motion that misrepresents timing is not.
7. **Caption system** — the one element present in nearly every frame, so it
   gets its own section rather than being one treatment among many. Show it on
   a **real keyframe**, with **real transcript** text, in the film's actual
   caption band (draw the band edge so its position is visible, as the pack
   showcases do), and include the rung-1 emphasis state (accent or weight
   shift on a key span) since that belongs to the same continuous system —
   [captions-and-golden-lines.md](captions-and-golden-lines.md).

   Present **two or three candidate caption identities**, one recommended,
   each losing candidate carrying a one-line reason — the same diverse-
   shortlist discipline `style-composition.md` applies to direction, for the
   same reason: the first mechanism a model reaches for is the one every run
   would ship. In preset mode the pack's `caption-skin.html` is candidate one
   and `effect_affinity` bounds the rest; in composed mode each candidate is
   drawn from FRAME.md tokens. Label the owning workflow's already-declared
   aspect and pixel range so every identity is proved in the same reserved
   band; caption identity selection does not reopen band position.

## Keyframe extraction

```bash
ffmpeg -y -i "$VIDEO_PATH" -vf "select='eq(n\,0)+gt(scene\,0.3)',scale=960:-2" \
  -vsync vfr -frames:v 8 "$WORK_DIR/showcase-frame-%02d.png"
```

Pull additional frames at specific timestamps (`-ss <t> -frames:v 1`) when a
treatment belongs to a section the scene detector skipped. Choose the frame
each treatment actually sits on — a hook treatment on the opening frame, a
quote treatment on the frame where the quote is spoken.

## Review selected-system proof

Before sharing the proof page, open it yourself and run the FRAME.md
Pre-Render Self-Audit **and Taste Gate** against the treatment frames —
squint, silence, restraint, anchor, fabrication, source-led share, status-chrome
cap, single-anchor honesty. Fix what fails.

The Taste Gate is one counted review, not a collection of impressions:

1. **Room first:** the direction looks like this person and room before it
   looks like a generic methodology deck.
2. **Source-led share:** on a static mono plate, source-led seconds are at
   least half the runtime and light treatments are at least half the treatment
   classes. Record treatment counts, packaged seconds, and source-led ranges.
3. **Single anchor:** the named anchor matches the culture that actually owns
   the screen; otherwise rename it or remove the competing skin.
4. **Judgment over status chrome:** on Chinese speech, distinct English
   status/SaaS tokens are at most two unless the transcript itself uses that
   language.
5. **Mono hierarchy:** technical mono labels structure but does not occupy
   more Hero-frame area than the film's judgment type.
6. **Proof scarcity:** count full-frame takeovers and diagrams against
   [the Recut director pass](../../vidmuse-recut/references/director-pass.md)
   when Recut owns the film; merge or remove excess proof systems.
7. **Entrance intent:** do not declare one direction/ease combination as the
   whole film's default without a reason. Count actual entrances later during
   scene and motion review.
8. **Emphasis scarcity:** count caption cues with accent or weight emphasis.
   Roughly one in five is a useful anchor; a majority always fails.
9. **Mechanism demotion:** no visible choice comes solely from an installed
   effect demo against the BRIEF, source footage, or `FRAME.md`.

Also check the caption band across every treatment frame: the captions sit in
the film's declared band, and no treatment's graphics occupy it without a
recorded reason. A showcase whose treatments each look fine but collectively
crowd the caption out of its zone is the failure this section exists to catch.

Review question order:

1. Does this look like **this room / this person**?
2. Is the argument clearer without turning into a methodology deck?

Run these questions yourself. Reopen user input only when this proof exposes a
material departure from the selected candidate; otherwise do not create a
second direction stop.

## Taste tells that fail the gate

- Every treatment sits on a night grid with mono status chips (`STALE` /
  `EXPIRED` / `MODEL UPDATE`) and almost no warm full-bleed face holds.
- Showcase looks like product-spec tiles more than the founder's space.
- More than two distinct English status words across the film on Chinese speech.
- Dual culture (warm editorial named, technical blueprint practiced) with no
  rewrite of anchor or departure narrative.
- Captions sit somewhere other than the bottom-centered band with no written
  reason — or the page shows no caption at all, leaving the film's most
  constant element unconfirmed.

Share the selected-system page as non-blocking evidence, then continue. Apply
corrections to `FRAME.md` first, then re-wire the showcase tokens — the two
artifacts never disagree.
