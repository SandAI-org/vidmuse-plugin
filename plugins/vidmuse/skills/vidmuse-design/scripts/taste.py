#!/usr/bin/env python3
"""Progressive-disclosure access to the VidMuse taste library.

The active aesthetic model has two surfaces that feed one pipeline:

  Compositional (default)
    style atoms → optional reference profiles → project FRAME.md

  Preset / kit (when the user picks a ready look)
    private VidMuse style packs carry FRAME.md tokens
    example kits + showcase projects teach structure and effect casting

Three modes, no search engine:

  --index   compact one-line-per-record digest of a whole domain
  --get     fetch full records by exact id, preserving request order
  --validate validate atoms, profiles, packs, kits, and cross references
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    # Allow `from scripts.taste import validate_library` and direct execution
    # to resolve the sibling FRAME.md parser.
    sys.path.insert(0, str(SCRIPTS_DIR))

DATA_DIR = ROOT / "data"
DOMAINS = {
    "atoms": DATA_DIR / "style-atoms.jsonl",
    "profiles": DATA_DIR / "style-profiles.jsonl",
    "packs": DATA_DIR / "style-packs.jsonl",
    "examples": DATA_DIR / "example-kits.jsonl",
    "showcases": DATA_DIR / "showcase-kits.jsonl",
}

INDEX_FIELDS = (
    "id",
    "name",
    "status",
    "kind",
    "tagline",
    "dimension",
    "category",
    "weight",
    "description",
    "anchor_atoms",
    "suitable_for",
    "avoid_for",
    "use_when",
    "avoid",
    "workflow_fit",
    "workflow_use",
    "format",
    "genre",
    "best_for",
    "style_echo",
    "effect_affinity",
    "palette_preview",
)

REQUIRED_STYLE_DIMENSIONS = (
    "editorial_stance",
    "visual_culture",
    "material",
    "typography",
    "composition",
    "color_logic",
    "motion_temperament",
    "source_relationship",
)

REQUIRED_PACK_FIELDS = (
    "id",
    "version",
    "status",
    "kind",
    "name",
    "tagline",
    "source",
    "anchor_atoms",
    "default_motion",
    "effect_affinity",
    "suitable_for",
    "avoid_for",
    "workflow_fit",
    "adopt",
)

REQUIRED_MOTION = ("dur_fast", "dur_base", "dur_slow", "ease_enter", "ease_exit")


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
                raise ValueError(f"{path}:{line_number}: {exc}") from exc
            if not isinstance(record, dict):
                raise ValueError(f"{path}:{line_number}: record must be an object")
            records.append(record)
    return records


def index(domain: str) -> list[dict[str, Any]]:
    """Compact digest of every record in a domain, for in-context selection."""
    if domain not in DOMAINS:
        raise ValueError(f"unknown domain: {domain}")
    digest: list[dict[str, Any]] = []
    for record in load_jsonl(DOMAINS[domain]):
        entry = {field: record[field] for field in INDEX_FIELDS if field in record}
        # Prefer tagline as the one-line description when present.
        if "tagline" in entry and "description" not in entry:
            entry["description"] = entry["tagline"]
        digest.append(entry)
    return digest


def get(ids: list[str], domain: str) -> list[dict[str, Any]]:
    """Fetch records by exact id with portable and resolved source paths."""
    if domain not in DOMAINS:
        raise ValueError(f"unknown domain: {domain}")
    by_id = {str(record.get("id", "")): record for record in load_jsonl(DOMAINS[domain])}
    return [
        _resolve_source_paths(by_id[record_id])
        for record_id in ids
        if record_id in by_id
    ]


def _resolve_source_paths(record: dict[str, Any]) -> dict[str, Any]:
    """Add execution-safe absolute paths without mutating portable catalog data."""
    enriched = dict(record)
    source = record.get("source")
    if not isinstance(source, dict):
        return enriched
    resolved_source = dict(source)
    resolved_source["skill_root"] = str(ROOT)
    for field in ("local_path", "frame_md", "caption_skin", "showcase"):
        value = source.get(field)
        if isinstance(value, str) and value:
            resolved_source[f"resolved_{field}"] = str((ROOT / value).resolve())
    enriched["source"] = resolved_source
    return enriched


def _require_unique_ids(records: list[dict[str, Any]], domain: str) -> None:
    ids = [str(record.get("id", "")) for record in records]
    missing = [index + 1 for index, record_id in enumerate(ids) if not record_id]
    if missing:
        raise ValueError(f"{domain}: records missing id at lines {missing}")
    duplicates = sorted({record_id for record_id in ids if ids.count(record_id) > 1})
    if duplicates:
        raise ValueError(f"{domain}: duplicate ids: {', '.join(duplicates)}")


def _validate_anchor_set(
    refs: list[Any],
    atoms_by_id: dict[str, dict[str, Any]],
    owner: str,
) -> None:
    if not isinstance(refs, list) or not refs:
        raise ValueError(f"{owner}: anchor_atoms must be a non-empty array")
    unknown = [str(ref) for ref in refs if str(ref) not in atoms_by_id]
    if unknown:
        raise ValueError(f"{owner}: unknown atoms: {', '.join(unknown)}")
    dimensions = [str(atoms_by_id[str(ref)]["dimension"]) for ref in refs]
    missing = [dimension for dimension in REQUIRED_STYLE_DIMENSIONS if dimension not in dimensions]
    repeated = sorted({dimension for dimension in dimensions if dimensions.count(dimension) > 1})
    if missing or repeated:
        detail = []
        if missing:
            detail.append(f"missing {', '.join(missing)}")
        if repeated:
            detail.append(f"repeated {', '.join(repeated)}")
        raise ValueError(f"{owner}: " + "; ".join(detail))


def _validate_packs(
    packs: list[dict[str, Any]],
    atoms_by_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    _require_unique_ids(packs, "packs")
    report: dict[str, Any] = {"count": len(packs), "frame_md_ok": [], "frame_md_missing": []}
    for pack in packs:
        pack_id = str(pack["id"])
        for field in REQUIRED_PACK_FIELDS:
            if field not in pack:
                raise ValueError(f"packs:{pack_id}: missing {field}")
        if pack.get("kind") != "style-pack":
            raise ValueError(f"packs:{pack_id}: kind must be style-pack")
        _validate_anchor_set(pack.get("anchor_atoms") or [], atoms_by_id, f"packs:{pack_id}")

        motion = pack.get("default_motion") or {}
        missing_motion = [key for key in REQUIRED_MOTION if key not in motion]
        if missing_motion:
            raise ValueError(f"packs:{pack_id}: default_motion missing {', '.join(missing_motion)}")

        affinity = pack.get("effect_affinity") or {}
        if not isinstance(affinity.get("prefer"), list) or not affinity["prefer"]:
            raise ValueError(f"packs:{pack_id}: effect_affinity.prefer must be a non-empty list")
        if not isinstance(affinity.get("avoid"), list):
            raise ValueError(f"packs:{pack_id}: effect_affinity.avoid must be a list")

        source = pack.get("source") or {}
        frame_md_rel = source.get("frame_md")
        if not frame_md_rel:
            raise ValueError(f"packs:{pack_id}: source.frame_md is required")
        path = ROOT / str(frame_md_rel)
        if not path.is_file():
            report["frame_md_missing"].append(pack_id)
            raise ValueError(f"packs:{pack_id}: FRAME.md missing at {frame_md_rel}")

        import frame_md

        try:
            spec = frame_md.load_design_document(path)
            if frame_md._is_template_pack(spec):
                result = frame_md._lint_template_pack(spec, str(path))
            else:
                result = frame_md._lint_current(spec, str(path))
            if not result.get("ok"):
                raise ValueError(f"packs:{pack_id}: FRAME.md lint failed")
            report["frame_md_ok"].append(pack_id)
        except frame_md.FrameMdError as exc:
            raise ValueError(f"packs:{pack_id}: {exc}") from exc
    return report


def _validate_kits(records: list[dict[str, Any]], domain: str, kind: str) -> int:
    _require_unique_ids(records, domain)
    for record in records:
        record_id = str(record["id"])
        if record.get("kind") != kind:
            raise ValueError(f"{domain}:{record_id}: kind must be {kind}")
        for field in ("name", "tagline", "source", "workflow_use"):
            if field not in record:
                raise ValueError(f"{domain}:{record_id}: missing {field}")
    return len(records)


def validate_library() -> dict[str, Any]:
    atoms = load_jsonl(DOMAINS["atoms"])
    profiles = load_jsonl(DOMAINS["profiles"])
    packs = load_jsonl(DOMAINS["packs"])
    examples = load_jsonl(DOMAINS["examples"])
    showcases = load_jsonl(DOMAINS["showcases"])
    _require_unique_ids(atoms, "atoms")
    _require_unique_ids(profiles, "profiles")

    atoms_by_id = {str(record["id"]): record for record in atoms}
    dimension_counts = {dimension: 0 for dimension in REQUIRED_STYLE_DIMENSIONS}
    for atom in atoms:
        dimension = str(atom.get("dimension", ""))
        if dimension not in dimension_counts:
            raise ValueError(f"atoms:{atom['id']}: unknown dimension {dimension!r}")
        dimension_counts[dimension] += 1
        for forbidden in ("implementation", "effects", "recipes", "anchor_atoms"):
            if forbidden in atom:
                raise ValueError(f"atoms:{atom['id']}: must not own {forbidden}")
    empty_dimensions = [name for name, count in dimension_counts.items() if count == 0]
    if empty_dimensions:
        raise ValueError(f"atoms: empty dimensions: {', '.join(empty_dimensions)}")

    for profile in profiles:
        profile_id = str(profile["id"])
        for forbidden in ("design", "implementation", "effects", "recipes"):
            if forbidden in profile:
                raise ValueError(f"profiles:{profile_id}: must not own {forbidden}")
        _validate_anchor_set(profile.get("anchor_atoms") or [], atoms_by_id, f"profiles:{profile_id}")

    pack_report = _validate_packs(packs, atoms_by_id)
    example_count = _validate_kits(examples, "examples", "example-kit")
    showcase_count = _validate_kits(showcases, "showcases", "showcase-project")
    # Cross-link: example/showcase style_echo ids must resolve to packs when present.
    pack_ids = {str(pack["id"]) for pack in packs}
    for domain_name, records in (("examples", examples), ("showcases", showcases)):
        for record in records:
            echoes = record.get("style_echo") or []
            bad = [echo for echo in echoes if echo not in pack_ids]
            if bad:
                raise ValueError(
                    f"{domain_name}:{record['id']}: unknown style_echo {', '.join(bad)}"
                )

    return {
        "ok": True,
        "atoms": len(atoms),
        "profiles": len(profiles),
        "packs": pack_report["count"],
        "examples": example_count,
        "showcases": showcase_count,
        "dimensions": dimension_counts,
        "frame_md_ok": pack_report["frame_md_ok"],
        "effect_affinity": {
            "checked": "shape-only",
            "owner": "vidmuse-recut/scripts/effects.py --check-affinity",
            "note": "Run the owner check against a live or saved HyperFrames catalog.",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ids", nargs="?", help="Comma-separated ids (required with --get)")
    parser.add_argument("--domain", choices=sorted(DOMAINS), default="packs")
    parser.add_argument("--index", action="store_true", help="Print the domain's compact index (JSONL)")
    parser.add_argument("--get", action="store_true", help="Fetch full records by exact id")
    parser.add_argument("--validate", action="store_true", help="Validate the full taste library")
    args = parser.parse_args()

    if args.validate:
        print(json.dumps(validate_library(), ensure_ascii=False, indent=2))
        return 0

    if args.index:
        for entry in index(args.domain):
            print(json.dumps(entry, ensure_ascii=False))
        return 0

    if args.get:
        if not args.ids:
            parser.error("--get requires comma-separated ids")
        records = get([item.strip() for item in args.ids.split(",") if item.strip()], args.domain)
        print(json.dumps(records, ensure_ascii=False, indent=2))
        return 0

    parser.error("pass --index, --get with ids, or --validate")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
