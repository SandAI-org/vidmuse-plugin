# Design Adherence

Run this review after authoring a showcase or composition and before approval.
The project `FRAME.md` is normative. Prose in craft references and preset
source files is contextual guidance, never a second token authority.

For `recut-packaging`, this review has a mechanical floor. The selected design
is frozen in `design-lock.json`; production mounts its exact treatment HTML
instead of implementing a lookalike. Run:

```bash
python3 scripts/design_lock.py "$WORK_DIR" --check \
  --require-pairs \
  --pair <treatment-id>=<rendered-developed-state.png>
```

Supply one `--pair` for every treatment used in production. The gate verifies
hash continuity, exact `data-composition-src` mounts, declared surface/weight,
panel-card count and adjacency, and rendered-vs-approved frames. Missing
comparison evidence is a failure, not partial aesthetic coverage.

Check the final artifact against `FRAME.md`:

1. every load-bearing color maps to a declared token;
2. font families, real weights, case, and numeric features match;
3. radius, border, shadow, grain, and material behavior agree;
4. spacing and density stay inside the declared range;
5. captions, safe zones, and aspect behavior match;
6. the signature move is present only where intended;
7. explicit avoidance rules are absent;
8. mode-specific constraints remain true, especially source primacy in
   `recut-packaging`.

In particular, verify morphology rather than vocabulary:

- `surface: none` has no bounded backing shell;
- `surface: full-field` reaches the intended canvas edge(s) and has not become
  a fixed-width rectangle;
- only `surface: panel` behaves as a card and consumes the panel-card budget;
- face avoidance changes anchors, wrapping, crop, or gradient falloff without
  changing the approved surface category.

Report violations as a checklist and fix the authority first when the intended
design has changed. Then update the showcase or composition. Never patch the
implementation into disagreement with stale `FRAME.md`.
