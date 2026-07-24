# Official HyperFrames style packs

Vendored copies of the 12 premade frames from
[hyperframes.dev/design](https://www.hyperframes.dev/design).

Each directory is an upstream **frame pack**:

| file | role |
| --- | --- |
| `FRAME.md` | Design tokens + composition prose (preset source) |
| `caption-skin.html` | Caption look wired to the pack's tokens |
| `frame-showcase.html` | Human preview only — never mount in a composition |

Machine-readable catalog + recut binding lives in
[`data/style-packs.jsonl`](../../data/style-packs.jsonl):

- `anchor_atoms` — maps the pack onto the compositional atom set
- `default_motion` — motion block to add when adopting (upstream packs stop at composition)
- `effect_affinity` — Registry effects that preserve the look when adapting to talking-head footage

## Adopt into a project (preset mode)

```bash
# browse
python3 scripts/taste.py --index --domain packs
python3 scripts/taste.py pack:coral --get --domain packs

# lint the upstream source
python3 scripts/frame_md.py library/frame-packs/coral/FRAME.md --check

# then write videos/<project>/FRAME.md with:
#   schema/project/mode: preset
#   anchor: pack:coral
#   colors/typography/spacing/components from the pack
#   motion from the catalog default_motion (or overridden)
#   Frame Treatments cast onto this transcript + safe zones
```

Do not treat these packs as end-to-end video templates. They define **look**;
the agent still selects effects (guided by `effect_affinity`) and times them
from packaging analysis.
