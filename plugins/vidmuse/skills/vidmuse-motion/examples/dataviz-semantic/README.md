# Gold example — dataviz semantic trio

HyperFrames composition that **passed** `lint` + `check` and rendered to MP4
(2026-07-24, HF 0.7.69). Zero Registry installs. Zero Remotion.

## Recipes exercised

| id | element |
| --- | --- |
| `stat-card-trio` | `.stage` / `.card` entrance |
| `kpi-glow-count` | `#kpi` |
| `weekly-bar-rise` | `#bars` |
| `sparkline-draw` | `#spark-line` |

## Files

| file | note |
| --- | --- |
| `index.html` | drop into a hyperframes project root or copy patterns |
| `contact-sheet.jpg` | snapshot grid for quick visual QA |

## Replay

```bash
mkdir -p /tmp/replay && cp index.html /tmp/replay/
cd /tmp/replay && HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init . --example blank --non-interactive 2>/dev/null || true
# ensure index.html is this file, then:
npx hyperframes check .
npx hyperframes snapshot . --at 0.5,1.5,3.2,5.5,8.0 -o proof --describe false
```

Replace demo metrics with project-truth numbers and FRAME skin before shipping.
See `../../references/verified-run.md`.
