# HyperFrames references — **read-only inventory** (VidMuse plugin)

> **Stop.** In the VidMuse Codex plugin these files are **frozen upstream docs**, not
> an active product router.
>
> | Do | Don't |
> | --- | --- |
> | Use terminology, CLI habits, brief field names | Run the intent interview as the user front door |
> | Load domain skills named in `/hyperframes` §3 after `/vidmuse-recut` owns the job | Install `/talking-head-recut` or other creation workflows for packaging |
> | Defer every packaging / dress-up / recut / director ask to **`/vidmuse-recut`** | Follow route tables that name missing skills as if they were shipped here |

**Authority order when anything conflicts:**

1. `/vidmuse-recut` (product router)
2. `/hyperframes` `SKILL.md` §0–2 (this plugin’s demoted reference)
3. Files in this `references/` tree (lowest — inventory only)

## What still lives here

| Path | Treat as |
| --- | --- |
| `intent-interview.md`, `pitch-round.md` | Upstream sole-HF product briefing — **do not run** for VidMuse packaging |
| `routes/*` | Historical contracts; `routes/talking-head-recut.md` is a **redirect stub** → `/vidmuse-recut` |
| `skill-lifecycle.md` | Upstream install mechanics — overridden by plugin bundling + whitelist in `vidmuse-recut/scripts/setup.sh` |
| `capability-menu.md`, `workflow-catalog.md` | Capability vocabulary; overlay row already points at `/vidmuse-recut` |
| other | CLI / design vocabulary as needed inside an owned run |

## Forbidden install targets (packaging jobs)

Never for a packaging/recut job:

```text
talking-head-recut
embedded-captions   # start at /vidmuse-recut Packaging instead
product-launch-video
faceless-explainer
pr-to-video
music-to-video
motion-graphics     # as a competing product entry
general-video
slideshow
remotion-to-hyperframes
```

Ship and prefer the plugin’s vendored: `vidmuse-recut`, `hyperframes*`, `media-use`, `gsap-*`.
