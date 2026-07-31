# Direction Picker

Use this as the default direction gate for every fresh Recut project. Skip it
only when the user already approved a named look or preset, a resumed project
already has an approved `FRAME.md`, or the user explicitly asks VidMuse to
auto-select the visual direction. "直接做", "看看实力", "完整做完", an isolated
test, or a general autonomous run does not count. The three candidates must
come from the project; they are not three invented brands.

## Phase A — complete worlds

Offer exactly three materially different directions. Each must be developed to
showcase quality, not left as a mood-board label or color swap:

- name and one-sentence thesis;
- evidence from the source, audience, or product;
- palette and material;
- type voices and hierarchy;
- frame grammar and caption identity;
- motion temperament;
- best fit, risk, and reason another direction lost.

Develop all three against the same project moments so the user compares
direction rather than content. Each world needs at least:

1. one source-led frame with its actual caption identity on a real keyframe;
2. one developed treatment or full-frame proof state from an approved beat;
3. one additional real-content layout state plus a live motion-temperament demo.

These are live DOM mini-frames using scoped candidate tokens and real copy, not
screenshots of a mood board. A single background image with a headline, tags,
and prose is a concept card and fails this gate.

Use `templates/direction-picker.html` as a presentation shell, but write the
result to the project's single `frame-showcase.html`. Replace demo content with
real frames and project tokens, mark one evidence-backed recommendation, and
give every world a visible `选择 A/B/C` control. Present the HTML path and the
three names, then end the turn and wait for the user's named choice. Do not
write `FRAME.md` or continue production in that turn. Only an explicit request
to auto-select visual direction overrides this stop. A selection approves a
direction, not production timing, and is the workflow's only blocking
direction stop.

Do not create candidate FRAME files, candidate JSON, or three HTML pages. After
selection, write only the winning `FRAME.md`; retain losing reasons briefly in
its departure rationale. Preserve the three candidate sections in
`frame-showcase.html`, mark the chosen world, and append its selected-system
proof below the comparison. Continue without a second approval stop when it
faithfully implements the chosen candidate.

## Phase B — fine tune

After one world wins, expose only high-leverage adjustments: density, warmth,
contrast, type register, surface depth, caption assertiveness, and motion
energy. Apply the result to `FRAME.md`, then regenerate the showcase. Do not
continue mixing rejected directions into the selected system.
