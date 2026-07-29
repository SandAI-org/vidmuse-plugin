# VidWrap MVP · 会话记录与交接

**日期**: 2026-07-27 · **分支**: `feat/vidwrap-mvp` · **提交**: `bdbd654`
**前置文档**: [`hyperframes-engine-analysis.md`](hyperframes-engine-analysis.md)（方案 A/B/C 全分析）

本文按时间顺序记录 VidWrap MVP 的实现过程、查证到的事实、以及由对话推进出的方向转变。

> ## 写给下一个会话
>
> **实验已经做完了(第二轮,2026-07-27)。要动手实现,直接看 [§9 实现交接](#9-实现交接下一个会话从这里开始)。**
>
> 一句话结论: **HyperFrames 可以完全出局,`vidmuse render` 和 `vidmuse serve` 预览都能保住。**
> 走 §4.6 的**方案 D** —— 同一份 alpha 帧出两个文件、配两份 DSL:
>
> | | 叠加层格式 | DSL 里怎么挂 |
> |---|---|---|
> | `serve` 预览 | VP9 alpha WebM | 子轨 `type:"hyperframes"`,但 `htmlSourceFilePath` 指向 `.webm` |
> | `render` 出片 | ProRes 4444 `.mov` | 子轨**普通视频项**（`videoFile[]`） |
>
> **最容易踩的坑**: 出片那份用 VP9 WebM 会被**静默吃掉 alpha**,变成不透明黑幕盖死画面 ——
> 不报错、几何和时序还全对,所以很难发现(§4.2)。
>
> 阅读次序: §9(要做什么) → §4(为什么这么做,已验证的事实) → §7(别高估编译器)。
> **§4 和 §7 是查证过的结论,直接引用,不要重做分析。**

---

## 0. 原始实验计划（已完成,保留为推理记录）

> **⚠️ 本节的实验已经做完 —— 结论在 §4.1–§4.6,别重做。**
> 保留原文是因为它记录了当时的推理和边界设定(比如「alpha 素材必须用 ffmpeg 直接造、
> 不能用 HF 产」这条纪律,正是它让结论可信)。

### 待验证的核心假设

**问题**: 能不能一边用 `vidmuse render`,一边不用 HyperFrames?

**已查证的约束**（`plugins/vidmuse/skills/vidmuse-recut/references/vidmuse-timeline.md`）:
DSL 里唯一的叠加机制是 `type: "hyperframes"` 指向一个 HTML —— 文档里没有 `type: "image"` 或
`type: "video"` 叠加项。所以 `vidmuse render` 必须内部调 HF 来栅格化那个 HTML。

**但**: 调研 §7 记录 vidmuse 二进制内嵌 JS 里有 `appendVisualLayers` / `appendVideoLayers` /
`appendAudioFilters` —— 说明底层 ffmpeg 合成图**有能力叠视频层**,只是 DSL 文档没暴露入口。

**如果子轨能吃一个普通视频项**,整条路就通了:

```
你的 HTML → 自研 capture → alpha MOV/WebM → DSL 普通视频叠加层 → vidmuse render
```

HF 完全出局,并且顺手省掉现状那次「VP9 alpha WebM 有损往返 + 全量编解码」。

### 实验步骤（估 30 分钟）

1. 取一段真实素材,按 `references/pipeline.md` 做 probe / 抽音 / 密关键帧重编码
2. **用 ffmpeg 直接合成一个 alpha 测试素材** —— 透明底 + 一个横向移动的色块,
   `-c:v libvpx-vp9 -pix_fmt yuva420p`（VP9 alpha,和 HF 现在的输出格式一致）。
   **不要用 HF render 产这个素材** —— 那会把「HF 能不能出片」这个无关变量混进来。
   合成素材还有个好处: 色块位置随时间线性变化,一眼就能看出合成后 alpha 和时序对不对
3. **手写一份 `dsl.json`**,在 `type:"sub"` 轨上放一个**普通视频项**而不是 `hyperframes` 项。
   已知的 main 轨项形状（调研 §2.1）是:
   ```json
   { "type": "main", "startTime": 0, "duration": 60, "videoClipStartTime": 0,
     "muted": true, "videoFile": [{ "filePath": "public/input-video.mp4", "active": true }] }
   ```
   在 sub 轨上试同样形状（以及可能的 `type` 变体）指向那个 alpha WebM
4. `vidmuse serve dsl.json` 看它是否合成;再 `vidmuse render` 看出片是否保留 alpha
5. 若 DSL 不接受,查 `vidmuse` 二进制内嵌 JS 里 `appendVideoLayers` 的实际调用条件

**这一个实验决定后面全部架构选择。** 结果无论正负,都要写回本文 §4。

### 与实验无关、可以并行做的事

**运动匹配**（见 §6.2）不依赖实验结果 —— 用不用 HF 都要做,而且这是被识别出的核心差异化。

---

## 1. 时间顺序记录

### 1.1 起点（用户指令）

> 读 `docs/research/hyperframes-engine-analysis.md` 的 §8 和 §7,然后开始实现 VidWrap MVP:
> DSL schema v0 + 编译器

### 1.2 实现前的调研

读了 §8（MVP 交接说明）、§7（代码坐标）,以及为了准确性追加的 §1（HF 原理）、§4（资产可继承性）、
§5/§6（三条路与建议次序）。然后按 §8 的三条「注意事项」逐条落实:

| §8 的要求 | 读了什么 | 结论 |
|---|---|---|
| 保留 GSAP 作为执行层 | §4.6 类 3 | 不自造插值器 |
| `move` 词汇表从既有 recipe 名提炼 | `hyperframes-animation/rules-index.md`（40+ rules）、`vidmuse-motion/references/index.jsonl`（9 semantic recipes） | 15 个 move 全部有出处 |
| 吸收 0.3.9 的 beat 模型而非重造 | `vidmuse-create/scripts/film_plan.py`、`shot_scaffold.py`、`check_motion.py` | enum / 容差 / terminal-hold 原样搬 |

追加读了这些以保证生成的 HTML 是对的:

- `hyperframes-core/references/determinism-rules.md` — 属性白名单、时间轴契约
- `hyperframes-core/references/data-attributes.md` — **`class="clip"` 是必需的**（见 §3.2）
- `hyperframes-animation/rules/viewport-change.md` + `coordinate-target-zoom.md` — **两个不同的相机公式**（见 §3.3）
- `hyperframes-animation/rules/spring-pop-entrance.md`、`waterfall-entry.md` 等 — 具体 GSAP 形状
- `plugins/vidmuse/SKILLS.md` — 路由法,决定了放置位置（见 §5.1）

### 1.3 实现

进过一次 plan mode（想让 schema 设计先过审,因为 §8 说 MVP 的核心问题就是表达力边界),
随即退出并直接实现。产出 16 个文件、~2,700 行 + 76 个测试,详见 §2。

### 1.4 自查中发现并修掉的 6 个问题

全部是我自己代码里的,不是外部问题:

