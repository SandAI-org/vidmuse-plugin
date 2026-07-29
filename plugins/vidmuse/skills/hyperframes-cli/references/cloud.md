# Render and authentication boundary

VidMuse owns product authentication, AI media generation, Timeline preview, and
final product delivery. HyperFrames is the HTML composition/render layer.

## Default product path

```bash
vidmuse login
vidmuse profile get
vidmuse serve "$WORK_DIR/dsl.json"
```

Use the `vidmuse render` contract documented by
`../../vidmuse-recut/references/vidmuse-cli.md` after the user approves the
Timeline preview. Do not introduce a second provider credential or managed
render account.

## HyperFrames composition path

Use local HyperFrames rendering only for the HTML composition layer:

```bash
npx hyperframes lint
npx hyperframes check
npx hyperframes render --quality high --output composition.mp4
```

The resulting composition can be referenced by the VidMuse Timeline DSL. It is
not a replacement for the VidMuse product handoff.

## Explicit self-managed infrastructure

The bundled CLI also documents self-managed AWS Lambda and Google Cloud Run
rendering. These paths are allowed only when the user explicitly requests and
owns that infrastructure:

- AWS → `lambda.md`
- GCP → `cloudrun.md`

Do not choose either as an automatic fallback for missing local dependencies.
For a general environment or media failure, run `/media-use`
`scripts/resolve.mjs --doctor`; for a concrete HyperFrames browser/render
failure, read `doctor-browser.md`.

## Composition variables

Variables are part of the HyperFrames composition contract regardless of the
render surface. Declare and validate them using
`../../hyperframes-core/references/variables-and-media.md`. Keep all generated
media frozen locally and recorded by `/media-use` before a composition or
Timeline references it.
