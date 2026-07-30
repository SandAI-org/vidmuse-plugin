# Architecture — semantic motion layer

## Problem

HyperFrames **Registry** is sparse relative to Remotion/community template
zoos. Agents that **only** search catalog fail closed (“no effect”) and ship
static PNGs or give up. Meanwhile HF **already** can compose the missing looks
via HTML + GSAP + published **rules/blueprints**.

## Solution

Add a **semantic motion layer** between film plan and registry:

```text
┌─────────────────────────────────────────────────────────────┐
│  Product skills                                             │
│   /vidmuse-create · /vidmuse-recut                          │
│   film plan · FRAME · taste gates · Timeline                │
└───────────────────────────┬─────────────────────────────────┘
                            │ beat job + numbers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  /vidmuse-motion  (this skill)                              │
│   index.jsonl → recipe md → steps + forbid + verify         │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │ optional
            ▼                             ▼
┌───────────────────────┐     ┌───────────────────────────────┐
│  HF rules/blueprints  │     │  Registry + effects-overlay   │
│  hyperframes-animation│     │  hyperframes add + reskin     │
└───────────┬───────────┘     └───────────────┬───────────────┘
            │                                 │
            └────────────┬────────────────────┘
                         ▼
              Native composition HTML
              lint · check · snapshot · render
```

## Design principles

1. **Recipe is implementable** — if an Agent follows steps + named rules, a
   first green `check` is expected (gold example proves the v1 set).
2. **Registry is optional** — `registry_required: false` by default.
3. **Thin skill description, thick recipes** — routing lives in SKILL.md;
   mechanics live in versioned markdown so context stays selectable.
4. **One runtime** — HyperFrames seek contract only (no Remotion fork).
5. **Validateable graph** — `motion_recipes.py --validate` ensures recipe files
   exist, required fields present, and cited rule files resolve in-plugin.
6. **Taste still wins skin** — recipes must not smuggle a second brand;

## Layer comparison

| Layer | Question it answers | Failure mode if used alone |
| --- | --- | --- |
| product-launch-film | What is the film's directing grammar? | Direction without implementation |
| **motion-recipes** | **How do I code this beat in HF?** | Overuse = mechanism collage |
| effects-overlay | How do I edit a Registry item? | Empty when catalog misses |
| HF rules | What GSAP pattern is seek-safe? | Too many files without a picker |
| FRAME | What skin? | Motion without identity |

## Data model

### `references/index.jsonl` (one object per line)

Required keys: `id`, `title`, `tags`, `viewer_job`, `production_cost`,
`registry_required`, `recut_ok`, `rules`, `recipe_path`, `verify_times`.

Optional: `blueprint`, `registry_optional`, `shotcard_affinity`,
`example_path`, `inputs`.

### `references/recipes/<id>.md`

Sections Agents must honor:

- **When / Avoid**
- **Inputs** (schema; source of truth for numbers)
- **Compose** (rules, blueprint, registry_optional)
- **Steps** (ordered; include pre-set / fromTo / hold)
- **Forbid**
- **Verify** (times for snapshot; what to see)
- **Reference** (path to gold HTML if any)

## Package layout

```text
skills/vidmuse-motion/
├── SKILL.md
├── scripts/motion_recipes.py
├── references/
│   ├── architecture.md      ← this file
│   ├── agent-playbook.md
│   ├── verified-run.md
│   ├── index.jsonl
│   └── recipes/*.md
└── examples/
    └── dataviz-semantic/    ← gold compose (passed check/render)
```

## Extension process (authors)

1. Reproduce a look in a workdir with `npx hyperframes` until `check` passes.
2. Distill into a recipe md + index row (`registry_required: false`).
3. Point `example_path` or keep HTML under `examples/`.
4. `python3 scripts/motion_recipes.py --validate`.
5. Bump plugin version; note in CHANGELOG.

Do **not** add recipes that only restyle FRAME demos without new mechanism.
Do **not** duplicate a rule file — link it.

## Anti-patterns

| Anti-pattern | Why |
| --- | --- |
| “Search catalog forever” | Converts sparse Registry into product ceiling |
| Prompt-only skill, no index | Unreviewable; no validate |
| Recipe copies Remotion TSX | Wrong runtime |
| Recipe ships locked purple SaaS skin | Catalog-collage / unframed brand |
| 30 recipes opened per film | Mechanism zoo; use ≤3/scene |
| Invented `$9,946` when user gave no number | Evidence lie |

## Security / license notes

- Gold example data is **demo**; replace with project-safe numbers.
- Do not vendor third-party Remotion sources into recipes without license pass.
- Third-party cinematic priors do not belong in this recipe library;
  motion-recipes should cite HF rules first.
