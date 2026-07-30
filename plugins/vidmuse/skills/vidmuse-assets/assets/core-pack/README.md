# VidMuse Core Pack

The preinstalled, read-only asset baseline — and the single query surface over
every static asset the plugin can reach, including assets that live in other
skills.

## Files, and who writes them

| File | Written by | Purpose |
| --- | --- | --- |
| `types.json` | hand | Which asset types exist, how each is discovered, its size budget, and how HyperFrames consumes it |
| `packs/<id>/pack.json` | `--ingest` fills `files`; the rest by hand | **Ledger.** One license receipt and one pinned upstream version per pack, plus per-file hashes |
| `packs/<id>/tags.json` | hand, or a one-time LLM pass | **Semantic layer.** Tags and Chinese aliases. Lives beside the pack so `--reindex` never discards it |
| `index.json` | `--reindex` only | **Derived.** The only file the query path and the provider read. Safe to delete and rebuild |

Never hand-edit `index.json`. Never put a license notice anywhere but its own
pack directory.

## Commands

Importing a third-party set is a separate script, because it touches npm and the
network and has per-source quirks:

```bash
node ../../scripts/import_pack.mjs --source lucide --version 1.27.0 --dry-run
node ../../scripts/import_pack.mjs --source lucide --version 1.27.0
```

It pins an exact version, refuses a license outside the redistributable set,
fails if upstream's declared license no longer matches, harvests upstream tag
metadata, and (for CJK fonts) subsets via fontTools. Then ingest as usual.

```bash
node ../../scripts/core_pack.mjs --inventory              # every type, count, and source
node ../../scripts/core_pack.mjs --query "进度环" --type shape
node ../../scripts/core_pack.mjs --query "dark grain" --type texture --sheet
node ../../scripts/core_pack.mjs --ingest packs/<id>      # rehash + reprobe one pack
node ../../scripts/core_pack.mjs --reindex                # rebuild index.json
node ../../scripts/core_pack.mjs --validate               # structure + index freshness
node ../../scripts/core_pack.mjs --validate --verify-hashes
```

`--validate` deliberately does **not** hash every file. Structure and index
freshness are the cheap checks that catch real mistakes; hashing 1500 icons on
every run is what made the v1 layout unusable at scale. Ask for
`--verify-hashes` when you want byte verification.

## Three discovery modes

Retrieval is keyword-based, explainable, and offline — no embeddings. An agent
sees *why* each candidate matched and fixes a bad result by editing tags rather
than tuning a threshold. Index entries reserve a `vector` field so semantic
search can be added later without re-indexing.

| Mode | For | How the agent uses it |
| --- | --- | --- |
| `keyword` | large sets (`icon`, `shape`, `lottie`, `sfx`) | `--query` narrows; tags and the Chinese lexicon carry recall |
| `table` | small sets (`font`, `palette`, `brand`) | the whole table returns so the agent can reason across it |
| `sheet` | visual choice (`texture`, `overlay`) | `--sheet` renders a contact sheet; read the image and pick a cell |

## Preinstalled vs generated

Not every type ships files. `types.json` records an `acquisition` field where the
answer is "not from here":

| Type | Where it comes from |
| --- | --- |
| `icon` `shape` `font` `lottie` | Preinstalled packs. No generative route — a wrong typeface or pre-baked timeline is worse than a clean miss |
| `brand` | Preinstalled, but as an **offline floor only**. `logo` resolves live first (Lobe → SVGL → Simple Icons → GitHub → favicon → `core-pack.brands`), because marks change and new models ship constantly. One mark per brand: color where upstream has it, mono for brands that are monochrome by design |
| `sfx` `palette` | Indexed read-only from sibling skills |
| `texture` `overlay` | **Generated per film.** Surface treatment has to match one frame's palette, grain, and era, so a shipped set would be heavy and usually wrong. Prefer CSS/canvas for plain grain, noise, and scanlines |

Core Pack is still consulted first for `texture`/`overlay`, so a file the project
adopted (`resolve --from`) or a licensed Creator Library set wins over paying to
generate.

`sheet` exists because `noise-fine.png` and `grain-heavy.png` cannot be told
apart from metadata. Sheets are built **on demand from the candidate set** and
cached under `.cache/sheets/` by candidate hash — a committed per-pack sheet does
not scale past a few dozen files, and the useful sheet is of the candidates, not
of the pack. Sheets need ffmpeg and cover raster types only (ffmpeg ships no SVG
decoder; vector types are small, named, and tagged, so keyword serves them).

