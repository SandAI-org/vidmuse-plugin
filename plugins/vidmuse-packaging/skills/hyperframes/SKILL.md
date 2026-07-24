---
name: hyperframes
description: >
  HyperFrames domain reference only (VidMuse Codex plugin): CLI pin/upgrade hints and
  on-demand map to hyperframes-core, hyperframes-cli, hyperframes-animation,
  hyperframes-creative, hyperframes-keyframes, hyperframes-registry, media-use, and
  gsap-*. Not a product router and not a mandatory entry. Load only after the VidMuse
  product skill already owns the run, or for inspect/lint/check/render help on an
  existing composition project. Never the first skill for a new user video request.
---

# HyperFrames (VidMuse plugin — delegated router)

> **Routing authority in this plugin belongs to VidMuse product skills:**  
> `/vidmuse-recut` (existing speaking footage) and `/vidmuse-create` (no speaking plate).  
> This file is a **domain reference** vendored from upstream HyperFrames so agents can
> load composition, CLI, and media skills while executing a **VidMuse** workflow.  
> It must **not** capture "make / package / dress up a video" requests.

HyperFrames **renders video from HTML** — a composition is an HTML file whose DOM declares timing with `data-*` attributes, whose animation runtime is seekable, and whose media playback is owned by the framework. The full authoring contract lives in `/hyperframes-core`; read it before writing composition HTML.

## 0. Authority (read first)

