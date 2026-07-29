#!/usr/bin/env python3
"""Fast correctness preflight with optional rendered-motion diagnosis.

Catches the "beautiful plan, PPT execution" failure mechanically, from two
directions:

Static (blocking; index.html vs film-plan.resolved.json)
  S1  every beat has a <section data-beat="bXX"> block
  S2  every shot_sequence window label survived (motion labels must also be
      used as a tween position at least once)
  S3  ui_proof_path beats reference a real-capture file from asset-sources.json
  S4  optional hero_throughline selector appears in enough beat sections
  S5  precise UI/image overlays share a declared transform space with their
      target and use normalized raster geometry
  S6  every approved semantic asset appears as a real data-asset-ref DOM node
      in its assigned beat and points at the resolved local file

Rendered (optional diagnosis; frame sampling via ffmpeg)
  R1  freeze: planned motion windows are not silently missing; read/hold exempt
  R2  event cues: the picture measurably changes state around role=event cues
      (an event spike, not just ambient Ken Burns drift)
  R3  global wash: repeated full-frame, same-direction luminance changes fail;
      cue flashes and ambient scans cannot be used to game R1/R2. Beat seams
      (starts and ends) and declared exit/morph/camera windows are exempt — a
      planned crossfade or dissolve is grammar, not a wash

Usage:
  python3 scripts/check_motion.py "$WORK_DIR" --skip-render
  python3 scripts/check_motion.py "$WORK_DIR" --render-analysis [--video path]
  python3 scripts/check_motion.py "$WORK_DIR" --strict-render   # CI / explicit deep gate

Static is the default and blocking. Rendered findings are advisory unless
--strict-render is explicitly requested. The user judges hierarchy, motif,
material, and pacing on VidMuse Timeline.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from html import escape
from pathlib import Path
from typing import Any

from alignment_contract import evaluate_alignment

RESOLVED_NAME = "film-plan.resolved.json"

# ── sampling ────────────────────────────────────────────────────────────────
SAMPLE_FPS = 4          # frames per second extracted for analysis
SAMPLE_W, SAMPLE_H = 160, 90

# ── thresholds (mean abs diff on 0–255 gray, 160x90, 0.25s apart) ───────────
# Calibrated on a known-bad promo render: true freeze measures ~0.0–0.3 per
# 0.25s step; Ken Burns screenshot drift ~0.8–2.5; real reveals/transitions
# spike to 5–40 over a 0.6s crossing.
STATIC_MAD = 0.5        # a 0.25s step below this is "still"
FREEZE_S = 1.5          # still span >= this inside a non-hold window fails
EVENT_MIN = 1.0         # cue crossing must at least reach this...
EVENT_RATIO = 1.6       # ...and stand out vs ambient drift just before it
EVENT_STRONG = 5.0      # or be unambiguously large on its own
CUE_HALF = 0.3          # compare frames at cue ± this
BEAT_HEAD_FREE = 0.45   # cues this close to beat start pass (entrance is the event)
WASH_PIXEL_DELTA = 4    # ignore compression/noise below this per-pixel change
WASH_COVERAGE = 0.70    # changed share of the frame
WASH_COHERENCE = 0.88   # changed pixels traveling in the same luminance direction
WASH_MEAN_SHIFT = 6.0   # mean shift *of the changed pixels* — a same-direction
                        # move this small is invisible at 8-bit, so gating on it
                        # failed renders no viewer would call a flash
WASH_REPEAT_MAX = 1     # one deliberate punctuation may pass; a system fails

# Window kinds whose planned job *is* a whole-frame change. Exempt from R3.
FULL_FRAME_KINDS = {"exit", "morph", "camera"}

CAPTURE_TYPES = ("capture", "screenshot", "user")


def ffprobe_duration(video: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(video)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def extract_frames(video: Path, tmp: Path) -> list[bytes]:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video),
         "-vf", f"fps={SAMPLE_FPS},scale={SAMPLE_W}:{SAMPLE_H},format=gray",
         "-f", "image2", str(tmp / "f%05d.pgm")],
        check=True, capture_output=True,
    )
    frames: list[bytes] = []
    for path in sorted(tmp.glob("f*.pgm")):
        data = path.read_bytes()
        # P5 header: magic, dims, maxval, then raw bytes
        head = 0
        for _ in range(3):
            head = data.index(b"\n", head) + 1
        frames.append(data[head:head + SAMPLE_W * SAMPLE_H])
    return frames


def mad(a: bytes, b: bytes) -> float:
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def wash_signature(a: bytes, b: bytes) -> dict[str, float | bool]:
    """Identify full-frame tint/flash behavior rather than object motion.

    A wash needs all three: most of the frame changed (coverage), those pixels
    moving the same luminance direction (coherence), and the move being large
    enough to actually read as a flash (mean_shift, measured over the changed
    pixels so unchanged areas cannot dilute it).
    """
    deltas = [y - x for x, y in zip(a, b)]
    changed = [delta for delta in deltas if abs(delta) >= WASH_PIXEL_DELTA]
    coverage = len(changed) / len(deltas)
    if not changed:
        coherence = 0.0
        mean_shift = 0.0
    else:
        positive = sum(delta > 0 for delta in changed)
        negative = len(changed) - positive
        coherence = max(positive, negative) / len(changed)
        mean_shift = sum(abs(delta) for delta in changed) / len(changed)
    like = (
        coverage >= WASH_COVERAGE
        and coherence >= WASH_COHERENCE
        and mean_shift >= WASH_MEAN_SHIFT
    )
    return {
        "like": like,
        "coverage": coverage,
        "coherence": coherence,
        "mean_shift": mean_shift,
    }


def frame_at(frames: list[bytes], t: float) -> bytes:
    idx = min(max(int(round(t * SAMPLE_FPS)), 0), len(frames) - 1)
    return frames[idx]


class Gate:
    def __init__(self) -> None:
        self.checks: list[dict[str, Any]] = []

    def add(self, check_id: str, ok: bool, where: str, detail: str) -> None:
        self.checks.append({"id": check_id, "ok": ok, "where": where, "detail": detail})
        mark = "ok  " if ok else "FAIL"
        print(f"{mark} [{check_id}] {where}: {detail}")

    @property
    def failures(self) -> list[dict[str, Any]]:
        return [c for c in self.checks if not c["ok"]]


# ── static checks ───────────────────────────────────────────────────────────

def beat_slices(html: str, beats: list[dict[str, Any]]) -> dict[str, str]:
    """Markup slice per beat, located by data-beat attributes."""
    hits: list[tuple[int, str]] = []
    for match in re.finditer(r"data-beat=[\"'](b\d{2})[\"']", html):
        hits.append((match.start(), match.group(1)))
    hits.sort()
    slices: dict[str, str] = {}
    for i, (pos, bid) in enumerate(hits):
        end = hits[i + 1][0] if i + 1 < len(hits) else html.find("</main>", pos)
        slices[bid] = html[pos:end if end > pos else len(html)]
    return slices


def capture_basenames(work: Path) -> list[str]:
    path = work / "asset-sources.json"
    if not path.is_file():
        return []
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    entries = doc.get("assets") if isinstance(doc, dict) else doc
    names: list[str] = []
    for entry in entries or []:
        if not isinstance(entry, dict):
            continue
        etype = str(entry.get("type", "")).lower()
        local = str(entry.get("local_file", ""))
        if any(k in etype for k in CAPTURE_TYPES) and local and "*" not in local:
            names.append(Path(local).name)
    return names


def run_static(gate: Gate, work: Path, html_path: Path, plan: dict[str, Any]) -> None:
    beats = plan["beats"]
    if not html_path.is_file():
        gate.add("S1.sections", False, str(html_path), "composition HTML not found")
        return
    html = html_path.read_text(encoding="utf-8")
    slices = beat_slices(html, beats)

    for beat in beats:
        bid = beat["id"]
        if bid in slices:
            gate.add("S1.sections", True, bid, "data-beat section present")
        else:
            gate.add("S1.sections", False, bid,
                     'no <section data-beat="%s"> — scaffold structure was dropped' % bid)

    for beat in beats:
        for win in beat["shot_sequence"]:
            wid = win["id"]
            uses = len(re.findall(r"[\"']" + re.escape(wid), html))
            if win["kind"] in ("hold", "read"):
                ok = uses >= 1
                need = "the label itself"
            else:
                ok = uses >= 2
                need = "the label + >=1 tween positioned at it"
            gate.add("S2.labels", ok, wid,
                     f"{uses} reference(s); needs {need}"
                     if not ok else f"{uses} reference(s)")

    captures = capture_basenames(work)
    proof_beats: list[str] = []
    for beat in beats:
        proof = beat.get("ui_proof_path")
        if proof not in ("screenshot-camera", "hybrid-slices"):
            continue
        proof_beats.append(beat["id"])
        section = slices.get(beat["id"], "")
        used = [n for n in captures if n in section]
        gate.add(
            "S3.proof", bool(used), beat["id"],
            f"real capture in DOM: {used}" if used else
            f"{proof} beat references no real-capture asset from asset-sources.json "
            "(fake UI — hard fails 5/12)",
        )

    hero = plan.get("hero_throughline")
    if hero:
        selector = hero["dom_selector"]
        present = [b["id"] for b in beats if selector in slices.get(b["id"], "")]
        need = math.ceil(float(hero.get("min_coverage", 0.5)) * len(beats))
        gate.add(
            "S4.hero", len(present) >= need, hero["name"],
            f"'{selector}' found in {len(present)}/{len(beats)} beats "
            f"(need >= {need}): {present}",
        )

    for check in evaluate_alignment(html, proof_beats):
        gate.add(check["id"], check["ok"], check["where"], check["detail"])

    for beat in beats:
        section = slices.get(beat["id"], "")
        for asset in beat.get("assets") or []:
            ref = str(asset.get("ref", ""))
            path = str(asset.get("path", ""))
            tag = re.search(
                r"<(?!\!--)[a-zA-Z][^>]*\bdata-asset-ref=[\"']"
                + re.escape(ref)
                + r"[\"'][^>]*>",
                section,
                flags=re.IGNORECASE,
            )
            ok = bool(
                tag
                and path
                and (
                    path in tag.group(0)
                    or escape(path, quote=True) in tag.group(0)
                )
            )
            gate.add(
                "S6.assets",
                ok,
                f"{beat['id']}:{ref}",
                f"resolved asset DOM binding present: {path}"
                if ok
                else f"missing real data-asset-ref DOM binding for {path}",
            )


# ── rendered checks ─────────────────────────────────────────────────────────

def window_iter(plan: dict[str, Any]):
    for beat in plan["beats"]:
        for win in beat["shot_sequence"]:
            yield beat, win


def in_hold(t: float, plan: dict[str, Any]) -> bool:
    for _, win in window_iter(plan):
        if (
            win["kind"] in ("hold", "read")
            and win["abs"][0] - 0.1 <= t <= win["abs"][1] + 0.1
        ):
            return True
    return False


def _near_beat_boundary(t: float, plan: dict[str, Any], radius: float = 0.55) -> bool:
    """True near any planned scene seam — beat starts *and* ends."""
    for beat in plan["beats"]:
        lo, hi = float(beat["ata_range"][0]), float(beat["ata_range"][1])
        if abs(t - lo) <= radius or abs(t - hi) <= radius:
            return True
    return False


def in_declared_full_frame_window(t: float, plan: dict[str, Any]) -> bool:
    """True inside a window whose planned kind *is* a whole-frame change.

    `exit`, `morph`, and `camera` windows are approved full-frame events: a
    dissolve out, a stage transformation, a travelling camera. Counting them as
    unmotivated washes would fail the very grammar path-routing asks for. Cue
    flashes and ambient scans live in `reveal`/`move`/`hold` windows, which stay
    under the R3 gate.
    """
    for _, win in window_iter(plan):
        if win["kind"] not in FULL_FRAME_KINDS:
            continue
        lo, hi = win["abs"]
        if lo - 0.1 <= t <= hi + 0.1:
            return True
    return False


def _cluster_times(times: list[float], gap: float = 0.8) -> list[float]:
    """Collapse timestamps into one representative per contiguous run.

    Call this **once** over the merged list. Clustering a subset first drops
    members that the merged pass would still have joined, which under-counts a
    sustained wash as a single punctuation.
    """
    clustered: list[float] = []
    for value in sorted(times):
        if not clustered or value - clustered[-1] > gap:
            clustered.append(value)
    return clustered


def run_rendered(gate: Gate, work: Path, video: Path, plan: dict[str, Any]) -> None:
    duration = ffprobe_duration(video)
    plan_end = plan["beats"][-1]["ata_range"][1]
    gate.add("R0.duration", duration >= plan_end - 0.5, video.name,
             f"video {duration:.2f}s vs plan {plan_end:.2f}s")

    with tempfile.TemporaryDirectory(prefix="check-motion-") as tmp:
        frames = extract_frames(video, Path(tmp))
    if len(frames) < 4:
        gate.add("R0.frames", False, video.name, f"only {len(frames)} frames extracted")
        return
    step = 1.0 / SAMPLE_FPS
    diffs = [mad(frames[i], frames[i + 1]) for i in range(len(frames) - 1)]

    # R1 — freeze inside windows that promised motion
    for beat, win in window_iter(plan):
        if win["kind"] in ("hold", "read"):
            continue
        lo, hi = win["abs"]
        first = max(int(math.ceil(lo * SAMPLE_FPS)), 0)
        last = min(int(hi * SAMPLE_FPS), len(diffs))
        pair = diffs[first:last]
        if not pair:
            continue
        longest = run_len = 0
        for d in pair:
            run_len = run_len + 1 if d < STATIC_MAD else 0
            longest = max(longest, run_len)
        frozen_s = longest * step
        span = hi - lo
        totally_still = longest == len(pair) and span >= 1.0
        ok = frozen_s < FREEZE_S and not totally_still
        gate.add(
            "R1.freeze", ok, win["id"],
            f"kind={win['kind']} span={span:.2f}s longest_still={frozen_s:.2f}s"
            + ("" if ok else " — planned motion is missing (PPT hold)"),
        )

    # R2 — a visible event lands only on cues that explicitly promise one
    cue_washes: list[float] = []
    for beat in plan["beats"]:
        base = beat["ata_range"][0]
        for cue in beat["vo_cues"]:
            t = cue["t"]
            role = cue.get("role", "event")
            where = f"{beat['id']} “{cue['text']}” @{t:.2f}s"
            if role != "event":
                gate.add(
                    "R2.cues",
                    True,
                    where,
                    f"role={role}; no visible event required",
                )
                continue
            if t - base <= BEAT_HEAD_FREE:
                gate.add("R2.cues", True, where, "at beat entrance (transition is the event)")
                continue
            if in_hold(t, plan):
                gate.add("R2.cues", True, where, "inside planned read/hold stillness")
                continue
            cross = mad(frame_at(frames, t - CUE_HALF), frame_at(frames, t + CUE_HALF))
            pre = mad(frame_at(frames, t - 3 * CUE_HALF), frame_at(frames, t - CUE_HALF))
            ok = cross >= EVENT_STRONG or (cross >= EVENT_MIN and cross >= EVENT_RATIO * pre)
            gate.add(
                "R2.cues", ok, where,
                f"cross={cross:.2f} ambient={pre:.2f}"
                + ("" if ok else " — nothing revealed on this cue (VO not paced)"),
            )
            if _near_beat_boundary(t, plan) or in_declared_full_frame_window(t, plan):
                continue
            into = wash_signature(
                frame_at(frames, t - CUE_HALF),
                frame_at(frames, t),
            )
            out = wash_signature(
                frame_at(frames, t),
                frame_at(frames, t + CUE_HALF),
            )
            if bool(into["like"]) or bool(out["like"]):
                cue_washes.append(t)

    # R3 — repeated full-frame tint/flash/scan events outside planned seams.
    # A declared crossfade, dissolve, morph, or travelling camera is approved
    # grammar and exempt. What fails is a *system* of unmotivated global
    # luminance events in reveal/move/hold windows — the cue-flash and
    # ambient-scan loophole that turns a green render into a worse film.
    step_washes: list[float] = []
    for index in range(len(frames) - 1):
        t = (index + 0.5) / SAMPLE_FPS
        if _near_beat_boundary(t, plan) or in_declared_full_frame_window(t, plan):
            continue
        if bool(wash_signature(frames[index], frames[index + 1])["like"]):
            step_washes.append(t)
    # One cluster pass over the merged list — see _cluster_times.
    events = _cluster_times(cue_washes + step_washes)
    ok = len(events) <= WASH_REPEAT_MAX
    gate.add(
        "R3.global-wash",
        ok,
        video.name,
        f"{len(events)} repeated full-frame luminance event(s) away from scene "
        f"boundaries at {[round(value, 2) for value in events]}"
        + (
            ""
            if ok
            else " — replace cue flashes/scans with the named local object action"
        ),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir")
    parser.add_argument("--video", help="rendered picture (default: public/program.mp4, "
                                        "final-master.mp4, final.mp4 — first found)")
    parser.add_argument("--html", help="composition HTML (default: public/index.html)")
    parser.add_argument(
        "--skip-render",
        action="store_true",
        help="static checks only (default; explicit/backward-compatible spelling)",
    )
    parser.add_argument(
        "--render-analysis",
        action="store_true",
        help="sample rendered motion and report advisory R1-R3 findings",
    )
    parser.add_argument(
        "--strict-render",
        action="store_true",
        help="make optional rendered findings blocking (CI / explicit deep review)",
    )
    args = parser.parse_args(argv)

    work = Path(args.work_dir).resolve()
    resolved = work / RESOLVED_NAME
    if not resolved.is_file():
        print(f"error: missing {resolved} — run film_plan.py --resolve first", file=sys.stderr)
        return 1
    plan = json.loads(resolved.read_text(encoding="utf-8"))

    gate = Gate()
    html_path = Path(args.html).resolve() if args.html else work / "public" / "index.html"
    run_static(gate, work, html_path, plan)

    video: Path | None = None
    run_render = bool(
        (args.render_analysis or args.strict_render or args.video)
        and not args.skip_render
    )
    if run_render:
        if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
            print("error: ffmpeg/ffprobe required for rendered checks", file=sys.stderr)
            return 1
        candidates = ([Path(args.video)] if args.video else
                      [work / "public" / "program.mp4",
                       work / "final-master.mp4", work / "final.mp4"])
        video = next((c for c in candidates if c.is_file()), None)
        if video is None:
            print("error: no rendered video found — pass --video or omit rendered analysis",
                  file=sys.stderr)
            return 1
        run_rendered(gate, work, video, plan)

    static_failures = [item for item in gate.failures if item["id"].startswith("S")]
    rendered_findings = [item for item in gate.failures if item["id"].startswith("R")]
    blocking_failures = static_failures + (rendered_findings if args.strict_render else [])
    report = {
        "mode": "strict-render" if args.strict_render else (
            "render-analysis" if run_render else "static-preflight"
        ),
        "video": str(video) if video else None,
        "html": str(html_path),
        "thresholds": {
            "static_mad": STATIC_MAD, "freeze_s": FREEZE_S, "event_min": EVENT_MIN,
            "event_ratio": EVENT_RATIO, "event_strong": EVENT_STRONG,
            "wash_pixel_delta": WASH_PIXEL_DELTA,
            "wash_coverage": WASH_COVERAGE,
            "wash_coherence": WASH_COHERENCE,
            "wash_mean_shift": WASH_MEAN_SHIFT,
            "wash_repeat_max": WASH_REPEAT_MAX,
        },
        "checks": gate.checks,
        "failures": len(blocking_failures),
        "diagnostic_findings": len(rendered_findings),
        "pass": not blocking_failures,
    }
    out = work / "motion-check.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = len(gate.checks)
    if blocking_failures:
        print(f"\nPREFLIGHT FAIL — {len(blocking_failures)}/{total} blocking checks failed "
              f"(see {out.name})")
        return 1
    if rendered_findings:
        print(
            f"\nPREFLIGHT PASS — {len(rendered_findings)} advisory rendered "
            f"finding(s); review them with the user on Timeline ({out.name})"
        )
        return 0
    print(f"\nPREFLIGHT PASS — {total} checks green ({out.name})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
