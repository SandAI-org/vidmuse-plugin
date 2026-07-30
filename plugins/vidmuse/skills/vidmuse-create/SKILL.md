---
name: vidmuse-create
description: >
  Create a complete designed film when no speaking-footage plate exists:
  product and website launch films, knowledge explainers, script-and-TTS
  films, and Vox-style collage. Use media-use for a single media operation.
compatibility: VidMuse CLI on PATH and authenticated for model-backed work;
  Node.js 22+, ffmpeg/ffprobe, Python 3, and HyperFrames CLI for full films.
---

# VidMuse Create

Direct a film whose primary material must be made. `/vidmuse` owns routing;
this skill owns the film through its first playable Timeline cut.

The outcome is a truthful, coherent film—not a page tour, slide deck, or
feature list with effects.

## Operating brief

- Infer sensible production details from the request and available evidence.
  Ask only when a missing choice would materially change the film.
- Keep one clear proposition and one directorial idea. Let them govern
  composition, camera, transitions, typography, and sound.
- Prefer a few developed scenes connected by visible handoffs over many
  self-contained cards.
- Use real product evidence when it is reachable. Never invent claims,
  metrics, or UI and present them as proof.
- Treat preview and revision as part of directing. Technical checks establish
  correctness; the rendered cut establishes quality.

## Start or resume

Read
[`../vidmuse/references/runtime-policy.md`](../vidmuse/references/runtime-policy.md)
once. It defines namespace safety, work directories, HyperFrames setup, and
VidMuse Timeline delivery.

Resume from existing project artifacts when present. If real speaking footage
becomes the primary material, return to `/vidmuse` so `/vidmuse-recut` can take
ownership.

Choose exactly one path using
[`references/path-routing.md`](references/path-routing.md):

- `promo` — product, website, UI, launch, or brand film;
- `explainer` — knowledge, how-to, concept, or topic film;
- `vox` — Vox, paper-collage, or halftone-collage film.

Load only the references named for that path.

## Create workflow

### 1. Understand the material

For a URL or product film, follow
[`references/site-capture.md`](references/site-capture.md) and capture the
reachable product:

```bash
npx hyperframes capture "<URL>" -o "$WORK_DIR/capture"
```

Inspect the capture visually. Identify the product's strongest proof, brand
language, interface rhythm, and material worth putting in motion. The website
is evidence, not a storyboard.

For an explainer, gather the subject's real diagrams, notation, era, palette,
and visual culture. For Vox, use the supplied script and its dedicated collage
reference.

### 2. Set the direction

Write a compact working note with:

- audience and single-minded proposition;
- the change the film makes the viewer feel;
- one directorial action or metaphor;
- spatial model and camera grammar;
- two to four related transition families;
- audio intent and one CTA.

This is a production brief, not an approval ceremony. Make the best supported
choice and proceed unless the user explicitly asks to compare directions.

For `promo`, read
[`references/product-launch-film.md`](references/product-launch-film.md).
It is the craft authority for flow, camera, motion, transitions, product
material, composition, typography, pacing, and music.

For `explainer`, read
[`references/story-design-explainer.md`](references/story-design-explainer.md)
and the visual references selected by
[`references/path-routing.md`](references/path-routing.md).

For `vox`, read only
[`references/vox-collage.md`](references/vox-collage.md) for visual craft.

Use [`references/story-spine.md`](references/story-spine.md) when the supplied
story is incomplete or the film needs a stronger dramatic turn. It owns
proposition and progression, not visual tokens.

After the film path establishes its proposition, treatment, real evidence, and
coverage, load `/vidmuse-design` for the shared visual authority. Give it the
approved treatment, source/subject evidence, storyboard frames, locked copy,
aspect/caption band, planned density, `film_mode: create`, and the selected
`create_path`. It returns the project `FRAME.md`, caption identity, direction
showcase, and successful `frame_md.py --check` report without taking over scene
planning or animation. Do not continue with an unvalidated FRAME or load a
second visual authority.