| 问题 | 症状 | 修法 |
|---|---|---|
| ease 只校验族名 | `power3.oot` 通过校验,GSAP 静默回落默认 ease | 改成全形式正则,后缀也校验 |
| CSS lint 锚在行首 | `.a { animation: spin 2s infinite; }` 单行写法漏检 | 锚在 `{` / `;` 边界 |
| `repeat` + 子孙 `id` | N 份拷贝 → N 个重复 DOM id | schema 报错并说明改法 |
| group id 用前缀匹配 | `#bar` 会误伤同级的 `bar-label` | 改存精确 id 列表 |
| stagger 检查在 pass 4 | 死选择器会把它挡住,一次跑报不全 | 移到 pass 2 |
| hero coverage 查不到 | 作者 id 按 beat 加前缀,`#mark` 不是 markup 的字面子串 | 生成 `data-hero="<name>"` 标记 |

### 1.5 验证

- 76 个测试全过
- 示例片子编译通过、过自己的契约 lint
- **`check_motion.py --skip-render` 17/17 GATE PASS**（零改动跑在编译产物上）
- 同输入两次编译产物**逐字节一致**（编译器必须确定性,否则不可 diff / 不可缓存）

### 1.6 提交

`bdbd654 feat(vidwrap): DSL v0 schema + compiler to HyperFrames-compatible HTML`
16 files, +4,269。另给根 `.gitignore` 加了 `__pycache__/` / `*.pyc`（本仓库第一个可 import 的 Python 包）。
**未 push。**

### 1.7 对话推进出的四次方向修正

这一段是本文最重要的部分 —— 实现是对的,但目标比 §8 写的更大。

**修正 1 — 「怎么在 Codex 里用」**
查出 `vidwrap/` 在插件边界之外（§3.1）,Codex 看不到。给了三个放置选项,用户没选,转而问架构。

**修正 2 — 「引擎如何被消费」**
读 `recut/references/pipeline.md` + `vidmuse-timeline.md` + `write_dsl.py`,画清了消费链（§3.4）。
同时发现 recut 的合成契约把源视频放进合成里并用 GSAP 变换它 —— **VidWrap v0 做不到**（无 `video` 节点）。

**修正 3 — 用户明确目标是脱离 HyperFrames**
我此前的回答一直站在 §8 的分期立场（C 先做、B 推迟),被指出没围绕目标。
量化了耦合面:208 行产物里 HF 专属只有 6 处,全在外壳（§3.5）。

**修正 4 — 渲染不是问题,包装效果才是**
> 渲染交给 vidmuse cli render 就可以了,我们只要实现能在用户的视频上包装的好看
> 比如动效,遮罩,字幕,转场,卡片,气泡,弹窗,金句...

这次修正最关键。据此读了 `recut/references/layout-vocabulary.md` 和
`captions-and-golden-lines.md`,发现**仓库里已经有一套完整的「包装词汇」规范,而 v0 只实现了「动效词汇」**（§3.6）。

**最终目标（用户原话）**
> 用 Agent 使用代码实现包装视频,能够准确的配合视频,比如时机,效果,流畅度等

---

## 2. 已建成的东西

`vidwrap/`（仓库根目录,**不是** skill）· Python 3 标准库 · 无安装步骤

```
vidwrap/
  SPEC.md                     DSL v0 完整 schema —— 先读这个
  README.md                   定位、为什么、目录说明
  vwc.py                      CLI 入口
  compiler/
    schema.py    (449)  结构校验;原样搬 film_plan.py 的 beat 契约
    resolve.py   (347)  at 锚点 + cue 短语 → 绝对时间;覆盖率/归属检查
    moves.py     (611)  15 个 move 的注册表与 GSAP codegen
    layout.py    (301)  stage 树 → HTML/CSS,选择器索引,clip 契约
    codegen.py   (502)  四个编译 pass + 文档组装
    props.py     (114)  动画属性白名单 + ease 语法
    lint.py      (143)  产物契约 lint（也能查手写合成）
    errors.py    (68)   诊断
    cli.py       (235)  validate / resolve / build / moves / lint
  examples/metric-hook.vw.json   3 beat 示例,覆盖大部分词汇表
  tests/test_compiler.py         76 个测试
```

### 命令

```bash
python3 vidwrap/vwc.py moves                       # 词汇表
python3 vidwrap/vwc.py moves --json                # 给 agent 读
python3 vidwrap/vwc.py validate film.vw.json
python3 vidwrap/vwc.py build    film.vw.json -o public/index.html \
        --transcript transcript.json --emit-plan film-plan.resolved.json
python3 vidwrap/vwc.py lint     public/index.html
python3 vidwrap/tests/test_compiler.py
```

### 四个编译 pass（顺序有硬依赖）

```
1 markup      stage 树 → HTML + CSS + 选择器索引
2 selectors   选择器 → 具体元素 id（这里发现「打错了」）
3 ownership   属性归属分析 → 设置 reowns
4 emit        生成 tween（需要 pass 3 的结果决定 immediateRender）
```

### 15 个 move

| move | kind | 出处 |
|---|---|---|
| `hold` | hold | — |
| `fade-in` | reveal | — |
| `rise-in` / `pop-in` | reveal | `spring-pop-entrance` |
| `waterfall-in` | reveal | `waterfall-entry` |
| `count-up` | reveal | `counting-dynamic-scale` / `kpi-glow-count` |
| `bar-grow` | reveal | `stat-bars-and-fills` / `weekly-bar-rise` |
| `draw-path` | reveal | `svg-path-draw` / `sparkline-draw` |
| `pullback` | camera | `multi-phase-camera` / `pullback-reveal` |
| `push-in` | camera | `viewport-change` |
| `nudge` | move | `nudge-curve` |
| `rack-focus` | move | `depth-of-field-blur` |
| `swap` | morph | `scale-swap-transition` |
| `exit-out` | exit | — |
| `tween` | 多 | `adapters/gsap.md`（声明式逃生口） |

加 9 种 `transition_in`: `cut` / `crossfade` / `blur-crossfade` / `zoom-through` / `squeeze` /
`push-slide LEFT|RIGHT|UP|DOWN`。

### 只有编译器能做的检查

- **stagger 预算** —— 需要知道选择器匹配了几个元素（超 0.5s 警告,超 1.0s 失败）
- **属性并发归属** —— 按元素 id 解析,所以 `.line` 和 `#line` 指同一元素时照样撞
- **死选择器** —— 手写 GSAP 里是静默失效的 tween,这里是编译错误
- **ease 后缀拼错** —— GSAP 会静默回落
- **hero coverage** —— `check_motion.py` S4 闸门搬到编译期

---

## 3. 查证过的事实（带坐标,可复核）

### 3.1 `vidwrap/` 在插件边界之外

```
.agents/plugins/marketplace.json          → source.path = "./plugins/vidmuse"
plugins/vidmuse/.codex-plugin/plugin.json → "skills": "./skills/"
```

Codex 只加载 `plugins/vidmuse/skills/`。`vidwrap/` 在仓库根,**装了插件的用户看不到它**。
另外 README 提到的 `scripts/package-codex-plugin.mjs` / `npm run package:codex-plugin`
在本仓库不存在 —— `822aaee chore: drop dev-only docs and packaging files from published plugin`
故意删掉了。

### 3.2 `class="clip"` 是必需的,不是装饰

`hyperframes-core/references/data-attributes.md:23`:

> Timed child elements are clips. **`class="clip"` is required on visible timed elements** —
> without it the runtime keeps the element visible for the whole composition, ignoring
> `data-start` / `data-duration`.

