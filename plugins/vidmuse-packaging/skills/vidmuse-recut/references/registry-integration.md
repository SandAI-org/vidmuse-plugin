# Registry Integration

HyperFrames Registry is the default executable effect supply. VidMuse does not
fork the catalog into a second implementation library: `data/effects-overlay.jsonl`
adds taste, editorial, and compatibility metadata, and the LLM adapts the actual
installed HTML for the current video.

## Authority split

| concern | authority |
| --- | --- |
| effect mechanism and upstream bug fixes | installed HyperFrames Registry item |
| when to use / avoid, weight, zones, conflicts | VidMuse effects overlay |
| content, palette, typography, geometry, timing | LLM, grounded in the selected design system and footage |
| seekability, media ownership, timeline registration | HyperFrames technical contract |
| acceptance | frame showcase on real keyframes, `check`, keyframe proof, rendered-output review |

`hyperframes add` currently accepts an official item name or tag, not a custom
registry URL. Keep VidMuse-only code under `library/native/` in the same
block/component shapes, and contribute general mechanisms upstream when stable.

## Selection and installation

```bash
python3 scripts/effects.py --index
python3 scripts/effects.py "hf:<id1>,hf:<id2>" --get
npx hyperframes add <upstream-id> --dir "$WORK_DIR/registry-source" --no-clipboard --json
```

Treat `registry-source/` as inspected upstream source material. Write only the
LLM-adapted result into `public/effects/` or `public/compositions/`; never render
an untouched demo file merely because `add` succeeded.

Catalog availability is not endorsement. A curated overlay record can still be
`candidate` or `needs-real-video-proof`; an unreviewed official item is usable
only after the LLM reads its installed source, identifies its real integration
shape, and proves it on footage.

In Director mode, the compact index may expose `director_capabilities`,
`production_cost`, and `proof_requirements`. Select by the capability required
by `scene-plan.json`, then act-world fit, then cost. Never begin with the most
spectacular effect name. `very-high` cost is normally reserved for the opening
promise, central proof, a major act-world hinge, or ending resolution, and it
requires a documented simpler fallback.

Do not rely on catalog descriptions for structure. Registry items may be
standalone demos, sub-compositions, pasteable snippets, or timeline hooks, and
their source can evolve independently of this skill.

An official block is not a parameterized template unless its installed source
actually exposes a variable contract. When demo identity, copy, product UI,
geometry, and choreography are hardcoded, extract or adapt the mechanism and
re-author the shot. Large demo-specific compositions may remain uncurated even
when their motion is excellent; inspection as reference does not make them a
safe production dependency.

## Pinned CDN policy

CDNs are allowed because the official catalog uses them and the user accepted an
online render dependency. Keep the dependency explicit and reproducible enough
to audit:

- runtime libraries need an exact version in the URL, for example
  `https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`;
- never use `@latest`, floating major versions such as `@3`, or an unversioned
  runtime URL in a render-critical composition;
- allow by default only `cdn.jsdelivr.net`, `fonts.googleapis.com`, and
  `fonts.gstatic.com`; document any additional host in `effect-sources.json`;
- Google Fonts requests name exact families and weights; record the complete URL;
- reuse one host runtime when integration permits, instead of loading duplicate
  GSAP copies into the same composition;
- `hyperframes check` must show no failed requests before render.

This policy accepts that rendering requires network availability. A later
offline requirement is a delivery-mode change, not a reason to maintain a
second effect library.

## LLM-authored adaptation

The LLM is the adapter and motion author. It preserves the useful mechanism but
rewrites everything that is project-specific:

1. replace demo copy, transcript data, images, and sample identities;
2. bind or rewrite palette, type, material, sizing, and safe-area geometry from
   the work directory's `FRAME.md` and the actual footage;
3. prefix IDs and selectors so they are unique in the assembled page;
4. derive timing from transcript beats and the effect's native choreography;
5. remove autoplay, wall-clock state, unseeded randomness, input-driven state,
   and infinite loops;
6. keep one timeline per composition, registered synchronously under the exact
   composition id;
7. record every meaningful change in `effect-sources.json`.

The design system guides visual judgment; it does not require every official
item to expose the same token names. Prefer upstream `data-composition-variables`
and CSS custom properties when present. Otherwise the LLM may adapt the installed
CSS and timeline directly.

## Integration modes

### Block — `sub-composition-adapt`

Mount a block through `data-composition-src` after making its file satisfy the
current sub-composition transport contract. The host id, inner composition id,
and registered timeline key match exactly. The block owns its timeline and
HyperFrames seeks it independently; never add it to the host timeline.

### Component — `inline-component-adapt`

Extract the reusable mechanism, not the standalone demo page. Integrate markup,
styles, and functions into the host or a dedicated sub-composition. Reuse the
owning composition's timeline and runtime registration. Delete demo transcripts,
sample content, redundant roots, and duplicate CDN tags.

### Timeline hook — `timeline-hook`

Follow the source's ordering requirements exactly. Hooks such as motion blur may
need to attach after motion tweens establish duration and before timeline
registration. Verify forward seek, seek-back, and exact final state.

### VidMuse native — `native-composition`

Use only for a missing upstream mechanism or a not-yet-generalizable signature
move. Follow the same block/component contract and keep taste metadata outside
the HTML. Upstream parity is the retirement condition.

## Required receipt

Write `effect-sources.json` before assembly. For every selected item record:

- source id and installed HyperFrames version;
- upstream type and chosen integration mode;
- content, design, geometry, and timing adaptations;
- every CDN URL;
- hero-frame path, `check`, keyframe, and render verification evidence.

For any record with `proof_requirements`, include evidence for every listed
item or mark the effect unresolved. GPU candidates additionally need the actual
render path, fallback path, seek-back result, and a motion segment reviewed at
delivery resolution; snapshots alone cannot prove shader stability or text
readability after compression.

If the installed catalog no longer contains an overlay item
(`catalog_present:false`), stop and reselect or re-audit it. Do not silently fall
back to a stale local copy.
