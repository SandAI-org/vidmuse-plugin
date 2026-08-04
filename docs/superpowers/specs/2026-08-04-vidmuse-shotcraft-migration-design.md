# VidMuse Shotcraft Migration Design

**Status:** implemented

**Date:** 2026-08-04

**Decision summary:** Local HyperFrames-compatible registry as independent skill `vidmuse-shotcraft`; full 162-block import; create + recut discover via job/tag index; install/wire identical to official registry protocol.

---

## 1. Problem

A completed Shotcraft pilot already exposes **162** reusable HyperFrames lens effects as a standard two-layer registry:

```text
registry/
├── registry.json                          # 162 item names
└── blocks/shot-*/
    ├── registry-item.json                 # description, tags, duration, files
    ├── shot-*.html                        # composition source
    └── assets/…                           # optional (14 blocks)
```

Source (read-only reference during migration):

```text
/Users/az/Documents/Codex/2026-08-03/
  hyperframes-plugin-hyperframes-openai-curated-remote/
  outputs/hf-shotcraft-pilot/registry/
```

VidMuse create and recut both need a **rich, searchable motion vocabulary** (transitions, titles, UI entrances, camera, data beats, editorial punctuation). Today:

| Surface | State |
| --- | --- |
| Official HF registry | Remote; charts, shaders, social overlays, code snippets — not Shotcraft |
| `hyperframes-animation/transitions/` | CSS/shader **knowledge docs**, not installable blocks |
| `vidmuse-create` / `vidmuse-recut` | Direct to “query live catalog” / motion rules; no local shot library |
| `vidmuse-create/.../shot-cards/`, `vidmuse-recut/library/native/` | Empty placeholders |

The migration goal is to bring the 162 blocks into this plugin so agents use them **as simply as the official library**, without breaking HyperFrames contracts or create/recut artifact rules.

---

## 2. Goals and non-goals

### Goals

1. **Preserve the HyperFrames registry protocol end-to-end**
   Same `registry.json` / `registry-item.json` / block HTML / `files[].target` shape; same install destination (`compositions/<name>.html`); same host wiring (`data-composition-src` + id/start/duration/track).

2. **One local overlay source, not a fork of the official registry**
   Official remote registry remains the default for upstream items. Shotcraft is an additional local source with the `shot-*` name prefix (natural isolation).

3. **Agent-friendly discovery**
   Natural-language / communicative-job routing (`scan transition` → tags `clock-wipe`, `radar`, `scan` → `shot-clock-wipe`), not a flat dump of 162 filenames.

4. **First-class create and recut hooks**
   - **Create:** full vocabulary after semantic job is named (step 7–8).
   - **Recut:** curated subset for editorial punctuation and justified support moments; never raw template → Timeline.

5. **Provenance**
   Record source path, pilot status, and license/attribution in `VENDOR-SOURCES.json` + skill NOTICE.

6. **Package size is acceptable**
   Full canonical Registry tree in-plugin (~9.9MB including HTML and declared png/svg assets). No LFS or lazy fetch required for v1.

### Non-goals

- Re-authoring or “improving” motion inside the 162 HTML files during migration.
- Merging Shotcraft into the upstream heygen `hyperframes` registry PR in this effort.
- Flattening shots into `TRANSITION-REGISTRY.md` (PLV Tier-B injector subset — different contract).
- Making every block recut-safe by default.
- Replacing `hyperframes-animation` rules/blueprints; shots **implement** jobs those skills describe.
- Changing Storyboard, DSL, card HTML, or Timeline synchronization contracts.

---

## 3. Decisions (locked)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Mount style | **A — local overlay registry** | Keeps HF protocol; works offline; owned by VidMuse release |
| Skill placement | **Independent skill**, not under `hyperframes-registry/` | Upstream HF skills stay thin/pinned; Shotcraft is owned asset + index + workflow policy |
| Skill name | **`vidmuse-shotcraft`** | Matches `vidmuse-*` ownership; protocol compatibility is documented, not implied by `hyperframes-*` prefix |
| Import scope | **All 162 blocks** + existing assets | Pilot already complete; partial import creates discovery holes |
| Naming of blocks | Keep `shot-*` | Already unique vs official catalog |
| Dimensions | Keep 1920×1080 metadata | Adapt at project level when aspect differs; do not mass-edit sources in v1 |

### Why `vidmuse-shotcraft` (not `hyperframes-shotcraft`)

- `hyperframes-*` in this repo means pinned upstream domain skills with minimal patches.
- Shotcraft is **VidMuse-carried content**: job index, recut allowlist, create/recut load points, vendor receipt.
- Agents still learn “same add/wire as registry” from `SKILL.md` sentence one — the name signals ownership, the docs signal protocol.