**`shot_scaffold.py` 生成的 `<section class="beat" data-start …>` 没有 `class="clip"`** ——
所有 beat 会同时可见、叠在一起。VidWrap 生成 `class="clip vw-beat"`,并在 clip 内部套两层
wrapper（`.vw-frame` 给转场 / `.vw-world` 给相机),因为 `full-screen-motion.md:57` 禁止在
`.clip` 上动可见性,且相机整体改写 `style.transform` 会覆盖同元素上的 GSAP transform。

### 3.3 两个相机公式不可混用

| 结构 | 公式 | 出处 |
|---|---|---|
| 单 wrapper（`translate(x,y) scale(S)` 同元素） | `T = −offset × S` | `viewport-change.md:19` |
| 嵌套 wrapper（外层 scale,内层 translate） | `T = −offset` | `coordinate-target-zoom.md:22` |

`coordinate-target-zoom.md:31` 警告:「#1 way this pattern ships broken」是手算 offset 弄错符号。
**VidWrap 只生成单 wrapper 形式**,走一个 `cam` proxy + 一个 writer,scale 与 translate
结构上不可能脱钩;`camera.focus` 用**合成像素声明**而非测量 —— 精确且不依赖字体加载。

### 3.4 消费链

```
input.mp4
  ├─ ffprobe                    → metadata.json
  ├─ ffmpeg -vn → audio.mp3     → vidmuse align → transcript.json（词级）
  └─ ffmpeg -g 30 -keyint_min 30 → public/input-video.mp4（稀疏 GOP 会冻帧）

  agent + SKILL 判断包装点 → edit-plan.json
              ↓
    ★ public/index.html ★        ← VidWrap 产出的唯一文件
              ↓
    write_dsl.py --mode layered → dsl.json
        videoTracks[0] main = public/input-video.mp4
        videoTracks[1] sub  = { type:"hyperframes", htmlSourceFilePath:"public/index.html" }
        sounds[] / subtitles[]
              ↓
      vidmuse serve（预览） / vidmuse render（→ final.mp4）
```

HF 在链条里的角色（调研 §2.3）: 一台 `HTML → alpha WebM` 转码机。

### 3.5 耦合面 = 6 处,全在外壳

208 行产物里 HF 专属的部分:

| 位置 | 内容 |
|---|---|
| 根元素 1 行 | `data-composition-id` |
| 每个 beat section | `class="clip"` + `data-start` / `data-duration` / `data-track-index` |
| 脚本 2 行 | `window.__timelines[...] = tl` |

其余 ~200 行是标准 HTML + CSS + GSAP。这层外壳由 `codegen.py` 的 `_document()` 一个函数生成。

### 3.6 仓库有两套词汇表,v0 只实现了一套

| 词汇表 | 位置 | 管什么 | v0 |
|---|---|---|---|
| **动效词汇** | `hyperframes-animation/rules/` + `vidmuse-motion` | 东西**怎么动** | ✅ 已实现 |
| **包装词汇** | `vidmuse-recut/references/layout-vocabulary.md` 等 | 这是**什么介入**、相对视频在**哪**、允许**多少** | ❌ 完全没有 |

`layout-vocabulary.md` 里已规范好的东西:

**Zones**（解析成像素框,随画布比例变）
`fullscreen` / `whiteboard-area` / `lower-third` / `side-panel` / `video-overlay`

**合成布局**（视频 + 效果同框）
`split` / `stack` / `pip` / `overlay` / hide-video

**源视频可动的通道**（原文明确列出）
`x` · `y` · `scale` · `clipPath` · `borderRadius` · `opacity` —— 禁 `width`/`height`/`top`/`left`

**介入权重分类法**（用户列的七类效果正好落在这上面）

| weight | 是什么 | 用户说的 |
|---|---|---|
| `bare-text` | 直接压在画面上的字,无底 | 金句、字幕 |
| `emphasis` | 对已在屏上的字做处理 | 关键词高亮 |
| `line-mark` | 锚在画面上的细线图形 | 气泡、弹窗、下三分之一、跟踪框 |
| `camera` | 操作源画面本身 | 遮罩、聚光、推镜 |
| `diagram` | 随时间展开的绘制结构 | 图表 |
| `panel-card` | 不透明底的承载面 | 卡片 |
| `grammar` | 进出场/转场语言 | 动效、转场 |

**介入预算（编译期可查!）**
> `panel-card`: **至多 2** 个 per video（超 ~5 分钟按比例放宽）,累计时长 ≤ **20%**,**绝不连续两个**

轻量级（`bare-text`/`emphasis`/`line-mark`/`camera`/`diagram`）不设上限 —— 密度是编辑判断。

### 3.7 `clipPath` 不在我的白名单里（bug）

```
clipPath       unknown      ← layout-vocabulary.md 明确列为 compositor-safe
maskImage      unknown
```

原因: `props.py` 抄的是 `determinism-rules.md`,那份没提 `clipPath`;包装词汇那份提了。
**遮罩类效果全靠它,必须补。**

### 3.8 仓库里没有任何自动视频分析

grep `scenedetect` / `face` / `blackdetect` / `signalstats` / `silencedetect` / `ebur128` / `astats`
—— **零命中**。唯一的 grounding 是 `vidmuse align` 出的词级 `transcript.json`。

Agent 知道**说了什么**,不知道**画面里发生了什么**。所以它只能写 `"at": 12.4` —— 一个猜出来的秒数。

### 3.9 本机环境

| 能力 | 状态 |
|---|---|
| ffmpeg `scdet`（场景切） | ✅ |
| ffmpeg `silencedetect` / `ebur128` | ✅ |
| ffmpeg `signalstats` / `blackdetect` / `freezedetect` | ✅ |
| ffmpeg `mestimate`（运动矢量） | ✅ |
| ffmpeg `vidstabdetect` | ❌ 缺（需 `--enable-libvidstab`） |
| numpy / scipy / PIL | ✅ |
| cv2 (opencv) | ❌ 缺 |

**结论**: 全局运动估计走 numpy FFT 相位相关,不依赖 vidstab / opencv。
抽帧管线 `check_motion.py` 已有（160×90 灰度 PGM,可直接复用）。

### 3.10 Remotion vs HyperFrames

**同一个核心机制** —— 都放弃了「播放」:

| | 时间入口 | 原理 |
|---|---|---|
| Remotion | `useCurrentFrame()` | 帧 = frame 号的纯函数 |
| HyperFrames | `renderSeek(t)` | 帧 = 一次全新 seek,`floor(t*fps+1e-9)/fps` |

**视频进合成的方式不同**（重要）:

| | 做法 | 代价 |
|---|---|---|
| Remotion | `<OffthreadVideo>` —— **ffmpeg 抽准确帧** | 结构上解决 |
| HyperFrames | `<video class="clip">` —— **浏览器 video seek** | 稀疏 GOP 冻帧,故须 `-g 30` 重编码 |
| **VidMuse 分层模式** | **源视频不进浏览器** | **问题不存在**（已有的架构优势） |

**alpha 合成**:
- HF（VidMuse 用法）: HTML → **VP9 alpha WebM** → ffmpeg overlay。中间那层是一次有损往返 + 全量编解码
- Remotion: 典型是**内部合成**（视频是 React 里的层,直出成片 RGB）;**也支持** alpha 输出
  （ProRes 4444 / VP8-VP9 with alpha）给外部合成

