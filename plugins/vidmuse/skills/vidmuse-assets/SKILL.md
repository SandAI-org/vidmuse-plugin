---
name: vidmuse-assets
description: >
  Asset intelligence and library policy for VidMuse video projects. Use for
  explicit logo/icon/font/material/library requests and, even when the user
  does not ask for assets, inside vidmuse-create / vidmuse-recut whenever the
  transcript or source contains semantically meaningful companies, products,
  AI models, people, places, events, or recurring visual subjects. Performs
  the Semantic Asset Pass, canonicalizes entities, decides whether an asset
  adds editorial value, writes asset-plan.json, selects legal sources, and
  manages Core Pack / Creator Library policy. Delegates every download,
  generation, transform, cache write, and manifest write to media-use. Does
  not own film routing, timing, composition, or rendering.
compatibility: Node.js 18+; network for remote catalogs; VidMuse CLI only when
  generation is needed. Uses the sibling media-use skill as its execution layer.
---

# VidMuse Assets

Turn explicit requests and implicit film opportunities into **intentional,
local, reusable, traceable assets**. This skill is the asset-intelligence
layer; `media-use` is its execution runtime.

## Ownership

| Decision or operation | Owner |
| --- | --- |
| What the viewer should see and at which beat | owning `/vidmuse-create` or `/vidmuse-recut` |
| Entity normalization, visual opportunity, source/license choice | `/vidmuse-assets` |
| Core Pack and Creator Library policy/indexing | `/vidmuse-assets` |
| Download, generate, transform, cache, freeze, manifest/index writes | sibling `/media-use` |
| Place, animate, evaluate, and render the asset | owning film skill |

When create or recut loads this skill, write/validate the asset plan, resolve
approved deterministic entries through `media-use`, then return control. Do
not reopen film routing or redesign the film.

## Two entry modes

1. **Explicit:** the user asks for a logo, font, icon, material, brand kit, or
   library. Resolve that request directly.
2. **In-film:** create/recut has a transcript and asks for a Semantic Asset
   Pass. Scan the full content even if the user never said "asset" or "logo".

In-film use is mandatory before film-plan/packaging coverage for substantial
films. An empty plan is valid when no asset improves comprehension; silent
omission of the pass is not.

## Semantic Asset Pass

Read [references/semantic-asset-pass.md](references/semantic-asset-pass.md).
Write `<project>/asset-plan.json`, stamp the completed pass against the current
transcript bytes, then validate it:

```bash
node scripts/asset_plan.mjs --project <project> --complete-pass
node scripts/asset_plan.mjs --project <project> --validate
```

`--init` deliberately creates a `pending` receipt. Even an empty
`opportunities: []` plan is invalid until `--complete-pass` records the
transcript SHA-256 and opportunity count. If the transcript changes, rerun the
pass and stamp it again.

The pass separates:

- **mention:** what the transcript literally names;
- **canonical entity:** organization/product/model/person/place/event/concept;
- **semantic role:** subject, comparison, history node, source, incidental, or
  already visible;
- **editorial decision:** logo/icon/photo/diagram/text-only/reuse/suppress;
- **asset query:** exact deterministic request, never a guessed identity;
- **timeline binding:** ATA ranges plus the owning beat/packaging point.

Resolve only approved deterministic entries before the film plan binds them:

```bash
node scripts/asset_plan.mjs --project <project> --resolve
```

The command calls `media-use` as a subprocess, writes its receipt back to the
plan, and syncs resolved entries into composition-facing
`asset-sources.json`. Each receipt carries a normalized request fingerprint;
changing type, intent, entity, variant, provider, or mode invalidates reuse and
forces a new resolution. Generated or ambiguous opportunities remain
planned/skipped until the owning film workflow clears the relevant user and
evidence gates.

## Hybrid library

Read [references/library-layout.md](references/library-layout.md) when
selecting between preinstalled, personal, cached, and remote material.

Resolution order:

1. project-frozen asset;
2. approved Creator Library asset;
3. plugin Core Pack asset;
4. deterministic licensed provider;
5. official real-world source;
6. VidMuse generation when the material does not exist in the world.

The Core Pack framework lives under `assets/core-pack/`. It intentionally
contains no third-party content yet; add an item only with an explicit manifest
record and redistribution receipt.

```bash
node scripts/core_pack.mjs
```

Creator Library is private and opt-in. Initialize only when the user asks:

