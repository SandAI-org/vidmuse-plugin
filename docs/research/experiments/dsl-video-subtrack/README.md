# 实验: DSL 子轨能不能吃一个普通视频项

结论写在 [`../../vidwrap-mvp-session-log.md`](../../vidwrap-mvp-session-log.md) **§4.1–§4.6**,
要实现的方案在 **§9**。这里只放可复跑的脚本。

**每次升级 vidmuse 都该重跑一遍** —— 结论依赖的是未文档化行为(会话记录 §4.6 风险提示),
验证过的版本是 `v0.3.0-a78bedd`。

三条一句话结论:

| 路子 | render | serve 预览 | 格式要求 |
|---|---|---|---|
| 子轨普通视频项（`videoFile[]`) | ✅ 不调 HF | ❌ 抢底图,源画面消失 | **必须 ProRes 4444**,VP9 会静默丢 alpha |
| hyperframes 项 + `htmlSourceFilePath` 指 `.webm` | ❌ `missing </body>` | ✅ 播成 alpha 叠加层 | 必须 VP9/VP8 WebM |
| `harness.artifacts.overlayAlphaVideoPath` | ✅ 不调 HF（`preRendered` 分支） | ❌ 前端无 segment | 强制 `libvpx-vp9`,只吃 WebM |

## 复跑

```bash
W=/tmp/vw-exp1; mkdir -p $W/public && cd $W
cp <repo>/docs/research/experiments/dsl-video-subtrack/*.{py,mjs} .

# 1. 素材: 取 10s,按 recut/references/pipeline.md 做密关键帧重编码 + 抽音
ffmpeg -y -ss 0 -t 10 -i <你的视频> -c:v libx264 -crf 18 -g 30 -keyint_min 30 \
  -pix_fmt yuv420p -movflags +faststart -c:a aac public/input-video.mp4
ffmpeg -y -ss 0 -t 10 -i <你的视频> -vn -acodec libmp3lame -q:a 2 audio.mp3

# 2. alpha 测试素材 —— ffmpeg 直接造,不经 HyperFrames
python3 make-alpha.py public/alpha-test.webm      # VP9 yuva420p
# ProRes 4444 变体见 make-alpha.py 顶部注释

# 3. 地面真值: 自己用 ffmpeg overlay 合一遍,verify.py 先对着它校准
ffmpeg -y -i public/input-video.mp4 -c:v libvpx-vp9 -i public/alpha-test.webm \
  -filter_complex "[0:v][1:v]overlay=shortest=1[o]" -map "[o]" -map 0:a \
  -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac ref-composite.mp4
python3 verify.py ref-composite.mp4 public/input-video.mp4     # 必须 PASS
python3 verify.py public/input-video.mp4                        # 必须 FAIL(对照)

# 4. 生成全部 DSL 变体
python3 make-dsl.py

# 4a. 子轨普通视频项 + ProRes → 出片 alpha 正确（§4.1）
vidmuse render dsl-b-prores.json --output out.mp4
python3 verify.py out.mp4 public/input-video.mp4          # 应 PASS
# 同一份 DSL 换成 VP9 → alpha 被静默吃掉,近黑占比 >90%（§4.2）
vidmuse render dsl-a-webm.json --output out-bad.mp4
python3 verify.py out-bad.mp4 public/input-video.mp4      # 几何 PASS 但 black% 爆表

# 4b. harness 路: 跳过 HF 且 VP9 alpha 可用（§4.5b）
vidmuse render dsl-h-harness-webm.json --output out-h.mp4
python3 verify.py out-h.mp4 public/input-video.mp4        # 应 PASS

# 5. 证明 HF 没被调用 —— 把 HF 二进制指向不存在的路径
HYPERFRAMES_BIN=/nonexistent/hf vidmuse render dsl-b-prores.json      --output o1.mp4  # 应成功
HYPERFRAMES_BIN=/nonexistent/hf vidmuse render dsl-h-harness-webm.json --output o2.mp4  # 应成功
# 对照(必须失败,否则说明这个探针无效):
HYPERFRAMES_BIN=/nonexistent/hf vidmuse render dsl-i-hfitem-webm.json  --output o3.mp4
#   → HyperFrames source is missing </body>.   ← 有 hyperframes 项就一定走 renderOverlay()

# 6. 浏览器侧(serve 预览用的解码器)能不能带 alpha 解这些格式
vidmuse serve dsl-g-dual-webm-active.json --port 5199 &
node browser-alpha-test.mjs http://127.0.0.1:5199
#   VP9/VP8 WebM → uncovered 保持 [255,0,0] 红底 = alpha 生效
#   ProRes/qtrle → load error, canPlayType 为空

# 7. serve 预览里真的出现叠加层（§4.5a）—— 这份 DSL 只给 serve 用
vidmuse serve dsl-i-hfitem-webm.json --port 5199 &
#   打开 http://127.0.0.1:5199 → 点「Preview the final result」进时间轴
#   应看到: 源画面 + 色块叠加层同时在,轨道标签 HF / Packaging 1
```

## 脚本

| 文件 | 干什么 |
|---|---|
| `make-alpha.py` | 造 alpha 测试素材。透明底 + 横移色块 + 50% alpha 方块 + 进度条(精确时间读数)。用 numpy 生 RGBA 帧管进 ffmpeg —— 因为 `drawbox` 的表达式里 `t` 是**线宽不是时间**,且不写 alpha 平面(除非 `replace=1`) |
| `make-dsl.py` | 生 4 个 DSL 变体: 普通视频项 × `item.type` ∈ {video, sub, main} × {webm, mov} |
| `verify.py` | 定量核验: 量色块左沿 / 进度条宽度并和地面真值比,量 50% 方块的混合值,量近黑像素占比(alpha 丢没丢) |
| `browser-alpha-test.mjs` | 用 CDP 驱动 Chrome,把每个素材画到预填红底的 canvas 上读像素 —— 判浏览器是否带 alpha 解码 |

## 两个坑(踩过,别再踩)

1. **`drawbox` 造不出动画 alpha 素材。** 它的表达式里没有时间变量(`t` = thickness),
   `t=fill` 时 `x=40+t*59.4` 会算出巨大值把方块推出画面 —— 静默画不出来,不报错。
   而且它默认不写 alpha 平面。所以用 numpy 生帧。
2. **`ffprobe` 报 `pix_fmt=yuv420p` 不代表 alpha 没了。** VP9 的 alpha 存在 WebM 的
   BlockAdditional 里,容器上是 `TAG:alpha_mode=1`;要 `-c:v libvpx-vp9` 才解得出来。
   验 alpha 用 `ffmpeg -c:v libvpx-vp9 -i x.webm -vf alphaextract`。
