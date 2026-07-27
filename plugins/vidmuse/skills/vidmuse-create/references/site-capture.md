# Site capture — grounding from the real website

**Purpose:** when the film's subject has a reachable URL, ground it with a
**full machine capture**, not a handful of manual browser screenshots. A
3-screenshot grounding produces a 3-asset film; a full capture gives the film
plan a real inventory to cast from — this is the single biggest lever for
"the promo actually looks like the product's world."

**When:** default for `create_path: promo` with a URL (site-to-video,
saas-promo, brand-sizzle, launch). Also for explainers whose subject has an
official site worth quoting. Manual browser capture (`browser` skills) drops
to a **fallback** for auth-walled pages, specific interaction states, or when
the CLI capture is blocked.

## 1. Run the capture

```bash
npx hyperframes capture "<URL>" -o "$WORK_DIR/capture"
```

- No API key required. Extracts scroll screenshots, design tokens, fonts,
  every downloadable asset with DOM-context descriptions, and manifests for
  videos / lottie / animations.
- Optional: `GEMINI_API_KEY` / `GOOGLE_API_KEY` in the environment upgrades
  `asset-descriptions.md` to vision-model captions. Without it, alt-text +
  DOM context still ship — continue, don't block.
- Long pages: `--max-screenshots` (default 24) covers the scroll.
- Capture more than the homepage when the film needs it: run additional
  captures for key subpages (templates/community/pricing/feature pages) into
  `"$WORK_DIR/capture-<name>"` — proof beats usually live on subpages.

**Real site videos are first-class assets.** If
`capture/extracted/video-manifest.json` exists:

```bash
npx hyperframes capture --video "$WORK_DIR/capture" --list
npx hyperframes capture --video "$WORK_DIR/capture" --index <n>
```

A real product video beats a generated plate on every proof beat — check the
manifest before planning any generated motion.

## 2. Reading protocol (write-down-and-forget)

Read in this order; after each file write 1–2 summary sentences into your
working notes (the raw content may leave context later):

1. **`capture/screenshots/scroll-000.png` first** — the hero at full
   resolution; then scan the rest of `screenshots/`. Write 3–4 sentences:
   visual mood, layout patterns, color strategy, overall feel.
2. **`capture/extracted/tokens.json`** — top 5–7 colors (hex + role), font
   families with weights, section/heading/CTA counts.
3. **`capture/extracted/visible-text.txt`** — lines are `[h1]/[p]/[a]`-tagged;
   headings are the site's own key messages. Script copy and golden lines
   quote from here, not from invented marketing speak.
4. **`capture/extracted/asset-descriptions.md`** — the canonical asset
   inventory. Note the visually striking assets (hero art, community work,
   product UI, logos).
5. If present: `animations.json` (motion language the site already speaks),
   `video-manifest.json` (real footage), `lottie-manifest.json`,
   `shaders.json` (recreate gradient/noise moods in HF canvas).

**Rich captures (30+ images): dispatch a sub-agent** to view every image in
`capture/assets/` and return a one-line-per-file catalog (filename — content,
dominant colors, useful-for-which-beat). Do not burn main context paging
through 200 images; do not cast beats from filenames alone.

## 3. Curate → `ASSET_AUDIT.md` + provenance

The capture directory is bulky (often 100–300 MB) and is **not** the render
input. Curate:

1. Pick the shortlist the film will actually use (hero art, product UI
   screenshots, community/style-proof images, logo SVG, fonts, real videos).
2. Copy those files to `$WORK_DIR/assets/` (flat, renamed meaningfully).
   The composition references only `assets/` — never deep capture paths.
3. Write `$WORK_DIR/ASSET_AUDIT.md`: one line per curated asset — what it
   shows, which beat(s) it serves, why it earned the cut.
4. Register every curated asset in `$WORK_DIR/asset-sources.json` with
   `type: "website_capture"`, `source_url`, `local_file`, `usage`. This is
   what `check_motion.py` S3 verifies proof beats against — an unregistered
   screenshot is invisible to the gate.

Keep `capture/` on disk during production (re-curation is cheap); exclude it
from delivery/archive.

## 4. Feed the pipeline

| capture artifact | feeds | how |
| --- | --- | --- |
| `tokens.json` colors/fonts | **FRAME.md seed** | map brand colors onto FRAME roles (ink / canvas / accents); adopt the site's real font files from `capture/assets/` |
| `visible-text.txt` | script + golden lines | narration vocabulary and on-screen copy quote the site's own language |
| `asset-descriptions.md` / sub-agent catalog | **film-plan.json `asset_candidates`** | each visual beat lists 1–3 candidate assets by filename before implementation |
| `screenshots/` + subpage captures | `ui_proof_path` beats | screenshot-camera / hybrid-slices source material |
| `video-manifest.json` downloads | proof/mood beats | real motion texture; registered like any other capture |
| `animations.json` / `shaders.json` | motion language notes | the site's own motion idiom informs (not dictates) the film's |

**Charter 9 test still rules:** would someone who knows this product
recognize its world in a muted frame? A full capture makes "yes" cheap —
use real art in the cards, real UI in the proof, real fonts in the type.

For pixel-precise overlays on a captured screenshot, preserve its native
width/height as a `data-vm-align-space` and follow
[alignment-contract.md](alignment-contract.md). Do not place the screenshot
with `object-fit` in one coordinate system and hand-position its frame/cursor
in another.

## 5. Anti-patterns

- Running capture and then still building beats from invented glass-card
  gradients (the inventory exists — cast from it; hard fails 5/12).
- Shipping the film with 3 assets when the capture returned 200 — coverage
  of *distinct real imagery* across beats is part of what makes a promo not
  feel like a deck.
- Referencing `capture/...` paths directly in compositions (breaks when the
  capture dir is archived; curation step exists for this).
- Treating capture as optional research. For URL promos it is the grounding
  step — the film plan should not be written before the inventory exists.
