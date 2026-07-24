# VidMuse-native effects

HyperFrames Registry is the default implementation supply. Put code here only
when no upstream block or component expresses the required mechanism, or when a
content-driven signature move cannot be generalized yet.

Native effects use the same shapes as upstream:

- `blocks/<id>/<id>.html` for independently seeked compositions;
- `components/<id>/<id>.html` for snippets or timeline hooks.

Keep selection metadata in `data/effects-overlay.jsonl`, not inside the effect
HTML. When an effect becomes general and stable, contribute it upstream; after
the upstream version reaches parity, mark the native copy deprecated and remove
it only after a real-video comparison.

Blocks are parameterized templates: declare every project-facing value in
`data-composition-variables` on the `<html>` root and read it with
`window.__hyperframes.getVariables()`. The host mounts the file untouched via
`data-composition-src` and injects per-instance values with
`data-variable-values`; content never gets edited into the template body.
Components are pasteable mechanisms driven by the host timeline through an
`attach*` function.

Current implementations:

- `blocks/chapter-title-card/chapter-title-card.html` — full-frame chapter
  title card template (kicker, title, supporting line, background index) in the
  official block contract; all copy, palette, and fonts arrive as composition
  variables from `design-system.json`.

- `components/source-pip-handoff/source-pip-handoff.html` — yields the main
  canvas to designed copy or diagrams while the direct-root source video moves
  into a lower-corner PiP, then restores it to full frame.
- `components/source-spotlight-frame/source-spotlight-frame.html` — clips the
  direct-root source video to a circular spotlight around the subject while a
  chapter HUD (corner brackets, index, chapter list) fills the released canvas,
  then restores the full frame. Circle geometry comes from the real footage.
- `components/cue-sticker-pop/cue-sticker-pop.html` — a sticker or icon that
  pops in at a spoken or gestural cue at a fixed evidence-derived point, floats
  a finite number of deterministic half-cycles, and exits cleanly. Not a
  frame-by-frame tracker.
