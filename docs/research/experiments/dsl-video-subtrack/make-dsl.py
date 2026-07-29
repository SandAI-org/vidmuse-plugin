#!/usr/bin/env python3
"""Write dsl.json variants that put a PLAIN VIDEO ITEM on a type:"sub" track.

The item shape is copied from the documented main-track item
(vidmuse-timeline.md:54-62) — videoFile[] + startTime/duration/videoClipStartTime —
rather than the documented sub-track shape (type:"hyperframes" + htmlSourceFilePath).
No HyperFrames, no HTML, no subtitles[] anywhere in these DSLs.
"""
import json
import sys

W, H, FPS, DUR = 854, 480, 60, 10.0


def dsl(overlay_file, item_type):
    return {
        "version": "2",
        "projectName": "vw-exp1",
        "totalDuration": DUR,
        "options": {"aspectRatio": "16:9", "resolution": "source", "frameRate": FPS},
        "sourceVideo": {
            "filePath": "public/input-video.mp4",
            "metadata": {"width": W, "height": H, "frameRate": FPS,
                         "duration": DUR, "hasAudio": True},
        },
        "videoTracks": [
            {
                "id": "main-track",
                "type": "main",
                "items": [{
                    "id": "source-main",
                    "type": "main",
                    "startTime": 0.0,
                    "duration": DUR,
                    "videoClipStartTime": 0.0,
                    "muted": True,
                    "videoFile": [{"filePath": "public/input-video.mp4", "active": True}],
                }],
            },
            {
                "id": "overlay-track",
                "type": "sub",
                "items": [{
                    "id": "alpha-overlay",
                    "type": item_type,
                    "startTime": 0.0,
                    "duration": DUR,
                    "videoClipStartTime": 0.0,
                    "muted": True,
                    "hasAudio": False,
                    "videoFile": [{"filePath": overlay_file, "active": True}],
                }],
            },
        ],
        "sounds": [{
            "id": "source-audio",
            "startTime": 0.0,
            "duration": DUR,
            "audioFile": [{"filePath": "audio.mp3", "active": True}],
        }],
        "subtitles": [],
        "characters": [],
        "visualStyles": [],
        "scenes": [],
    }


VARIANTS = {
    "dsl-a-webm.json": ("public/alpha-test.webm", "video"),
    "dsl-b-prores.json": ("public/alpha-test.mov", "video"),
    "dsl-c-webm-typesub.json": ("public/alpha-test.webm", "sub"),
    "dsl-d-webm-typemain.json": ("public/alpha-test.webm", "main"),
}


def write(name, d, note):
    with open(name, "w") as fh:
        json.dump(d, fh, indent=2)
        fh.write("\n")
    print(f"wrote {name:32s} {note}")


# 子轨普通视频项 × item.type 变体 × 格式（会话记录 §4.1 / §4.2）
for name, (f, t) in VARIANTS.items():
    write(name, dsl(f, t), f"overlay={f} item.type={t!r}")

# 双候选: videoFile[] 是候选列表,active 决定用哪个（§4.2 末）
for name, mov_active in (("dsl-f-dual-mov-active.json", True),
                         ("dsl-g-dual-webm-active.json", False)):
    d = dsl("public/alpha-test.mov", "video")
    d["videoTracks"][1]["items"][0]["videoFile"] = [
        {"filePath": "public/alpha-test.webm", "active": not mov_active},
        {"filePath": "public/alpha-test.mov", "active": mov_active},
    ]
    write(name, d, f"两个候选并存, mov active={mov_active}")

# --- 下面两个是「挂着 hyperframes 的名但不调用 HF」的两条口子（§4.5）---

# (a) 预览侧: hyperframes 项的 htmlSourceFilePath 指向 .webm。
#     前端判 HTML 只看后缀,不命中就用普通媒体播放器 → 播成 alpha 叠加层。
#     注意: render 这份会失败(missing </body>),它只给 serve 用。
d = dsl("public/alpha-test.webm", "video")
d["videoTracks"][1]["items"] = [{
    "id": "alpha-overlay", "type": "hyperframes",
    "startTime": 0.0, "duration": DUR,
    "htmlSourceFilePath": "public/alpha-test.webm",
    "params": {"enabled": True, "sourceStartTime": 0.0},
}]
write("dsl-i-hfitem-webm.json", d, "§4.5a serve 预览专用（render 会报 missing </body>）")

# (b) 出片侧: harness.artifacts.overlayAlphaVideoPath 命中 preRendered 分支 → 跳过 HF。
#     命中条件: 一个 hyperframes 项都没有,且 harness 里没有 overlayAlphaPath / configJsonPath。
#     这条路强制 -c:v libvpx-vp9,所以只吃 VP9/VP8 WebM,喂 ProRes 会 Invalid data。
d = dsl("public/alpha-test.webm", "video")
d["videoTracks"][1]["items"] = []
d["harness"] = {"artifacts": {"overlayAlphaVideoPath": "public/alpha-test.webm"}}
write("dsl-h-harness-webm.json", d, "§4.5b render 跳过 HF（仅 VP9/VP8 WebM）")
