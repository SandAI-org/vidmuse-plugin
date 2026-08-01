#!/usr/bin/env python3
"""Mechanical source facts for packaging decisions.

Turns the raw evidence a work directory already holds (word-level
transcript.json + extracted frames/) into the numbers packaging keeps
guessing at: where the speech is dense or quiet, where the face lives, which
screen regions are safely empty, and what colors the room actually is.

This is the fact layer under packaging-analysis: "where can a card land" and
"where does the film breathe" become lookups instead of vibes. It makes no
creative decision — density targets, treatment choice, and what deserves a
hero moment stay with the agent and the charter.

Example:
  source_map.py "$WORK_DIR" --out "$WORK_DIR/source-map.json"

Output shape:
  speech:   per-bucket words/sec + flat list of silences >= min gap
  frames:   per sampled frame — face bbox, empty thirds-grid cells (safe
            landing zones), dominant colors (packaging palette candidates)
"""

from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
from pathlib import Path

BUCKET = 10.0          # seconds per speech-rate bucket
DIFF_EDGE_THRESH = 18  # mean Sobel magnitude below this = visually quiet cell
MODEL = Path(__file__).resolve().parents[1] / "assets" / "vendor" / "face_detection_yunet_2023mar.onnx"


def pick_source_video(work: Path) -> Path | None:
    """Find the staged source without importing the Timeline writer."""
    for candidate in (
        work / "public" / "input-video.mp4",
        work / "public" / "source.mp4",
        work / "source" / "input-video.mp4",
        work / "source-video.mp4",
        work / "input.mp4",
    ):
        if candidate.is_file():
            return candidate
    return None


