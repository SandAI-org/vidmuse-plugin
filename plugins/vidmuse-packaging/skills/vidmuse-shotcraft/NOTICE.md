# VidMuse Shotcraft attribution

The bundled Shotcraft Registry contains 162 HyperFrames block translations derived from
the motion recipes and demonstration assets in:

- Project: `Vincentwei1021/video-shotcraft`
- Repository: https://github.com/Vincentwei1021/video-shotcraft
- Source commit: `d4915443232e89527fdc9d7e79f132ba411fc440`
- License: Apache License 2.0
- Upstream copyright: Copyright 2026 Wei Yihao

A copy of the upstream license is distributed as `LICENSE.apache-2.0.txt` beside this
notice. The HyperFrames block implementations are translations authored for the
`hf-shotcraft-pilot` evaluation and are shipped here as VidMuse-owned adaptations of that
source material.

VidMuse changes the distribution and integration layer:

- packages the canonical `registry/blocks` payloads inside the VidMuse plugin;
- adds bilingual job indexes and a fail-closed recut policy;
- installs blocks through a safe local installer because the current HyperFrames CLI does
  not load a second filesystem Registry;
- isolates installed assets by block and writes a project lock receipt;
- requires each film to replace demonstration copy, screenshots, data, colors, and logos
  before publishing.

Demonstration textures remain reference material. The source project explicitly notes
that demonstration screenshots should be replaced with product-owned captures before
publication. Neither the source project nor its trademarks endorse films made with this
plugin.