### Why not a sidecar under `hyperframes-registry/`

- Pollutes the upstream skill tree and future HF sync diffs.
- Mixes “how to use any registry” with “162 specific blocks + VidMuse routing.”
- Independent skill is explicitly loaded by create/recut — clearer than burying under registry references.

---

## 4. Target layout

```text
plugins/vidmuse-packaging/skills/vidmuse-shotcraft/
├── SKILL.md
├── NOTICE.md
├── LICENSE.apache-2.0.txt
├── PROVENANCE.json
├── SHOT-INDEX.md                 # human + agent job routing
├── agents/
│   └── openai.yaml
├── policies/                     # hand-maintained inputs; never generated away
│   ├── jobs.json
│   ├── recut.json
│   └── runtime-check.json        # pinned known visual findings; never hides Runtime errors
├── indexes/
│   ├── catalog.json              # full flat catalog for machines
│   ├── by-tag.json               # tag → [names]
│   └── by-job.json               # communicative job → candidates + notes
├── registry/                     # standard HF registry root
│   ├── registry.json
│   └── blocks/
│       └── shot-<name>/
│           ├── registry-item.json
│           ├── shot-<name>.html
│           └── assets/…          # when declared in files[]
└── scripts/                      # supported install, discovery, sync, and verification tools
    ├── sync-from-pilot.mjs       # one-shot / refresh import
    ├── build-indexes.mjs         # regenerate indexes from registry-item.json
    ├── catalog.mjs               # bilingual job/tag/recut lookup
    ├── install-local.mjs         # Shotcraft v1's only supported install path
    ├── verify-registry.mjs       # complete static Registry audit
    ├── verify-runtime.mjs        # concurrent, isolated all-block HyperFrames check
    └── shotcraft.test.mjs        # deterministic installer/search policy tests
```

**Not** placed under `plugins/vidmuse/skills/` for the bulk tree: packaging owns HyperFrames-adjacent vendor skills; the thin `plugins/vidmuse/` tree remains the shipped/runtime overlay pattern already used elsewhere. If packaging→vidmuse mirror is required by the existing ship pipeline, follow the same mirror rules as other packaging skills (implementation detail; does not change this design).

---

## 5. Registry protocol (compatibility contract)

### 5.1 Unchanged shapes

Top-level `registry.json`:

```json
{
  "$schema": "https://hyperframes.heygen.com/schema/registry.json",
  "name": "vidmuse-shotcraft",
  "items": [
    { "name": "shot-clock-wipe", "type": "hyperframes:block" }
  ]
}
```

Per-item `registry-item.json` (fields already present in pilot — keep):

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | `shot-*` |
| `type` | yes | `hyperframes:block` |
| `title` | yes | |
| `description` | yes | One-line; primary semantic search text |
| `tags` | yes | Always include `shotcraft`; plus motion/family tags |
| `dimensions` | yes | `{ "width": 1920, "height": 1080 }` |
| `duration` | yes | Demo length in seconds (adapt in project) |
| `files` | yes | composition + optional assets; `target` under `compositions/` / `assets/` |

### 5.2 Install destinations

Default project roots (same as official):

- Block HTML → `compositions/<name>.html`
- Assets → `assets/vidmuse-shotcraft/<name>/...` via item-namespaced copy-on-write

Project `hyperframes.json` may remap via `paths.blocks` / `paths.assets` exactly as `hyperframes-registry` documents.

Namespacing intentionally refines the pilot's shared `files[].target` values at install time. It prevents two installed effects from mutating or overwriting each other's local assets while leaving the canonical Registry payload unchanged.

### 5.3 Host wiring (create)

```html
<div
  class="clip"
  data-composition-id="shot-clock-wipe"
  data-composition-src="compositions/shot-clock-wipe.html"
  data-start="12.0"
  data-duration="5"
  data-track-index="2"
  data-width="1920"
  data-height="1080"
></div>
```

`data-composition-id` must match the block’s internal composition id. The installer emits the manifest duration (`5` seconds for `shot-clock-wipe`) as a safe initial mount. Duration is ultimately **beat-owned**, but changing only the host `data-duration` does not retime the block's internal GSAP timeline; adaptation must update the internal timeline/root duration and host together.

### 5.4 Multi-registry reality

Official skill docs assume one `hyperframes.json#registry` URL. Shotcraft is a **second root on disk**.

**Resolution order for agents:**

1. If the name starts with `shot-` **or** the job index hit is shotcraft → install from `vidmuse-shotcraft/registry`.
2. Else → official remote registry via `hyperframes add` / catalog.

