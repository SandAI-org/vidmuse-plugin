# Composable Style System

Production mode and taste mode are separate axes. Packaging/Director decides
the film structure; preset/composed decides how visual tokens are selected.
Director mode adds a film spine and act worlds as described in
[act-worlds.md](act-worlds.md).

The taste layer has two legitimate modes. In **preset** mode the user picked a
ready pack (or a library profile treated as a pack) and wants it as-is: adopt
its tokens faithfully and put your judgment into casting its treatments onto
this footage. In **composed** mode — the default, and the subject of most of
this document — you compose a project-specific visual language from
single-dimension atoms, optionally using one profile as a reference anchor.

## Official kit surfaces (browse before composing)

```bash
python3 scripts/taste.py --index --domain packs       # 12 hyperframes.dev/design looks
python3 scripts/taste.py --index --domain examples    # init --example structure kits
python3 scripts/taste.py --index --domain showcases   # launch production references
python3 scripts/taste.py --index --domain profiles    # atom-combination precedents
python3 scripts/taste.py --index --domain atoms
```

| domain | role in recut |
| --- | --- |
| **packs** | A pack **is** a visual template: vendored `FRAME.md` + caption skin + `effect_affinity`. Prefer this when the user names a look (Coral, Biennale Yellow, …) or wants a faithful official style. |
| **examples** | Teach host structure (multi-track a-roll, grain, stats). **Not** content-adaptive; demo copy/timing stay locked. Steal grammar, not timestamps. |
| **showcases** | Multi-act production references (shader/Three/VO). Use for technique, never as a talking-head preset. |
| **profiles / atoms** | Composed-mode vocabulary when no official pack is chosen. |

### Preset adoption path (style pack → project)

1. User or judgment selects `pack:<name>` from the packs index.
2. `python3 scripts/taste.py pack:<name> --get --domain packs` for full affinity + motion defaults.
3. Read `source.frame_md` (under `library/frame-packs/…`); `frame_md.py … --check` reports `mode: upstream-pack`.
4. Write project `FRAME.md` with `mode: preset`, `anchor: pack:<name>`, pack `colors` / `typography` / `spacing` / `components` (copy all four — never drop `spacing`), and `motion` from catalog `default_motion` (packs stop at composition). New projects use frame v5 plus `production_mode`; Director mode also declares the film spine and act worlds.
5. Copy `caption-skin.html` into the work dir when captions are on.
6. Select effects from **intersection** of packaging-analysis needs and `effect_affinity.prefer`; soft-ban `effect_affinity.avoid` unless the content absolute needs them and the pack still holds.
7. Cast Frame Treatments onto real transcript times and face-safe zones — packs do not ship a timeline.

Examples/showcases never skip steps 4–7. They only widen the effect and structure menu.

## Layers

| layer | decides | must not decide |
| --- | --- | --- |
| style atom | one aesthetic dimension | exact tokens, effects, timeline |
| reference profile | a coherent precedent made from eight atoms | project implementation values |
| **style pack** | official look tokens + default motion + effect affinity | user-video timeline, transcript copy |
| example / showcase kit | structural & technique precedent | project look (unless pack already chosen) |
| editorial pattern | what the content needs to express | visual skin |
| effect overlay | when and how an effect mechanism fits | whole-film art direction |
| project design system | the final combination and exact implementation | upstream effect internals |

## Required composition

Select one primary atom for each dimension. In Packaging mode these describe
the project. In Director mode they describe the film spine first; each act
world then records its motivated departures:

1. `editorial_stance`
2. `visual_culture` — one primary, optionally one supporting reference
3. `material` — one primary, optionally one restrained secondary material
4. `typography`
5. `composition`
6. `color_logic`
7. `motion_temperament`
8. `source_relationship`

The footage decides the source relationship before visual fashion does. The
content and audience decide editorial stance. These two choices constrain the
remaining dimensions.

Use at most one anchor profile. A profile is evidence that an atom combination
can be coherent, not a package to copy. Test every anchor atom against the
footage: keep it when it survives contact with this video, change it when the
footage argues against it, and record the reason either way in "Why this
departs from its anchor". It is valid to use no anchor when the footage calls
for a combination absent from the reference set.

**No silent dual-anchor.** Naming `editorial-intelligence` while shipping
night-blueprint grids, English status chips, and mono supremacy across most
frames is two skins. Structure may appear as a motivated act-world departure
with a written reason — or rename the anchor to the culture that actually owns
the screen. Read [taste-authority.md](taste-authority.md).

