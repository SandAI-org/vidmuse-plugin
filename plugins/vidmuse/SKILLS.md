# Skills shipped in this plugin

The mandatory user-facing entry is **`/vidmuse`**. It routes by requested
deliverable to two film workflows and two direct capability domains:
**`/vidmuse-recut`** (existing speaking footage), **`/vidmuse-create`**
(material must be made), **`/vidmuse-assets`** (semantic asset/library work),
or **`/media-use`** (standalone ASR, ATA, TTS, generation, and deterministic
media operations). Composition, motion, rendering, and GSAP skills remain
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
| `vidmuse` | **Mandatory router** — resume state, classify the requested deliverable, select one owner, and leave |
| `vidmuse-recut` | **Film workflow** — editor/director for existing talking-head / interview / podcast / product-explainer footage |
| `vidmuse-create` | Films **without** source footage: knowledge explainers / promos / **Vox paper-collage** B-roll & explainers. Non-Vox uses agency pre-production (truth → brief → 3 treatments → real storyboard → Timeline animatic), then the hard `vidmuse` TTS → ATA voice spine and path-routed craft. `picture-design` owns focal hierarchy, screenshot treatment, reading surfaces, depth, and motif restraint; `path-routing` owns role-tagged cues, continuity strategy, audio delivery, UI proof, and the fast static correctness preflight. Render analysis is optional and users own aesthetic review on Timeline. **Vox frozen / recut untouched.** |
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
| `hyperframes-creative` | Non-animation creative direction |
| `hyperframes-keyframes` | Seek-safe keyframe diagnostics |
| `hyperframes-registry` | `hyperframes add` / catalog / wiring |

## GSAP pack (vendored from greensock/gsap-skills)

Installed by upstream `setup.sh` via `npx skills add greensock/gsap-skills`; here they ship in-tree:

| Skill | Role |
| --- | --- |
| `gsap-core` | `gsap.to/from/fromTo`, easing, defaults |
| `gsap-timeline` | Timeline sequencing & position parameter |
| `gsap-plugins` | Official plugins registration & APIs |
| `gsap-utils` | `gsap.utils.*` helpers |
| `gsap-performance` | 60fps-friendly motion practice |

## Intentionally excluded

| Skill | Why |
| --- | --- |
| `talking-head-recut` | Replaced by `vidmuse-recut` (Namespace guard) |
| Other HF creation workflows (`product-launch-video`, `pr-to-video`, …) | Not dependencies of recut; install upstream separately if needed |

## Refresh vendored skills

From a checkout of this plugin repo:

```bash
# refresh HyperFrames core from a local hyperframes clone
HF=~/Desktop/hyperframes/skills
for s in hyperframes hyperframes-animation hyperframes-cli hyperframes-core \
         hyperframes-creative hyperframes-keyframes hyperframes-registry media-use; do
  rsync -a --delete --exclude '.DS_Store' "$HF/$s/" "skills/$s/"
done

# refresh GSAP from a local greensock skills install
G=~/.agents/skills
for s in gsap-core gsap-timeline gsap-plugins gsap-utils gsap-performance; do
  rsync -a --delete --exclude '.DS_Store' "$G/$s/" "skills/$s/"
done
```

Then commit and `npm run package:codex-plugin`.
