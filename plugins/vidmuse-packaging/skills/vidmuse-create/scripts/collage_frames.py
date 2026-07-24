#!/usr/bin/env python3
"""ffmpeg helpers for Vox paper-collage beats — machine work only.

Codex writes metaphors, prompts, and calls `vidmuse model run`.
This script only does deterministic media chores:

  prepare          empty color-field first frame + normalized last frame
  finalize-video   strip audio, contact sheet, first/last QA frames
  strip-audio      strip audio from one mp4
  still-contact    grid of approved stills under $WORK/collage/

See references/vox-collage.md.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


ASPECT_SIZE = {
    "9:16": (720, 1280),
    "16:9": (1280, 720),
    "1:1": (1080, 1080),
    "4:3": (1024, 768),
    "3:4": (768, 1024),
}


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def require_bin(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise SystemExit(f"missing dependency: {name}")
    return path


def run_cmd(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, text=True, capture_output=True)
    if proc.returncode != 0:
        eprint(proc.stdout)
        eprint(proc.stderr)
        raise SystemExit(f"command failed ({proc.returncode}): {' '.join(cmd[:6])}…")


def normalize_hex(color: str) -> str:
    c = (color or "").strip()
    if c.startswith("#"):
        c = c[1:]
    c = re.sub(r"[^0-9A-Fa-f]", "", c)
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        raise ValueError(f"expected 6-digit hex, got {color!r}")
    return c.upper()


def resolve_size(aspect: str, width: int | None, height: int | None) -> tuple[int, int]:
    if width and height:
        return int(width), int(height)
    return ASPECT_SIZE.get(aspect, ASPECT_SIZE["9:16"])


def load_json(path: Path) -> Any | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        eprint(f"[warn] invalid JSON {path}: {exc}")
        return None


def find_original_still(frames_dir: Path) -> Path | None:
    for name in (
        "last-frame-original.png",
        "last-frame-original.jpg",
        "last-frame-original.jpeg",
        "last-frame-original.webp",
        "still.png",
        "still.jpg",
    ):
        cand = frames_dir / name
        if cand.is_file():
            return cand
    for cand in sorted(frames_dir.glob("*")):
        if not cand.is_file():
            continue
        if cand.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        if cand.name in {"first-frame.png", "last-frame.png"}:
            continue
        return cand
    return None


def ffprobe_duration(path: Path) -> float | None:
    require_bin("ffprobe")
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        return None
    try:
        data = json.loads(proc.stdout or "{}")
        return float((data.get("format") or {}).get("duration"))
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def prepare(
    beat_dir: Path,
    *,
    aspect: str | None,
    width: int | None,
    height: int | None,
    bg_hex: str | None,
) -> dict[str, Any]:
    require_bin("ffmpeg")
    beat_dir = beat_dir.resolve()
    frames = beat_dir / "frames"
    frames.mkdir(parents=True, exist_ok=True)

    spec = load_json(beat_dir / "visual-spec.json") or {}
    aspect_s = aspect or spec.get("aspect_ratio") or "9:16"
    w, h = resolve_size(aspect_s, width, height)

    if bg_hex:
        color = bg_hex
    else:
        cf = spec.get("color_field") or {}
        color = cf.get("background_hex") or "#4A148C"
    hex6 = normalize_hex(color)

    original = find_original_still(frames)
    if not original:
        raise SystemExit(
            f"no still in {frames} — save Gate V2 image as "
            "frames/last-frame-original.png first"
        )

    last = frames / "last-frame.png"
    first = frames / "first-frame.png"
    vf = (
        f"scale={w}:{h}:force_original_aspect_ratio=increase,"
        f"crop={w}:{h},setsar=1"
    )
    run_cmd(
        ["ffmpeg", "-y", "-i", str(original), "-vf", vf, "-frames:v", "1", str(last)]
    )
    run_cmd(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0x{hex6}:s={w}x{h}:d=1",
            "-frames:v",
            "1",
            str(first),
        ]
    )
    return {
        "ok": True,
        "original": str(original),
        "last_frame": str(last),
        "first_frame": str(first),
        "size": [w, h],
        "background_hex": f"#{hex6}",
    }


def strip_audio(src: Path, dest: Path) -> Path:
    require_bin("ffmpeg")
    dest.parent.mkdir(parents=True, exist_ok=True)
    run_cmd(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-map",
            "0:v:0",
            "-c:v",
            "copy",
            "-an",
            str(dest),
        ]
    )
    return dest


def extract_near_end(video: Path, dest: Path) -> Path:
    require_bin("ffmpeg")
    dest.parent.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-sseof",
            "-0.1",
            "-i",
            str(video),
            "-frames:v",
            "1",
            str(dest),
        ],
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0 or not dest.is_file():
        run_cmd(
            ["ffmpeg", "-y", "-i", str(video), "-frames:v", "1", str(dest)]
        )
    return dest


def finalize_video(beat_dir: Path, raw: Path, run_name: str = "v01") -> dict[str, Any]:
    require_bin("ffmpeg")
    beat_dir = beat_dir.resolve()
    run_dir = beat_dir / "runs" / run_name
    run_dir.mkdir(parents=True, exist_ok=True)

    if not raw.is_file():
        raise SystemExit(f"raw video not found: {raw}")

    stored_raw = run_dir / "raw.mp4"
    if raw.resolve() != stored_raw.resolve():
        shutil.copy2(raw, stored_raw)

    silent = run_dir / "final-noaudio.mp4"
    strip_audio(stored_raw, silent)

    sheet = run_dir / "contact-sheet.jpg"
    try:
        run_cmd(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(silent),
                "-vf",
                "fps=1,scale=270:-1,tile=5x1",
                "-frames:v",
                "1",
                str(sheet),
            ]
        )
    except SystemExit as exc:
        eprint(f"[warn] contact sheet failed: {exc}")

    vfirst = run_dir / "video-first-frame.jpg"
    run_cmd(["ffmpeg", "-y", "-i", str(silent), "-frames:v", "1", str(vfirst)])

    vlast = run_dir / "video-last-frame.jpg"
    extract_near_end(silent, vlast)

    compare = run_dir / "end-frame-comparison.jpg"
    last_still = beat_dir / "frames" / "last-frame.png"
    if last_still.is_file() and vlast.is_file():
        try:
            run_cmd(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(last_still),
                    "-i",
                    str(vlast),
                    "-filter_complex",
                    "[0:v]scale=360:-1[a];[1:v]scale=360:-1[b];[a][b]hstack=inputs=2",
                    "-frames:v",
                    "1",
                    str(compare),
                ]
            )
        except SystemExit as exc:
            eprint(f"[warn] end comparison failed: {exc}")

    result = {
        "ok": True,
        "raw": str(stored_raw),
        "final": str(silent),
        "contact_sheet": str(sheet) if sheet.is_file() else None,
        "video_first_frame": str(vfirst) if vfirst.is_file() else None,
        "video_last_frame": str(vlast) if vlast.is_file() else None,
        "end_frame_comparison": str(compare) if compare.is_file() else None,
        "duration_s": ffprobe_duration(silent),
    }
    (run_dir / "finalize.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return result


def still_contact(work_dir: Path, dest: Path | None = None) -> dict[str, Any]:
    require_bin("ffmpeg")
    collage = work_dir.resolve() / "collage"
    if not collage.is_dir():
        raise SystemExit(f"no collage dir under {work_dir}")

    stills: list[Path] = []
    for beat in sorted(p for p in collage.iterdir() if p.is_dir()):
        frames = beat / "frames"
        last = frames / "last-frame.png"
        if last.is_file():
            stills.append(last)
            continue
        orig = find_original_still(frames) if frames.is_dir() else None
        if orig:
            stills.append(orig)
    if not stills:
        raise SystemExit("no stills found for contact sheet")

    dest = dest or (collage / "still-contact-sheet.jpg")
    n = len(stills)
    cols = min(n, 4)
    rows = (n + cols - 1) // cols
    cmd: list[str] = ["ffmpeg", "-y"]
    for s in stills:
        cmd.extend(["-i", str(s)])

    if n == 1:
        fc = "[0:v]scale=320:-1[out]"
    elif rows == 1:
        scales = [f"[{i}:v]scale=280:-1,setsar=1[s{i}]" for i in range(n)]
        fc = (
            ";".join(scales)
            + ";"
            + "".join(f"[s{i}]" for i in range(n))
            + f"hstack=inputs={n}[out]"
        )
    else:
        filter_parts = [f"[{i}:v]scale=240:-1,setsar=1[s{i}]" for i in range(n)]
        row_labels: list[str] = []
        for r in range(rows):
            idxs = [i for i in range(n) if i // cols == r]
            if not idxs:
                continue
            if len(idxs) == 1:
                filter_parts.append(f"[s{idxs[0]}]copy[row{r}]")
            else:
                ins = "".join(f"[s{i}]" for i in idxs)
                filter_parts.append(f"{ins}hstack=inputs={len(idxs)}[row{r}]")
            row_labels.append(f"[row{r}]")
        filter_parts.append(
            "".join(row_labels) + f"vstack=inputs={len(row_labels)}[out]"
        )
        fc = ";".join(filter_parts)

    cmd.extend(["-filter_complex", fc, "-map", "[out]", "-frames:v", "1", str(dest)])
    run_cmd(cmd)
    return {"ok": True, "still_contact_sheet": str(dest), "count": n}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_prep = sub.add_parser("prepare", help="empty first frame + normalized last frame")
    p_prep.add_argument("--beat-dir", type=Path, required=True)
    p_prep.add_argument("--aspect", default=None)
    p_prep.add_argument("--width", type=int, default=None)
    p_prep.add_argument("--height", type=int, default=None)
    p_prep.add_argument("--hex", default=None, help="override empty-field color")

    p_fin = sub.add_parser("finalize-video", help="strip audio + QA frames")
    p_fin.add_argument("--beat-dir", type=Path, required=True)
    p_fin.add_argument("--input", type=Path, required=True)
    p_fin.add_argument("--run", default="v01")

    p_sc = sub.add_parser("still-contact", help="grid of beat stills")
    p_sc.add_argument("--work-dir", type=Path, required=True)
    p_sc.add_argument("--out", type=Path, default=None)

    p_strip = sub.add_parser("strip-audio", help="strip audio from one mp4")
    p_strip.add_argument("--input", type=Path, required=True)
    p_strip.add_argument("--output", type=Path, required=True)

    args = ap.parse_args(argv)

    if args.cmd == "prepare":
        print(
            json.dumps(
                prepare(
                    args.beat_dir,
                    aspect=args.aspect,
                    width=args.width,
                    height=args.height,
                    bg_hex=args.hex,
                ),
                ensure_ascii=False,
            )
        )
        return 0
    if args.cmd == "finalize-video":
        print(
            json.dumps(
                finalize_video(args.beat_dir, args.input, run_name=args.run),
                ensure_ascii=False,
            )
        )
        return 0
    if args.cmd == "still-contact":
        print(json.dumps(still_contact(args.work_dir, args.out), ensure_ascii=False))
        return 0
    if args.cmd == "strip-audio":
        strip_audio(args.input, args.output)
        print(json.dumps({"ok": True, "output": str(args.output)}, ensure_ascii=False))
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