**Grounding 上三家都是空场**:

| | 时间 grounding | 空间 grounding |
|---|---|---|
| Remotion | ⚠️ `@remotion/captions` + `getAudioData`/`visualizeAudio` | ❌ |
| HyperFrames | ❌ | ❌ |
| VidMuse 现状 | ✅ 词级对齐（强项） | ❌ |

**这就是可以独立、也应该独立的那一层。**

---

## 4. 验证结果（第二轮实测,2026-07-27）

假设 1 / 2 已验完,结论见 §4.1–§4.6;3 / 4 / 5 仍未验。

| # | 假设 | 怎么验 | 状态 |
|---|---|---|---|
| 1 | DSL 子轨能吃普通视频项（→ 可绕开 HF） | §0 的实验 | ✅ **render 成立 / ❌ serve 预览不成立** → §4.1 |
| 2 | `appendVideoLayers` 的实际调用条件 | 读 vidmuse 二进制内嵌 JS | ✅ 已查明 → §4.2 |
| 3 | numpy FFT 相位相关能否稳定估出摄像机运动 | 拿真素材试,和肉眼比对 | ⬜ 未验 |
| 4 | 子合成嵌套是否必须（调研 §9 待确认项 1） | recut `pipeline.md:55-56` 用了 `data-composition-src` | ⬜ 未验 |
| 5 | Linux alpha 抓帧方案（调研 §9 待确认项 2） | 只做 macOS? captureScreenshot? 分层? | ⬜ 未验 |

实验脚本与复跑步骤: [`experiments/dsl-video-subtrack/`](experiments/dsl-video-subtrack/)。
素材是 `飞书20260706-230017-first-2min.mp4` 前 10s（854×480 @ 60fps）,
alpha 测试素材由 ffmpeg 直接合成（透明底 + 横移色块 + 50% alpha 方块 + 进度条),**未经 HyperFrames**。
核验是定量的,不是肉眼: `verify.py` 先对着「自己用 ffmpeg overlay 合的地面真值」校准通过、
对着裸源片正确报 FAIL,然后才用来判 vidmuse 的出片。

### 4.1 结论: 一半成立 —— `render` 能,`serve` 预览不能

**`vidmuse render` 侧: 完全成立。** DSL **根本没有 item 类型闸门**。
`videoSegments()` 里唯一被排除的是 `isHyperframesItem(item)`;此外任何带 active `videoFile` 的项
都会变成一个 video segment,在 `type:"sub"` 轨上拿 `start = item.startTime`、
`layer = tracks.length - trackIndex`（>0,叠在 main 之上）。实测:

- `item.type` 取 `"video"` / `"sub"` / `"main"` 出片**完全一致** —— 这个字段渲染器根本不读。
  真正的闸门只有三条: 轨是 `type:"sub"`、`videoFile[].active`、且**不带**
  `type:"hyperframes"` / `htmlSourceFilePath` / `htmlSource`
- **HF 确实没被调用**: `HYPERFRAMES_BIN=/nonexistent/hf` 照样出片;同一个 flag 配一个
  `type:"hyperframes"` 项则硬报错 `HyperFrames executable not found`。这是对照,不是推断
- 10s @ 60fps 854×480 出片 **1.25–1.9s**（HF 那条路是逐帧开浏览器抓帧）

**但 `serve` 预览侧不成立。** 预览的合成器只挑**一个**底图:

```js
MJ(e,t) → 取 t 时刻活跃的 visualSegments
TJ(e,t) → n.find(i => i.kind==="video" || i.kind==="image") ?? n[0] ?? null   // 只要一个
RJ(e)   → 只有 kind==="hyperframes" 的 segment 才变成叠加层播放器
```

所以子轨上的普通视频项会**和 main 抢那唯一一个底图位**,而且赢了 ——
实测预览舞台变成「黑底 + 我的色块」,源画面整个消失。DOM 里 `timeline-preview-panel`
底下只有**一个** `<video>`,src 是 `alpha-test.webm`,没有 main 的 video 元素。
时间轴 UI 本身是好的（叠加层轨道有缩略图、时长 10s 正确）—— DSL 解析没问题,**是预览合成器不支持两层视频**。

### 4.2 alpha 保不保得住,只取决于编码格式 —— 因为 ffmpeg 调用里有一处不对称

`appendVideoLayers` 的调用条件查明了,但**真正决定成败的不是它,是喂输入时的解码器 flag**。
二进制内嵌 render JS 里相邻的两行:

```js
materializedVideoSegments.forEach(s => ffmpegArgs.push("-i", s.filePath));                    // 视频段: 无解码器 flag
overlays.forEach(o => ffmpegArgs.push("-c:v", "libvpx-vp9", "-i", o.filePath));               // HF 叠加层: 显式 libvpx-vp9
```

ffmpeg 的**原生** vp9/vp8 解码器**不吐 alpha**（alpha 在 WebM 的 BlockAdditional 里,
只有 libvpx 解得出来）。于是:

| 叠加层格式 | ffmpeg 原生解码带 alpha（render） | 浏览器带 alpha（serve 预览） |
|---|---|---|
| VP9 alpha WebM | ❌ | ✅ |
| VP8 alpha WebM | ❌ | ✅ |
| ProRes 4444 `.mov` | ✅ | ❌ 直接 load error（`canPlayType` 空） |
| QuickTime RLE `.mov` | ✅ | ❌ 同上 |

**两边的交集是空的。** 这是本次实验最反直觉的结果。

实测数据（t=5.0s,地面真值为「自己 ffmpeg overlay 合的那份」）:

| 出片 | 色块左沿 | 进度条宽 | 50% alpha 方块 | 近黑像素 |
|---|---|---|---|---|
| 地面真值 | 338（want 337） | 428 | `[118.5, 242.3, 93.6]` | 0.3% |
| **VP9 WebM 当普通视频项** | 337 ✅ | 428 ✅ | `[0.7, 251.8, 0.8]` ❌ 纯不透明 | **92.3%** ❌ |
| **ProRes 4444 当普通视频项** | 336 ✅ | 428 ✅ | `[118.2, 242.1, 93.1]` ✅ | 0.3% ✅ |

即 VP9 那份**几何与时序是像素级正确的**（说明 segment 真的被合进去了、时间轴对得上），
只是 alpha 被吃掉 → 变成一块不透明黑幕把 main 盖死。ProRes 那份和地面真值在
50% 混合值上差 <1/255。合成链本身是保 alpha 的（video 分支是
`format=rgba` + `pad=…:color=black@0` + `overlay=…:format=auto`）。

一个顺手的好消息: `videoFile` 是**候选列表**,渲染器和前端用的是同一条选择规则
（`active===true` 优先,否则第一个非 `active:false`)。所以两个文件可以并存在同一个项里,
翻一个布尔值切换 —— 实测 mov active → alpha 正确,webm active → alpha 丢失。

### 4.3 顺带查到的: `subtitles[]` 也要经过 HyperFrames

这一条 §0 的计划没算到。render 里字幕不是 ffmpeg 画的:

