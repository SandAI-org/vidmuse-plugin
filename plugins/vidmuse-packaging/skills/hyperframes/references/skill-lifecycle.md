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

`setup.sh` checks siblings on disk first. It does **not** run bare
`npx hyperframes skills update` (that would refresh unrelated workflows already
on the machine, e.g. `talking-head-recut`).

## Fallback only (broken plugin layout)

If bundled siblings are missing, `setup.sh` recovers **whitelist only**:

```bash
npx hyperframes skills update \
  hyperframes \
  hyperframes-animation \
  hyperframes-cli \
  hyperframes-core \
  hyperframes-creative \
  hyperframes-keyframes \
  hyperframes-registry \
  media-use

npx skills add greensock/gsap-skills -g -y \
  --skill gsap-core --skill gsap-timeline --skill gsap-plugins \
  --skill gsap-utils --skill gsap-performance
```

## Never (packaging / VidMuse product)

```bash
# DO NOT
npx hyperframes skills update                          # bare — expands/refreshes installed workflows
npx hyperframes skills update talking-head-recut
npx hyperframes skills update product-launch-video
npx skills add heygen-com/hyperframes --skill talking-head-recut
npx skills add heygen-com/hyperframes --all
```

## Upstream behavior (inventory only)

Standalone HyperFrames still documents core-vs-lazy workflow installs and
`skills update <workflow-name>`. That model applies **outside** this plugin when
someone intentionally uses pure HyperFrames creation workflows — not when
running VidMuse packaging.
