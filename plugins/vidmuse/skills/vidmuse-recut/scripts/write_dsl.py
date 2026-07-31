#!/usr/bin/env python3
"""Build dsl.json for VidMuse Timeline multi-track preview.

Modes:
  layered (default) — main = source video, sub = hyperframes packaging HTML,
                      sounds = audio, subtitles from transcript.json
  baked             — main = output.mp4 only (flattened review); still attaches
                      subtitles when transcript exists
  audio             — no picture yet (create voice spine): main track empty,
                      sounds = audio.mp3, subtitles from transcript.json;
                      duration probed from the audio

See references/vidmuse-timeline.md.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from asset_gate import check as check_asset_gate

TERMINAL_PUNCT = set("。！？!?再；;…")


def load_json(path: Path) -> Any | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[warn] invalid JSON {path}: {e}", file=sys.stderr)
        return None


def ffprobe(path: Path) -> dict[str, Any]:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,r_frame_rate",
        "-show_entries",
        "format=duration",
        "-of",
        "json",
        str(path),
    ]
    try:
        raw = subprocess.check_output(cmd, text=True)
        return json.loads(raw)
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError) as e:
        print(f"[warn] ffprobe failed for {path}: {e}", file=sys.stderr)
        return {}


def parse_fps(frac: str | None) -> float | None:
    if not frac:
        return None
    if "/" in frac:
        a, b = frac.split("/", 1)
        try:
            return float(a) / float(b)
        except ValueError:
            return None
    try:
        return float(frac)
    except ValueError:
        return None


def aspect_label(w: int | None, h: int | None) -> str:
    if not w or not h or h <= 0:
        return "16:9"
    r = w / h
    if r >= 1.5:
        return "16:9"
    if r <= 0.7:
        return "9:16"
    return "4:5"


def rel(work: Path, path: Path) -> str:
    try:
        return str(path.resolve().relative_to(work.resolve()))
    except ValueError:
        return str(path)


def pick_source_video(work: Path) -> Path | None:
    candidates = [
        work / "public" / "input-video.mp4",
        work / "public" / "source.mp4",
        work / "source" / "input-video.mp4",
        work / "source-video.mp4",
        work / "input.mp4",
    ]
    for c in candidates:
        if c.is_file():
            return c
    # first mp4 under public/ that is not a render artifact
    pub = work / "public"
    if pub.is_dir():
        for p in sorted(pub.rglob("*.mp4")):
            name = p.name.lower()
            if name in {"output.mp4", "final.mp4", "motion-reel.mp4", "output-draft.mp4"}:
                continue
            if "render" in name:
                continue
            return p
    return None


def pick_overlay_html(work: Path) -> Path | None:
    for c in (
        work / "public" / "index.html",
        work / "hyperframes" / "index.html",
        work / "index.html",
    ):
        if c.is_file():
            return c
    return None


class _OverlayWindowParser(HTMLParser):
    """Collect top-level timed visual clips from a HyperFrames host."""

    _VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.nodes: list[dict[str, Any]] = []
        self._inside_candidate: list[bool] = []

    @staticmethod
    def _candidate(tag: str, attrs: dict[str, str]) -> bool:
        classes = set(attrs.get("class", "").split())
        return (
            tag not in {"audio", "video"}
            and "data-start" in attrs
            and "data-duration" in attrs
            and ("clip" in classes or "data-composition-src" in attrs)
            and "data-hidden" not in attrs
        )

    def handle_starttag(self, tag: str, raw_attrs: list[tuple[str, str | None]]) -> None:
        attrs = {key: value or "" for key, value in raw_attrs}
        parent_is_candidate = self._inside_candidate[-1] if self._inside_candidate else False
        candidate = self._candidate(tag, attrs)
        if "data-start" in attrs and "data-duration" in attrs:
            self.nodes.append(
                {
                    "id": attrs.get("id", ""),
                    "start": attrs["data-start"],
                    "duration": attrs["data-duration"],
                    "candidate": candidate and not parent_is_candidate,
                }
            )
        if tag not in self._VOID_TAGS:
            self._inside_candidate.append(parent_is_candidate or candidate)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in self._VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, _tag: str) -> None:
        if self._inside_candidate:
            self._inside_candidate.pop()


def _finite_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def extract_overlay_windows(overlay: Path, total_duration: float) -> list[dict[str, Any]]:
    """Return disjoint master-time windows occupied by packaging clips.

    HyperFrames hosts often contain several DOM nodes for one intervention.
    Top-level clips are selected, then overlapping windows are merged so the
    VidMuse Timeline shows editable packaging groups rather than DOM internals.
    """
    try:
        html = overlay.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"[warn] could not inspect overlay timing {overlay}: {exc}", file=sys.stderr)
        return []

    parser = _OverlayWindowParser()
    try:
        parser.feed(html)
    except Exception as exc:
        print(f"[warn] could not parse overlay timing {overlay}: {exc}", file=sys.stderr)
        return []

    by_id = {
        str(node["id"]): node
        for node in parser.nodes
        if isinstance(node.get("id"), str) and node["id"]
    }
    resolved: dict[int, float | None] = {}

    def resolve_start(node: dict[str, Any], active: set[int] | None = None) -> float | None:
        key = id(node)
        if key in resolved:
            return resolved[key]
        numeric = _finite_number(node.get("start"))
        if numeric is not None:
            resolved[key] = numeric
            return numeric

        match = re.fullmatch(
            r"\s*([A-Za-z_][A-Za-z0-9_.:-]*)\s*(?:([+-])\s*(\d+(?:\.\d+)?))?\s*",
            str(node.get("start", "")),
        )
        if not match or match.group(1) not in by_id:
            resolved[key] = None
            return None
        active = set() if active is None else set(active)
        if key in active:
            resolved[key] = None
            return None
        active.add(key)
        anchor = by_id[match.group(1)]
        anchor_start = resolve_start(anchor, active)
        anchor_duration = _finite_number(anchor.get("duration"))
        if anchor_start is None or anchor_duration is None:
            resolved[key] = None
            return None
        offset = _finite_number(match.group(3)) or 0.0
        if match.group(2) == "-":
            offset *= -1
        result = anchor_start + anchor_duration + offset
        resolved[key] = result
        return result

    limit = max(0.0, float(total_duration))
    spans: list[dict[str, Any]] = []
    for node in parser.nodes:
        if not node.get("candidate"):
            continue
        start = resolve_start(node)
        clip_duration = _finite_number(node.get("duration"))
        if start is None or clip_duration is None or clip_duration <= 0:
            continue
        end = start + clip_duration
        start = max(0.0, start)
        end = min(limit, end)
        if end <= start:
            continue
        spans.append(
            {
                "start": start,
                "end": end,
                "ids": [str(node.get("id") or "")],
            }
        )

    spans.sort(key=lambda span: (span["start"], span["end"]))
    merged: list[dict[str, Any]] = []
    for span in spans:
        if merged and span["start"] <= merged[-1]["end"] + 1e-6:
            merged[-1]["end"] = max(merged[-1]["end"], span["end"])
            merged[-1]["ids"].extend(item for item in span["ids"] if item)
        else:
            merged.append({"start": span["start"], "end": span["end"], "ids": list(span["ids"])})

    return [
        {
            "start": round(span["start"], 3),
            "duration": round(span["end"] - span["start"], 3),
            "id": next((item for item in span["ids"] if item), ""),
        }
        for span in merged
    ]


def build_overlay_items(
    work: Path,
    overlay: Path,
    duration: float,
    *,
    single_overlay: bool = False,
) -> list[dict[str, Any]]:
    """Build sparse Timeline items, with a full-duration compatibility fallback."""
    ovr = rel(work, overlay)
    windows = [] if single_overlay else extract_overlay_windows(overlay, duration)
    if not windows:
        return [
            {
                "id": "hyperframes-packaging",
                "type": "hyperframes",
                "startTime": 0.0,
                "duration": round(duration, 3),
                "htmlSourceFilePath": ovr,
                "params": {"enabled": True, "sourceStartTime": 0.0},
            }
        ]

    items: list[dict[str, Any]] = []
    used_ids: set[str] = set()
    for index, window in enumerate(windows, 1):
        label = re.sub(r"[^a-z0-9]+", "-", str(window.get("id", "")).lower()).strip("-")
        base_id = f"hyperframes-{label}" if label else f"hyperframes-packaging-{index:03d}"
        item_id = base_id
        suffix = 2
        while item_id in used_ids:
            item_id = f"{base_id}-{suffix}"
            suffix += 1
        used_ids.add(item_id)
        start = float(window["start"])
        items.append(
            {
                "id": item_id,
                "type": "hyperframes",
                "startTime": round(start, 3),
                "duration": round(float(window["duration"]), 3),
                "htmlSourceFilePath": ovr,
                "params": {"enabled": True, "sourceStartTime": round(start, 3)},
            }
        )
    return items


def pick_audio(work: Path) -> Path | None:
    for c in (work / "audio.mp3", work / "public" / "audio.mp3", work / "source" / "audio.mp3"):
        if c.is_file():
            return c
    return None


def pick_baked(work: Path) -> Path | None:
    for c in (work / "output.mp4", work / "public" / "output.mp4"):
        if c.is_file():
            return c
    return None


def read_meta(work: Path, media: Path | None) -> dict[str, Any]:
    duration = width = height = fps = None
    meta = load_json(work / "metadata.json") or {}
    if isinstance(meta, dict):
        if "duration" in meta:
            try:
                duration = float(meta["duration"])
            except (TypeError, ValueError):
                pass
        fmt = meta.get("format") if isinstance(meta.get("format"), dict) else {}
        if duration is None and "duration" in fmt:
            try:
                duration = float(fmt["duration"])
            except (TypeError, ValueError):
                pass
        streams = meta.get("streams")
        stream0 = None
        if isinstance(streams, list) and streams:
            stream0 = next((s for s in streams if s.get("codec_type") == "video"), streams[0])
        elif isinstance(meta.get("stream"), dict):
            stream0 = meta["stream"]
        src = stream0 if isinstance(stream0, dict) else meta
        if isinstance(src, dict):
            if width is None and "width" in src:
                try:
                    width = int(src["width"])
                except (TypeError, ValueError):
                    pass
            if height is None and "height" in src:
                try:
                    height = int(src["height"])
                except (TypeError, ValueError):
                    pass
            if fps is None:
                fps = parse_fps(str(src.get("r_frame_rate") or "") or None)
        if fps is None and "fps" in meta:
            try:
                fps = float(meta["fps"])
            except (TypeError, ValueError):
                pass

    if media and media.is_file():
        probe = ffprobe(media)
        fmt = probe.get("format") if isinstance(probe.get("format"), dict) else {}
        streams = probe.get("streams") if isinstance(probe.get("streams"), list) else []
        st = streams[0] if streams and isinstance(streams[0], dict) else {}
        if duration is None and "duration" in fmt:
            try:
                duration = float(fmt["duration"])
            except (TypeError, ValueError):
                pass
        if width is None and "width" in st:
            width = int(st["width"])
        if height is None and "height" in st:
            height = int(st["height"])
        if fps is None:
            fps = parse_fps(st.get("r_frame_rate"))

    return {
        "duration": duration,
        "width": width,
        "height": height,
        "fps": fps,
    }


def words_to_subtitles(words: list[dict[str, Any]], duration: float | None) -> list[dict[str, Any]]:
    """Group flat word array into sentence-like subtitle cues."""
    if not words:
        return []

    def w_start(w: dict) -> float:
        return float(w.get("start", w.get("start_time", 0)) or 0)

    def w_end(w: dict) -> float:
        return float(w.get("end", w.get("end_time", w_start(w))) or 0)

    # Detect ms vs s for the whole list
    max_t = max(w_end(w) for w in words)
    scale = 0.001 if max_t > 1000 else 1.0

    cues: list[dict[str, Any]] = []
    buf: list[str] = []
    cue_start: float | None = None
    cue_end: float = 0.0
    pause_break = 0.45  # seconds

    def flush():
        nonlocal buf, cue_start, cue_end
        if not buf or cue_start is None:
            buf = []
            cue_start = None
            return
        text = "".join(buf) if any("\u4e00" <= c <= "\u9fff" for t in buf for c in t) else " ".join(buf)
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            buf = []
            cue_start = None
            return
        end = cue_end
        if duration is not None:
            end = min(end, duration)
        start = min(cue_start, end)
        cues.append(
            {
                "id": f"subtitle-{len(cues) + 1:03d}",
                "text": text,
                "startTime": round(start, 3),
                "endTime": round(max(end, start + 0.05), 3),
            }
        )
        buf = []
        cue_start = None

    prev_end: float | None = None
    for w in words:
        t = str(w.get("text", w.get("word", "")) or "")
        if not t:
            continue
        s = w_start(w) * scale
        e = w_end(w) * scale
        if duration is not None:
            s = min(s, duration)
            e = min(e, duration)
        if prev_end is not None and s - prev_end >= pause_break and buf:
            flush()
        if cue_start is None:
            cue_start = s
        buf.append(t)
        cue_end = e
        prev_end = e
        # terminal punct on word
        if t and t[-1] in TERMINAL_PUNCT:
            flush()
        # long cue safety
        elif cue_start is not None and (e - cue_start) >= 6.0 and buf:
            flush()

    flush()
    return cues


def load_subtitles(work: Path, duration: float | None) -> list[dict[str, Any]]:
    # Prefer explicit subtitles.json
    raw = load_json(work / "subtitles.json")
    if isinstance(raw, list) and raw:
        out = []
        for i, s in enumerate(raw):
            if not isinstance(s, dict):
                continue
            text = str(s.get("text", "")).strip()
            if not text:
                continue
            st = float(s.get("startTime", s.get("start", 0)) or 0)
            en = float(s.get("endTime", s.get("end", st + 0.5)) or (st + 0.5))
            out.append(
                {
                    "id": str(s.get("id") or f"subtitle-{i + 1:03d}"),
                    "text": text,
                    "startTime": round(st, 3),
                    "endTime": round(en, 3),
                }
            )
        if out:
            return out

    tr = load_json(work / "transcript.json")
    words: list[dict[str, Any]] = []
    if isinstance(tr, list):
        words = [w for w in tr if isinstance(w, dict)]
    elif isinstance(tr, dict):
        if isinstance(tr.get("words"), list):
            words = [w for w in tr["words"] if isinstance(w, dict)]
        elif isinstance(tr.get("segments"), list):
            # segment-level cues
            out = []
            for i, seg in enumerate(tr["segments"]):
                if not isinstance(seg, dict):
                    continue
                text = str(seg.get("text", "")).strip()
                if not text:
                    continue
                st = float(seg.get("start", seg.get("startTime", 0)) or 0)
                en = float(seg.get("end", seg.get("endTime", st + 0.5)) or (st + 0.5))
                # ms?
                if en > 1000 and (duration is None or duration < 500):
                    st, en = st / 1000.0, en / 1000.0
                out.append(
                    {
                        "id": f"subtitle-{i + 1:03d}",
                        "text": text,
                        "startTime": round(st, 3),
                        "endTime": round(en, 3),
                    }
                )
            if out:
                return out
    return words_to_subtitles(words, duration)


def build_dsl(
    work: Path,
    *,
    mode: str,
    no_overlay: bool,
    overlay_path: Path | None,
    source_path: Path | None,
    baked_path: Path | None,
    force_duration: float | None,
    single_overlay: bool = False,
) -> dict[str, Any]:
    work = work.resolve()
    project = work.name

    source = source_path or pick_source_video(work)
    baked = baked_path or pick_baked(work)
    overlay = None if no_overlay else (overlay_path or pick_overlay_html(work))
    audio = pick_audio(work)

    if mode == "audio":
        media_for_meta = audio
    else:
        media_for_meta = baked if mode == "baked" and baked else source or baked
    m = read_meta(work, media_for_meta)
    duration = force_duration if force_duration is not None else m["duration"]
    if duration is None:
        duration = 0.0
        print("[warn] duration unknown — set 0; fix metadata.json", file=sys.stderr)
    duration = float(duration)
    width, height, fps = m["width"], m["height"], m["fps"]
    if fps is None:
        fps = 30.0

    subtitles = load_subtitles(work, duration)

    options: dict[str, Any] = {
        "aspectRatio": aspect_label(width, height),
        "resolution": "source",
    }
    if fps:
        # keep numeric; Timeline accepts number
        options["frameRate"] = int(round(fps)) if abs(fps - round(fps)) < 1e-3 else round(fps, 3)
    if width and height:
        options["sourceSize"] = {"width": int(width), "height": int(height)}

    dsl: dict[str, Any] = {
        "version": "2",
        "projectName": project,
        "totalDuration": round(duration, 3),
        "options": options,
        "videoTracks": [],
        "sounds": [],
        "subtitles": subtitles,
        "characters": [],
        "visualStyles": [],
        "scenes": [],
    }

    if mode == "audio":
        if not audio or not audio.is_file():
            raise SystemExit(
                f"[error] audio mode needs audio.mp3 under {work} "
                "(run the TTS voice spine first)"
            )
        ar = rel(work, audio)
        # empty main keeps topology honest; picture attaches later via layered/baked
        dsl["videoTracks"] = [
            {"id": "main-track", "type": "main", "items": []},
            {"id": "overlay-track", "type": "sub", "items": []},
        ]
        dsl["sounds"] = [
            {
                "id": "narration-audio",
                "startTime": 0.0,
                "duration": round(duration, 3),
                "audioFile": [{"filePath": ar, "active": True}],
            }
        ]
        return dsl

    if mode == "baked":
        if not baked or not baked.is_file():
            raise SystemExit(
                f"[error] baked mode needs output.mp4 under {work} "
                "(run hyperframes render first, or pass --baked)"
            )
        br = rel(work, baked)
        dsl["videoTracks"] = [
            {
                "id": "main-track",
                "type": "main",
                "items": [
                    {
                        "id": "main-clip",
                        "type": "main",
                        "startTime": 0.0,
                        "duration": round(duration, 3),
                        "videoClipStartTime": 0.0,
                        "videoFile": [{"filePath": br, "active": True}],
                    }
                ],
            }
        ]
        # audio already in bake; still no double-list sounds
        dsl["sounds"] = []
        return dsl

    # layered
    if not source or not source.is_file():
        raise SystemExit(
            f"[error] layered mode needs a source video "
            f"(expected public/input-video.mp4). Found: {source}"
        )
    sr = rel(work, source)
    meta_block = {
        "width": int(width or 0) or None,
        "height": int(height or 0) or None,
        "frameRate": fps,
        "duration": round(duration, 3),
    }
    # drop nulls
    meta_block = {k: v for k, v in meta_block.items() if v is not None}
    dsl["sourceVideo"] = {"filePath": sr, "metadata": meta_block}

    dsl["videoTracks"].append(
        {
            "id": "main-track",
            "type": "main",
            "items": [
                {
                    "id": "source-main",
                    "type": "main",
                    "startTime": 0.0,
                    "duration": round(duration, 3),
                    "videoClipStartTime": 0.0,
                    "muted": True,
                    "videoFile": [{"filePath": sr, "active": True}],
                }
            ],
        }
    )

    if overlay and overlay.is_file():
        dsl["videoTracks"].append(
            {
                "id": "overlay-track",
                "type": "sub",
                "items": build_overlay_items(
                    work,
                    overlay,
                    duration,
                    single_overlay=single_overlay,
                ),
            }
        )
    else:
        # empty overlay track keeps topology honest for incremental attach
        dsl["videoTracks"].append({"id": "overlay-track", "type": "sub", "items": []})
        if not no_overlay:
            print(
                "[warn] no packaging HTML yet (public/index.html) — "
                "overlay track left empty; re-run after assemble",
                file=sys.stderr,
            )

    if audio and audio.is_file():
        ar = rel(work, audio)
        dsl["sounds"] = [
            {
                "id": "source-audio",
                "startTime": 0.0,
                "duration": round(duration, 3),
                "audioFile": [{"filePath": ar, "active": True}],
            }
        ]
    else:
        print("[warn] audio.mp3 missing — sounds[] empty", file=sys.stderr)

    return dsl


def merge_preserve_user(existing: dict[str, Any], fresh: dict[str, Any]) -> dict[str, Any]:
    """Prefer fresh media wiring but keep user subtitle text/times when ids match and look edited.

    Simple policy: if existing subtitles length > 0 and fresh would rebuild same count from
    transcript, keep existing subtitles (user may have edited in Timeline). Agent can --force.
    """
    out = dict(fresh)
    # preserve unknown top-level keys from existing
    for k, v in existing.items():
        if k not in out:
            out[k] = v
    if existing.get("subtitles") and isinstance(existing["subtitles"], list):
        # keep user subtitles unless fresh has more grounded data and existing empty texts
        ex = existing["subtitles"]
        if ex and all(isinstance(s, dict) and s.get("text") for s in ex):
            out["subtitles"] = ex
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("work_dir", type=Path, help="videos/<project>/ work directory")
    ap.add_argument(
        "--mode",
        choices=("layered", "baked", "audio"),
        default="layered",
        help="layered = source+overlay+subs (default); baked = output.mp4 main; "
        "audio = narration+subs only (no picture yet)",
    )
    ap.add_argument("--no-overlay", action="store_true", help="layered without hyperframes item")
    ap.add_argument("--overlay", type=Path, default=None, help="override packaging HTML path")
    ap.add_argument(
        "--single-overlay",
        action="store_true",
        help="mount packaging HTML as one full-duration item instead of timed clip windows",
    )
    ap.add_argument("--source", type=Path, default=None, help="override source video path")
    ap.add_argument("--baked", type=Path, default=None, help="override output.mp4 path")
    ap.add_argument("--duration", type=float, default=None, help="force totalDuration seconds")
    ap.add_argument("--force", action="store_true", help="overwrite dsl.json ignoring user subtitles")
    ap.add_argument("-o", "--output", type=Path, default=None, help="default: <work>/dsl.json")
    args = ap.parse_args(argv)

    work = args.work_dir
    if not work.is_dir():
        print(f"[error] work_dir not found: {work}", file=sys.stderr)
        return 2

    if args.mode == "layered" and not args.no_overlay:
        asset_report = check_asset_gate(
            work,
            args.overlay if args.overlay else pick_overlay_html(work),
        )
        if not asset_report["ok"]:
            for problem in asset_report["errors"]:
                print(f"[asset-gate] {problem}", file=sys.stderr)
            return 1

    dsl = build_dsl(
        work,
        mode=args.mode,
        no_overlay=args.no_overlay,
        overlay_path=args.overlay,
        source_path=args.source,
        baked_path=args.baked,
        force_duration=args.duration,
        single_overlay=args.single_overlay,
    )

    out_path = args.output or (work / "dsl.json")
    if out_path.is_file() and not args.force:
        prev = load_json(out_path)
        if isinstance(prev, dict):
            dsl = merge_preserve_user(prev, dsl)

    text = json.dumps(dsl, ensure_ascii=False, indent=2) + "\n"
    tmp = out_path.with_suffix(".json.tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(out_path)

    n_sub = len(dsl.get("subtitles") or [])
    n_ov = 0
    for t in dsl.get("videoTracks") or []:
        if t.get("type") == "sub":
            n_ov += len(t.get("items") or [])
    print(
        json.dumps(
            {
                "ok": True,
                "path": str(out_path),
                "mode": args.mode,
                "duration": dsl.get("totalDuration"),
                "subtitles": n_sub,
                "overlay_items": n_ov,
                "tracks": [t.get("id") for t in dsl.get("videoTracks") or []],
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
