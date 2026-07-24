# Agent playbook — implementing from motion recipes

Copy this loop when `/vidmuse-motion` is open.

## 0. Preconditions

```bash
command -v npx
npx hyperframes --help >/dev/null
# composition lives OUTSIDE the plugin repo when possible
```

Know paths (plugin install or desktop checkout):

```text
MOTION_SKILL=…/skills/vidmuse-motion
HF_ANIM=…/skills/hyperframes-animation
```

## 1. Bind the beat

Write on the film plan beat:

- `viewer_job:` one sentence
- `numbers:` list with **source** (user / script / transcript). If empty → halt and ask.
- `motion_recipe_ids:` (filled after step 2)

## 2. Pick recipes

```bash
python3 "$MOTION_SKILL/scripts/motion_recipes.py" --index
python3 "$MOTION_SKILL/scripts/motion_recipes.py" --tag dataviz
```

Rules of thumb:

| Job | Start with |
| --- | --- |
| One big number | `kpi-glow-count` |
| Weeks/categories growing | `weekly-bar-rise` |
| Trend shape | `sparkline-draw` |
| Multi-panel evidence | `stat-card-trio` + children |

**≤3 recipes. ≤1 very-high cost.**

```bash
python3 "$MOTION_SKILL/scripts/motion_recipes.py" id1,id2 --get
```

## 3. Read mechanics

For each `rules: […]` entry:

```bash
# example
sed -n '1,120p' "$HF_ANIM/rules/counting-dynamic-scale.md"
sed -n '1,80p' "$HF_ANIM/rules/stat-bars-and-fills.md"
```

Optional blueprint:

```bash
sed -n '1,80p' "$HF_ANIM/blueprints/dataviz-countup.md"
```

Optional gold HTML:

```bash
# structure reference — copy patterns, not locked demo brand
less "$MOTION_SKILL/examples/dataviz-semantic/index.html"
```

## 4. Compose

Scaffold if needed:

```bash
mkdir -p "$WORK/public-dataviz" && cd "$WORK/public-dataviz"
# Prefer non-interactive when supported:
npx hyperframes init . --example blank --non-interactive
# or replace index.html of an existing project
```

Implement recipe **Steps** in order. Checklist:

- [ ] Root `#root` has `data-composition-id`, `data-width`, `data-height`, `data-duration`
- [ ] Clips have `id`, `data-start`, `data-duration`, `data-track-index`
- [ ] `const tl = gsap.timeline({ paused: true })` + `window.__timelines[id] = tl`
- [ ] Pre-tween hidden state via `gsap.set` / `fromTo` (not CSS `transform:`)
- [ ] Numbers use `tabular-nums`
- [ ] FRAME colors injected (or documented temporary tokens)
- [ ] Hold final frame until `data-duration` ends

## 5. Gate loop

```bash
npx hyperframes lint .
npx hyperframes check .
```

### Common failures → fix from recipe Forbid

| Check/lint signal | Fix |
| --- | --- |
| `gsap_css_transform_conflict` | Remove CSS `transform`; use `fromTo` |
| Contrast `#kpi` fail | Lighten fill color; keep glow as +bonus |
| Contrast grid labels | Raise SVG label opacity ≥ ~0.7 on dark |
| Layout jump on count | Fixed width wrap + `tabular-nums` |
| Bars visible before beat | `gsap.set(bars, { scaleY: 0 })` at t≈0 |

Re-run check until **passed**.

## 6. Proof

```bash
npx hyperframes snapshot . \
  --at 0.5,1.5,3.2,5.5,8.0 \
  -o "$WORK/proof-motion" \
  --describe false
```

Open contact-sheet or frames; confirm recipe **Verify** bullets.

Optional:

```bash
npx hyperframes render . -o "$WORK/out/motion-beat.mp4"
```

## 7. Integrate into product film

- **create:** sub-composition or main packaging HTML scene; Timeline DSL sound from VO.
- **recut:** only if recipe `recut_ok` and packaging analysis budgets fullscreen/insert.

Record receipts:

```json
{
  "motion_recipe_ids": ["kpi-glow-count", "weekly-bar-rise", "sparkline-draw", "stat-card-trio"],
  "rules_used": ["counting-dynamic-scale", "stat-bars-and-fills", "svg-path-draw"],
  "registry": [],
  "check": "passed"
}
```

## 8. Stop conditions

- User forbids motion / wants still only
- No legitimate numbers after one ask
- Recipe cannot pass check after 2 contrast/transform iterations → simplify (static readable final state + shorter motion) rather than stack shaders
