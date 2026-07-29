# init, capture, skills

Scaffolding commands. Use these to create the HyperFrames composition
structure. In the VidMuse plugin they do not own transcription, media
generation, or skill installation.

## init

> **Always prefix `HYPERFRAMES_SKIP_SKILLS=1` in this plugin.** Bare `init`
> refreshes the "core set" (`hyperframes`, `hyperframes-*`, `media-use`) from
> GitHub and will overwrite the plugin's vendored copies **mid-run** with
> upstream text that reclaims mandatory-entry routing (sending URL promos to
> `/product-launch-video`) and forces a storyboard/Studio open. `--skip-skills`
> is documented as *temporarily ignored*; the env var is the only working opt-out.
> Export it once per shell if you prefer: `export HYPERFRAMES_SKIP_SKILLS=1`.

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video                                    # TTY: interactive wizard
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video --example warm-grain               # pick an example
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video --example blank --resolution portrait
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video --video clip.mp4 --skip-transcribe # media copied; VidMuse transcribes
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video --audio track.mp3 --skip-transcribe # media copied; VidMuse transcribes
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video --example blank --tailwind         # Tailwind v4 browser runtime
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init my-video --non-interactive --example blank  # CI/agents — flag-only
```

**Default depends on TTY**: in a terminal, the CLI prompts for example/options. Outside a TTY (CI, agents, piped output) it auto-switches to non-interactive and **requires `--example`** (the CLI errors with a usage example if missing). Pass `--non-interactive` to force flag-only mode even on a TTY.

Templates: `blank`, `warm-grain`, `play-mode`, `swiss-grid`, `vignelli`, `decision-tree`, `kinetic-type`, `product-promo`, `nyt-graph`.

Other useful flags:

- `--resolution` — preset: `landscape` (1920×1080), `portrait` (1080×1920), `landscape-4k`, `portrait-4k`, `square` (1080×1080), `square-4k`. Aliases: `1080p`, `4k`, `uhd`, `1080p-square`, `4k-square`.
- `--skip-skills` — **temporarily ignored**: `init` always checks AI coding skills against GitHub while the skills.sh registry catches up. To opt out (CI/tests), set the `HYPERFRAMES_SKIP_SKILLS=1` env var instead.
- `--skip-transcribe` — **required in this plugin** whenever `--audio` or
  `--video` is supplied. The VidMuse media layer owns ASR + ATA.

When using `--tailwind`, invoke the `hyperframes-core` (Tailwind reference) skill before editing classes or theme tokens. The scaffold uses Tailwind v4 browser runtime patterns, not Studio's Tailwind v3 setup.

After scaffolding with media, run `/media-use`
`scripts/transcribe.mjs <media> --output <transcript.json>`. It uses VidMuse
ASR when text is missing and VidMuse ATA for word-level timing. Do not pass
HyperFrames transcription model/language flags in this plugin.

## capture

```bash
npx hyperframes capture https://stripe.com                  # scaffold from a website
npx hyperframes capture https://linear.app -o linear-video  # custom output directory
npx hyperframes capture https://example.com --json          # JSON output for agents
npx hyperframes capture https://example.com --skip-assets   # skip image/SVG download
npx hyperframes capture https://example.com --max-screenshots 12
npx hyperframes capture https://example.com --timeout 60000 # page-load timeout in ms
```

Captures a live URL as an editable HyperFrames project: screenshots become layered scenes, assets are downloaded locally, and the result is a normal project you can `lint` / `preview` / `render`. Use this when the user supplies a URL as the starting point for a video.

## skills

```bash
npx hyperframes skills    # install HyperFrames skills for AI coding tools
```

The VidMuse plugin already bundles its patched HyperFrames domain skills.
Do not run this installer in a VidMuse workflow: it can overwrite the vendored
copies or add competing product routers. Plugin installation/update owns skill
lifecycle.