**Room before house style.** Derive palette from wall / wardrobe / practical
lights first. Do not open `hyperframes-creative` as a look menu in the direction
phase; after tokens exist it is hygiene only.

**Judgment type before status chrome.** Prefer short Chinese lines from the
transcript over `EXPIRED` / `STALE` / SaaS ops chips. Cap distinct English
status tokens (default ≤2 per film unless the speech is itself status jargon).

## Coherence rules

- Keep one editorial stance per passage. Intimate documentary and provocative
  commercial attitudes cannot both lead the same act without a narrative turn.
- Packaging mode keeps one primary motion temperament. Director mode keeps one
  global motion physics model while act worlds may change expressive grammar,
  direction, and intensity for a recorded narrative reason.
- Use no more than two materials; one remains dominant.
- Typography and visual culture may contrast, but the contrast needs a content
  reason. Do not mix them merely to appear original.
- Color logic describes relationships, not named hex values. Derive the actual
  palette from the source frame, brand, contrast, and channel.
- Treat `avoid` entries as active conflict tests, not descriptive copy.
- A signature move is outside the atom set: it is the one content-specific
  departure that makes this video unreproducible by changing only the text.

## Composition procedure

1. Read every atom digest and the profile digest.
2. From `video-context.json` and representative frames, select stance and source
   relationship first.
3. **Name the rut, then leave it.** Before shortlisting, write down (in the
   working notes for FRAME.md's departure section) what the default packaging
   for this category of video looks like — the look a generator would produce
   for any founder monologue / product explainer / interview — and also its
   predictable opposite. Both are ruts; neither may be the direction unless
   the user asked for it. A model's first-ranked direction is what every run
   would ship, so the shortlist must be built after the rut is named, not
   before.
4. **Build a diverse shortlist.** Propose candidate directions drawn from at
   least two different visual cultures or material families, each grounded in
   something this footage actually offers (room, wardrobe, light, content
   metaphor). Three candidates is the default; a short Packaging-mode film
   (roughly ≤3 min, quiet plate) may carry two — the burden scales with how
   much direction the film will actually hold. If all candidates share one
   material family, the derivation stopped at the most obvious association —
   widen it.
   - When the direction gate is active, present the candidates to the user at
     or before the showcase round; the user's pick is the external dice that
     keeps the film off the average.
   - On an autonomous run, self-compare the candidates against the charter
     dimensions and record why the winner won *and* why each loser lost.
     Diversity must be checkable, not claimed: each candidate names a
     different would-be `anchor` (or explicit no-anchor) and a different
     primary material in terms FRAME.md would use — candidates that differ
     only in adjectives are one candidate. A winner whose only virtue is
     safety is the rut wearing a new name.
5. Shortlist up to three profiles as precedent. Reject any that conflicts with
   footage, audience, channel, or brand.
6. Compose the remaining dimensions atom by atom. For each serious alternative,
   record a visual reason for rejection.
7. Derive exact palette, fonts, type scale, material values, motion guidance,
   and effect adaptations only after the atom set is coherent.
8. Write the result into FRAME.md: the anchor in frontmatter, the changed and
   kept decisions with their footage-grounded reasons in "Why this departs from
   its anchor" — including the named rut and the losing candidates from steps
   3–4. Director mode also writes `film_spine` and `act_worlds`.
9. Prove the result on real footage. Names and atom descriptions are not an
   approval surface.

## Anti-template test

Run these against your own design before building the showcase (composed mode
only — a preset run is a template by consent):

- exact implementation tokens were copied from a reference profile or another
  project without source- or brand-grounded reasons;
- the design matches its anchor everywhere and the departure narrative is
  cosmetic;
- changing the subject and transcript would leave the same composition fully
  plausible;
- a material or motion choice exists only because its profile contained it;
- official effect demo styling remains recognizable after adaptation.

### Temporal defaults

The same test applies to the plan in time — and in both modes, because a pack
ships tokens, not a timeline. The single source for these is the temporal
tells **T1–T7** in [packaging-tells.md](packaging-tells.md) (metronome
spacing, a card per sentence, one entrance for everything, no quiet passage,
identical fade exits, clock-fixed durations, graphics in a separate
universe). Run the plan against that list; do not maintain a second copy
here.

During hero-frame review, state which atom is visible in each major decision and
which source fact caused its final implementation. If that explanation cannot be
made, the design is still an unchosen preset rather than a project design system.