**Shotcraft v1 install mechanism:**

Run `scripts/install-local.mjs <name> --dir <project>`. This is the only supported local Shotcraft install path because the current HyperFrames CLI loads its configured Registry with HTTP `fetch()` and has no filesystem-registry parameter. The helper:

- accepts only exact `shot-*` names from this Registry
- preflights the full write set and refuses modified-file overwrites unless `--force` is explicit
- honors `hyperframes.json#paths.blocks` and `#paths.assets`
- isolates each item's assets under its own namespace and rewrites its installed HTML references
- writes `shotcraft-lock.json` with source and installed hashes
- prints a complete `class="clip"` mount at the manifest duration

The official Registry remains installed through `hyperframes add`; agents must not pass the local Shotcraft root to the current CLI or invent a third layout.

### 5.5 Adaptation red lines (fail-closed)

After install, before treating the block as film-ready:

1. **Strip demo content** — fake dashboards, placeholder copy, pilot brand colors.
2. **Apply `FRAME.md`** — type, palette, edge language, motion temperament.
3. **Bind time** — map entrance/development/hold/resolve to transcript or silent anchors; do not leave the 4–5s demo clock as authority.
4. **Honor variables** — when `data-composition-variables` exists, set those first.
5. **Never** point VidMuse Timeline `htmlSourceFilePath` at a raw registry file or unadapted demo block.
6. **Recut hosts** must remain overlay-safe (no duplicate program video/audio/captions) per `vidmuse-recut` protocol.

---

## 6. Discovery model

### 6.1 Layers

| Layer | File | Consumer |
| --- | --- | --- |
| Protocol catalog | `registry/registry.json` + per-item JSON | Install, validation, HF-shaped tools |
| Machine indexes | `indexes/*.json` | Agent scripts / deterministic lookup |
| Job guide | `SHOT-INDEX.md` | Primary agent read for selection |
| Skill policy | `SKILL.md` | When to load, how to install, red lines |

### 6.2 Category map (from pilot tags)

Approximate primary families (non-exclusive; blocks carry multiple tags):

| Family | ~Count | Example jobs |
| --- | --- | --- |
| transition | 25 | chapter change, scan wipe, iris, hard cut family |
| effects | 22 | impact, glow, sheen, brand frame |
| typography | 20 | title materialize, typewriter, scramble decode |
| rhythm | 19 | accelerando cuts, beat pump, trailer bumper |
| ui-entrance | 19 | panel materialize, bento light-up, skeleton reveal |
| interaction | 15 | cursor duet, command palette, AI stream |
| camera | 14 | crash zoom, dolly zoom, freeze annotate |
| data | 13 | odometer, before/after scrub, counter sparks |
| opening | 9 | brand ink open, letterspace materialize |
| outro | 6 | logo sting, strip-away outro |

Every item keeps tag `shotcraft` for bulk filter.

### 6.3 Selection algorithm (agents)

```text
communicative job
  → relationship / intensity / spatial mode   (from create/recut + vidmuse-motion)
  → query SHOT-INDEX / by-job / by-tag
  → shortlist ≤3
  → pick 1 primary (+ optional 1 accent for whole film language)
  → install → adapt → wire → check
```

Hard limits:

- Do **not** pick a shot before the beat’s job exists.
- Do **not** use a different distinctive shot on every seam (same rule as transition overview: one primary language + rare accents).
- Prefer official HF block when it is a better semantic fit (e.g. real map/chart packages); Shotcraft is vocabulary, not a monopoly.

### 6.4 Example

Job: “扫描式转场 / data refresh between two full-frame arguments.”

```json
{
  "name": "shot-clock-wipe",
  "description": "A fixed 73-point fan reveals the destination in one linear clockwise revolution…",
  "tags": ["shotcraft", "transition", "clock-wipe", "radar", "geometry", "scan", "data-refresh"]
}
```

---

## 7. Create vs recut integration

### 7.1 `vidmuse-create`

| Step | Integration |
| --- | --- |
| ≤6 | No shot selection (story, evidence, FRAME first) |
| 7 motion | May name a shot as an *implementation hint* after cue chain exists |
| 8 build | Load `vidmuse-shotcraft` for discovery/install; load `hyperframes-registry` for official items and shared wire rules; load core/animation as today |
| QA | Unadapted demo residue = defect; animation-map dead zones still governed by create gates |

Add a short subsection under step 8: **Shotcraft local registry** — protocol-compatible blocks; strip demo; duration from beat.

### 7.2 `vidmuse-recut`

Recut constraints are stricter: source plate stays authoritative; packaging is often overlay; Timeline cannot mount raw templates.

