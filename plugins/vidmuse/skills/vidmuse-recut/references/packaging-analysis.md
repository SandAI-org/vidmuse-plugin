# Packaging-point analysis

The packaging-point analysis is the editorial contract between understanding the video and designing it. It answers **which production mode fits, where intervention or full-scene direction helps, why it helps, what evidence it must express, and which motion grammar can express it**. It is user-facing and must be confirmed before style selection unless an autonomous skip is recorded.

## Required evidence passes

1. Read the full transcript, not keyword excerpts. Build semantic chapters and subtopics from actual time ranges.
2. Inspect at least one representative frame from every major chapter, plus frames for every visual demonstration or annotation candidate.
3. Audit existing subtitles, watermarks, baked graphics, split screens, comparison footage, subject position, product position, and persistent safe zones.
4. Mark every quantified claim, ordered list, explicit contrast, advantage/disadvantage, conclusion, recommendation, and memorable phrase.
5. Separate candidates that need visual explanation from moments that are already self-explanatory in the footage.
6. In Director mode, map acts, viewer-state changes, energy, source states,
   visual proofs, deliberate silence, and candidate full-frame takeovers.

## Editorial and aesthetic reasoning

Do not detect packaging points by matching transcript keywords to effect names. Interpret the film as a sequence of attention, information, evidence, tension, release, and visual energy.

For each serious candidate, consider:

- What would the viewer fail to notice, understand, remember, or feel without intervention?
- Is the source frame already doing the job more honestly or beautifully than an overlay would?
- Is this a structural beat, an explanatory beat, an emotional beat, or merely a sentence containing a keyword?
- What is the information load at this moment, and how much additional visual load can it tolerate?
- How does this beat contrast with the previous and next beats? Does it create rhythm, or flatten everything into constant emphasis?
- Does the proposed motion embody the meaning—cause, comparison, hierarchy, direction, accumulation, uncertainty—or merely animate around it?
- Is the effect's material, energy, depth, and timing compatible with the footage and the project's visual culture?
- Would a quieter solution be more confident? Would a more ambitious solution create a genuine signature moment?

Use these questions to form a point of view. Two competent analyses of the same video may legitimately choose different moments and mechanisms; the proposal should make its taste and reasoning legible to the user.

## Packaging families

Use the families below as a vocabulary for perception. They are not a checklist, schema, or quota, and a strong film may use only a subset.

| Family | Editorial job | Typical evidence | Plausible HyperFrames grammar |
| --- | --- | --- | --- |
| Hook / promise | establish tension and reason to watch | opening claim, question, conflict | kinetic type, texture-mask text, particle accent, morph text |
| Identity / context | identify speaker, products, test conditions | first appearance, product names, methodology | lower third, product lockup, compact metadata rail |
| Chapter / act break | reset orientation at a semantic boundary | “接下来”, numbered section, topic change | title card, rail draw, mask reveal, shader transition |
| Semantic transition | make a logic/state change legible | before/after, ideal/adverse, design/image quality | FLIP, wipe, morph, motion blur, shared-element move |
| Spoken captions | guarantee comprehension and pacing | external/no burned-in subtitles | phrase captions, per-word emphasis, blend-difference captions |
| Keyword / golden line | increase recall without replacing captions | concise judgment or memorable phrase | kinetic emphasis, particle burst, texture reveal |
| Comparison | make A/B criteria scannable | “相比”, two products, tradeoff | split panel, balance scale, two-column cards, shared axis |
| Specification / data | externalize numbers and units | percentages, storage, resolution, frame rate | counters, bars, ticks, charts, number morph |
| Ordered list / hierarchy | keep multi-point reasoning in working memory | “第一/第二/第三”, features/problems | progressive list, indexed rail, stacked cards |
| Causal explanation | expose why one condition leads to another | “因为/所以/带来/代价” | node-link diagram, path draw, equation-like chain |
| Source annotation | point to an exact observed feature | product close-up or on-screen evidence | SVG leader, target ring, tracked label, masked highlight |
| Demonstration / tracking | direct attention during a live test | moving control, autofocus miss, stabilization test | crop/PiP, motion path, freeze/zoom, tracking box |
| Spatial depth / cutout | integrate typography with the subject | clean subject separation and sufficient contrast | caption-parallax-layers, subject mask, DOM/Three.js depth |
| Conclusion / recommendation | compress decision logic | summary, buyer recommendation | decision tree, scorecard, scenario matrix, quote lockup |
| Source-camera treatment | add rhythm without covering meaning | long static talking-head holds | restrained crop/zoom, parallax, motion blur on motivated moves |
| Finish layer | unify the whole film | mixed footage/color/contrast | grain-overlay, vignette, color wash, subtle texture |

## Capability-expansion checklist

