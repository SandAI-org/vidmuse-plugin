# Font Resolution

Use after `vidmuse-design` has selected a typographic voice. Design owns the
choice; this reference proves that the exact family, weights, glyphs, and
license can render where the film will run.

## Deterministic order

1. Prefer a HyperFrames pre-bundled family when it fits the approved design.
2. Otherwise freeze a licensed webfont or supplied font into the project and
   declare an explicit local `@font-face`.
3. A locally installed system font is acceptable only for local work that will
   never move to another renderer.
4. Treat implicit network font fetching as a convenience for exploration, not
   a production guarantee.

The currently pre-bundled families and weights are renderer implementation
detail and may change. Confirm against the installed HyperFrames version
rather than copying a stale list into `FRAME.md`.

## Coverage and licensing

- Verify every requested weight is a real cut; display faces often ship only
  one weight.
- Shape representative Chinese, Japanese, emoji, symbols, numerals, and
  punctuation before approval. A subset that renders Latin can still produce
  tofu for the actual script.
- Record family, style, weight range, source, license, frozen path, and
  coverage limitation in the asset receipt.
- Do not treat “free download” as a redistributable license. Preserve the
  license text when the license requires it.

## Handoff

Return the exact CSS family name, available weights/styles, local path or
pre-bundled status, license state, coverage note, and cloud-render safety.
Update project `FRAME.md` if the approved visual choice cannot be resolved;
never silently substitute a different voice in implementation.