| Use | Guidance |
| --- | --- |
| Editorial punctuation | transition / impact / short rhythm — preferred |
| Support moments | data/typography only when payload and safe regions allow |
| Full-screen UI stages | default **create-only** unless redesign to overlay-safe |

**Allowlist field** is authored in `policies/recut.json`, joined into generated `indexes/catalog.json`, and summarized in `SHOT-INDEX.md`:

| Flag | Meaning |
| --- | --- |
| `recut:safe` | Short, low demo-UI, adaptable to transparent overlay or brief full-frame takeover |
| `recut:adapt` | Usable with substantial structural edit |
| `create-only` | Demo stage / heavy UI / multi-surface product fiction |

v1 allowlist is **curated by hand** for transition + impact + a thin data/type slice: 30 `recut:safe`, 31 `recut:adapt`, and the remaining 101 default to `create-only`. Five initially safe candidates were demoted to `adapt` after the pinned runtime visual audit. It is not auto-derived from tags; unknown = `create-only` in recut runs (fail-closed).

### 7.3 `hyperframes-registry`

Add a brief cross-link only:

- Second local registry: `vidmuse-shotcraft`
- Same item schema and wiring
- Do not list all 162 names inside registry docs

### 7.4 `hyperframes-animation/transitions`

Keep CSS/shader docs as the **scene-seam implementation manual**.
In `overview.md`, add one pointer: installable lens/transition *blocks* live in `vidmuse-shotcraft`; do not merge catalogs.

### 7.5 `vidmuse-motion` (optional light touch)

May reference shot names as optional implementation hints after the cue chain is specified. Motion skill remains owner of *why/when*; shotcraft owns *which packaged block*.

---

## 8. Vendor and licensing

Update `plugins/vidmuse-packaging/skills/VENDOR-SOURCES.json` with a `vidmuseShotcraft` (or equivalent) entry:

| Field | Value |
| --- | --- |
| kind | local HyperFrames registry blocks |
| source pilot | `hf-shotcraft-pilot` registry tree (path recorded at import time) |
| upstream lineage | video-shotcraft → HyperFrames block translation (see pilot `MIGRATION_STATUS.md` / `ATTRIBUTION.md`) |
| skill | `vidmuse-shotcraft` |
| policy | Ship full registry; preserve HF schema; adapt demo content per film; do not Timeline-mount raw items |
| refresh | re-run `scripts/sync-from-pilot.mjs` only when pilot tree intentionally updates |

Carry `NOTICE.md` in the skill with attribution pointers. Do not strip license comments from HTML if present.

---

## 9. Migration phases

### Phase 0 — Scaffold

- Create `vidmuse-shotcraft` skill skeleton (`SKILL.md` stub, `NOTICE.md`, directories).
- Register vendor entry draft.
- No create/recut behavior change yet.

### Phase 1 — Import tree

- Copy only the pilot's canonical `registry/` → `vidmuse-shotcraft/registry/`; do not import its duplicate `compositions/` working tree.
- Set top-level registry `name` to `vidmuse-shotcraft` (items unchanged).
- Validate: 162 items; every `files[].path` exists; JSON parses; names/folders match; IDs and timeline registration match; manifest/HTML durations agree; shared targets never point to conflicting payload hashes.

### Phase 2 — Indexes

- Generate `catalog.json`, `by-tag.json` from manifests.
- Author `SHOT-INDEX.md` job tables (10 families + query examples).
- Seed `by-job.json` for high-value jobs (transitions, titles, camera, data, impacts).
- Hand-label `recut` flags in `policies/recut.json`; generated indexes join policy without becoming its source of truth.

### Phase 3 — Install helper + skill policy

- Implement `install-local.mjs` as Shotcraft v1's standard path (plus index, catalog, static verification, runtime verification, and deterministic test scripts).
- Complete `SKILL.md`: discovery, install priority, wire, adapt red lines, create/recut boundaries.
- Document that the current CLI is reserved for the official HTTP Registry and cannot install this filesystem Registry.

### Phase 4 — Workflow hooks

- Minimal edits to `vidmuse-create`, `vidmuse-recut`, `hyperframes-registry`, transitions `overview.md`.
- No artifact schema changes.

### Phase 5 — Verification

| Gate | Pass criteria |
| --- | --- |
| Structure | 162/162 paths + schema |
| Install coverage | All 162 blocks install into isolated throwaway projects without target conflicts |
| Runtime coverage | Isolated wired hosts cover all 162 under pinned `hyperframes check`; no install/Lint/Runtime failure is allowed. Authored Layout/Contrast findings are baseline-recorded and force project adaptation/manual QA rather than being silently called green |
| Discovery | ≥5 NL queries return sensible top-3 via index |
| Create path | 1 dry-run selection+adapt note (paper or mini composition) |
| Recut path | 1 `recut:safe` item overlay-safe adaptation note |
| Vendor | VENDOR-SOURCES + NOTICE present |

