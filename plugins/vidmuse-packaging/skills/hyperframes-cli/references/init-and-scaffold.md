# init, capture, skills

Scaffolding commands. Use these instead of creating files by hand when a project does not already exist.

## init

```bash
npx hyperframes init my-video                                    # TTY: interactive wizard
npx hyperframes init my-video --example warm-grain               # pick an example
npx hyperframes init my-video --example blank --resolution portrait
npx hyperframes init my-video --example blank --tailwind         # Tailwind v4 browser runtime
npx hyperframes init my-video --non-interactive --example blank  # CI/agents — flag-only
```

**Default depends on TTY**: in a terminal, the CLI prompts for example/options. Outside a TTY (CI, agents, piped output) it auto-switches to non-interactive and **requires `--example`** (the CLI errors with a usage example if missing). Pass `--non-interactive` to force flag-only mode even on a TTY.

Templates: `blank`, `warm-grain`, `play-mode`, `swiss-grid`, `vignelli`, `decision-tree`, `kinetic-type`, `product-promo`, `nyt-graph`.

Other useful flags:

- `--resolution` — preset: `landscape` (1920×1080), `portrait` (1080×1920), `landscape-4k`, `portrait-4k`, `square` (1080×1080), `square-4k`. Aliases: `1080p`, `4k`, `uhd`, `1080p-square`, `4k-square`.
- `--skill=<slug>` — record the owning authoring workflow (e.g. `product-launch-video`) in `hyperframes.json`, so every later render of this project — re-renders, `npm run render`, `--batch` — is attributed to it on anonymous telemetry without re-passing the flag. Creation workflows set this automatically; you rarely pass it by hand.
- `--skip-skills` — **temporarily ignored**: `init` always checks AI coding skills against GitHub while the skills.sh registry catches up. To opt out (CI/tests), set the `HYPERFRAMES_SKIP_SKILLS=1` env var instead.
When using `--tailwind`, invoke the `hyperframes-core` (Tailwind reference) skill before editing classes or theme tokens. The scaffold uses Tailwind v4 browser runtime patterns, not the legacy v3 setup.

Do not pass `--audio`, `--video`, transcription, or model options to `init`; those paths may select or download HyperFrames-managed models. Add user media after scaffolding through `vidmuse-media`.

## capture

```bash
npx hyperframes capture https://stripe.com --skip-vision                  # scaffold from a website
npx hyperframes capture https://linear.app -o linear-video --skip-vision  # custom output directory
npx hyperframes capture https://example.com --json --skip-vision          # JSON output for agents
npx hyperframes capture https://example.com --skip-assets   # skip image/SVG download
npx hyperframes capture https://example.com --skip-vision   # skip optional AI captions
npx hyperframes capture https://example.com --max-screenshots 12
npx hyperframes capture https://example.com --timeout 60000 # page-load timeout in ms
npx hyperframes capture https://example.com --capture-budget 90000 # post-navigation budget
```

Captures a live URL as an editable HyperFrames project: screenshots become layered scenes, assets are downloaded locally, and the result is a normal project you can `lint`, `snapshot`, and `render`. Always pass `--skip-vision`; VidMuse does not use HyperFrames-selected vision models.

`--timeout` bounds page navigation; `--capture-budget` is the separate cooperative budget for work
after navigation (fonts, assets, vision, and contact sheets). The latter is not a hard wall-clock
watchdog and cannot interrupt native work already in flight. An outer caller deadline is therefore a
third, distinct timeout. An outer caller timeout leaves the capture result unknown; it does not prove
HyperFrames hung or that the navigation timeout should be increased. Preserve the last phase and
classify the boundary that fired. `--skip-vision` disables optional AI image captioning and is required in VidMuse.

For agents, use `--json`. The result includes `ok`, warnings, and `lastPhase`. The command also emits
stable `HYPERFRAMES_CAPTURE_PHASE` records so a watchdog can report the last started, completed, or
degraded phase without retaining sensitive payloads.

Treat a non-zero exit, JSON `ok: false`, or an output `BLOCKED.md` as a **hard stop**. Do not render,
build, or infer brand/design data from partial files in a blocked capture. A successful capture may
degrade an optional phase within budget, but its structural output still has to satisfy the owning
workflow's gate. Exit zero and file existence alone are not semantic success: require the current
invocation's JSON `ok: true`, no `BLOCKED.md`, and artifacts usable for that workflow. Run each retry
into a fresh output directory; never merge or reuse a blocked attempt's partial output.

## skills

```bash
npx hyperframes skills    # install HyperFrames skills for AI coding tools
```

One-time setup that adds the HyperFrames skill pack (`hyperframes-core`, `-creative`, `-animation`, `-cli`, `-registry`, `-media`, plus the `product-launch-video` and `hyperframes` orchestrators) to the local AI coding environment so agents follow the framework conventions. Re-run after major HyperFrames upgrades.
