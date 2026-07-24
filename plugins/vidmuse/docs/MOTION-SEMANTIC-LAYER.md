# Guidance — Semantic motion layer for Agents

**Audience:** humans maintaining the VidMuse Codex plugin, and Agents that
load `/vidmuse-motion`.

**Status:** v1 verified on HyperFrames 0.7.69 (2026-07-24) with a three-card
dataviz board (KPI + bars + sparkline), **no Registry, no Remotion**.

---

## 1. Why this exists

Competitor/Remotion ecosystems look “full of templates.” HyperFrames Registry
is thinner. If Agents only do `hyperframes add` / catalog search, they fail
closed and ship static images.

But HyperFrames **already** implements the missing looks via:

- composition contract (`hyperframes-core`)
- atomic GSAP rules + blueprints (`hyperframes-animation`)
- lint / check / snapshot / render (`hyperframes` CLI)

The missing piece was a **semantic picker + implementable steps** maintained
inside the plugin so any Agent can compose without a catalog hit.

---

## 2. Is this a new skill?

**Yes — dependency skill `/vidmuse-motion`.**

| Skill | Role |
| --- | --- |
| `/vidmuse-create` | Product: films with no speaking plate |
| `/vidmuse-recut` | Product: package speaking footage |
| **`/vidmuse-motion`** | **Shared implementer: intent → recipe → HF native** |

Not a third product router. Create/recut open it when a beat needs composed
motion the Registry does not stock.

Location:

```text
skills/vidmuse-motion/
├── SKILL.md                      # Agent entry + hard rules
├── scripts/motion_recipes.py     # --index / --tag / --get / --validate
├── references/
│   ├── architecture.md
│   ├── agent-playbook.md
│   ├── verified-run.md           # how the first proof was done
│   ├── index.jsonl
│   └── recipes/*.md
└── examples/dataviz-semantic/    # gold HTML + contact-sheet
```

---

## 3. Architecture (layers)

```text
Create / Recut film plan
        │  beat: viewer_job + real numbers
        ▼
vidmuse-motion index (thin)
        │  shortlist ≤3
        ▼
recipe markdown (steps, forbid, verify)
        │
        ├─ optional → Registry add + FRAME reskin
        │
        └─ default → native HTML + GSAP
                │
                ▼
        read HF rules cited by recipe
                │
                ▼
        lint → check → snapshot → (render)
```

**Authority:** numbers (truth) → FRAME (skin) → recipe steps → HF rules →
Registry optional.

Detail: `skills/vidmuse-motion/references/architecture.md`.

---

## 4. How the first verification was implemented

Full narrative: `skills/vidmuse-motion/references/verified-run.md`.

Summary:

1. Mapped the competitor stillboard to four recipe ids.
2. Bound each id to existing HF rules (`counting-dynamic-scale`,
   `stat-bars-and-fills`, `svg-path-draw`).
3. Wrote one 9s composition (no `hyperframes add`).
4. Fixed real gates:
   - lint `gsap_css_transform_conflict` → GSAP owns transform via `fromTo`
   - check contrast → lighten solid fills (glow alone failed AA)
5. Snapshot + render → green.

**Implication:** another Agent that follows the same recipes + playbook should
reproduce; success is mechanical (`check passed`), not “prompt vibe.”

---

## 5. Agent operating instructions (short)

Full checklist: `skills/vidmuse-motion/references/agent-playbook.md`.

```bash
python3 skills/vidmuse-motion/scripts/motion_recipes.py --index
python3 skills/vidmuse-motion/scripts/motion_recipes.py --tag dataviz
python3 skills/vidmuse-motion/scripts/motion_recipes.py kpi-glow-count --get
# read skills/hyperframes-animation/rules/<rule>.md
# write composition
npx hyperframes lint .
npx hyperframes check .
npx hyperframes snapshot . --at 1.5,3.2,5.5 -o proof --describe false
```

Caps: ≤3 recipes/scene; never invent metrics; never Remotion.

---

## 6. Relation to shot-cards

| | shot-cards | motion-recipes |
| --- | --- | --- |
| Origin | video-shotcraft priors | HF native implement unit |
| Host skill | create references | **vidmuse-motion** |
| When weak | great intent, weak HF steps | great steps, narrower look zoo |
| Bridge | `shotcard_affinity` on index rows | implement after shot shortlist |

Promo Agent path can be: shot-card *feeling* → motion-recipe *code path*.

---

## 7. Extending the library

1. Build until `hyperframes check` passes in a temp project.
2. Add `references/recipes/<id>.md` + `index.jsonl` line.
3. Prefer `registry_required: false`.
4. `python3 scripts/motion_recipes.py --validate`.
5. CHANGELOG + pack plugin.

---

## 8. Validation in CI / plugin package

```bash
npm run validate:skill   # includes motion_recipes.py --validate
```

Ensure plugin pack includes entire `skills/vidmuse-motion/`.