These mechanisms expand the available imagination when the footage and editorial job justify them. They are options, not required ingredients. Start from the editorial problem, then inspect the catalog for a fitting mechanism; do not reverse the order. Verify the installed source before promising implementation.

| Registry/capability | What it adds | Appropriate use | Avoid when |
| --- | --- | --- | --- |
| `motion-blur` | velocity-driven sampled blur/trails | motivated camera/layout move, rapid semantic transition | static copy or continuous talking head |
| `caption-particle-burst` | particle energy owned by a word | one or two hero words, opening tension, final emphasis | routine subtitles or every chapter |
| `caption-parallax-layers` | text passes in front of/behind a cutout subject | signature hero beat with reliable subject mask | busy footage, poor segmentation, dense captions |
| `texture-mask-text` / `caption-texture` | luminance/material reveals through glyphs | chapter title, product/material metaphor, hero quote | small body copy or low-contrast footage |
| `morph-text` | fluid SVG-threshold text transformation | A-to-B concept shift, tradeoff, old-to-new state | ordinary sentence replacement |
| `caption-blend-difference` | automatic contrast through blend mode | captions over changing comparison/test footage | brand colors must remain exact |
| `grain-overlay` / `vignette` | film-level finish and focus control | coherent global treatment with restrained opacity | already noisy extreme-low-light evidence |

Also review FLIP, SVG path/stroke draw, clip/mask reveals, word/character subdivision, deterministic particles, DOM/Three.js depth, shader transitions, charts, PiP, tracked annotations, camera transforms, and audio-reactive accents when audio evidence exists.

## Intensity and density

- **Continuous:** captions, safe-zone rules, source treatment, finish. The
  caption band is decided once here (default per
  [captions-and-golden-lines.md](captions-and-golden-lines.md)); name it, and
  list every beat whose graphics enter it with the reason the graphic — not
  the caption — could not move.
- **Light:** one fact, word, label, marker, or annotation.
- **Medium:** comparison, data, list, causal chain, PiP, multi-element explanation.
- **Hero:** hook, major act break, signature visual, decisive conclusion.

Explore freely before pruning, but do not optimize for candidate count. There is no expected density for a given duration. Derive density from narrative structure, visual variety, cognitive load, pacing, channel, and desired finish. Never use a hard interval such as “one effect every 20 seconds” — that is tell **T1** (metronome spacing), and a card per sentence is tell **T2**; run the pruned plan against the temporal tells in [packaging-tells.md](packaging-tells.md). Repeated quiet passages can be right; several interventions close together can also be right when they form one coherent explanatory sequence.

## Suggested Markdown structure

Adapt the structure to the video and the user's review needs. A concise grouped proposal can be better than a wide mechanical table; a complex evidence-heavy review may deserve the full structure.

```markdown
# 包装点分析

## 1. 内容与画面判断
- 时长 / 类型 / 核心问题
- 字幕状态 / 水印 / 安全区
- 画面类型与变化

## 2. 本片的审美取舍（Charter trades）
- 本片优先保护哪 2–3 个宪章维度、为什么（来自内容与素材，不是套话）
- 本片相应牺牲哪些维度（例：安静独白弃 6/7 保 8/9）
- 这组取舍如何决定 production mode 与密度

## 3. 包装目标与密度
- 连续系统
- 轻 / 中 / 重候选数量
- 节奏原则与明确不包装的场景

## 4. 章节地图
| 时间 | 章节 | 内容任务 | 画面证据 | 包装任务 |

## 5. 包装点清单
| # | 时间 | 类型/强度 | 字幕证据 | 画面证据 | 为什么包装 | 建议内容 | HyperFrames 语法 | 风险/约束 |

## 6. 全片系统层
- 字幕系统（字幕带位置 + 身份；偏离默认带需写理由）
- 转场系统
- source motion / framing
- finish layer

## 7. 效果语法预算
- chosen families and repetition limits
- signature mechanism
- catalog items to verify

## 8. 不包装与降级点
- moments already explained by source footage
- unsafe/occluded moments
- ideas rejected as decorative

## 9. 待确认
- keep / remove / add / reprioritize
```

## Candidate record guidance

Every recommended point needs an exact time range and a clear editorial reason. Include the following when it improves confidence or decision quality:

- exact start/end time;
- verbatim or faithful transcript evidence;
- visible-frame evidence, or an explicit statement that the decision is transcript-only;
- editorial reason in viewer terms;
- family and intensity;
- proposed on-screen copy or information structure;
- layout/safe-zone relation, including whether the point touches the caption
  band and how it yields;
- HyperFrames mechanism or shortlist, not a vague animation adjective;
- risk/constraint and confidence.

Do not add fields merely to make every row look equally complete. The analysis should read like a thoughtful editorial proposal, not exported database records.

Do not proceed to taste selection until the user confirms coverage, unless autonomous mode was explicitly requested.