### Phase 6 — Ship notes

- `CHANGELOG.md` entry under Unreleased or next version.
- Optional paper-eval stubs under `evals/` for create/recut shot selection (follow-up ok).

---

## 10. Skill surface (`SKILL.md` outline)

```yaml
name: vidmuse-shotcraft
description: >
  Local HyperFrames registry of 162 shot/lens effect blocks (shot-*).
  Use when create or recut needs an installable transition, title, camera move,
  UI entrance, data beat, impact, opening, or outro treatment. Same install and
  wire protocol as hyperframes-registry; query SHOT-INDEX by communicative job
  and tags. Not for official upstream-only items; not a Timeline template path.
```

Body sections:

1. Protocol parity with `hyperframes-registry`
2. When to load (after job exists)
3. Discovery (`SHOT-INDEX`, tags, indexes)
4. Install (`install-local.mjs` only for Shotcraft v1)
5. Wire + adapt red lines
6. Create vs recut allowlist
7. Relationship to transitions docs and official catalog
8. Validation expectations

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Agent ships demo UI as final film | Fail-closed adapt red lines in shotcraft + create/recut |
| Agent points Timeline at raw block | Recut/create already forbid; restate in shotcraft SKILL |
| CLI only supports one remote registry | `install-local.mjs` is supported path, not a hack |
| Catalog overload / random shot per beat | Primary+accent language rule; job-first selection |
| Recut misuse of full-screen UI shots | `create-only` default; small `recut:safe` set |
| Confusion with CSS transition catalog | Explicit layering in docs; no merged list |
| Future pilot updates diverge | sync script + vendor ref; indexes regenerated, not hand-copied forever |
| Aspect ratios other than 16:9 | All v1 blocks are native 1920×1080. Re-author layout for another aspect or reject the candidate; never solve whole-canvas fit by scaling the 16:9 composition |

---

## 12. Success criteria

Migration is done when:

1. `vidmuse-shotcraft/registry` holds 162 valid HF blocks and passes structure validation.
2. An agent can resolve “扫描式转场” → `shot-clock-wipe` (or clear peer) via index without reading all HTML.
3. All 162 blocks install through `install-local.mjs`; their isolated wired hosts have no install/Lint/Runtime failures, and any strict visual-check finding is explicit in the pinned runtime baseline.
4. Create and recut skills mention when/how to load shotcraft without new artifact types.
5. Recut cannot “legally” select unlabeled blocks as safe (fail-closed flags).
6. Vendor provenance is recorded; CHANGELOG notes the addition.

---

## 13. Implementation order (after approval)

1. Scaffold skill + NOTICE + vendor stub
2. Import registry tree + structure validate
3. Generate indexes + author SHOT-INDEX + recut flags
4. install-local helper + full SKILL.md
5. Cross-links in create / recut / registry / transitions overview
6. Full 162-block install/runtime check
7. CHANGELOG

No HTML motion rewrites in this pass unless a block fails basic parse/check and needs a minimal fix.

---

## 14. Open items (non-blocking for doc approval)

| Item | Default if unspecified |
| --- | --- |
| Exact packaging→`plugins/vidmuse` mirror policy | Follow existing ship pipeline for other packaging skills |
| Local install path | Locked: `install-local.mjs` is Shotcraft v1's only formal path; honor `hyperframes.json#paths` for blocks/assets |
| Shared pilot asset targets | Install as item-namespaced copy-on-write and rewrite installed block references |
| Depth of `by-job.json` in v1 | Cover 10 families + ~20 high-frequency jobs; expand later |
| Evals | Optional follow-up after ship |

---

## 15. References

- Pilot registry: `.../hf-shotcraft-pilot/registry/`
- Pilot status: `.../hf-shotcraft-pilot/MIGRATION_STATUS.md` (161 gallery variants + crash-zoom/impact pair = 162 blocks)
- HF registry skill: `plugins/vidmuse-packaging/skills/hyperframes-registry/`
- Create build step: `vidmuse-create` §8
- Recut overlay + Timeline gates: `vidmuse-recut`
- Transition knowledge (not installable shots): `hyperframes-animation/transitions/`

---

## Approval

Approved on 2026-08-04 with one clarification: the current HyperFrames CLI has no filesystem Registry parameter, so `install-local.mjs` is Shotcraft v1's only formal install path. The implementation follows that decision.