```js
if (hasSubtitles) await renderOverlay({...}, overlays.length, true);
// renderOverlay(…, includeSubtitles=true) → emptyComposition() + injectSubtitles() → npx hyperframes render
```

所以「绕开 HF」同时意味着**放弃 DSL 的 `subtitles[]`**（或者把字幕画进我们自己的 alpha 层）。
本次实验的 DSL 刻意不带 `subtitles[]`,就是为了隔离这个变量。

### 4.4 那次 VP9 有损往返值多少钱 —— 量出来了

拿一个刻意做难的样张（1px 竖笔画 + 硬边 + 渐变,也就是**字和细线图形的样子**）
编一遍再解回来,和原始 RGBA 帧比:

| | RGB PSNR | RGB 最大误差 | alpha 最大误差 | 体积（30 帧） |
|---|---|---|---|---|
| VP9 alpha WebM | **27.04 dB** | **125/255** | 1 | 9 KB |
| ProRes 4444 | **82.02 dB** | 2/255 | 1 | 2.2 MB |

alpha 本身两边都近乎精确（最大差 1），**损失全在 RGB 的边缘彩边上** ——
正好打在字和细线上。代价是体积约 245×（中间文件,可接受: 854×480/60fps/10s 的 mov 是 12 MB）。

所以 §0 里「顺手省掉那次有损往返」不只是成立,而且**收益比预期大**。

### 4.5 追加发现: 还有两条「挂着 hyperframes 的名、但不调用 HF」的口子

§4.1 那个「预览做不到」的结论**是错的,或者说不完整** —— 由对话追问逼出来的。
除了子轨普通视频项,还有两条路,各自绕开 HF:

**(a) 预览侧: `type:"hyperframes"` 项的 `htmlSourceFilePath` 指向一个 `.webm`。**
前端判 HTML 用的是纯后缀正则:

```js
function V6(e){ return !!(e && /\.html?(?:[?#].*)?$/i.test(e)) }
// 命中 → 当合成 HTML 处理;否则 → pr(sourcePath) 普通媒体播放器
```

所以路径不以 `.html` 结尾时,预览**直接把它当普通视频播成叠加层**。
实测: 舞台上出现 2 个 `<video>`(main + alpha webm),alpha 正确合成,
时间轴里那条轨标成 `HF / Packaging 1`。`serve` 自己不渲染,所以 HF 根本没机会被调用。

**(b) 出片侧: `harness.artifacts.overlayAlphaVideoPath`,命中 `preRendered` 分支。**

```js
if (segments.length > 0 || hyperframesSource(dsl, {}) || !fallback) return segments;
return [{ …, filePath: resolveInput(fallback, dslDirectory), preRendered: true, layer: 1, … }];
// main() 里:
if (segment.preRendered) overlays.push({...segment, filePath: await materialize(segment.filePath)});
else await renderOverlay(segment, index, false);        // ← 只有这支调 npx hyperframes
```

命中条件: **一个 hyperframes 项都不能有**、`harness.artifacts` 里不能有
`overlayAlphaPath` / `configJsonPath`、并且 `overlayAlphaVideoPath` 有值。
实测 `HYPERFRAMES_BIN=/nonexistent/hf` 照样出片,alpha 完全正确(近黑 0.3%、
50% 方块 `[118.1, 240.8, 92.9]` vs 地面真值 `[118.5, 242.3, 93.6]`)。
而且叠加层输入本来就带 `-c:v libvpx-vp9`,所以**这条路 VP9 alpha WebM 是可以的**。

**但 (a) 和 (b) 塞不进同一份 DSL。** 只要 DSL 里存在 hyperframes 项,
render 就走 `renderOverlay()` 把文件按 UTF-8 当 HTML 读 —— 实测直接报
`HyperFrames source is missing </body>.`,加上 `overlayAlphaVideoPath` 也救不回来
(因为 `segments.length > 0`,fallback 分支根本不进)。反过来只写 harness 字段,
前端没有 hyperframes segment,预览就没有叠加层(实测舞台只剩 main)。

还有一条约束: (b) 强制 `-c:v libvpx-vp9`,**只吃 VP9/VP8 WebM** ——
喂 ProRes 会 `Error submitting packet to decoder: Invalid data found`。
所以想保住 §4.4 的无损,出片必须走 §4.1 的子轨普通视频项 + ProRes。

### 4.6 净结论: HF 可以完全出局,预览也能保住 —— 代价是两份 DSL

四种组合,都不调用 HF:

| 方案 | 预览看得到叠加层 | 出片 alpha | 出片质量 | 叠加层格式 |
|---|---|---|---|---|
| A 子轨普通视频项（§4.1） | ❌ | ✅ | 无损 82 dB | ProRes 4444 |
| B `overlayAlphaVideoPath`（§4.5b） | ❌ | ✅ | VP9 有损 27 dB | VP9 WebM |
| C 预览走 4.5a + 出片走 4.5b（同一个文件） | ✅ | ✅ | VP9 有损 27 dB | VP9 WebM |
| **D 预览走 4.5a + 出片走 A** | ✅ | ✅ | **无损 82 dB** | webm + mov 两份 |

**推荐 D。** 两个文件从同一次 capture 的帧一趟出（ffmpeg 一个输入两个输出），成本可忽略;
两份 DSL 差异只在叠加层那一项，`write_dsl.py` 已经在生成 DSL 了，加一个 `--target serve|render` 即可。

所以 §0 那句「能不能一边用 `vidmuse render`、一边不用 HyperFrames」最终答案:
**能,而且 `serve` 预览也能保住。** 剩下的真实代价只有两条:

1. **两份 DSL**（预览用的和出片用的字段位置不同）。写回纪律要注意: 用户在 UI 里的编辑落在预览那份上
2. **DSL `subtitles[]` 用不了**（§4.3）—— 这条没有绕路,字幕必须自己画进 alpha 层

**风险提示**: `harness.artifacts.*` 明显是内部字段,`htmlSourceFilePath` 指向非 HTML
更是钻后缀判断的空子 —— 两条都比 §4.2 那处不对称更脆。验证版本 `v0.3.0-a78bedd`,
每次升级都该重跑 `experiments/dsl-video-subtrack/`。

---

## 5. 已做的决定与理由

### 5.1 `vidwrap/` 放在仓库根目录,不做成 skill

`plugins/vidmuse/SKILLS.md` 有一整节「Routing law」,记录 skill shadowing 造成了
0.3.11 / 0.3.12 两个版本在修的事故。一个还没验证过表达力的 MVP 不该碰路由面。

**待定**: 要真正在 Codex 里可用,必须挪进 `plugins/vidmuse/skills/`。三个选项（用户尚未选）:

| 选项 | 好处 | 代价 |
|---|---|---|
| 折进 `vidmuse-create/scripts/vidwrap/` | 零新增路由面;VidWrap 就是 `shot_scaffold.py` 的继任者,后者正住这里 | 埋在 create 里;recut 走 `../vidmuse-create/scripts/`（仓库已有跨技能引用惯例） |
| 新建依赖技能 `skills/vidwrap/` | create/recut 对称可用;有自己的 SKILL.md 教 DSL | 路由表多一项;描述必须写得不抢 recut/create 的匹配 |
| 先不动 | 与 MVP 定位一致（先证明,再固化） | Codex 里用不了 |

