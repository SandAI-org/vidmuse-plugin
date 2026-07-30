# Private VidMuse style packs

VidMuse-owned runtime copies of 12 reviewed frame systems. Their original
source is recorded for provenance, but this library is complete inside the
plugin and does not read `hyperframes-creative` at runtime.

Each directory is a private **frame pack**:

| file | role |
| --- | --- |
| `FRAME.md` | Design tokens + composition prose (preset source) |
| `caption-skin.html` | Caption look wired to the pack's tokens |
| `frame-showcase.html` | Human preview only — never mount in a composition |

Machine-readable catalog + workflow binding lives in
[`data/style-packs.jsonl`](../../data/style-packs.jsonl):

- `anchor_atoms` — maps the pack onto the compositional atom set
- `default_motion` — motion block to add when adopting (template packs stop at composition)
- `workflow_fit` — workflow-specific suitability without making Recut the data owner
- `effect_affinity` — Registry effects that preserve the look when adapting to talking-head footage

## Adopt into a project (preset mode)

```bash
# browse
python3 scripts/taste.py --index --domain packs
python3 scripts/taste.py pack:coral --get --domain packs

# lint the private template
python3 scripts/frame_md.py library/frame-packs/coral/FRAME.md --check

# then write videos/<project>/FRAME.md with:
#   schema: vidmuse.design.frame.v1
#   project: <project>
#   film_mode: recut-packaging | recut-director | create
#   create_path: promo | explainer | vox  # when film_mode=create
#   mode: preset
#   anchor: pack:coral
#   colors/typography/spacing/components from the pack
#   motion from the catalog default_motion (or overridden)
#   Frame Treatments cast onto this transcript + safe zones
```

Do not treat these packs as end-to-end video templates. They define **look**;
the agent still selects effects (guided by `effect_affinity`) and times them
from packaging analysis.