| Situation | Action |
| --- | --- |
| Package / dress / recut / direct **existing speaking footage** (talking-head, interview, podcast, product explainer, graphic overlays, launch-film polish) | **Hand off immediately to `/vidmuse-recut`.** Do not run this skill's intent interview. Do not install `/talking-head-recut`. |
| Plain captions/subtitles only on existing talking-head (no designed cards) | Prefer `/vidmuse-recut` Packaging mode with captions focus (THR's old `/embedded-captions` path is not the product entry here). |
| Film with **no** recording of a person speaking — script+TTS explainer, website/product promo from URL, generated-media film | **Hand off immediately to `/vidmuse-create`.** |
| Already inside an active **vidmuse-recut** / **vidmuse-create** (or other VidMuse) run and need HF contract / CLI / motion / media manuals | Stay here; load domain skills in § 3. |
| Existing HyperFrames project: inspect, lint, check, preview, render only | Load `/hyperframes-cli` (+ domain skills as needed). Skip product routing. |

**Never:**

- claim this skill is the "mandatory entry point" for video work in the VidMuse plugin;
- route packaging jobs to `/talking-head-recut` (intentionally **not** shipped);
- run `npx hyperframes skills update <workflow>` to pull competing creation workflows for a packaging job;
- re-open product routing after `/vidmuse-recut` or `/vidmuse-create` has taken the job.

Upstream HyperFrames still docs other creation workflows (`product-launch-video`, `pr-to-video`, …) under `references/`. Those route files are **historical / external-kit references** in this plugin, not active product gates. Do not install them unless the user explicitly leaves the VidMuse packaging product and asks for a pure HyperFrames creation path **and** those skills are available outside this plugin.

## 1. Start from project state (narrow)

Apply the first matching row; do not evaluate lower state rows:

| State | Action |
| --- | --- |
| Packaging / directing existing speaking footage | → `/vidmuse-recut` (stop). |
| Create film without speaking plate (script, site promo, TTS, generated media) | → `/vidmuse-create` (stop). |
| Specific operation on an existing HyperFrames project: inspect, diagnose, validate, preview, render, publish, or batch-render | Perform only that operation. Load `/hyperframes-cli` and any required domain skills. |
| Specific edit to an existing HyperFrames composition already owned by a VidMuse run | Make the edit under the active VidMuse workflow's rules; load domain skills from § 3. |
| `BRIEF.md` or VidMuse work-dir artifacts (`packaging-analysis.md`, `FRAME.md`, `scene-plan.json`, …) | Resume via **`/vidmuse-recut`** or **`/vidmuse-create`** per whether speaking source exists — not this skill. |
| No product intent, bare HF project files only | CLI/domain help only; no intent interview orchestrated from this skill. |

### Keep the project's CLI current

A scaffolded project may pin `hyperframes@<version>` in its `package.json` scripts so renders stay reproducible. When resuming a project whose scripts carry a pin, probe once before the first render-affecting command:

```bash
npx hyperframes@latest upgrade --project . --check
```

The probe is read-only and reports the pin against the latest release; keep the explicit `.`. When it reports the project behind, apply with `npx hyperframes@latest upgrade --project .`, then verify with `npx hyperframes check`. Name old and new version in the run summary. If the check fails, revert the `package.json` change and stay on the pinned version.

## 2. Product route map (VidMuse override)

User-facing packaging routes that upstream HyperFrames once owned:

| Priority | Request | Workflow **in this plugin** |
| -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 1        | Package / dress up / recut / direct existing talking-head, interview, podcast, or product-explainer footage        | **`/vidmuse-recut`**       |
| 2        | Designed graphic overlays, kinetic titles, lower-thirds, data callouts, PiP, director-mode motion film on footage | **`/vidmuse-recut`**       |
| 3        | Launch-film / promo polish on existing speaking footage                                                            | **`/vidmuse-recut`**       |
| 4        | Explainer / promo / narrated film **without** speaking-source footage (script+TTS, website-from-URL, generated)   | **`/vidmuse-create`**      |

Upstream alias (do not install):

| Legacy name | Status in this plugin |
| --- | --- |
| `/talking-head-recut` | **Replaced** by `/vidmuse-recut`. Never install or invoke. |

### Resolve common ambiguities (packaging)

- Existing footage + designed information cards / packaging / dress-up → **`/vidmuse-recut`**.
- Existing footage + "just captions" → still start at **`/vidmuse-recut`** (restrained Packaging mode); do not orphan to a missing `/embedded-captions` install unless the user opts out of VidMuse.
- Retiming, reordering, heavy NLE remix may still be handled inside Director-mode **`/vidmuse-recut`** when the user still has a speaking-source packaging goal; only abandon VidMuse when the user explicitly wants a different product.

This skill does **not** run the upstream intent layer (`references/intent-interview.md`) for product routing. That layer is frozen inventory; VidMuse owns brief capture when it needs it (`BRIEF.md` under the recut work dir).

## 3. Load domain skills on demand

Load only after `/vidmuse-recut` or `/vidmuse-create` (or an explicit HF project op) owns the run:

| Need                                                                                                                | Skill                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Composition structure, timing attributes, tracks, variables, determinism                                            | `/hyperframes-core`      |
| Motion rules, scene blueprints, transitions, runtime adapters                                                       | `/hyperframes-animation` |
| Seek-safe GSAP, CSS, Anime.js, WAAPI, FLIP, paths, masks, SVG, 3D keyframes, or `hyperframes keyframes` diagnostics | `/hyperframes-keyframes` |
| Design specs, concept, palette, typography, narration, beat planning                                                | `/hyperframes-creative`  |
| Images, icons, logos, audio, captions, grades, LUTs, reusable media                                                 | `/media-use`             |
| Init, lint, check, snapshots, compare, batch render, Studio, render, publish, or diagnostics                        | `/hyperframes-cli`       |
| Registry blocks and components                                                                                      | `/hyperframes-registry`  |
| GSAP timeline craft (bundled siblings)                                                                              | `/gsap-core` (+ timeline / plugins / utils / performance) |

Domain skills never take ownership of the end-to-end VidMuse deliverable. **`/vidmuse-recut` or `/vidmuse-create` does.**

## 4. Skills install policy (this plugin)

Dependency skills for packaging already ship **inside the VidMuse Codex plugin** next to this file (`skills/hyperframes-*`, `media-use`, `gsap-*`, `vidmuse-recut`). Prefer those paths.

- Do **not** run `npx hyperframes skills update talking-head-recut`.
- Do **not** expand the plugin with upstream creation workflows just because a reference route file names them.
- CLI runtime remains `npx hyperframes` (engine); agent manuals remain the vendored sibling skills.

If a bundled domain skill is missing, recover via the host plugin's `vidmuse-recut/scripts/setup.sh` fallback — not by reasserting this file as product router.

## 5. Upstream references (read-only inventory)

`references/intent-interview.md`, `references/routes/*`, `references/capability-menu.md`, and `references/workflow-catalog.md` describe the **standalone HyperFrames product**. In the VidMuse plugin they remain useful for terminology and CLI habits, but any instruction that:

- names this skill as mandatory entry, or  
- routes packaging to `/talking-head-recut`, or  
- installs lazy creation workflows for a packaging ask  

is **overridden by § 0–2 of this file**. When a reference conflicts with a VidMuse product skill, **`/vidmuse-recut` or `/vidmuse-create` wins** (pick by whether speaking footage exists).