技能内调用路径形式不变: 现有技能已是 `python3 scripts/film_plan.py "$WORK_DIR"`,
`python3 scripts/vidwrap/vwc.py` 完全同构。

### 5.2 不留 JS 逃生口

`move: "tween"` 收声明式 from/to 字典,仍走属性白名单。放 JS 字符串进去等于把 DSL
本来要消灭的「脆弱命令式动画」原封不动请回来。

### 5.3 保留 GSAP

调研 §4.6 类 3。自造插值器会丢掉 easing / stagger / SplitText / MotionPath,以及本仓库
12,933 行动效知识。GSAP 不是痛点所在。

### 5.4 Python 3 标准库

仓库全部工具链都是标准库 Python CLI,没有任何 JS 工具链。

> **2026-07-28 补充**: 这条纪律的实质是**不加依赖**,不是「必须是 Python」。
> capture 一件已拍板用 Node(零 npm 依赖,只用原生 `WebSocket`/`fetch`),理由见 §9.7 问题 1。
> 另外把这里的说法说准: 编译器侧确实没有 JS 工具链,但**交付路径上一直有 Node** ——
> `vidmuse render` 今天就在 shell out `npx hyperframes@0.7.26`。

---

## 6. 下一步计划

### 6.1 前置: `video` 节点 + `zone` + `mask`（估 400–600 行）

没有这个,分析出来的事实没有东西可以消费。

- `video` 节点类型 + §3.6 那 6 个 compositor-safe 通道
- `zone` 解析（5 个 zone × 3 种画布比例;**横竖屏自适应靠它,手填坐标一换比例全废**）
- `clipPath` / `maskImage` 进白名单（修 §3.7）+ 一个 `mask-reveal` move
- 4 种合成布局（`split`/`stack`/`pip`/`overlay`）当预设

### 6.2 灵魂: 运动匹配（估 300–500 行）· 与 §0 实验无关,可并行

用户原话:「难的是代码效果如何配合视频运动,这才是灵魂所在」。拆成三种配合关系:

| 关系 | 意思 | 需要测什么 |
|---|---|---|
| **跟随** | 气泡跟着头、跟踪框跟着产品 | 主体 bbox 逐帧轨迹 |
| **同步** | 镜头往右推,卡片也往右滑,同一条曲线 | 全局运动曲线 |
| **对位** | 画面在动,标签锚死不动 → 贴在世界上 | 同一条曲线,取反 |

**实现路径**（环境已确认可行,见 §3.9）:

```
ffmpeg 抽 160×90 灰度帧（复用 check_motion.py 的管线）
  → 相邻帧 FFT 相位相关 → 每帧 (dx, dy)
  → log-polar 相位相关   → 每帧 scale
≈ 100 行 numpy
```

**关键设计**: 拿到 per-frame `(dx, dy, scale)` 之后,**不是让 agent 猜一条 ease,而是把实测曲线
直接烘成 tween** —— GSAP `CustomEase`,或干脆烘成关键帧序列。这是精确解,不是近似。

拟议 DSL:
```json
{ "move": "sync-camera",  "target": "#card",  "from": "shot:2", "gain": 1.0 }
{ "move": "anchor-world", "target": "#label", "at": [820, 460] }
{ "move": "follow",       "target": "#bubble", "track": "subject.head", "offset": [0, -120] }
```

**Remotion 和 HyperFrames 都没做这件事。**

### 6.3 时间 grounding + 锚点扩展（估 300–500 行）

只用 ffmpeg,无模型依赖。产出 `video-facts.json`:

```json
{
  "meta":       { "duration": 0, "fps": 0, "width": 0, "height": 0 },
  "words":      [],                       // 已有: vidmuse align
  "utterances": [],                       // 从 words 推
  "pauses":     [],                       // 词的补集 —— 免费,不需要音频分析
  "shots":      [],                       // ffmpeg scdet
  "motion":     [],                       // 帧差 / 相位相关
  "loudness":   [],                       // ebur128
  "luma":       []                        // 各 zone 明暗 → 字幕可读性
}
```

锚点从「秒数」升级成「引用事实」:

```json
"at": "cue:c1"     // 说到某个词        ← 已实现
"at": "pause:3"    // 第 3 个停顿 —— 卡片进场最佳时机
"at": "shot:2"     // 第 2 次镜头切换
"at": "beat:12"    // 音频重音
```

**Agent 写 `"at": "pause:3"` 而不是 `"at": 12.4` —— 前者永远对,后者一改剪辑就错。**

### 6.4 空间 grounding（估 400–600 行）

人脸/主体轨迹 + 安全框 + `avoid` / `anchor`。

```json
"zone": "lower-third"
"avoid": "subject"                // 编译期算安全框
"anchor": "subject.head+top"      // 气泡指向头顶
```

检测器: macOS Vision framework（离线免费）或 mediapipe。
**难点不是检测,是轨迹平滑** —— 人在动,气泡不能跟着抖。做法是时间上平滑 + 用保守静态安全框
而非逐帧跟随;`rules/ai-tracking-box.md` 已踩过这个坑。

### 6.5 介入预算检查（估 100 行,ROI 极高）

给每个 move 加 `weight` 字段,实现 §3.6 那三条:

```
FAIL [budget.panel-card] 3 个 panel-card 超出预算（上限 2）
FAIL [budget.adjacent]   b04 紧跟 b03,两个 panel-card 不能连续
FAIL [budget.coverage]   panel-card 累计 14.2s / 60s = 23.7%,超过 20%
```

**这比检查动效更有价值** —— 它管的是「包装过度」,最常见的审美失败,也最难靠提示词约束住。

---

## 7. 认知边界 —— 编译器解决不了的

写在这里以免后续高估它。

### 7.1 Agent 看视频的真实能力

- 看帧解决**空间**（脸在哪、屏幕在哪),VLM 擅长
- **不解决时间精度**: 每 0.5s 抽帧 = ±250ms,而词级转录是 ±30ms —— **更差**
- 连续帧能感知**帧间变化**,不能感知**运动曲线**;给不了起止时刻、速度曲线、亚帧精度
- **最危险的是**: 你问「摄像机什么时候开始推」,它会给一个数。那是**幻觉时间戳伪装成观察结果**。
  `film_plan.py` 已在防同类问题（cue 必须是转录里的逐字短语,永不猜时间戳）

**原则: 模型负责定性,ffmpeg 负责定量。** 模型说「这里镜头右摇」,ffmpeg 说
「第 372–418 帧,dx = −3.2 px/frame」。

### 7.2 GIF 没用

模型 API 基本把 GIF 拆成单帧或拒绝动画,它不会「播放」。

**管用的替代仓库里已有**: `vidmuse-create/scripts/collage_frames.py` 的 contact sheet ——
把 N 帧**带时间戳标注**拼成一张图,模型一次看到全部、可横向比较。比 GIF 严格更好,
比发 N 张独立图便宜。`check_motion.py` 的抽帧 + `collage_frames.py` 的拼图 = 这套东西的两半。

### 7.3 三件真难的事

1. **「什么时候该包装」是编辑判断,不是分析结果。** 分析能说「这里有停顿」「这里镜头切了」,
   永远不能说「这里该出金句」。分析的价值是**把候选点从 1800 帧收敛到 20 个**,
   让 agent 在 20 个里挑 5 个。这个判断永远归 SKILL。
