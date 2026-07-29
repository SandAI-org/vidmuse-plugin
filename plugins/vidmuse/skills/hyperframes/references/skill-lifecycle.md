# Skill installation and freshness (VidMuse plugin override)

> **This file is overridden for the VidMuse Codex plugin.**  
> Full detail: `references/README.md`. Product entry: **`/vidmuse-recut`**.

## Default path — no network skill install

Dependency skills ship **inside the plugin** next to this skill:

- `vidmuse-recut` (product router)
- HyperFrames core: `hyperframes`, `hyperframes-*`, `media-use`
- GSAP pack: `gsap-core`, `gsap-timeline`, `gsap-plugins`, `gsap-utils`, `gsap-performance`

Verify with:

```bash
bash <path-to>/skills/vidmuse-recut/scripts/setup.sh
```

`setup.sh` checks siblings on disk and fails closed when the plugin payload is
incomplete. Reinstall or update `vidmuse@personal`; do not repair a broken
plugin by downloading upstream skill text because that would overwrite the
VidMuse adaptations.

## Never (packaging / VidMuse product)

```bash
# DO NOT
npx hyperframes skills update                          # bare — expands/refreshes installed workflows
npx hyperframes skills update talking-head-recut
npx hyperframes skills update product-launch-video
npx skills add heygen-com/hyperframes --skill talking-head-recut
npx skills add heygen-com/hyperframes --all
```

## Upstream behavior (outside this plugin only)

Standalone HyperFrames may use a different skill lifecycle. It does not apply
inside the VidMuse plugin.
