# VidMuse Recut

把现有口播、访谈、播客或产品解说包装成由人物、字幕、视觉证明、
解释动画和声音共同构成的影片。默认使用源画面主导的 Packaging；
只有明确的发布片/宣传片意图，或论点确实需要源画面无法承载的视觉证明，
才升级到 Director。

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

`scripts/setup.sh` 是首次安装或环境故障时使用的主机检查，不需要每条影片重复运行：

| 必须在**用户全局 PATH** | Recut 运行时依赖 |
| --- | --- |
| Node 22+、ffmpeg/ffprobe、Python3 | `vidmuse`、`vidmuse-recut`、`vidmuse-design`、`vidmuse-assets`、`media-use` |
| `vidmuse` CLI（serve/render/model）+ `vidmuse login` | setup **不会**去查 `~/.codex/skills` |
| `npx hyperframes` 渲染运行时 | `hyperframes-animation/core/cli/keyframes/registry` |

随包 `assets/vendor/vidmuse-cli` 在全局没有 `vidmuse` 时拷进 `/usr/local/bin` 或 `~/.local/bin`。  
`vidmuse-create`、`vidmuse-motion` 和 `hyperframes`
不属于 Recut 启动硬依赖，缺失不会阻塞 Recut。不要安装或调用官方
`talking-head-recut`。

环境就绪后，对 Claude 说"帮我包装这个视频 xxx.mp4"即可触发。

口播文本有两条来源，对齐方式不变（都用 `doubao_speech/audio_text_alignment` 对齐到音频，得到词级时间轴）：

- **你提供字幕/文案（推荐）** —— 这是你真正想说的词，专有名词和数字都准。
- **没有文本** —— 自动走云端 ASR（`vidmuse model run` + `sub_model_type=asr`）识别，再对齐。**只给一个视频文件也能直接开工**，不用先准备字幕。不做本地语音识别，识别在云端完成。

ASR 出的文字会标明来源给你看一眼：机器识别容易错专有名词、产品名和数字，而对齐会把错词也对得很准，不改就会一路带到字幕和每个包装点。发现错字告诉 Claude，改文本重新对齐即可（不要手改时间戳）。

## 审美入口

视觉方向由私有 `/vidmuse-design` capability 负责，Recut 只向它传递已经确认的内容覆盖、真实关键帧、画幅、字幕区和密度预算：

1. **Preset** — `vidmuse-design/library/frame-packs/` 私有持有 13 套视觉包。
2. **Composed** — 私有 atoms + profiles 现场组合，默认路径。

每条片的最终 token 只写在项目 `FRAME.md`。设计 capability 返回
`effect_affinity` 和 Treatment 约束；Recut 再用自己的效果目录选择和安装
Registry 机制。运行时不读取第二套视觉 authority。

## 维护者验证

下面只保留 Recut 所拥有的 Registry overlay 检查。Design 数据维护命令
见插件根目录 `SKILLS.md`，不属于每条影片的运行步骤：

```bash
python3 scripts/effects.py --validate
python3 scripts/effects.py --index
python3 scripts/effects.py \
  --check-affinity ../vidmuse-design/data/style-packs.jsonl
```

## 目录

```text
vidmuse-recut/
├── SKILL.md                 # 精简工作流入口
├── references/              # 运行时按步骤阅读的领域文档
├── data/                    # effects overlay
├── library/native/          # Recut 专属的源画面/PiP机制
├── scripts/                 # setup + effects / scene_plan / evaluation / Timeline
└── assets/                  # 字体资源位 + 随包分发的 vidmuse CLI（vendor/vidmuse-cli/）
```

Taste、视觉包、FRAME 校验、字幕身份和方向 Showcase 位于相邻的
`vidmuse-design/`，只在方向阶段加载。

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
