# Create path routing

Choose one visual craft path for a film made without a speaking-footage plate.
This file owns routing only. It does not impose a universal beat schema,
approval sequence, or production artifact set.

## Decision order

1. `vox` when the user asks for Vox, paper collage, halftone collage, or
   `vox-collage-*`.
2. `promo` when a product, website, interface, launch, brand, or live URL is
   the subject.
3. `explainer` for other knowledge, concept, how-to, or topic films.

Record the selected `create_path` in project context. Do not mix path-specific
craft references.

## Path map

| path | use | load |
| --- | --- | --- |
| `promo` | product launch, site-to-video, UI film, brand sizzle | [site-capture.md](site-capture.md) when reachable, then [product-launch-film.md](product-launch-film.md) |
| `explainer` | knowledge, concept, how-to, listicle, topic film | [story-design-explainer.md](story-design-explainer.md), then only the relevant parts of [picture-design.md](picture-design.md), [visual-design.md](visual-design.md), [motion-language.md](motion-language.md), and [cut-catalog.md](cut-catalog.md) |
| `vox` | Vox or paper/halftone collage | [vox-collage.md](vox-collage.md) only for visual craft |

## Promo operating context

Keep the project context compact and decision-oriented:

```json
{
  "create_path": "promo",
  "proposition": "one viewer-facing change",
  "directorial_idea": "one action or metaphor",
  "spatial_model": "the world the film inhabits",
  "camera_grammar": "how and why the viewpoint moves",
  "transition_families": ["two to four related families"],
  "audio_intent": {
    "vo": false,
    "music": "planned",
    "sfx": "restrained event accents"
  }
}
```

These are creative coordinates, not fields that must become a formal JSON
artifact. Preserve them wherever the working project keeps direction.

For a short product launch film, prefer four to six developed scenes over a
large list of shallow beats. Each scene should answer:

- What is the focal subject?
- Where is the camera at the start and end?
- What meaningful state changes?
- What is carried into the next scene?
- Which real asset proves the claim?

Use a recurring object only when it carries meaning. Coherence may instead
come from a shared spatial world, camera axis, crop law, light direction,
typographic system, edit rhythm, or transition family.

## Explainer operating context

Use narration and ATA when the film is narration-led. Organize around the
viewer understanding a sequence of ideas, not around equal time slices or
one card per sentence. Let diagrams, examples, quiet holds, and type take
different amounts of time according to comprehension.

Load only the visual and motion references needed by the chosen treatment.
Use `/vidmuse-motion` when a concrete dataviz or semantic mechanism needs a
recipe; do not load a recipe library simply to create generic activity.

## Vox isolation

Vox is clip-per-argument collage. It keeps the common sound and Timeline
delivery behavior from `../SKILL.md`, but it does not inherit product-launch
camera grammar, UI proof rules, shot-card conventions, or non-Vox planning
formats.

## Product evidence

When a promo has a reachable site or supplied screenshots:

- capture before designing;
- show at least one recognizable real product moment;
- use a full screenshot only when the whole surface matters;
- otherwise use editorial crops, isolated details, hybrid slices, or a
  moving product capture;
- rebuild UI only when the interaction itself is the story and a capture
  cannot express it truthfully.

Generated generic dashboard chrome must not replace available product proof.

## Sound defaults

- No voiceover means no voiceover; it does not mean silence.
- Product launch films default to music unless silence is explicit.
- Narration-led explainers use real TTS and ATA timing.
- SFX belong to visible mechanical events and should remain subordinate to
  music or narration.

## Working artifacts

Create only artifacts that help direct or implement the current film:

- a compact direction note;
- script or on-screen copy;
- storyboard frames for spatially ambiguous scenes;
- an animatic when timing or music needs proof;
- asset and provenance records;
- the HyperFrames composition and VidMuse Timeline DSL.

Do not require three directions, approval receipts, hashes, formal beat
contracts, generated scaffolds, or motion reports unless the user asks for
that production process or the project already depends on one of those
artifacts.

Technical lint, media receipts, deterministic timing, claim truth, and a
complete normal-speed playback remain necessary production hygiene.

## Recipe names

Legacy recipe names map to paths as follows:

| recipe | path |
| --- | --- |
| `knowledge-explainer` | `explainer` |
| `saas-promo-30s` | `promo` |
| `site-to-video` | `promo` |
| `brand-sizzle` | `promo` |
| `hook-proof-outro` | `promo`, or `explainer` when no product exists |
| `data-beat` | whichever path owns the surrounding film |
| `vox-collage-broll`, `vox-collage-explainer` | `vox` |

Recipes are optional starting shapes. The film's proposition, material, and
directorial idea decide the final structure.
