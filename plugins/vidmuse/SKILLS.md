# Skills shipped in this plugin

The user-facing router is **`/vidmuse`**. It routes by requested
deliverable to two film workflows and three capability domains:
**`/vidmuse-recut`** (existing speaking footage), **`/vidmuse-create`**
(material must be made), **`/vidmuse-design`** (private visual direction),
**`/vidmuse-assets`** (semantic asset/library work), or **`/media-use`**
(standalone ASR, ATA, TTS, generation, and deterministic media operations).
Composition, motion, rendering, and runtime-specific animation guidance remain
dependencies loaded on demand.

Do **not** install or invoke HyperFrames `talking-head-recut` from this plugin — that job is owned by `vidmuse-recut`.

**Routing law:** `/vidmuse` is the only fresh-intent router. Match the output,
not the input technique: “transcribe this video” → `/media-use`; “make a film
from this script with TTS” → `/vidmuse-create`; “package this interview” →
`/vidmuse-recut`; “source the official ChatGPT mark” → `/vidmuse-assets`.
`/hyperframes` is vendored and demoted to a domain reference. A workflow keeps
film ownership while it calls assets or media execution. Shared namespace,
vendored-skill, init, and preview policy lives once under
`vidmuse/references/runtime-policy.md`.

## User-facing

| Skill | Role |
| --- | --- |
| `vidmuse` | **Router** — resume state, classify the requested deliverable, select one owner, and leave |
| `vidmuse-recut` | **Film workflow** — editor/director for existing talking-head / interview / podcast / product-explainer footage |
| `vidmuse-create` | **Film workflow** for material that must be made: explainers, promos, script + TTS films, and Vox collage. The skill keeps only the shared spine; `path-routing` and the selected references own path-specific craft. |
| `vidmuse-design` | **Private visual-direction capability** — taste atoms and profiles, private frame packs, project `FRAME.md`, caption identity, treatment grammar, and real-content showcase. Loaded by a film owner only for the direction phase; it does not route, time beats, source media, animate, or render. |
| `vidmuse-assets` | **Asset intelligence** for explicit or in-film work. Owns semantic opportunities, canonical identity, transcript-bound pass receipts, request fingerprints, `asset-plan.json`, source/license policy, Core Pack / Creator Library direction, and provider choice; delegates all I/O and generation to `media-use`. First active catalog: pinned Lobe Icons. |
| `media-use` | **Direct capability + shared runtime** — standalone ASR/ATA/TTS/generation/transforms, or exact execution for an owning workflow. Never owns semantic asset decisions or a film deliverable. |
| `vidmuse-motion` | **Dependency skill** — semantic motion recipes → HyperFrames/GSAP native compose when Registry has no block (KPI/bars/sparkline/stat cards). Not a product router. `scripts/motion_recipes.py` + gold `examples/dataviz-semantic/` |

## HyperFrames core (vendored from heygen-com/hyperframes `skills/`)

Same set as `npx hyperframes skills update` core tier (`FALLBACK_CORE_SKILLS`):

| Skill | Role |
| --- | --- |
| `hyperframes` | **Domain reference only** (CLI pin + domain map). Fresh intent returns to `/vidmuse`. |
| `hyperframes-core` | Composition contract, `data-*`, determinism, STORYBOARD/SCRIPT |
| `hyperframes-cli` | CLI loop: init / lint / check / keyframes / snapshot / render |
| `hyperframes-animation` | Motion rules, blueprints, seven runtime adapters |
| `hyperframes-keyframes` | Seek-safe keyframe diagnostics |
| `hyperframes-registry` | `hyperframes add` / catalog / wiring |

## Intentionally excluded

| Skill | Why |
| --- | --- |
| `talking-head-recut` | Replaced by `vidmuse-recut` (Namespace guard) |
| Other HF creation workflows (`product-launch-video`, `pr-to-video`, …) | Not dependencies of recut; install upstream separately if needed |

## Skill authoring policy

Keep product skills as thin control layers:

- State the goal, trigger boundary, autonomy boundary, required inputs and
  outputs, and blocking success criteria.
- State each instruction once. Put schemas, catalogs, examples, craft rules,
  and troubleshooting in a named reference or deterministic script.
- For policy-only workflow changes, reuse existing artifacts and templates.
  Do not introduce a schema migration, validator, or persistent artifact unless
  the requested user outcome requires it.
- Load references by decision branch; do not make every run read every path.
- Keep a constraint only when it protects safety, product truth, workflow
  ownership, or a measured failure. Prefer explaining the reason over adding
  another near-duplicate prohibition.
- Treat scripts as contract enforcement and the model as the director. A
  validator can reject broken artifacts but cannot grant aesthetic approval.
- Test direct, indirect, incomplete, near-miss, and resume prompts before
  tightening a skill description or adding another rule.

Aim for a focused `SKILL.md` well below the 500-line progressive-disclosure
ceiling. When a workflow grows, make one reference authoritative and link to
it instead of copying its contract back into the skill.

## Maintain private VidMuse design

Run Design-owned checks from the Design skill directory so portable catalog
paths and project commands have one documented base:

```bash
cd skills/vidmuse-design
python3 scripts/taste.py --validate
python3 scripts/taste.py --index --domain packs
python3 scripts/frame_md.py library/frame-packs/coral/FRAME.md --check
```

The catalog stores portable relative paths; `taste.py --get` also returns
`source.skill_root` and `source.resolved_*` absolute paths for callers in
another working directory.

Affinity is a cross-boundary integration check owned by Recut's effect
resolver. With no saved catalog it queries the installed/live HyperFrames
catalog; CI can pass a deterministic snapshot:

```bash
python3 ../vidmuse-recut/scripts/effects.py \
  --check-affinity data/style-packs.jsonl

python3 ../vidmuse-recut/scripts/effects.py \
  --check-affinity data/style-packs.jsonl \
  --catalog-file /path/to/hyperframes-catalog.json
```

## Refresh vendored skills

From a checkout of this plugin repo:

```bash
# refresh HyperFrames core from a local hyperframes clone
HF=~/Desktop/hyperframes/skills
for s in hyperframes hyperframes-animation hyperframes-cli hyperframes-core \
         hyperframes-keyframes hyperframes-registry media-use; do
  rsync -a --delete --exclude '.DS_Store' "$HF/$s/" "skills/$s/"
done

```

Creative reference material is not refreshed as a standalone vendored skill.
Its owned capabilities are distributed across `vidmuse-design`,
`vidmuse-create`, `hyperframes-animation`, `hyperframes-core`, and
`vidmuse-assets`.

Then commit and `npm run package:codex-plugin`.
