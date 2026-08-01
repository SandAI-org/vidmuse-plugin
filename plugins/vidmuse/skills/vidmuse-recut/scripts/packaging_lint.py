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


def lint_overlay(
    work: Path,
    dwell_limit: float,
    coverage_limit: float,
    allow_continuous: set[str],
    duration: float | None,
) -> dict:
    """Dwell budgets and span coverage for the packaging overlay HTML.

    Uses write_dsl's own clip-window parser, so what this lint sees is exactly
    what will be mounted on the Timeline. Catches the two whole-film failure
    modes: an overlay with no timed clip windows (write_dsl falls back to one
    full-duration item — every scene stacked over the entire runtime) and
    individual graphics that outstay a scene (scene duration mistaken for
    graphic dwell).
    """
    from write_dsl import (
        _OverlayWindowParser,
        _finite_number,
        extract_overlay_windows,
        load_json,
        pick_overlay_html,
    )

    overlay = pick_overlay_html(work)
    if overlay is None:
        return {"pass": True, "note": "no overlay HTML found; nothing to check"}

    if duration is None:
        meta = load_json(work / "metadata.json") or {}
        probed = _finite_number(meta.get("duration") if isinstance(meta, dict) else None)
        duration = probed if probed and probed > 0 else None

    findings: list[dict] = []
    parser = _OverlayWindowParser()
    parser.feed(overlay.read_text(encoding="utf-8", errors="replace"))
    clips = [n for n in parser.nodes if n.get("candidate")]

    for node in clips:
        clip_id = str(node.get("id") or "<unnamed>")
        dwell = _finite_number(node.get("duration"))
        if dwell is None or dwell <= 0 or clip_id in allow_continuous:
            continue
        if dwell > dwell_limit:
            findings.append({
                "clip": clip_id,
                "duration": dwell,
                "error": f"clip dwells {dwell:g}s, over the {dwell_limit:g}s budget — "
                         "shorten it, or exempt a deliberate continuous system via --allow-continuous",
            })

    windows = extract_overlay_windows(overlay, duration if duration else 1e9)
    if not windows:
        findings.append({
            "error": "no timed clip windows readable — write_dsl will mount one "
                     "full-duration overlay item and every scene stacks over the whole film; "
                     "give top-level clips data-start/data-duration",
        })
    elif duration:
        # Coverage counts individual non-exempt clips, not merged Timeline
        # windows: a deliberately continuous layer (e.g. a transparent
        # captions band) would otherwise merge every timed clip into one
        # full-film window and hide the real occupancy. Anchor-relative
        # starts ("id+0.5") are skipped here; they still count in windows.
        intervals = []
        for node in clips:
            if str(node.get("id") or "") in allow_continuous:
                continue
            start = _finite_number(node.get("start"))
            dwell = _finite_number(node.get("duration"))
            if start is None or dwell is None or dwell <= 0:
                continue
            intervals.append((max(0.0, start), min(duration, start + dwell)))
        intervals.sort()
        occupied = 0.0
        widest_span = 0.0
        cursor = 0.0
        for lo, hi in intervals:
            occupied += max(0.0, hi - max(lo, cursor))
            cursor = max(cursor, hi)
            widest_span = max(widest_span, hi - lo)
        share = occupied / duration
        if share > coverage_limit:
            findings.append({
                "coverage": round(share, 3),
                "error": f"packaging occupies {share:.0%} of the {duration:g}s runtime "
                         f"(limit {coverage_limit:.0%}) — the source never breathes",
            })
        if widest_span > 0.9 * duration:
            findings.append({
                "widest_clip_span": round(widest_span, 3),
                "error": "one packaging clip spans nearly the whole film — "
                         "split it into per-intervention windows unless the takeover is deliberate",
            })

    return {
        "pass": not findings,
        "overlay": str(overlay),
        "duration": duration,
        "clips": len(clips),
        "windows": windows,
        "findings": findings,
        **({} if duration else {"note": "no duration available (metadata.json or --duration); coverage checks skipped"}),
    }


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
    o = sub.add_parser("overlay", help="dwell budgets and span coverage for the packaging overlay HTML")
    o.add_argument("work_dir", type=Path)
    o.add_argument("--dwell-limit", type=float, default=8.0,
                   help="max seconds one clip may stay on screen (default 8)")
    o.add_argument("--coverage-limit", type=float, default=0.6,
                   help="max share of the runtime packaging windows may occupy (default 0.6)")
    o.add_argument("--duration", type=float, help="film duration in seconds; read from metadata.json when omitted")
    o.add_argument("--allow-continuous", default="",
                   help="comma-separated clip ids exempt from the dwell limit (deliberate continuous systems)")
    args = parser.parse_args()

    if args.cmd == "fonts":
        findings = lint_fonts(args.files, args.allow.split(","))
        print(json.dumps({"pass": not findings, "findings": findings}, ensure_ascii=False, indent=2))
        return 1 if findings else 0
    if args.cmd == "overlay":
        report = lint_overlay(
            args.work_dir.resolve(),
            args.dwell_limit,
            args.coverage_limit,
            {i.strip() for i in args.allow_continuous.split(",") if i.strip()},
            args.duration,
        )
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if report.get("pass") else 1
    report = lint_faces(args.rendered, args.source, args.limit)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report.get("pass") else 1


if __name__ == "__main__":
    sys.exit(main())
