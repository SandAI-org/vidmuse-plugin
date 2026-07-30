---
name: hyperframes
description: >
  HyperFrames domain reference only (VidMuse Codex plugin): CLI pin/upgrade hints and
  on-demand map to hyperframes-core, hyperframes-cli, hyperframes-animation,
  hyperframes-keyframes, hyperframes-registry, media-use, and VidMuse product
  capabilities.
  Not a product router and not a mandatory entry. Fresh VidMuse requests
  belong to /vidmuse, including standalone ASR/TTS/media operations. Load this
  skill only after a VidMuse workflow owns the run, or for
  inspect/lint/check/render help on an existing HyperFrames composition.
---

# HyperFrames (VidMuse plugin — delegated router)

> **Routing authority in this plugin belongs to `/vidmuse`.**
> This file is a **domain reference** vendored from upstream HyperFrames so agents can
> load composition, CLI, and media skills while executing a **VidMuse** workflow.  
> It must not capture fresh film or standalone media requests.

HyperFrames **renders video from HTML** — a composition is an HTML file whose DOM declares timing with `data-*` attributes, whose animation runtime is seekable, and whose media playback is owned by the framework. The full authoring contract lives in `/hyperframes-core`; read it before writing composition HTML.

## 0. Authority

For any fresh VidMuse request, load `/vidmuse` and stop routing here. That
includes:

- film creation, packaging, recut, captions, or design;
- standalone ASR, ATA, TTS, generation, download, or media transforms;
- semantic asset and library requests.

Stay in this skill only when an active VidMuse workflow needs HyperFrames
domain knowledge, or when the user asks for a specific operation on an
existing HyperFrames composition.

Read `../vidmuse/references/runtime-policy.md` for the shared namespace,
vendored-skill, initialization, and preview rules. Do not copy an archived
upstream creation route into this domain reference.

## 1. Existing HyperFrames project operations

| State | Action |
| --- | --- |
| Specific inspect, diagnose, validate, snapshot, preview, render, publish, or batch-render request | Perform only that operation with `/hyperframes-cli` and required domain skills. |
| Specific composition edit inside an active VidMuse film | Preserve the owning workflow's decisions; load only the domain layer needed for the edit. |
| VidMuse project artifacts exist but no owner is active | Return to `/vidmuse` to resume the recorded owner. |
| Fresh creative or media request | Return to `/vidmuse`; this skill does not interview or route it. |

### Keep the project's CLI current

A scaffolded project may pin `hyperframes@<version>` in its `package.json` scripts so renders stay reproducible. When resuming a project whose scripts carry a pin, probe once before the first render-affecting command:

```bash
npx hyperframes@latest upgrade --project . --check
```

The probe is read-only and reports the pin against the latest release; keep the explicit `.`. When it reports the project behind, apply with `npx hyperframes@latest upgrade --project .`, then verify with `npx hyperframes check`. Name old and new version in the run summary. If the check fails, revert the `package.json` change and stay on the pinned version.

## 2. Load domain skills on demand

Load only after a VidMuse owner or an explicit HyperFrames project operation
has been selected:

| Need                                                                                                                | Skill                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Composition structure, timing attributes, tracks, variables, determinism                                            | `/hyperframes-core`      |
| Motion rules, scene blueprints, transitions, runtime adapters                                                       | `/hyperframes-animation` |
| Seek-safe GSAP, CSS, Anime.js, WAAPI, FLIP, paths, masks, SVG, 3D keyframes, or `hyperframes keyframes` diagnostics | `/hyperframes-keyframes` |
| Visual system, palette, typography, and motion temperament                                                         | `/vidmuse-design`        |
| Story, narration, beats, and editorial timing                                                                      | owning `/vidmuse-create` or `/vidmuse-recut` |
| Images, icons, logos, audio, captions, grades, LUTs, reusable media                                                 | `/media-use`             |
| Init, lint, check, snapshots, compare, batch render, Studio, render, publish, or diagnostics                        | `/hyperframes-cli`       |
| Registry blocks and components                                                                                      | `/hyperframes-registry`  |
| HyperFrames-safe GSAP timelines, easing, stagger, plugins, and performance                                          | `/hyperframes-animation` adapters                          |

Domain skills never take ownership of an end-to-end VidMuse deliverable.

## 3. Skills install policy (this plugin)

Dependency skills for packaging already ship **inside the VidMuse Codex plugin** next to this file (`skills/hyperframes-*`, `media-use`, `vidmuse-recut`). Prefer those paths.

- Do **not** run `npx hyperframes skills update talking-head-recut`.
- Do **not** expand the plugin with upstream creation workflows just because a reference route file names them.
- CLI runtime remains `npx hyperframes` (engine); agent manuals remain the vendored sibling skills.

If a bundled domain skill is missing, `vidmuse-recut/scripts/setup.sh` reports
the incomplete payload. Reinstall/update the VidMuse plugin; do not download
upstream skill text as a repair path.

## 4. Upstream references and normalized inventory

`references/capability-menu.md` is the VidMuse-normalized capability inventory.
`references/intent-interview.md`, `references/capability-menu.md`, and
`references/workflow-catalog.md` are VidMuse-normalized. Only
`references/routes/*` remains frozen standalone-HyperFrames provenance.
Any archived instruction that:

- names this skill as mandatory entry, or  
- routes packaging to `/talking-head-recut`, or  
- installs lazy creation workflows for a packaging ask  

is overridden by `/vidmuse` plus the selected owner. Return to `/vidmuse`
rather than resolving product ambiguity in this domain skill.