def extract_frames(
    video: Path,
    frames_dir: Path,
    duration: float,
    interval: float,
) -> dict:
    """Materialize timestamp-named frames consumed by ``frame_time``."""
    frames_dir.mkdir(parents=True, exist_ok=True)
    timestamps = [i * interval for i in range(max(1, math.ceil(duration / interval)))]
    written: list[str] = []
    errors: list[str] = []
    for timestamp in timestamps:
        label = f"{timestamp:g}"
        output = frames_dir / f"f{label}s.jpg"
        if output.is_file():
            written.append(output.name)
            continue
        try:
            run = subprocess.run(
                [
                    "ffmpeg", "-y", "-ss", label, "-i", str(video),
                    "-frames:v", "1", "-vf", "scale=960:-2", str(output),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
        except OSError as exc:
            errors.append(f"ffmpeg unavailable: {exc}")
            break
        if run.returncode == 0 and output.is_file():
            written.append(output.name)
        else:
            detail = run.stderr.strip().splitlines()
            errors.append(
                f"{label}s: {detail[-1] if detail else f'ffmpeg exited {run.returncode}'}"
            )
    return {
        "source": str(video),
        "interval_seconds": interval,
        "requested": len(timestamps),
        "written": len(written),
        "errors": errors,
    }


def speech_map(transcript: Path, min_gap: float) -> dict:
    words = json.loads(transcript.read_text(encoding="utf-8"))
    if not isinstance(words, list) or not words:
        raise SystemExit("transcript must be a non-empty JSON array of {text,start,end}")
    end = words[-1]["end"]
    buckets = []
    for lo in [i * BUCKET for i in range(int(end // BUCKET) + 1)]:
        hi = lo + BUCKET
        inside = [w for w in words if w["start"] < hi and w["end"] > lo]
        buckets.append({
            "start": lo, "end": round(min(hi, end), 2),
            "words": len(inside),
            "rate": round(len(inside) / BUCKET, 2),
        })
    rates = [b["rate"] for b in buckets if b["words"]]
    mean = sum(rates) / len(rates) if rates else 0
    for b in buckets:
        b["energy"] = ("quiet" if b["rate"] < 0.75 * mean else
                       "dense" if b["rate"] > 1.25 * mean else "mid")
    silences = []
    for a, b in zip(words, words[1:]):
        gap = b["start"] - a["end"]
        if gap >= min_gap:
            silences.append({"start": round(a["end"], 3), "end": round(b["start"], 3), "gap": round(gap, 3)})
    return {"duration": end, "mean_rate": round(mean, 2), "buckets": buckets, "silences": silences}


def frame_time(path: Path) -> float | None:
    m = re.search(r"f?(\d+(?:\.\d+)?)s", path.stem)
    return float(m.group(1)) if m else None


def analyze_frame(path: Path, detector, cv2, np) -> dict:
    img = cv2.imread(str(path))
    if img is None:
        return {"file": path.name, "error": "unreadable"}
    h, w = img.shape[:2]
    detector.setInputSize((w, h))
    _, dets = detector.detect(img)
    faces = [[int(v) for v in d[:4]] for d in (dets if dets is not None else [])]

    # Visual busyness per thirds-grid cell: cells with low edge density and no
    # face are safe landing zones for cards and captions.
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.magnitude(
        cv2.Sobel(gray, cv2.CV_32F, 1, 0), cv2.Sobel(gray, cv2.CV_32F, 0, 1))
    cells = {}
    names = [["top-left", "top-center", "top-right"],
             ["mid-left", "mid-center", "mid-right"],
             ["bottom-left", "bottom-center", "bottom-right"]]
    for r in range(3):
        for c in range(3):
            y0, y1 = r * h // 3, (r + 1) * h // 3
            x0, x1 = c * w // 3, (c + 1) * w // 3
            busy = float(edges[y0:y1, x0:x1].mean())
            face_hit = any(fx < x1 and fx + fw > x0 and fy < y1 and fy + fh > y0
                           for fx, fy, fw, fh in faces)
            cells[names[r][c]] = {
                "edge_density": round(busy, 1),
                "face": face_hit,
                "safe": (not face_hit) and busy < DIFF_EDGE_THRESH,
            }

    # Dominant colors via k-means on a downsampled frame.
    small = cv2.resize(img, (80, 45)).reshape(-1, 3).astype(np.float32)
    _, labels, centers = cv2.kmeans(
        small, 4, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 8, 1.0),
        2, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.flatten(), minlength=4)
    order = counts.argsort()[::-1]
    colors = ["#{:02x}{:02x}{:02x}".format(int(centers[i][2]), int(centers[i][1]), int(centers[i][0]))
              for i in order]
    shares = [round(float(counts[i]) / len(labels), 2) for i in order]

    return {
        "file": path.name, "t": frame_time(path), "size": [w, h],
        "faces": faces,
        "safe_cells": sorted(k for k, v in cells.items() if v["safe"]),
        "cells": cells,
        "dominant_colors": [{"hex": c, "share": s} for c, s in zip(colors, shares)],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", type=Path)
    parser.add_argument("--min-gap", type=float, default=0.5)
    parser.add_argument(
        "--frame-interval",
        type=float,
        default=10.0,
        help="seconds between automatically extracted source frames (default 10)",
    )
    parser.add_argument("--out", type=Path, help="write JSON here as well as stdout summary")
    args = parser.parse_args()

    work = args.work_dir.resolve()
    result: dict = {"work_dir": str(work)}

    transcript = work / "transcript.json"
    if transcript.is_file():
        result["speech"] = speech_map(transcript, args.min_gap)
    else:
        result["speech"] = {"error": "transcript.json missing"}

    frames_dir = work / "frames"
    existing_frames = (
        [path for path in frames_dir.glob("f*s.*") if frame_time(path) is not None]
        if frames_dir.is_dir()
        else []
    )
    if not existing_frames:
        source = pick_source_video(work)
        speech_duration = (result.get("speech") or {}).get("duration")
        if source and isinstance(speech_duration, (int, float)) and speech_duration > 0:
            if args.frame_interval <= 0:
                raise SystemExit("--frame-interval must be greater than zero")
            result["frame_extraction"] = extract_frames(
                source,
                frames_dir,
                float(speech_duration),
                args.frame_interval,
            )
        else:
            result["frame_extraction"] = {
                "status": "unavailable",
                "error": (
                    "no timestamp-named frames and no staged source/duration; "
                    "stage public/input-video.mp4 and materialize transcript.json"
                ),
            }
    frame_files = sorted(
        (p for p in frames_dir.glob("f*s.*") if frame_time(p) is not None),
        key=frame_time) if frames_dir.is_dir() else []
    if frame_files:
        try:
            import cv2
            import numpy as np
        except ImportError:
            raise SystemExit("opencv missing: pip3 install opencv-python-headless")
        if not MODEL.is_file():
            raise SystemExit(f"face model missing: {MODEL}")
        detector = cv2.FaceDetectorYN.create(str(MODEL), "", (0, 0), score_threshold=0.6)
        result["frames"] = [analyze_frame(p, detector, cv2, np) for p in frame_files]
    else:
        result["frames"] = []
        result["frames_error"] = result.get("frame_extraction", {}).get(
            "error", "no timestamp-named frames were produced"
        )

    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        args.out.write_text(payload, encoding="utf-8")
        speech = result["speech"]
        quiet = [b for b in speech.get("buckets", []) if b.get("energy") == "quiet"]
        print(json.dumps({
            "written": str(args.out),
            "duration": speech.get("duration"),
            "quiet_buckets": [[b["start"], b["end"]] for b in quiet],
            "silences": len(speech.get("silences", [])),
            "frames_analyzed": len(result["frames"]),
        }, ensure_ascii=False))
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
