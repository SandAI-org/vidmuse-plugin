# Typography Craft

Choose type by communicative register before choosing it by category. Ask
whether the voice is institutional, personal, technical, literary, urgent, or
playful, and what physical artifact it resembles. Reject the first familiar
training-data default unless it is genuinely the best fit.

## Voice system

- One expressive voice performs; a quieter voice supports.
- Avoid two merely similar faces. Prefer one family with real weight contrast,
  or contrast across clear axes such as serif/sans, condensed/wide, or
  proportional/mono.
- Register switching is semantic: statements, data, attribution, captions,
  and code may speak in different voices when that distinction matters.
- Time is hierarchy in video. The first typographic event reads as the most
  important even when it is not the largest.
- Motion changes voice. A slam, measured reveal, and long dissolve make the
  same typeface say different things.

## Video legibility

Use the project aspect and destination, then validate on rendered frames.
Starting floors for 1920×1080 full-screen work are 60 px display, 20 px body,
and 16 px data labels. In a scrolling feed, start around 90 px display, 32 px
body, and 24 px data labels. These are calibration points, not schema law.

Keep reading time shorter than screen time. Tight display tracking may survive
encoding better, but never use it to rescue too much copy. Light text on dark
backgrounds appears heavier and tighter; reduce body weight slightly and add a
little line-height or tracking.

## Numeric and code detail

Use tabular numerals for aligned stats, timers, and tables. Use diagonal
fractions where the font supports them, small caps for compact units, and
disable ligatures in code. A numeric transition must preserve column width
unless movement is deliberately part of the meaning.

## Runtime handoff

This reference chooses visual voices. `vidmuse-assets` resolves the actual
font files, license, CJK coverage, and deterministic render path through
`references/font-resolution.md`. Record the resolved family and available
weights in project `FRAME.md`; never assume a local-only face will exist in a
cloud render.