### 3. Choose the sound spine

Honor the user's requested sound format:

- If narration is requested, load `/media-use`, generate VidMuse TTS, and use
  real ATA word timing. Read
  [`references/narration-craft.md`](references/narration-craft.md) before
  locking the script. Never invent word times or substitute system TTS.
- If narration is not requested, do not manufacture it. A product launch film
  should still use music by default unless the user explicitly asks for
  silence.
- Use restrained SFX only on meaningful interface, transition, or lockup
  events. Sound should reinforce visible action.

When using narration, save the approved text, audio receipt, final audio,
ATA transcript, and probed duration in the project. Regenerating narration
also regenerates alignment.

### 4. Plan the film as connected scenes

Plan timing from the real audio duration or the chosen music edit. For a short
promo, four to six scenes are usually enough:

`hook → tension or possibility → product proof → transformation → payoff → CTA`

Describe each scene by its focal subject, start state, end state, camera move,
main action, outgoing handoff, and source asset. Do not divide the runtime into
equal sections by default.

Read [`references/scene-brief.md`](references/scene-brief.md) and cite exact
project `FRAME.md` tokens in each scene packet. The scene brief enriches
story, proof, choreography, and handoffs; it must not reopen the selected
visual direction.

Use `DESIGN.md`, `SCRIPT.md`, `STORYBOARD.md`, frame sketches, or an animatic
when they help the current film. They are working media, not mandatory
paperwork. Preserve decisions that the implementation needs; omit ceremony
that adds no creative information.

### 5. Resolve only useful assets

Load `/vidmuse-assets` when the film needs external, generated, or library
assets. Prefer:

1. supplied or captured product material;
2. licensed local/library material;
3. generation only where it adds a needed world, texture, or visual metaphor.

Freeze adopted files locally with provenance. Crop and stage screenshots for
the shot instead of shrinking an entire page into a decorative card. Use
video or animated product capture when it communicates behavior better than a
still.

### 6. Compose in HyperFrames

Build one seek-safe master timeline and keep the film's world coherent across
scene boundaries. For product launch work, follow the implementation guidance
in `product-launch-film.md`; load `/vidmuse-motion` only for a specific
semantic mechanism such as a real counter, chart, table, or transformation
that needs a recipe.

Implementation should make these layers distinct:

- camera or stage movement;
- primary subject choreography;
- secondary UI or media movement;
- detail motion such as highlights, cursor activity, masks, or texture.

Use nested motion, varied cadence, and action-motivated transitions. Keep text
stable long enough to read while other layers remain alive.

### 7. Watch and revise

Run HyperFrames lint/check and inspect representative keyframes. Then watch
the complete cut at normal speed with its actual music, narration, and SFX.

Revise anything that feels like a deck:

- frozen spans with no intentional pause;
- repeated full-screen card replacement;
- constant-speed motion or one entrance recipe everywhere;
- cuts with no visual, spatial, or musical handoff;
- tiny centered product screenshots;
- text and UI competing for the same focal priority;
- transitions that call attention to themselves instead of advancing action.

Do not add ambient motion merely to make pixels change. Improve the shot's
camera, blocking, hierarchy, or handoff.

### 8. Deliver on VidMuse Timeline

Refresh the project DSL after program picture exists and serve it with
`vidmuse serve`. Timeline should contain the finished picture plus the sound
layers and subtitles the user requested.

Report:

- project directory and create path;
- grounding and product evidence used;
- directorial idea, spatial model, and camera grammar;
- important asset and sound choices;
- Timeline URL;
- any material limitation or unverified claim.

Do not call the film finished until the full cut has been watched with sound
and the output is playable on Timeline.

## Light probe

Only when the user explicitly asks for a disposable muted motion probe of at
most 20 seconds:

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init …
```

Keep it seek-safe, run the relevant HyperFrames checks, and label it `stub`.
Never silently downgrade a launch film or client deliverable to this path.
