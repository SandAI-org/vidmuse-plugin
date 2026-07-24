# Skills shipped in this plugin

User-facing entries are **`/vidmuse-recut`** (existing speaking footage) and **`/vidmuse-create`** (no source footage). Everything else is a **dependency skill** the agent loads on demand while executing those workflows (composition contract, motion craft, media ops, GSAP timeline mechanics).

Do **not** install or invoke HyperFrames `talking-head-recut` from this plugin — that job is owned by `vidmuse-recut`.

**Routing law:** `/hyperframes` is vendored and **demoted**. Description avoids packaging trigger words (so it should not win skill-match over recut). Body §0 + `references/README.md` banners hand packaging / dress-up / recut to `/vidmuse-recut`. THR route is a redirect stub. `setup.sh` network fallback uses a **core whitelist only** (never bare `skills update`, never THR). Between the two product skills: a recording of a person speaking exists → `vidmuse-recut`; the film's material must be made (script+TTS explainer, website/product promo, generated media) → `vidmuse-create`. Create shares recut's references and scripts — the aesthetic system (charter, tells, taste authority, FRAME.md, gates) is one system with two grounding modes.

## User-facing

| Skill | Role |
| --- | --- |
| `vidmuse-recut` | **Product router** + editor/director for existing talking-head / interview / podcast / product-explainer footage |
| `vidmuse-create` | Films **without** source footage: knowledge explainers / promos / **Vox paper-collage** B-roll & explainers. **Hard voice spine:** `vidmuse` TTS → `doubao_speech/audio_text_alignment` → `transcript.json` (no guessed times / OS TTS). Anti-PPT craft + `references/promo-recipes.md` + curated **shot-cards** (32 motion priors from video-shotcraft → HF/GSAP) + `references/vox-collage.md` (optional `scripts/collage_frames.py` for ffmpeg); shares recut taste/Timeline pipeline |

## HyperFrames core (vendored from heygen-com/hyperframes `skills/`)

Same set as `npx hyperframes skills update` core tier (`FALLBACK_CORE_SKILLS`):

| Skill | Role |
| --- | --- |
| `hyperframes` | **Domain reference only** (CLI pin + domain map). Not mandatory entry; must hand packaging to `vidmuse-recut` |
| `hyperframes-core` | Composition contract, `data-*`, determinism, STORYBOARD/SCRIPT |
| `hyperframes-cli` | CLI loop: init / lint / check / keyframes / snapshot / render |
| `hyperframes-animation` | Motion rules, blueprints, seven runtime adapters |
| `hyperframes-creative` | Non-animation creative direction |
| `hyperframes-keyframes` | Seek-safe keyframe diagnostics |
| `hyperframes-registry` | `hyperframes add` / catalog / wiring |
| `media-use` | Media OS: TTS, BGM, captions, prefs, assets |

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
