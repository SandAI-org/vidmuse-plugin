#!/usr/bin/env python3
"""Freeze and verify the selected VidMuse design as production input.

The direction showcase is not a mood board after the user chooses it. Design
promotes every approved treatment into a reusable HTML sub-composition, shares
one CSS file between showcase and production, and records hashes in
``design-lock.json``. Production mounts those exact HTML files via
``data-composition-src`` instead of redrawing them.

Examples:
  design_lock.py <work-dir> --create --selected-direction "C / Soft Documentary"
  design_lock.py <work-dir> --check
  design_lock.py <work-dir> --check --require-pairs \
    --pair time-compression=design-evidence/rendered/time-compression.png
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

import frame_md


SCHEMA = "vidmuse.design.lock.v1"
LOCK_NAME = "design-lock.json"
SHARED_CSS = Path("design-system/selected-system.css")
SHOWCASE = Path("frame-showcase.html")


class DesignLockError(ValueError):
    pass


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _project_path(work: Path, relative: str | Path, label: str) -> Path:
    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise DesignLockError(f"{label} must be a project-relative path")
    resolved = (work / candidate).resolve()
    try:
        resolved.relative_to(work.resolve())
    except ValueError as exc:
        raise DesignLockError(f"{label} escapes the project: {relative}") from exc
    return resolved


def _receipt(work: Path, relative: str | Path, label: str) -> dict[str, str]:
    path = _project_path(work, relative, label)
    if not path.is_file():
        raise DesignLockError(f"{label} missing: {path}")
    return {"path": str(Path(relative)), "sha256": sha256(path)}


def _load_frame(work: Path) -> dict[str, Any]:
    path = work / "FRAME.md"
    report = frame_md.check(path)
    spec = frame_md.load_design_document(path)
    if spec.get("film_mode") != "recut-packaging":
        raise DesignLockError("design-lock is currently required only for recut-packaging projects")
    if not report.get("treatments"):
        raise DesignLockError("FRAME.md has no executable treatment contract")
    return spec


def create_lock(work: Path, selected_direction: str) -> dict[str, Any]:
    work = work.resolve()
    if not selected_direction.strip():
        raise DesignLockError("--selected-direction must name the user's approved direction")
    spec = _load_frame(work)
    showcase = _receipt(work, SHOWCASE, "selected showcase")
    shared_css = _receipt(work, SHARED_CSS, "shared selected-system CSS")
    showcase_text = (work / SHOWCASE).read_text(encoding="utf-8", errors="replace")

    treatments: dict[str, Any] = {}
    for treatment_id, contract in spec["treatments"].items():
        source = _receipt(work, contract["source"], f"{treatment_id} source")
        approved = _receipt(work, contract["approved_frame"], f"{treatment_id} approved frame")
        source_text = _project_path(work, contract["source"], f"{treatment_id} source").read_text(
            encoding="utf-8", errors="replace"
        )
        if SHARED_CSS.name not in source_text:
            raise DesignLockError(
                f"{treatment_id} source must import {SHARED_CSS}; "
                "showcase and production need the same CSS bytes"
            )
        if contract["source"] not in showcase_text:
            raise DesignLockError(
                f"selected showcase does not mount {contract['source']} for {treatment_id}"
            )
        treatments[treatment_id] = {
            "weight": contract["weight"],
            "surface": contract["surface"],
            "backing": contract["backing"],
            "required_in_production": contract["required_in_production"],
            "max_instances": contract["max_instances"],
            "source": source,
            "approved_frame": approved,
        }

    lock = {
        "schema": SCHEMA,
        "project": spec["project"],
        "selected_direction": selected_direction.strip(),
        "frame_md": _receipt(work, "FRAME.md", "FRAME.md"),
        "showcase": showcase,
        "shared_css": shared_css,
        "treatments": treatments,
    }
    (work / LOCK_NAME).write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return lock


def _read_lock(work: Path) -> dict[str, Any]:
    path = work / LOCK_NAME
    try:
        lock = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise DesignLockError(f"{LOCK_NAME} missing: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise DesignLockError(f"{LOCK_NAME} is invalid JSON: {exc}") from exc
    if not isinstance(lock, dict) or lock.get("schema") != SCHEMA:
        raise DesignLockError(f"{LOCK_NAME} must use schema {SCHEMA}")
    return lock


def _verify_receipt(work: Path, receipt: Any, label: str, findings: list[dict[str, str]]) -> None:
    if not isinstance(receipt, dict) or not isinstance(receipt.get("path"), str) or not isinstance(receipt.get("sha256"), str):
        findings.append({"target": label, "error": "invalid hash receipt"})
        return
    try:
        path = _project_path(work, receipt["path"], label)
    except DesignLockError as exc:
        findings.append({"target": label, "error": str(exc)})
        return
    if not path.is_file():
        findings.append({"target": label, "error": f"locked file missing: {path}"})
    elif sha256(path) != receipt["sha256"]:
        findings.append({
            "target": label,
            "error": "approved design bytes changed after selection; update the showcase through VidMuse Design and create a new lock",
        })


class _MountParser(HTMLParser):
    def __init__(self, source_file: Path) -> None:
        super().__init__()
        self.source_file = source_file
        self.mounts: list[dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value for key, value in attrs}
        treatment_id = values.get("data-treatment-id")
        if not treatment_id:
            return
        self.mounts.append({
            "file": str(self.source_file),
            "tag": tag,
            "id": treatment_id,
            "source": values.get("data-composition-src"),
            "surface": values.get("data-treatment-surface"),
            "weight": values.get("data-treatment-weight"),
            "start": values.get("data-start"),
            "duration": values.get("data-duration"),
        })


def _production_mounts(work: Path) -> tuple[list[dict[str, Any]], list[Path]]:
    files = sorted((work / "public").glob("**/*.html")) if (work / "public").is_dir() else []
    mounts: list[dict[str, Any]] = []
    for path in files:
        parser = _MountParser(path)
        parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        mounts.extend(parser.mounts)
    return mounts, files


def _float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _compare_images(approved: Path, rendered: Path, pixel_threshold: int, changed_limit: float, mean_limit: float) -> dict[str, Any]:
    try:
        import cv2
    except ImportError:
        return {"pass": False, "error": "opencv missing: design comparison cannot be skipped"}
    expected = cv2.imread(str(approved))
    actual = cv2.imread(str(rendered))
    if expected is None or actual is None:
        return {"pass": False, "error": f"unreadable comparison image: {approved if expected is None else rendered}"}
    eh, ew = expected.shape[:2]
    ah, aw = actual.shape[:2]
    if abs(ew / eh - aw / ah) > 0.01:
        return {"pass": False, "error": f"aspect mismatch: approved {ew}x{eh}, rendered {aw}x{ah}"}
    if (eh, ew) != (ah, aw):
        actual = cv2.resize(actual, (ew, eh))
    diff = cv2.absdiff(expected, actual)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    changed_share = float((gray > pixel_threshold).mean())
    mean_abs_diff = float(gray.mean())
    passed = changed_share <= changed_limit and mean_abs_diff <= mean_limit
    return {
        "pass": passed,
        "approved": str(approved),
        "rendered": str(rendered),
        "changed_share": round(changed_share, 4),
        "mean_abs_diff": round(mean_abs_diff, 3),
        "limits": {"changed_share": changed_limit, "mean_abs_diff": mean_limit},
        **({} if passed else {"error": "rendered treatment materially differs from its approved frame"}),
    }


def check_lock(
    work: Path,
    pairs: dict[str, Path] | None = None,
    require_pairs: bool = False,
    pixel_threshold: int = 20,
    changed_limit: float = 0.08,
    mean_limit: float = 12.0,
) -> dict[str, Any]:
    work = work.resolve()
    spec = _load_frame(work)
    lock = _read_lock(work)
    findings: list[dict[str, str]] = []
    for key in ("frame_md", "showcase", "shared_css"):
        _verify_receipt(work, lock.get(key), key, findings)

    locked_treatments = lock.get("treatments")
    if not isinstance(locked_treatments, dict):
        findings.append({"target": "treatments", "error": "lock treatments must be an object"})
        locked_treatments = {}
    current_ids = set(spec["treatments"])
    if set(locked_treatments) != current_ids:
        findings.append({"target": "treatments", "error": "FRAME.md treatment ids differ from the approved lock"})
    for treatment_id, contract in spec["treatments"].items():
        locked = locked_treatments.get(treatment_id)
        if not isinstance(locked, dict):
            findings.append({"target": treatment_id, "error": "treatment missing from lock"})
            continue
        for key in ("weight", "surface", "backing", "required_in_production", "max_instances"):
            if locked.get(key) != contract.get(key):
                findings.append({"target": treatment_id, "error": f"{key} changed after approval"})
        _verify_receipt(work, locked.get("source"), f"{treatment_id}.source", findings)
        _verify_receipt(work, locked.get("approved_frame"), f"{treatment_id}.approved_frame", findings)

    mounts, public_files = _production_mounts(work)
    if public_files and not mounts:
        findings.append({
            "target": "public",
            "error": "production HTML has no data-treatment-id mounts; approved treatments must be mounted, not redrawn",
        })
    counts: dict[str, int] = {}
    chronological: list[tuple[float, str, str, float]] = []
    for mount in mounts:
        treatment_id = str(mount["id"])
        counts[treatment_id] = counts.get(treatment_id, 0) + 1
        contract = spec["treatments"].get(treatment_id)
        if not isinstance(contract, dict):
            findings.append({"target": mount["file"], "error": f"unknown treatment id {treatment_id}"})
            continue
        if mount.get("surface") != contract["surface"]:
            findings.append({"target": treatment_id, "error": "production surface does not match FRAME.md"})
        if mount.get("weight") != contract["weight"]:
            findings.append({"target": treatment_id, "error": "production weight does not match FRAME.md"})
        source_value = mount.get("source")
        if not isinstance(source_value, str) or not source_value:
            findings.append({"target": treatment_id, "error": "missing data-composition-src; treatment was likely reimplemented"})
        else:
            mounted_path = (Path(mount["file"]).parent / source_value.split("?", 1)[0].split("#", 1)[0]).resolve()
            approved_path = _project_path(work, contract["source"], f"{treatment_id}.source")
            if mounted_path != approved_path:
                findings.append({"target": treatment_id, "error": "data-composition-src is not the approved treatment source"})
        start = _float(mount.get("start"))
        duration = _float(mount.get("duration"))
        if start is None or duration is None or duration <= 0:
            findings.append({"target": treatment_id, "error": "production mount needs numeric data-start/data-duration"})
        else:
            chronological.append((start, treatment_id, contract["surface"], duration))

    for treatment_id, contract in spec["treatments"].items():
        count = counts.get(treatment_id, 0)
        if contract["required_in_production"] and count == 0 and public_files:
            findings.append({"target": treatment_id, "error": "required treatment is absent from production"})
        if count > contract["max_instances"]:
            findings.append({
                "target": treatment_id,
                "error": f"used {count} times, over approved max_instances={contract['max_instances']}",
            })
    panel_count = sum(1 for _, _, surface, _ in chronological if surface == "panel")
    if panel_count > 2:
        findings.append({"target": "panel-budget", "error": f"{panel_count} panel-card mounts exceed the Packaging limit of 2"})
    ordered = sorted(chronological)
    for previous, current in zip(ordered, ordered[1:]):
        if previous[2] == current[2] == "panel":
            findings.append({"target": "panel-budget", "error": f"panel treatments {previous[1]} and {current[1]} occur consecutively"})
    metadata_path = work / "metadata.json"
    if metadata_path.is_file():
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            film_duration = _float(metadata.get("duration")) if isinstance(metadata, dict) else None
        except json.JSONDecodeError:
            film_duration = None
        if film_duration and film_duration > 0:
            intervals = sorted(
                (start, min(film_duration, start + duration))
                for start, _, surface, duration in chronological
                if surface == "panel"
            )
            occupied = 0.0
            cursor = 0.0
            for start, end in intervals:
                occupied += max(0.0, end - max(start, cursor))
                cursor = max(cursor, end)
            share = occupied / film_duration
            if share > 0.2:
                findings.append({
                    "target": "panel-budget",
                    "error": f"panel treatments occupy {share:.0%} of runtime, over the Packaging limit of 20%",
                })

    comparisons: dict[str, Any] = {}
    supplied_pairs = pairs or {}
    used_ids = set(counts)
    required_comparisons = used_ids if public_files else set()
    if require_pairs:
        missing = sorted(required_comparisons - set(supplied_pairs))
        if missing:
            findings.append({"target": "design-comparison", "error": f"missing rendered comparisons for {', '.join(missing)}"})
    for treatment_id, rendered in supplied_pairs.items():
        locked = locked_treatments.get(treatment_id)
        if not isinstance(locked, dict):
            findings.append({"target": treatment_id, "error": "comparison names an unlocked treatment"})
            continue
        approved_receipt = locked.get("approved_frame") or {}
        approved = _project_path(work, approved_receipt.get("path", ""), f"{treatment_id}.approved_frame")
        rendered_path = rendered if rendered.is_absolute() else (work / rendered).resolve()
        result = _compare_images(approved, rendered_path, pixel_threshold, changed_limit, mean_limit)
        comparisons[treatment_id] = result
        if not result.get("pass"):
            findings.append({"target": treatment_id, "error": str(result.get("error"))})

    return {
        "schema": SCHEMA,
        "work_dir": str(work),
        "selected_direction": lock.get("selected_direction"),
        "pass": not findings,
        "coverage": "full" if (not require_pairs or required_comparisons <= set(supplied_pairs)) else "partial",
        "treatments": len(locked_treatments),
        "production_mounts": len(mounts),
        "panel_mounts": panel_count,
        "comparisons": comparisons,
        "findings": findings,
    }


def _parse_pairs(work: Path, specs: list[str]) -> dict[str, Path]:
    pairs: dict[str, Path] = {}
    for spec in specs:
        treatment_id, separator, path = spec.partition("=")
        if not separator or not treatment_id.strip() or not path.strip():
            raise DesignLockError(f"invalid --pair {spec!r}; expected treatment-id=rendered.png")
        if treatment_id in pairs:
            raise DesignLockError(f"duplicate --pair for {treatment_id}")
        candidate = Path(path)
        pairs[treatment_id] = candidate if candidate.is_absolute() else _project_path(work, candidate, "rendered pair")
    return pairs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", type=Path)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--create", action="store_true")
    action.add_argument("--check", action="store_true")
    parser.add_argument("--selected-direction", default="")
    parser.add_argument("--pair", action="append", default=[], metavar="TREATMENT=RENDERED")
    parser.add_argument("--require-pairs", action="store_true")
    parser.add_argument("--pixel-threshold", type=int, default=20)
    parser.add_argument("--changed-limit", type=float, default=0.08)
    parser.add_argument("--mean-limit", type=float, default=12.0)
    args = parser.parse_args()
    work = args.work_dir.resolve()
    try:
        if args.create:
            result = create_lock(work, args.selected_direction)
            result = {"ok": True, "path": str(work / LOCK_NAME), **result}
        else:
            pairs = _parse_pairs(work, args.pair)
            result = check_lock(
                work,
                pairs=pairs,
                require_pairs=args.require_pairs,
                pixel_threshold=args.pixel_threshold,
                changed_limit=args.changed_limit,
                mean_limit=args.mean_limit,
            )
    except (DesignLockError, frame_md.FrameMdError) as exc:
        print(json.dumps({"pass": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("pass", result.get("ok", False)) else 1


if __name__ == "__main__":
    sys.exit(main())
