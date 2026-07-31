#!/usr/bin/env python3
"""Mechanical packaging lints that catch the two recurring visual accidents.

fonts  — every font-family stack in a composition must name at least one
         allowed family, must not name a banned CJK face, and a CJK stack may
         not fall through to bare `serif` (that fallback is how 宋体 reaches a
         rendered frame).
faces  — diff a rendered frame against the clean source frame at the same
         timestamp; overlay pixels that cover a detected face beyond the
         threshold fail the frame.

Examples:
  packaging_lint.py fonts public/index.html --allow "Noto Sans SC,Source Han Sans SC"
  packaging_lint.py faces --rendered snap_45s.png --source frames/f45s.jpg
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Faces that must never reach a rendered frame unless the user names them in
# the BRIEF. These are the classic "browser fell back to system serif" tells.
BANNED_FAMILIES = {
    "simsun", "nsimsun", "宋体", "新宋体", "stsong", "songti", "songti sc",
    "fangsong", "仿宋", "stfangsong", "kaiti", "楷体", "stkaiti", "kaiti sc",
    "mingliu", "pmingliu", "biaukai",
}

FONT_DECL = re.compile(r"font-family\s*:\s*([^;}]+)", re.IGNORECASE)


def parse_stacks(text: str) -> list[list[str]]:
    stacks = []
    for match in FONT_DECL.finditer(text):
        families = [
            f.strip().strip("'\"").lower()
            for f in match.group(1).split(",")
            if f.strip() and not f.strip().startswith("var(")
        ]
        if families:
            stacks.append(families)
    return stacks


def lint_fonts(paths: list[Path], allow: list[str]) -> list[dict]:
    allowed = {f.strip().lower() for f in allow if f.strip()}
    findings = []
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        for stack in parse_stacks(text):
            named = [f for f in stack if f not in {"serif", "sans-serif", "monospace", "system-ui", "cursive"}]
            banned = [f for f in stack if f in BANNED_FAMILIES]
            if banned:
                findings.append({"file": str(path), "stack": stack, "error": f"banned family {banned}"})
            if allowed and named and not any(f in allowed for f in named):
                findings.append({"file": str(path), "stack": stack, "error": "no allowed family in stack"})
            if stack and stack[-1] == "serif":
                findings.append({
                    "file": str(path), "stack": stack,
                    "error": "stack falls back to bare serif — CJK text will render as 宋体 when the named faces miss",
                })
    return findings


def lint_faces(rendered: Path, source: Path, coverage_limit: float) -> dict:
    try:
        import cv2
        import numpy as np
    except ImportError:
        return {"error": "opencv missing: pip3 install opencv-python-headless"}
    src = cv2.imread(str(source))
    ren = cv2.imread(str(rendered))
    if src is None or ren is None:
        return {"error": f"unreadable image: {source if src is None else rendered}"}
    if ren.shape[:2] != src.shape[:2]:
        sh, sw = src.shape[:2]
        rh, rw = ren.shape[:2]
        if abs(sw / sh - rw / rh) > 0.01:
            return {"error": f"aspect mismatch: source {sw}x{sh} vs rendered {rw}x{rh} — pass a full frame, not a crop"}
        ren = cv2.resize(ren, (sw, sh))
    diff = cv2.cvtColor(cv2.absdiff(src, ren), cv2.COLOR_BGR2GRAY)
    overlay_mask = (diff > 35).astype("uint8")
    model = Path(__file__).resolve().parents[1] / "assets" / "vendor" / "face_detection_yunet_2023mar.onnx"
    if not model.is_file():
        return {"error": f"face model missing: {model}"}
    h_img, w_img = src.shape[:2]
    detector = cv2.FaceDetectorYN.create(str(model), "", (w_img, h_img), score_threshold=0.6)
    _, dets = detector.detect(src)
    faces = [tuple(int(v) for v in d[:4]) for d in (dets if dets is not None else [])]
    report = {"rendered": str(rendered), "source": str(source), "faces": [], "pass": True}
    for (x, y, w, h) in faces:
        x, y = max(x, 0), max(y, 0)
        coverage = float(overlay_mask[y:y + h, x:x + w].mean())
        entry = {"bbox": [int(x), int(y), int(w), int(h)], "overlay_coverage": round(coverage, 4)}
        if coverage > coverage_limit:
            entry["error"] = f"overlay covers {coverage:.0%} of face (limit {coverage_limit:.0%})"
            report["pass"] = False
        report["faces"].append(entry)
    if not len(faces):
        report["note"] = "no face detected; nothing to check"
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fonts", help="lint font-family stacks in HTML/CSS files")
    f.add_argument("files", nargs="+", type=Path)
    f.add_argument("--allow", default="", help="comma-separated whitelist from FRAME.md resolved fonts")
    c = sub.add_parser("faces", help="fail when overlays cover a detected face")
    c.add_argument("--rendered", required=True, type=Path)
    c.add_argument("--source", required=True, type=Path)
    c.add_argument("--limit", type=float, default=0.10, help="max overlay coverage of a face bbox")
    args = parser.parse_args()

    if args.cmd == "fonts":
        findings = lint_fonts(args.files, args.allow.split(","))
        print(json.dumps({"pass": not findings, "findings": findings}, ensure_ascii=False, indent=2))
        return 1 if findings else 0
    report = lint_faces(args.rendered, args.source, args.limit)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report.get("pass") else 1


if __name__ == "__main__":
    sys.exit(main())