2. **画面语义**（「他正指着屏幕右边」）需要 VLM 看关键帧。能做,但成本和可靠性要实测。
3. **「好不好看」编译期查不了。** 目前唯一手段还是渲染后采帧（`check_motion.py`),
   而它只能查「有没有动」,查不了「好不好」。没有捷径。

### 7.4 编译器化解不了的渲染问题（若日后自研 capture）

- **Linux alpha**: BeginFrame 不保留 alpha;在 BeginFrame 启动的浏览器上调 captureScreenshot
  会挂死整个 protocol。macOS-only 可绕,但是推迟不是解决
- **黑帧/空白帧检测**: 必须自己做,编译器看不见像素
- **进程泄漏 / OOM**: 长片跑几千帧,Chrome 会死

而**字体确定性和就绪门反而被编译器化解了** —— 因为编译器知道用了哪些字体、以及
stage 树里每一个字符串,精确字形子集可在编译期算出;而 v0 没有 canvas / video / 异步内容,
唯一需要的就绪门是 `document.fonts.ready`。HF 需要 936 行 + 10 个 poll,是因为它必须接受任意 HTML。

**HF 的难度来自它的通用性。放弃通用性,难度就塌掉了。**

---

## 8. 职责边界（Agent / SKILL / CLI）

| | 负责 | 为什么在这一层 |
|---|---|---|
| **SKILL**（markdown） | 品味判断: 用哪个 zone、什么调性、密度多少、金句该不该出 | 主观,不可编译 |
| **Agent** | 读 SKILL 做判断 → 写 `.vw.json` → 拿编译错误自我修正 | 判断 + 翻译 |
| **CLI**（`vwc`） | 词汇表查询、确定性生成、技术 + 预算双重把关 | 客观,可编译 |

关键是**反馈闭环给了 agent**: 写完 `vwc build`,秒级拿到「选择器打错」「panel-card 超预算」
「stagger 不成一拍」,自己改 —— 不用等渲染完采帧。

**编译器保证「不出技术错误 + 不超预算」,不保证好看。** 好看来自 `FRAME.md` 的设计 token、
zone 的选择、`packaging-tells.md` 的反面清单 —— 那些是 SKILL 和 agent 的活。VidWrap 的作用是
把「技术上错了」和「量上过了」变成编译错误,让 agent 的注意力全部留给判断。

---

## 9. 实现交接（下一个会话从这里开始）

§4 是**已验证的事实**,本节是**要动手的事**。所有 DSL 形状和 ffmpeg 参数都是本轮实测跑通的,
可以直接抄;标了「**设计草案**」的部分没验证过,需要边做边验。

### 9.1 目标管线（方案 D）

```
.vw.json
  │  vwc build                                    ← 已建成(bdbd654),不用改
  ▼
public/index.html                                  ← VidWrap 产出的唯一合成文件
  │  自研 capture  ★ 最大的未建成件,见 9.4
  ▼
alpha 帧序列（RGBA）
  ├─→ public/overlay.webm   VP9 yuva420p          → 给 serve 预览
  └─→ public/overlay.mov    ProRes 4444           → 给 render 出片
        │
        ├─ dsl.serve.json  ─→ vidmuse serve      预览: 源画面 + 叠加层都在,可 scrub
        └─ dsl.render.json ─→ vidmuse render     出片: final.mp4,alpha 无损
```

**HyperFrames 在这张图里没有位置。** 两个消费口都不调它(§4.5 已验证)。

### 9.2 两份 DSL 的确切形状（实测跑通,可直接抄）

差异**只在 `videoTracks[1].items[0]` 一项**,其余(main 轨 / sounds / options / sourceVideo)完全相同。

**`dsl.serve.json`** —— 子轨用 hyperframes 项,但 `htmlSourceFilePath` 指向 `.webm`:

```json
{
  "id": "alpha-overlay",
  "type": "hyperframes",
  "startTime": 0.0,
  "duration": 10.0,
  "htmlSourceFilePath": "public/overlay.webm",
  "params": { "enabled": true, "sourceStartTime": 0.0 }
}
```

前端 `V6()` 判 HTML 只看后缀(`/\.html?(?:[?#].*)?$/i`),不命中就用普通媒体播放器 →
播成带 alpha 的叠加层。实测舞台上 2 个 `<video>`、alpha 正确、轨道标签 `HF / Packaging 1`。
**`params.enabled` 不能设 false** —— 前端会 `.filter(i => i.item.params?.enabled !== !1)` 把它过滤掉。

**`dsl.render.json`** —— 子轨用普通视频项,指向 `.mov`:

```json
{
  "id": "alpha-overlay",
  "type": "video",
  "startTime": 0.0,
  "duration": 10.0,
  "videoClipStartTime": 0.0,
  "muted": true,
  "hasAudio": false,
  "videoFile": [{ "filePath": "public/overlay.mov", "active": true }]
}
```

`item.type` 渲染器不读,写 `"video"` 只为可读性(§4.1 实测 `video`/`sub`/`main` 出片一致)。
`hasAudio: false` 建议显式写 —— 否则渲染器会去 ffprobe 探,探不到就抛
`Cannot determine whether video has audio`。

**三条硬约束,违反了不报错而是静默出错:**

| 约束 | 违反后果 |
|---|---|
| render 那份的叠加层**必须 ProRes 4444 / QT RLE**,不能 VP9 WebM | alpha 被静默吃掉 → 不透明黑幕盖死画面（§4.2） |
| serve 那份的叠加层**必须 VP9/VP8 WebM**,不能 ProRes | 浏览器直接 load error,叠加层不显示（§4.2 矩阵） |
| render 那份里**不能出现任何 hyperframes 项** | 走 `renderOverlay()` 把文件当 HTML 读 → `HyperFrames source is missing </body>.` |

### 9.3 两个文件的确切编码参数（实测）

从同一份 RGBA 帧一趟出两个输出,别编两遍:

```bash
# 帧从 stdin 进(rawvideo rgba),一个输入两个输出
ffmpeg -y -f rawvideo -pix_fmt rgba -s ${W}x${H} -r ${FPS} -i - \
  -map 0:v -c:v libvpx-vp9  -pix_fmt yuva420p    -auto-alt-ref 0 -b:v 0 -crf 20 public/overlay.webm \
  -map 0:v -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -alpha_bits 8    public/overlay.mov
```

- `-auto-alt-ref 0` 对 VP9 alpha 是必需的
- **验 alpha 别用 `ffprobe` 看 `pix_fmt`** —— VP9 的 alpha 在 WebM 的 BlockAdditional 里,
  `pix_fmt` 照样报 `yuv420p`,容器上只有 `TAG:alpha_mode=1`。要
  `ffmpeg -c:v libvpx-vp9 -i x.webm -vf alphaextract` 才验得出来
- ProRes 体积约 VP9 的 245×,是中间文件,可接受(854×480/60fps/10s = 12 MB)

### 9.4 自研 capture —— 最大的未建成件（**设计草案**）

**现状**: 这一步今天是 HF 干的(HTML → VP9 alpha WebM)。要让 HF 出局必须自己做。
**已知的坑不要重新分析** —— §7.4 列过了(Linux alpha、黑帧检测、进程泄漏/OOM),
以及 §7.4 最后那句关键判断: **HF 需要 936 行就绪门是因为它必须接受任意 HTML;
我们的 HTML 是自己编译出来的,唯一需要的就绪门是 `document.fonts.ready`。**

