# Generate a project beat grid

Use `hyperframes beats` when an existing HyperFrames project needs the Studio-compatible beat file for its music track. This is a CLI utility, not a complete video workflow.

```bash
npx hyperframes beats
npx hyperframes beats ./my-video
npx hyperframes beats ./my-video --json
```

The project must contain a local music `<audio>` source. Mark it with `data-timeline-role="music"`; an id containing `music`, `bgm`, or `soundtrack` is also recognized. The command analyzes that file in headless Chrome and writes `beats/<audio-relative-path>.json`.

If no beats are detected, the command fails and writes nothing. If Chrome is unavailable, run:

```bash
npx hyperframes browser ensure
```

For a complete beat-synced VidMuse film, keep ownership with
`/vidmuse-create` or `/vidmuse-recut`. Use `/hyperframes-animation`
`references/audio-reactive.md` and `scripts/extract-audio-data.py` for the
deterministic audio map; use this `beats` command only when an existing
HyperFrames project specifically needs its Studio beat grid.
