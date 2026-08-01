#!/usr/bin/env python3
"""Validate VidMuse Recut evaluation artifacts.

The v1 Packaging contract remains readable. Director-mode v2 adds semantic
approval checks that JSON Schema alone cannot express: rendered evidence for
completed passes, required review gates, closed material findings, and all
quality stop conditions passing before status may become approved.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SCHEMA_V1 = "vidmuse.packaging.evaluation.v1"
SCHEMA_V2 = "vidmuse.recut.evaluation.v2"
STATUSES = ("pending", "needs_revision", "ready", "approved", "rejected")
PASS_STATUSES = ("pending", "pass", "fail")
STOP_KEYS = (
    "opening_promise",
    "major_claim_visual_proof",
    "energy_variation",
    "signature_sequence",
    "act_world_coherence",
    "source_motion_sound_integration",
    "hero_frames",
    "motion_handoffs",
    "technical_integrity",
    "dialogue_and_sound",
)
REQUIRED_APPROVAL_PASSES = (
    "hero_frame_passes",
    "motion_reel_passes",
    "act_review",
    "full_film_review",
    "correction_review",
    "final_polish",
)
ALL_PASS_GROUPS = REQUIRED_APPROVAL_PASSES


class EvaluationError(ValueError):
    pass


def load(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise EvaluationError(f"{path}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise EvaluationError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise EvaluationError(f"{path}: root must be an object")
    return value


def _text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _check_v1(value: dict[str, Any], path: Path) -> dict[str, Any]:
    problems: list[str] = []
    for key in ("project_id", "status", "render", "hard_checks", "aesthetic_review", "feedback"):
        if key not in value:
            problems.append(f"v1 missing {key}")
    if value.get("status") not in STATUSES:
        problems.append("v1 status is invalid")
    if problems:
        raise EvaluationError(f"{path}: " + "; ".join(problems))
    return {
        "ok": True,
        "path": str(path),
        "schema": SCHEMA_V1,
        "production_mode": "packaging",
        "status": value.get("status"),
        "compatibility": "v1",
    }


def _check_passes(review_passes: Any, problems: list[str]) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(review_passes, dict):
        problems.append("review_passes must be an object")
        return {key: [] for key in ALL_PASS_GROUPS}
    normalized: dict[str, list[dict[str, Any]]] = {}
    for group in ALL_PASS_GROUPS:
        passes = review_passes.get(group)
        if not isinstance(passes, list):
            problems.append(f"review_passes.{group} must be an array")
            normalized[group] = []
            continue
        normalized[group] = [item for item in passes if isinstance(item, dict)]
        if len(normalized[group]) != len(passes):
            problems.append(f"review_passes.{group} entries must be objects")
        for index, item in enumerate(normalized[group]):
            label = f"review_passes.{group}[{index}]"
            if not _text(item.get("id")):
                problems.append(f"{label}.id must be non-empty text")
            status = item.get("status")
            if status not in PASS_STATUSES:
                problems.append(f"{label}.status is invalid")
            evidence = item.get("evidence")
            if not isinstance(evidence, list):
                problems.append(f"{label}.evidence must be an array")
            elif status == "pass" and not any(_text(entry) for entry in evidence):
                problems.append(f"{label} passed without rendered evidence")
            findings = item.get("findings")
            if not isinstance(findings, list) or any(not isinstance(entry, str) for entry in findings):
                problems.append(f"{label}.findings must be an array of finding ids")
    return normalized


def check(path: Path) -> dict[str, Any]:
    value = load(path)
    schema = value.get("schema")
    if schema == SCHEMA_V1:
        return _check_v1(value, path)
    if schema != SCHEMA_V2:
        raise EvaluationError(f"{path}: schema must be {SCHEMA_V1!r} or {SCHEMA_V2!r}")

    problems: list[str] = []
    if not _text(value.get("project_id")):
        problems.append("project_id must be non-empty text")
    if value.get("production_mode") != "director":
        problems.append("v2 production_mode must be 'director'")
    status = value.get("status")
    if status not in STATUSES:
        problems.append(f"status must be one of {STATUSES}")

    renders = value.get("renders")
    if not isinstance(renders, dict):
        problems.append("renders must be an object")
        renders = {}
    hero_frames = renders.get("hero_frames")
    if not isinstance(hero_frames, list):
        problems.append("renders.hero_frames must be an array")
        hero_frames = []
    else:
        for index, frame in enumerate(hero_frames):
            if not isinstance(frame, dict) or not _text(frame.get("scene_id")) or not _text(frame.get("path")):
                problems.append(f"renders.hero_frames[{index}] needs scene_id and path")
    act_renders = renders.get("act_renders")
    if not isinstance(act_renders, list):
        problems.append("renders.act_renders must be an array")
    for key in ("motion_reel", "full_draft", "final"):
        if key not in renders or not (renders[key] is None or _text(renders[key])):
            problems.append(f"renders.{key} must be a path or null")

    pass_groups = _check_passes(value.get("review_passes"), problems)

    findings = value.get("findings")
    if not isinstance(findings, list):
        problems.append("findings must be an array")
        findings = []
    finding_ids: set[str] = set()
    open_material: list[str] = []
    for index, finding in enumerate(findings):
        label = f"findings[{index}]"
        if not isinstance(finding, dict):
            problems.append(f"{label} must be an object")
            continue
        finding_id = finding.get("id")
        if not _text(finding_id):
            problems.append(f"{label}.id must be non-empty text")
            continue
        if finding_id in finding_ids:
            problems.append(f"{label}.id duplicates {finding_id!r}")
        finding_ids.add(finding_id)
        severity = finding.get("severity")
        finding_status = finding.get("status")
        if severity not in ("critical", "major", "minor"):
            problems.append(f"{label}.severity is invalid")
        if finding_status not in ("open", "resolved", "waived"):
            problems.append(f"{label}.status is invalid")
        if not _text(finding.get("target")) or not _text(finding.get("note")):
            problems.append(f"{label} needs target and note")
        evidence = finding.get("evidence")
        if not isinstance(evidence, list):
            problems.append(f"{label}.evidence must be an array")
        if finding_status == "waived" and not _text(finding.get("waiver_reason")):
            problems.append(f"{label}.waiver_reason is required when waived")
        if severity in ("critical", "major") and finding_status == "open":
            open_material.append(str(finding_id))

    for group, passes in pass_groups.items():
        for index, review_pass in enumerate(passes):
            for finding_id in review_pass.get("findings", []):
                if finding_id not in finding_ids:
                    problems.append(
                        f"review_passes.{group}[{index}] references unknown finding {finding_id!r}"
                    )

    history = value.get("correction_history")
    if not isinstance(history, list):
        problems.append("correction_history must be an array")
        history = []
    referenced_findings: set[str] = set()
    for index, correction in enumerate(history):
        label = f"correction_history[{index}]"
        if not isinstance(correction, dict):
            problems.append(f"{label} must be an object")
            continue
        ids = correction.get("finding_ids")
        if not isinstance(ids, list) or any(item not in finding_ids for item in ids):
            problems.append(f"{label}.finding_ids must reference known findings")
        else:
            referenced_findings.update(ids)
        if not _text(correction.get("action")) or not _text(correction.get("evidence")):
            problems.append(f"{label} needs action and evidence")

    for finding in findings:
        if isinstance(finding, dict) and finding.get("severity") in ("critical", "major") and finding.get("status") == "resolved":
            if finding.get("id") not in referenced_findings:
                problems.append(f"resolved material finding {finding.get('id')!r} has no correction history")

    stop_conditions = value.get("stop_conditions")
    if not isinstance(stop_conditions, dict):
        problems.append("stop_conditions must be an object")
        stop_conditions = {}
    missing_stops = [key for key in STOP_KEYS if key not in stop_conditions]
    extra_stops = [key for key in stop_conditions if key not in STOP_KEYS]
    if missing_stops:
        problems.append(f"stop_conditions missing {', '.join(missing_stops)}")
    if extra_stops:
        problems.append(f"stop_conditions has unknown keys {', '.join(extra_stops)}")
    for key in STOP_KEYS:
        if key in stop_conditions and stop_conditions[key] not in ("pending", "pass", "fail"):
            problems.append(f"stop_conditions.{key} is invalid")

    if not isinstance(value.get("feedback"), dict):
        problems.append("feedback must be an object")

    if status == "approved":
        if any(stop_conditions.get(key) != "pass" for key in STOP_KEYS):
            problems.append("approved status requires every stop condition to pass")
        if open_material:
            problems.append(f"approved status has open material findings: {', '.join(open_material)}")
        for group in REQUIRED_APPROVAL_PASSES:
            if not any(item.get("status") == "pass" for item in pass_groups[group]):
                problems.append(f"approved status requires a passed {group} entry")
        if not hero_frames:
            problems.append("approved status requires rendered hero frames")
        for key in ("motion_reel", "full_draft", "final"):
            if not _text(renders.get(key)):
                problems.append(f"approved status requires renders.{key}")

    if problems:
        raise EvaluationError(f"{path}: " + "; ".join(problems))
    return {
        "ok": True,
        "path": str(path),
        "schema": SCHEMA_V2,
        "production_mode": "director",
        "status": status,
        "hero_frames": len(hero_frames),
        "findings": len(findings),
        "open_material_findings": len(open_material),
        "stop_conditions_passed": sum(stop_conditions.get(key) == "pass" for key in STOP_KEYS),
        "approval_pass_groups": sum(
            any(item.get("status") == "pass" for item in pass_groups[group])
            for group in REQUIRED_APPROVAL_PASSES
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path, help="evaluation.json")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="validate and print a JSON report")
    group.add_argument("--extract", action="store_true", help="print normalized JSON")
    args = parser.parse_args()
    try:
        if args.extract:
            print(json.dumps(load(args.path), ensure_ascii=False, indent=2))
        else:
            print(json.dumps(check(args.path), ensure_ascii=False, indent=2))
    except EvaluationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
