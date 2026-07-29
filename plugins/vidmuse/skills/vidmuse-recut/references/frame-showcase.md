# Frame Showcase

`frame-showcase.html` is the confirmation-gate artifact: a single self-contained
HTML page, authored by you for this project, that lets the user see the design
system live and see it landing on their own footage — before any timeline work.

It replaces the old template-generated style board. There is no generator
script; you write the page the way the upstream HyperFrames frame packs write
theirs, driven entirely by the work directory's `FRAME.md`.

## Contract

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
   drawn from FRAME.md tokens. Label the band's aspect and pixel range so the
   user is approving a position, not only a look.

## Keyframe extraction

```bash
ffmpeg -y -i "$VIDEO_PATH" -vf "select='eq(n\,0)+gt(scene\,0.3)',scale=960:-2" \
  -vsync vfr -frames:v 8 "$WORK_DIR/showcase-frame-%02d.png"
```

Pull additional frames at specific timestamps (`-ss <t> -frames:v 1`) when a
treatment belongs to a section the scene detector skipped. Choose the frame
each treatment actually sits on — a hook treatment on the opening frame, a
quote treatment on the frame where the quote is spoken.

## Review before showing

Before presenting the page, open it yourself and run the FRAME.md
Pre-Render Self-Audit **and Taste Gate** against the treatment frames —
squint, silence, restraint, anchor, fabrication, source-led share, status-chrome
cap, single-anchor honesty. Fix what fails.

Also check the caption band across every treatment frame: the captions sit in
the film's declared band, and no treatment's graphics occupy it without a
recorded reason. A showcase whose treatments each look fine but collectively
crowd the caption out of its zone is the failure this section exists to catch.

Gate question order for the user (and yourself):

1. Does this look like **this room / this person**?
2. Is the argument clearer without turning into a methodology deck?

The user's round is for direction decisions, not for catching contrast bugs.

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

Present the page path to the user together with the render-strategy questions
(aspect, canvas layout, intervention plan). Apply corrections to `FRAME.md`
first, then re-wire the showcase tokens — the two artifacts never disagree.