## Chinese queries

`lexicon-zh.json` maps Chinese terms to the English tokens upstream metadata
actually uses, expanded at **query time** rather than baked into index entries —
one lexicon serves every pack including ones added later, and the index stays
small. Substring matching handles unsegmented input, and the longest matching key
wins so `购物车` does not also fire `购物`.

Add an entry when a reasonable Chinese query returns nothing. Keep expansions
synonymous, not merely related: listing `bag` and `store` under `购物车` diluted
the query until `shopping-cart` tied with `shopping-bag`.

A hit reached through the lexicon is scored slightly below a direct hit and
labeled `(via 垃圾桶)` in the match reason, so expansion is always visible.

## Three tag sources, in priority order

1. **Upstream metadata** — Lucide, Phosphor, and Simple Icons publish per-icon
   tags. Use them. Re-deriving what upstream already curated is the most
   commonly skipped step here and the most wasteful.
2. **Mechanical** — filename tokens, pack name, and whatever the probe extracts:
   viewBox, stroke-vs-fill, tintability, alpha, luminance, contrast, tone. Free,
   deterministic, and enough to answer most texture queries with no model
   involvement at all.
3. **Semantic + Chinese aliases** — one batched LLM pass, written to
   `tags.json`, never recomputed.

Ingest must never *depend* on step 3. `types.json` plus probes make the index
usable on their own, which is what keeps the offline guarantee real.

## Admission

An item may enter an owned pack only when all are true:

1. VidMuse owns it, or redistribution is explicitly permitted;
2. commercial video output is permitted;
3. its notice sits at `packs/<id>/<receipt>`;
4. `pack.json` pins an upstream version — `npm`+`version`, `url`+`ref`, or
   `self: true` for original work;
5. every file is hashed and within its type's size budget.

Do not admit purchased marketplace packs, scraped collections, third-party brand
logos, or unverified free fonts. Those belong in the private Creator Library or a
dynamic provider.

**Fonts specifically:** HyperFrames pre-bundles 18 families (see
`hyperframes-creative/references/typography.md`). Re-shipping one of those is
pure install weight. Admit only families it does *not* bundle.

**Size discipline:** the plugin is already ~19MB. SVG is cheap; PNG textures are
not. Prefer a small tileable image, or generate the look in CSS/canvas and admit
no file at all. `--validate` fails a pack that exceeds its type budget.

## External roots

`manifest.json` declares roots. Only `core-pack` is `owned: true`; everything
else is indexed **in place, read-only**:

| Root | Owner | Types |
| --- | --- | --- |
| `media-use-sfx` | `media-use/audio/assets/sfx` | `sfx` |
| `hf-creative-palettes` | `hyperframes-creative/palettes` | `palette` |

Both of those skills are vendored from an upstream HyperFrames clone (see
`skills/VENDOR-SOURCES.json`). Copying their files here would create a permanent
re-vendor patch plus a second source of truth. Indexing gives one query surface
at no such cost, and `--reindex` picks up upstream changes for free.

Consequences worth stating plainly:

- `license_state` on an external item is **inherited**, not verified here. The
  entry records its origin; it does not claim a Core Pack review.
- `--verify-hashes` covers owned packs only. Another skill's byte drift is that
  skill's concern.
- An adapter degrades to a warning, never a throw, when an upstream layout
  shifts — a format change stays visible instead of silently dropping assets.

## Not indexed here

`types.json` `not_indexed` records every excluded type and the reason. The
important one: **`logo` never enters the Core Pack.** Identity marks are an
unbounded set requiring exact entity matching; they resolve live through the
media-use cascade (Lobe Icons → SVGL → Simple Icons → GitHub avatar → favicon).
A stale local copy invites exactly the wrong-identity substitution the Semantic
Asset Pass forbids.

## Adding a type

A data change, not a code change:

1. add an entry to `types.json`, picking one of the three discovery modes;
2. add a `probe` in `scripts/lib/core_pack_probe.mjs` only if the type needs
   geometry no existing probe extracts;
3. register the type in `media-use/scripts/lib/registry.mjs` and its project
   subdirectory in `media-use/scripts/lib/manifest.mjs`.

`--query`, `--reindex`, `--inventory`, `--validate`, and the provider all derive
from `types.json` and need no edit.