草案(本轮顺带验证到的可行性):

- Chrome 已在本机: `~/.cache/puppeteer/chrome/mac_arm-150.0.7871.24/…/Google Chrome for Testing`
- **CDP 不需要 puppeteer**: node 26 有原生 `WebSocket`,`fetch http://127.0.0.1:PORT/json/version`
  拿 `webSocketDebuggerUrl` 就能驱动。本轮的 `experiments/dsl-video-subtrack/browser-alpha-test.mjs`
  就是这么写的,可以当骨架抄
- 透明底: `Emulation.setDefaultBackgroundColorOverride({color:{r:0,g:0,b:0,a:0}})`
- 逐帧: `Runtime.evaluate` 驱动 seek(产物里是 `window.__timelines[…]`,§3.5)→
  `Page.captureScreenshot({format:"png"})` → 管进 9.3 那条 ffmpeg
- **已定(2026-07-28)**: **用 Node**,零 npm 依赖。完整理由和四条实现约束见 §9.7 问题 1。

### 9.5 建议的实现次序 —— 先把风险和收益解耦

**别一上来就写 capture。** 它是唯一的高风险件,而消费侧(9.2/9.3)是已验证的低风险件。

| 步 | 做什么 | 风险 | HF 是否还在 |
|---|---|---|---|
| **1** | `write_dsl.py` 加 `--target serve\|render`,按 9.2 出两份 DSL;再加一步「拿现有 alpha webm 转一份 ProRes」 | 低,机制已验证 | **还在**(仍由 HF 产 webm) |
| **2** | 用真实 VidWrap 合成(不是本轮的色块)把方案 D 端到端跑通,确认真实包装内容下预览和出片都对 | 低 | 还在 |
| **3** | 自研 capture(9.4),两个文件直接从帧出 | **高** | **出局** |
| **4** | 字幕画进 alpha 层(§4.3: DSL `subtitles[]` 没有绕路) | 中 | 出局 |

步 1–2 就能拿到「出片 alpha 无损 + 预览有叠加层」的**一半收益**,而且不碰任何高风险面;
真正的赌注只在步 3。步 1 里那次 webm→ProRes 转换**救不回 HF 已经损失的画质**
(有损不可逆),它的价值只是提前验证消费侧拓扑。

### 9.6 验收怎么做 —— 直接用本轮的工具

`experiments/dsl-video-subtrack/verify.py` 是定量核验器,不要靠肉眼:

```bash
python3 verify.py <出片>.mp4 <源>.mp4      # 量色块位置/进度条宽度/50%混合值/近黑占比
```

用法纪律(本轮就是这么建立可信度的): **先让它对着「自己 ffmpeg overlay 合的地面真值」PASS、
对着裸源片 FAIL,再拿去判 vidmuse 的出片。** 否则你不知道是它错还是被测对象错。

真实包装内容上色块检测不适用,那时的判据换成: 近黑像素占比(alpha 有没有丢) +
和自己 ffmpeg overlay 合的地面真值做 PSNR 比对。

### 9.7 未决问题（需要拍板,别默认）

> 编号保持不变(正文多处按号引用)。已拍板的条目原地标 ✅,保留理由而不是删掉。

1. ✅ **已定(2026-07-28): capture 用 Node,零 npm 依赖。**

   **本机核实**: `node v26.0.0`,原生 `WebSocket` 和 `fetch` 都在 → 不装 puppeteer、
   不装 `chrome-remote-interface` 就能驱 CDP。`python3` 是 **3.9.6**,stdlib 里**没有**
   WebSocket 客户端,`websocket` 模块也没装。

   **四条理由**:

   1. §5.4 的实质是「不加依赖」而非「必须 Python」。走 Node 满足那条纪律;走 Python
      反而违反它 —— 因为得自己实现协议。
   2. **Node 已经是交付路径的硬依赖**,不是新引入的。`vidmuse render` 今天就在 shell out
      `npx hyperframes@0.7.26`,那个 headless Chrome 本身也来自 puppeteer 缓存。HF 出局
      是干掉一个 **npm 包**,不是干掉 Node 运行时 → 边际依赖成本 **0**。
   3. **capture 在进程边界上,不在库边界上。** `vwc.py` 不 import 它,只
      `subprocess.run([...])` 然后收 RGBA 帧。跨运行时的代价只在「它是个库」时才疼
      (ffmpeg 是 C 写的,没人觉得那是不一致)。这也是这个决定**可逆**的原因 ——
      日后后悔,重写一个叶子子进程的影响范围只有它自己。
   4. **Python 路线的代价比 9.4 草案里那句「可行但难看」更难看**: 握手要自己拼
      (SHA1 + magic GUID + base64);client→server 每帧必须掩码;而真正的坑是
      `Page.captureScreenshot` 返回 base64 PNG,**一帧几百 KB,每个响应都越过 64 KB
      边界并分片到达**,所以必须自己做扩展长度字段 + 续帧重组 —— 这段代码在**每一帧的
      热路径上**,写错的表现是「帧内容坏了」而不是抛异常,属于最难查的那类 bug。
      而且要在 3.9.6 这个老解释器上写。

   **已关掉的第三条路**: 用 `chrome --headless --screenshot` 逐帧调 CLI 绕开 WebSocket ——
   10 秒 / 60fps = 600 次 Chrome 启动,不成立。

   **承认的代价**: vidwrap 变成双运行时。现有 76 个测试是 pytest 形状的,capture 要自己一套;
   读 `vidwrap/` 的人要懂两种语言。代价有界,因为它在进程边界上。

   **连带定下的四条实现约束**:

   | # | 约束 | 为什么 |
   |---|---|---|
   | 1 | 零 npm 依赖 —— 只用原生 `WebSocket`/`fetch`,不引 puppeteer | 这是选 Node 的前提,破了这条这个决定就不成立 |
   | 2 | 一个文件 `vidwrap/capture/capture.mjs`,JSON 参数进、RGBA 帧从 stdout 出;Python 侧只认这个契约 | 把它钉在进程边界上,保住理由 3 的可逆性 |
   | 3 | 测试用 Node 内置 `node:test` | 保持零依赖 |
   | 4 | Chrome 路径**从参数传入**,不隐式依赖 puppeteer 缓存目录 | 那是别人的缓存,随时会被清 |

2. **两份 DSL 的写回纪律** —— 用户在 Timeline UI 里改的是 `dsl.serve.json`,
   `dsl.render.json` 是导出时生成的派生物还是也要双向合并?（`vidmuse-timeline.md` 的
   write-back discipline 是围绕单一 dsl.json 写的）
3. **`vidwrap/` 还在插件边界外**（§3.1 / §5.1 三个选项,用户仍未选）—— Codex 里用不了
4. **依赖的是未文档化行为**（§4.6 风险提示）: `harness.artifacts.*` 是内部字段、
   `htmlSourceFilePath` 指非 HTML 是钻后缀判断的空子。验证版本 `v0.3.0-a78bedd`,
   **每次升级 vidmuse 都要重跑 `experiments/dsl-video-subtrack/`**
