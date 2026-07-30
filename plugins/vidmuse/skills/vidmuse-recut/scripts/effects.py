#!/usr/bin/env python3
"""Merge the live HyperFrames catalog with VidMuse's taste overlay.

The HyperFrames registry owns executable effect code.  This script adds only
VidMuse editorial metadata: when to use an item, intervention weight, zones,
integration mode, and compatibility notes.  It never copies or rewrites the
upstream implementation.

Examples:
  effects.py --index
  effects.py hf:lt-clean-bar,hf:motion-blur --get
  effects.py --validate
  effects.py --check-affinity ../vidmuse-design/data/style-packs.jsonl
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OVERLAY = ROOT / "data" / "effects-overlay.jsonl"
WEIGHTS = {"bare-text", "emphasis", "line-mark", "camera", "diagram", "panel-card", "grammar"}
INTEGRATION_MODES = {
    "sub-composition-adapt",
    "inline-component-adapt",
    "timeline-hook",
    "native-composition",
}
PRODUCTION_COSTS = {"low", "medium", "high", "very-high"}
REQUIRED_OVERLAY_FIELDS = {
    "id",
    "upstream_id",
    "source",
    "curation_status",
    "weight",
    "description",
    "use_when",
    "avoid",
    "zones",
    "integration_mode",
    "theme_strategy",
    "compatibility",
}


class EffectsError(ValueError):
    pass


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, raw in enumerate(handle, start=1):
            line = raw.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise EffectsError(f"{path}:{line_number}: {exc}") from exc
            if not isinstance(record, dict):
                raise EffectsError(f"{path}:{line_number}: record must be an object")
            records.append(record)
    return records


def validate_overlay(records: list[dict[str, Any]]) -> None:
    seen: set[str] = set()
    for record in records:
        missing = sorted(REQUIRED_OVERLAY_FIELDS - set(record))
        if missing:
            raise EffectsError(f"{record.get('id', '<unknown>')}: missing fields {missing}")
        record_id = str(record["id"])
        upstream_id = str(record["upstream_id"])
        source = str(record.get("source"))
        expected_prefix = {
            "hyperframes-registry": "hf",
            "vidmuse-native": "native",
        }.get(source)
        if expected_prefix is None:
            raise EffectsError(f"{record_id}: unsupported source {source!r}")
        if record_id != f"{expected_prefix}:{upstream_id}":
            raise EffectsError(
                f"{record_id}: id must equal {expected_prefix}:<upstream_id>"
            )
        if record_id in seen:
            raise EffectsError(f"duplicate overlay id: {record_id}")
        seen.add(record_id)
        if source == "vidmuse-native":
            native_path = record.get("native_path")
            if not isinstance(native_path, str) or not native_path:
                raise EffectsError(f"{record_id}: native_path is required")
            candidate = (ROOT / native_path).resolve()
            native_root = (ROOT / "library" / "native").resolve()
            if native_root not in candidate.parents or not candidate.is_file():
                raise EffectsError(
                    f"{record_id}: native_path must point to a file under library/native"
                )
        if record.get("weight") not in WEIGHTS:
            raise EffectsError(f"{record_id}: unknown weight {record.get('weight')!r}")
        if record.get("integration_mode") not in INTEGRATION_MODES:
            raise EffectsError(f"{record_id}: unknown integration_mode {record.get('integration_mode')!r}")
        for field in ("use_when", "avoid", "zones"):
            if not isinstance(record.get(field), list):
                raise EffectsError(f"{record_id}: {field} must be an array")
        compatibility = record.get("compatibility")
        if not isinstance(compatibility, dict) or not compatibility.get("status"):
            raise EffectsError(f"{record_id}: compatibility.status is required")
        if "director_capabilities" in record:
            capabilities = record.get("director_capabilities")
            if not isinstance(capabilities, list) or not capabilities:
                raise EffectsError(f"{record_id}: director_capabilities must be a non-empty array")
        if "production_cost" in record and record.get("production_cost") not in PRODUCTION_COSTS:
            raise EffectsError(
                f"{record_id}: unknown production_cost {record.get('production_cost')!r}"
            )
        if "proof_requirements" in record:
            requirements = record.get("proof_requirements")
            if not isinstance(requirements, list) or not requirements:
                raise EffectsError(f"{record_id}: proof_requirements must be a non-empty array")


def hyperframes_command() -> list[str]:
    configured = os.environ.get("HYPERFRAMES_BIN")
    if configured:
        return [configured]
    installed = shutil.which("hyperframes")
    if installed:
        return [installed]
    return ["npx", "hyperframes"]


def load_catalog(path: Path | None) -> list[dict[str, Any]]:
    if path is not None:
        payload = json.loads(path.read_text(encoding="utf-8"))
    else:
        result = subprocess.run(
            [*hyperframes_command(), "catalog", "--json"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise EffectsError(result.stderr.strip() or "hyperframes catalog --json failed")
        payload = json.loads(result.stdout)
    if not isinstance(payload, list):
        raise EffectsError("HyperFrames catalog payload must be an array")
    for item in payload:
        if not isinstance(item, dict) or not item.get("name") or item.get("type") not in {"block", "component"}:
            raise EffectsError("each catalog item needs name and type=block|component")
    return payload


def default_integration(item_type: str) -> str:
    return "sub-composition-adapt" if item_type == "block" else "inline-component-adapt"


def merge_catalog(
    catalog: list[dict[str, Any]], overlay: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    registry_overlay = [
        record for record in overlay if record.get("source") == "hyperframes-registry"
    ]
    native_overlay = [record for record in overlay if record.get("source") == "vidmuse-native"]
    overlay_by_upstream = {
        str(record["upstream_id"]): record for record in registry_overlay
    }
    merged: list[dict[str, Any]] = []
    present: set[str] = set()
    for item in catalog:
        upstream_id = str(item["name"])
        present.add(upstream_id)
        record = {
            "id": f"hf:{upstream_id}",
            "upstream_id": upstream_id,
            "source": "hyperframes-registry",
            "type": item["type"],
            "title": item.get("title", upstream_id),
            "description": item.get("description", ""),
            "tags": item.get("tags", []),
            "curation_status": "unreviewed",
            "weight": None,
            "use_when": [],
            "avoid": [],
            "zones": [],
            "integration_mode": default_integration(str(item["type"])),
            "catalog_present": True,
        }
        curated = overlay_by_upstream.get(upstream_id)
        if curated:
            record.update(curated)
            record["type"] = item["type"]
            record["title"] = item.get("title", curated.get("title", upstream_id))
            record["tags"] = item.get("tags", curated.get("tags", []))
            record["catalog_present"] = True
        merged.append(record)

    # Keep curated records visible when the installed catalog has drifted.  The
    # false flag forces the LLM to stop and inspect instead of assuming support.
    for record in registry_overlay:
        if str(record["upstream_id"]) not in present:
            missing = dict(record)
            missing.setdefault("type", "unknown")
            missing.setdefault("title", record["upstream_id"])
            missing.setdefault("tags", [])
            missing["catalog_present"] = False
            merged.append(missing)

    # Native effects are local executable components. They do not depend on a
    # registry catalog item, so validation of native_path is their availability
    # check and catalog_present is true.
    for record in native_overlay:
        local = dict(record)
        local.setdefault("type", "component")
        local.setdefault("title", record["upstream_id"])
        local.setdefault("tags", ["vidmuse-native"])
        local["catalog_present"] = True
        merged.append(local)
    return merged


def validate_affinity(
    packs: list[dict[str, Any]],
    catalog: list[dict[str, Any]],
    overlay: list[dict[str, Any]],
) -> dict[str, Any]:
    """Check Design affinity ids against executable Registry/native mechanisms."""
    known = {f"hf:{item['name']}" for item in catalog}
    known.update(
        str(record["id"])
        for record in overlay
        if record.get("source") == "vidmuse-native"
    )
    referenced: set[str] = set()
    unknown: list[str] = []
    for pack in packs:
        pack_id = str(pack.get("id") or "<unknown-pack>")
        affinity = pack.get("effect_affinity")
        if not isinstance(affinity, dict):
            raise EffectsError(f"{pack_id}: effect_affinity must be an object")
        for bucket in ("prefer", "avoid"):
            ids = affinity.get(bucket)
            if not isinstance(ids, list):
                raise EffectsError(f"{pack_id}: effect_affinity.{bucket} must be an array")
            for effect_id in ids:
                if not isinstance(effect_id, str) or not effect_id:
                    raise EffectsError(
                        f"{pack_id}: effect_affinity.{bucket} contains an invalid id"
                    )
                referenced.add(effect_id)
                if effect_id not in known:
                    unknown.append(f"{pack_id}.{bucket}:{effect_id}")
    if unknown:
        raise EffectsError(
            "unknown effect_affinity ids (not in the supplied/live HyperFrames "
            "catalog or local native effects): "
            + ", ".join(unknown)
        )
    return {
        "ok": True,
        "packs": len(packs),
        "referenced_ids": len(referenced),
        "known_ids": len(known),
        "catalog_source": "validated",
    }


def compact(record: dict[str, Any]) -> dict[str, Any]:
    fields = (
        "id",
        "upstream_id",
        "type",
        "title",
        "weight",
        "description",
        "use_when",
        "avoid",
        "zones",
        "integration_mode",
        "curation_status",
        "catalog_present",
        "tags",
        "source",
        "native_path",
        "director_capabilities",
        "production_cost",
        "proof_requirements",
    )
    return {field: record[field] for field in fields if field in record}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ids", nargs="?", help="Comma-separated hf:<id> or upstream ids, required with --get")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--index", action="store_true", help="Print the merged compact catalog as JSONL")
    action.add_argument("--get", action="store_true", help="Print full merged records for exact ids")
    action.add_argument("--validate", action="store_true", help="Validate the overlay without fetching the catalog")
    action.add_argument(
        "--check-affinity",
        type=Path,
        metavar="PACKS_JSONL",
        help="Validate Design pack effect_affinity ids against the live or saved catalog",
    )
    parser.add_argument("--curated-only", action="store_true", help="Limit --index to reviewed overlay records")
    parser.add_argument("--overlay", type=Path, default=DEFAULT_OVERLAY)
    parser.add_argument("--catalog-file", type=Path, help="Use a saved catalog JSON file instead of the live CLI")
    args = parser.parse_args()

    try:
        overlay = load_jsonl(args.overlay)
        validate_overlay(overlay)
        if args.validate:
            print(json.dumps({"ok": True, "records": len(overlay)}, ensure_ascii=False))
            return 0
        catalog = load_catalog(args.catalog_file)
        if args.check_affinity:
            packs = load_jsonl(args.check_affinity)
            print(
                json.dumps(
                    validate_affinity(packs, catalog, overlay),
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0
        records = merge_catalog(catalog, overlay)
        if args.curated_only:
            records = [record for record in records if record.get("curation_status") != "unreviewed"]
        if args.index:
            for record in records:
                print(json.dumps(compact(record), ensure_ascii=False))
            return 0
        if args.get:
            if not args.ids:
                parser.error("--get requires comma-separated ids")
            by_id: dict[str, dict[str, Any]] = {}
            for record in records:
                by_id[str(record["id"])] = record
                by_id[str(record["upstream_id"])] = record
            requested = [item.strip() for item in args.ids.split(",") if item.strip()]
            print(json.dumps([by_id[item] for item in requested if item in by_id], ensure_ascii=False, indent=2))
            return 0
        parser.error("pass one action")
    except (EffectsError, OSError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