```bash
node scripts/creator_library.mjs --init
```

## Acquisition and project freeze

Resolve in this order:

Before fetching or generating, check reusable candidates:

```bash
node ../media-use/scripts/resolve.mjs \
  --type <type> \
  --intent "<need>" \
  --project <project> \
  --candidates
```

`vidmuse-assets` chooses the candidate; `media-use` performs the actual
freeze. The result is not complete until the chosen file is local and appears
in:

- `<project>/.media/manifest.jsonl`
- `<project>/.media/index.md`

Use the local path in HyperFrames/Timeline. Do not leave a shipping
composition dependent on an unpinned catalog URL.

## Lobe Icons — active provider

Lobe Icons is the preferred catalog for exact AI/LLM model, provider, and
application marks. It runs before SVGL, Simple Icons, GitHub avatars, and
favicons.

```bash
node ../media-use/scripts/resolve.mjs \
  --type logo \
  --intent "Codex logo" \
  --entity codex \
  --variant color \
  --provider lobehub.icons \
  --project <project> \
  --json
```

Supported static SVG variants:

```text
mono | color | text | text-cn | text-color | brand | brand-color
```

Rules:

- Pass `--entity` as the exact brand/model name. Matching ignores punctuation
  and case but never treats relationship text such as `OpenAI (ChatGPT)` as a
  synonym. Company, product, and model substitutions require separate explicit
  editorial decisions.
- Use `--provider lobehub.icons` when the user explicitly asks for Lobe.
  Omit it when normal fallback to other official-logo catalogs is welcome.
  When `--variant` is explicit, only Providers that can attest that exact
  variant participate.
- Do not silently replace an unavailable requested variant. Resolution fails
  with `logo_variant_unavailable` and the available Lobe variants.
- The resolver pins both the Lobe catalog and static SVG package, freezes the
  selected SVG locally, records its variant and license, and promotes it to
  the reusable cache.
- Treat the SVG as an identification mark, not as permission to impersonate a
  brand or adopt its trademark as the user's own.

Verify the receipt:

```bash
tail -n 1 <project>/.media/manifest.jsonl
```

It should include `provider: "lobehub.icons"`, package versions, `variant`,
top-level `license_state: "verified-commercial"` + the MIT notice receipt,
original URL, entity, and local path.

## License gate

Classify every external source before automatic use:

| State | Action |
| --- | --- |
| `verified-commercial` | May use within recorded scope |
| `verified-personal` | Personal output only; add attribution if required |
| `user-licensed` | Use only from the user's private library; record receipt/scope |
| `unknown` | Discovery/preview only; do not ship commercially |
| `no-redistribution` | Never vendor into this plugin or expose as a downloadable pack |

Read [references/source-policy.md](references/source-policy.md) when adding a
new catalog, importing a third-party pack, or making a commercial-use decision.

## Current source status

| Source | Status |
| --- | --- |
| Core Pack | **Framework active; content intentionally empty** |
| Creator Library | Layout/policy defined; private user content only |
| Lobe Icons | **Implemented** deterministic Logo Provider |
| SVGL / Simple Icons / GitHub / favicon | Existing official-logo fallbacks |
| Thiings | Licensed local-library design only; not bundled or scraped |
| 喵闪字库 | Font discovery only until original-author license is verified |
| DaFont | Font discovery only until archive/author license is verified |

Do not imply that a planned source is already automated.

## Adding a provider

A provider adapter belongs in `../media-use/scripts/lib/`; its selection and
license policy belongs here. The adapter must:

1. Match a semantic request without guessing identity.
2. Return a direct URL or local path plus file extension.
3. Pin mutable package/catalog versions.
4. Return provenance: provider, source id, version, URL, license state.
5. Let `resolve.mjs` perform the atomic freeze, manifest append, index refresh,
   and global-cache promotion.
6. Fail cleanly so the next legal provider can run. Identity or explicit
   variant constraint failures are terminal; availability misses may fall
   through.
7. Ship mocked unit tests for hit, miss, bad metadata, network failure, and
   cascade order.

Do not implement a second downloader/cache inside this skill.

## Report

Tell the user:

- which semantic opportunity caused the lookup, or that it was an explicit request;
- which provider and exact variant won;
- local asset path;
- license state and any attribution/use restriction;
- whether the asset was fetched, reused, or generated;
- manifest/index paths.
