# VidMuse Recut

HyperFrames 生态原生的视频再导演 workflow skill。把现有口播/访谈/播客/产品解说重构为人物、全屏动效、解释动画、素材蒙太奇和声音共同构成的 motion film，`hyperframes render` 直出 MP4。

两种生产模式，**默认导演模式**：

- **Director mode（默认）**：面向官方样片、发布片、宣传片和效果优先任务；允许重构图、全屏接管、Act Worlds、镜头/声音设计及多轮渲染复盘。
- **Packaging mode**：用户要求克制处理时使用——源画面主导，字幕、标注、图表、lower-third、PiP 和少量 hero takeover。

## 安装

把本目录复制到你的 skill 目录（全局 `~/.claude/skills/`，或项目内 `.claude/skills/`）：

```bash
cp -R vidmuse-recut ~/.claude/skills/
```

## 环境要求

- Node.js 22+
- ffmpeg / ffprobe
- Python 3
- macOS Apple Silicon（随包分发的 vidmuse CLI 为 darwin-arm64 构建）
- VidMuse 账号 —— vidmuse CLI 由 `setup.sh` 自动安装，负责字幕对齐、模型调用、时间轴预览与交付，需要 `vidmuse login`

## 首次使用

```bash
bash ~/.claude/skills/vidmuse-recut/scripts/setup.sh
```

`scripts/setup.sh` 健康检查分成两层：

| 必须在**用户全局 PATH** | 只认 **plugin 包内** `skills/` |
| --- | --- |
| Node 22+、ffmpeg/ffprobe、Python3 | `vidmuse-recut` + 兄弟 HF/GSAP skills |
| `vidmuse` CLI（serve/render/model）+ `vidmuse login` | setup **不会**去查 `~/.codex/skills` |
| `npx hyperframes` 渲染运行时 | 缺 skill → **失败并提示重装 plugin**，不裸装全局 skill |

随包 `assets/vendor/vidmuse-cli` 在全局没有 `vidmuse` 时拷进 `/usr/local/bin` 或 `~/.local/bin`。  
不要安装或调用官方 `talking-head-recut`。

环境就绪后，对 Claude 说"帮我包装这个视频 xxx.mp4"并附上视频的口播文本（字幕/文案）即可触发。本 skill 不做本地语音识别：口播文本由你提供，skill 用 `doubao_speech/audio_text_alignment` 把它对齐到音频，得到词级时间轴。

## 审美入口

1. **Preset — 官方视觉模板**：[hyperframes.dev/design](https://www.hyperframes.dev/design) 的 12 套 premade frame，vendored 在 `library/frame-packs/`，目录在 `data/style-packs.jsonl`。选定后视为 look + `effect_affinity`；Agent 再按包装分析把 Registry 效果铸到用户口播时间轴上。
2. **Composed — 原子现场合成**：`style-atoms.jsonl`（64 维）+ `style-profiles.jsonl`（13 参考锚点）。默认路径。

官方 Examples / Showcase 分别收成 `data/example-kits.jsonl` 与 `data/showcase-kits.jsonl`，只作结构与制片参考（demo 文案/时间不可直接当用户内容）。每条片的最终 token 只写在项目 `FRAME.md`（upstream frame-pack 形态，preset / composed 双模式）。效果实现优先 HyperFrames Registry；`data/effects-overlay.jsonl` 提供选型元数据。

## 快速验证

```bash
python3 scripts/taste.py --validate
python3 scripts/taste.py --index --domain packs
python3 scripts/effects.py --validate
python3 scripts/effects.py --index
```

## 目录

```text
vidmuse-recut/
├── SKILL.md                 # 13 步工作流（入口）
├── references/              # 运行时按步骤阅读的领域文档
├── data/                    # style atoms / profiles / packs / kits / effects overlay
├── library/
│   ├── frame-packs/         # vendored FRAME.md + caption-skin × 12
│   └── native/              # Registry 缺失时的原生机制
├── schemas/                 # scene-plan / evaluation 校验 schema
├── scripts/                 # setup.sh + taste / effects / frame_md / scene_plan / evaluation
└── assets/                  # 字体资源位 + 随包分发的 vidmuse CLI（vendor/vidmuse-cli/）
```

运行产物一律写入工作目录 `videos/<项目名>/`（已被 `.gitignore` 忽略），skill 目录本身只读。

## 用户预览：VidMuse Timeline 多轨

默认 **不是** 只把烤好的 `output.mp4` 丢进时间线。`vidmuse serve` 读 `dsl.json`，多轨呈现：

| 轨 | 内容 |
| --- | --- |
| main | 原片 `public/input-video.mp4` |
| sub / hyperframes | 包装层 `public/index.html` |
| sounds | `audio.mp3` |
| subtitles | 由 `transcript.json` 生成的字幕线索 |

```bash
python3 scripts/write_dsl.py videos/<项目> --mode layered
vidmuse serve videos/<项目>/dsl.json
```

HyperFrames 负责包装层怎么动；Timeline 负责原片 + 包装点 + 字幕一起预览与微调。详见 `references/vidmuse-timeline.md`。可选 `--mode baked` 才是单文件成片审片。
