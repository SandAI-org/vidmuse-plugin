# Shotcraft job index

Use this page to turn an approved communicative job into a small search vocabulary. It is
not a substitute for `FRAME.md`, the cue chain, or the machine catalog.

## Query flow

```text
communicative job
  → relationship / intensity / spatial mode
  → bilingual job alias or exact tag
  → shortlist at most three
  → inspect one manifest and source
  → install, adapt, wire, check
```

Run `scripts/catalog.mjs search --query <job> --json --limit 3` for the live result.

## High-frequency jobs

| Job | Search phrase | Likely starting points |
| --- | --- | --- |
| Scan a new state into view | `扫描式转场` / `scan transition` | `shot-clock-wipe`, `shot-spotlight-sweep` |
| Mark a hard reversal or payoff | `hard state change` | `shot-flash-cut`, `shot-smash-cut`, `shot-drop-blackout-slam` |
| Open a new chapter | `章节转场` / `chapter transition` | `shot-black-title-card-transition`, `shot-line-carry-transition` |
| Preserve continuity through a seam | `soft cinematic transition` | `shot-light-leak-burn`, `shot-rack-focus-relay`, `shot-shared-element-morph` |
| Materialize a headline | `标题生成` / `title materialize` | `shot-letterspace-materialize`, `shot-gradient-word-sweep` |
| Type, correct, or enter language | `打字解释` / `typed explanation` | `shot-terminal-typewriter`, `shot-typewriter-error-retype` |
| Brand opening | `品牌开场` / `brand opening` | `shot-brand-ink-open`, `shot-crane-rise-reveal` |
| Brand close | `品牌收尾` / `brand outro` | `shot-logo-sting-button`, `shot-ui-strip-away-outro` |
| Push toward named evidence | `镜头推进` / `camera punch in` | `shot-crash-zoom`, `shot-slow-push-in` |
| Freeze and explain evidence | `定格标注` / `freeze annotate` | `shot-freeze-annotate`, `shot-reticle-lock-on` |
| Make a number land | `数字增长` / `data countup` | `shot-odometer-digit-roll`, `shot-counter-tick-sparks` |
| Compare before and after | `前后对比` / `data comparison` | `shot-before-after-slider-scrub`, `shot-axis-rescale-shock` |
| Show a live signal | `实时数据` / `live data` | `shot-oscilloscope-stream`, `shot-voice-waveform-live` |
| Bring in a UI panel | `UI 面板出现` / `ui panel entrance` | `shot-panel-to-canvas`, `shot-bento-light-up` |
| Explain a UI process | `界面流程解释` / `ui process` | `shot-ai-stream-response`, `shot-diagram-cascade` |
| Show a causal cursor action | `光标点击` / `cursor interaction` | `shot-cursor-performance`, `shot-hashtag-pill-materialize` |
| Deliver an impact | `冲击强调` / `impact emphasis` | `shot-impact-burst-kit`, `shot-score-slam` |
| Focus with light | `发光聚焦` / `glow focus` | `shot-spotlight-sweep`, `shot-sheen-sweep` |
| Accelerate rhythm into a result | `节奏加速` / `rhythmic acceleration` | `shot-beat-cut-accelerando`, `shot-trailer-bumper` |
| Punctuate a known beat | `节拍强调` / `beat punctuation` | `shot-beat-pump`, `shot-paparazzi-flash` |
| Rearrange cards causally | `卡片重排` / `cards rearrange` | `shot-card-flock`, `shot-flip-grid-reflow` |
| Connect causes and consequences | `关系连接` / `diagram connect` | `shot-flyline-arc`, `shot-diagram-cascade` |

## Exact tag membership

Tags overlap. These counts describe search membership, not mutually exclusive source
categories:

| Tag | Blocks |
| --- | ---: |
| `transition` | 28 |
| `typography` | 27 |
| `effects` | 23 |
| `rhythm` | 22 |
| `camera` | 21 |
| `ui-entrance` | 19 |
| `interaction` | 15 |
| `data` | 14 |
| `opening` | 10 |
| `outro` | 7 |

## Recut policy

The current policy contains 30 `recut:safe`, 31 `recut:adapt`, and 101 fail-closed
`create-only` blocks. Use `catalog.mjs search --recut safe`; do not memorize the set from
this page because `policies/recut.json` is the maintained source.
