#!/usr/bin/env python3
"""Validate a Director-mode scene-plan.json mechanically and temporally.

JSON Schema documents field shapes. This script checks relationships that a
schema cannot express clearly: act references, scene coverage, hero-time
bounds, frame-aligned boundaries, and review-target references. It does not
judge whether a visual proof or transition is aesthetically good.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any


SCHEMA = "vidmuse.recut.scene-plan.v1"
PRODUCTION_MODES = ("packaging", "director")
NARRATIVE_JOBS = (
    "hook",
    "orient",
    "explain",
    "prove",
    "contrast",
    "turn",
    "release",
    "conclude",
    "call_to_action",
)
SOURCE_MODES = ("fullscreen", "reframe", "split", "stack", "pip", "composite", "hidden")
MOTION_PHASES = ("entry", "development", "hold", "exit", "handoff")


class ScenePlanError(ValueError):
    pass


def load(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise ScenePlanError(f"{path}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ScenePlanError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ScenePlanError(f"{path}: root must be an object")
    return value


def _number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _required_text(mapping: dict[str, Any], key: str, label: str, problems: list[str]) -> None:
    value = mapping.get(key)
    if not isinstance(value, str) or not value.strip():
        problems.append(f"{label}.{key} must be non-empty text")


def _range(mapping: dict[str, Any], label: str, problems: list[str]) -> tuple[float, float] | None:
    start = mapping.get("start")
    end = mapping.get("end")
    if not _number(start) or not _number(end):
        problems.append(f"{label}.start and {label}.end must be finite numbers")
        return None
    if start < 0 or end <= start:
        problems.append(f"{label} has invalid range {start!r}..{end!r}")
        return None
    return float(start), float(end)


def _check_frame_alignment(value: float, fps: float, label: str, problems: list[str]) -> None:
    nearest = round(value * fps) / fps
    if abs(value - nearest) > 1e-4:
        problems.append(f"{label}={value} is not aligned to {fps:g}fps (nearest {nearest:.6f})")


def check(path: Path) -> dict[str, Any]:
    plan = load(path)
    problems: list[str] = []

    if plan.get("schema") != SCHEMA:
        problems.append(f"schema must be {SCHEMA!r}")
    _required_text(plan, "project_id", "plan", problems)
    production_mode = plan.get("production_mode")
    if production_mode not in PRODUCTION_MODES:
        problems.append(f"production_mode must be one of {PRODUCTION_MODES}")

    timeline = plan.get("timeline")
    if not isinstance(timeline, dict):
        problems.append("timeline must be an object")
        timeline = {}
    duration = timeline.get("duration_seconds")
    fps = timeline.get("fps")
    if not _number(duration) or duration <= 0:
        problems.append("timeline.duration_seconds must be a positive number")
        duration = 0.0
    else:
        duration = float(duration)
    if not _number(fps) or fps <= 0:
        problems.append("timeline.fps must be a positive number")
        fps = 1.0
    else:
        fps = float(fps)
    if timeline.get("aspect") not in ("16:9", "9:16", "4:5"):
        problems.append("timeline.aspect must be one of 16:9, 9:16, 4:5")

    acts = plan.get("acts")
    if not isinstance(acts, list) or not acts:
        problems.append("acts must be a non-empty list")
        acts = []
    act_ranges: dict[str, tuple[float, float]] = {}
    for index, act in enumerate(acts):
        label = f"acts[{index}]"
        if not isinstance(act, dict):
            problems.append(f"{label} must be an object")
            continue
        _required_text(act, "id", label, problems)
        act_id = act.get("id")
        if isinstance(act_id, str) and act_id:
            if act_id in act_ranges:
                problems.append(f"{label}.id duplicates {act_id!r}")
        times = _range(act, label, problems)
        if times and isinstance(act_id, str) and act_id:
            act_ranges[act_id] = times
            _check_frame_alignment(times[0], fps, f"{label}.start", problems)
            _check_frame_alignment(times[1], fps, f"{label}.end", problems)
            if times[1] > duration + 1e-6:
                problems.append(f"{label}.end exceeds timeline duration")
        for energy_key in ("energy_start", "energy_peak", "energy_end"):
            energy = act.get(energy_key)
            if not isinstance(energy, int) or isinstance(energy, bool) or not 1 <= energy <= 5:
                problems.append(f"{label}.{energy_key} must be an integer from 1 to 5")

    scenes = plan.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        problems.append("scenes must be a non-empty list")
        scenes = []
    scene_ranges: list[tuple[float, float, str]] = []
    scene_ids: set[str] = set()
    for index, scene in enumerate(scenes):
        label = f"scenes[{index}]"
        if not isinstance(scene, dict):
            problems.append(f"{label} must be an object")
            continue
        _required_text(scene, "id", label, problems)
        scene_id = scene.get("id")
        if isinstance(scene_id, str) and scene_id:
            if scene_id in scene_ids:
                problems.append(f"{label}.id duplicates {scene_id!r}")
            scene_ids.add(scene_id)

        act_world = scene.get("act_world")
        if not isinstance(act_world, str) or act_world not in act_ranges:
            problems.append(f"{label}.act_world {act_world!r} does not match an act id")
        times = _range(scene, label, problems)
        if times:
            start, end = times
            scene_ranges.append((start, end, str(scene_id or label)))
            _check_frame_alignment(start, fps, f"{label}.start", problems)
            _check_frame_alignment(end, fps, f"{label}.end", problems)
            if end > duration + 1e-6:
                problems.append(f"{label}.end exceeds timeline duration")
            if isinstance(act_world, str) and act_world in act_ranges:
                act_start, act_end = act_ranges[act_world]
                if start < act_start - 1e-6 or end > act_end + 1e-6:
                    problems.append(f"{label} falls outside act {act_world!r}")
            hero_time = scene.get("hero_time")
            if not _number(hero_time) or not start <= float(hero_time) < end:
                problems.append(f"{label}.hero_time must fall inside the scene range")

        spoken_line = scene.get("spoken_line")
        if "silent" in scene and not isinstance(scene.get("silent"), bool):
            problems.append(f"{label}.silent must be boolean when present")
        if not isinstance(scene.get("source_only"), bool):
            problems.append(f"{label}.source_only must be boolean")
        silent = scene.get("silent") is True
        source_only = scene.get("source_only") is True
        if not isinstance(spoken_line, str) or (not spoken_line.strip() and not (silent or source_only)):
            problems.append(f"{label}.spoken_line may be empty only for silent or source-only scenes")
        for key in ("viewer_response", "visual_proof", "camera_verb", "sound_cue"):
            _required_text(scene, key, label, problems)
        if scene.get("narrative_job") not in NARRATIVE_JOBS:
            problems.append(f"{label}.narrative_job is invalid")
        if scene.get("source_mode") not in SOURCE_MODES:
            problems.append(f"{label}.source_mode is invalid")
        energy = scene.get("energy")
        if not isinstance(energy, int) or isinstance(energy, bool) or not 1 <= energy <= 5:
            problems.append(f"{label}.energy must be an integer from 1 to 5")
        if not isinstance(scene.get("risks"), list):
            problems.append(f"{label}.risks must be an array")

        motion = scene.get("motion")
        if not isinstance(motion, dict):
            problems.append(f"{label}.motion must be an object")
        else:
            for phase in MOTION_PHASES:
                _required_text(motion, phase, f"{label}.motion", problems)

    tolerance = 0.5 / fps
    sorted_ranges = sorted(scene_ranges)
    cursor = 0.0
    coverage_gaps = 0
    for start, end, scene_id in sorted_ranges:
        if start > cursor + tolerance:
            coverage_gaps += 1
            problems.append(f"coverage gap {cursor:.3f}..{start:.3f} before scene {scene_id!r}")
        elif start < cursor - tolerance:
            problems.append(f"scene {scene_id!r} overlaps previous coverage at {start:.3f}")
        cursor = max(cursor, end)
    if duration and cursor < duration - tolerance:
        coverage_gaps += 1
        problems.append(f"coverage gap {cursor:.3f}..{duration:.3f} at timeline tail")

    interventions = plan.get("interventions")
    if not isinstance(interventions, list):
        problems.append("interventions must be an array")

    targets = plan.get("review_targets")
    if not isinstance(targets, dict):
        problems.append("review_targets must be an object")
    else:
        reel = targets.get("motion_reel_scene_ids")
        if not isinstance(reel, list) or not reel:
            problems.append("review_targets.motion_reel_scene_ids must be a non-empty array")
        else:
            for scene_id in reel:
                if scene_id not in scene_ids:
                    problems.append(f"motion reel references unknown scene {scene_id!r}")
        pairs = targets.get("transition_pairs")
        if not isinstance(pairs, list):
            problems.append("review_targets.transition_pairs must be an array")
        else:
            for index, pair in enumerate(pairs):
                if not isinstance(pair, list) or len(pair) != 2 or any(item not in scene_ids for item in pair):
                    problems.append(f"transition_pairs[{index}] must reference two known scenes")

    if problems:
        raise ScenePlanError(f"{path}: " + "; ".join(problems))
    return {
        "ok": True,
        "path": str(path),
        "schema": SCHEMA,
        "production_mode": production_mode,
        "acts": len(acts),
        "scenes": len(scenes),
        "interventions": len(interventions),
        "coverage_gaps": coverage_gaps,
        "duration_seconds": duration,
        "fps": fps,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path, help="scene-plan.json")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="validate and print a JSON report")
    group.add_argument("--extract", action="store_true", help="print normalized JSON")
    args = parser.parse_args()
    try:
        if args.extract:
            print(json.dumps(load(args.path), ensure_ascii=False, indent=2))
        else:
            print(json.dumps(check(args.path), ensure_ascii=False, indent=2))
    except ScenePlanError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
