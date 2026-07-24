#!/usr/bin/env python3
"""Index and fetch VidMuse semantic motion recipes (HyperFrames/GSAP).

Examples:
  python3 scripts/motion_recipes.py --index
  python3 scripts/motion_recipes.py --tag dataviz
  python3 scripts/motion_recipes.py kpi-glow-count,weekly-bar-rise --get
  python3 scripts/motion_recipes.py --validate
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "references" / "index.jsonl"
RECIPES = ROOT / "references" / "recipes"
# hyperframes-animation sits beside this skill in the plugin pack
HF_ANIM = ROOT.parent / "hyperframes-animation"

COSTS = {"low", "medium", "high", "very-high"}
REQUIRED = {
    "id",
    "title",
    "tags",
    "viewer_job",
    "production_cost",
    "registry_required",
    "recut_ok",
    "rules",
    "recipe_path",
    "verify_times",
}


class MotionRecipesError(ValueError):
    pass


def load_index(path: Path = INDEX) -> list[dict[str, Any]]:
    if not path.is_file():
        raise MotionRecipesError(f"missing index: {path}")
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_number, raw in enumerate(handle, start=1):
            line = raw.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise MotionRecipesError(f"{path}:{line_number}: {exc}") from exc
            if not isinstance(row, dict):
                raise MotionRecipesError(f"{path}:{line_number}: expected object")
            rows.append(row)
    return rows


def validate(rows: list[dict[str, Any]]) -> None:
    seen: set[str] = set()
    for row in rows:
        missing = sorted(REQUIRED - set(row))
        if missing:
            raise MotionRecipesError(f"{row.get('id', '?')}: missing {missing}")
        rid = str(row["id"])
        if rid in seen:
            raise MotionRecipesError(f"duplicate id {rid}")
        seen.add(rid)
        if row["production_cost"] not in COSTS:
            raise MotionRecipesError(f"{rid}: bad cost {row['production_cost']!r}")
        if row.get("registry_required") is not False:
            raise MotionRecipesError(
                f"{rid}: v1 requires registry_required=false (Registry optional)"
            )
        recipe = ROOT / "references" / str(row["recipe_path"])
        if not recipe.is_file():
            raise MotionRecipesError(f"{rid}: missing recipe {recipe}")
        for rule in row.get("rules") or []:
            rule_path = HF_ANIM / "rules" / f"{rule}.md"
            if not rule_path.is_file():
                raise MotionRecipesError(
                    f"{rid}: rule file not found in plugin: {rule_path}"
                )
        example = row.get("example_path")
        if example:
            ex = ROOT / str(example)
            if not ex.is_file():
                raise MotionRecipesError(f"{rid}: missing example {ex}")


def norm_ids(spec: str) -> list[str]:
    out: list[str] = []
    for part in spec.split(","):
        token = part.strip()
        if not token:
            continue
        if token.startswith("recipe:"):
            token = token.split(":", 1)[1]
        out.append(token)
    return out


def filter_rows(
    rows: list[dict[str, Any]],
    *,
    tag: str | None,
) -> list[dict[str, Any]]:
    if not tag:
        return rows
    needle = tag.lower()
    return [
        r
        for r in rows
        if needle in [str(t).lower() for t in (r.get("tags") or [])]
        or needle in str(r.get("id", "")).lower()
        or needle in str(r.get("viewer_job", "")).lower()
    ]


def compact(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "title": row.get("title"),
        "tags": row.get("tags") or [],
        "viewer_job": row.get("viewer_job"),
        "production_cost": row.get("production_cost"),
        "registry_required": row.get("registry_required"),
        "recut_ok": row.get("recut_ok"),
        "rules": row.get("rules") or [],
        "blueprint": row.get("blueprint"),
        "verify_times": row.get("verify_times") or [],
        "recipe_path": row.get("recipe_path"),
        "example_path": row.get("example_path"),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ids", nargs="?", help="comma-separated recipe ids (with --get)")
    parser.add_argument("--index", action="store_true", help="print compact index")
    parser.add_argument("--get", action="store_true", help="full index rows + recipe text")
    parser.add_argument("--tag", help="filter by tag / id / job substring")
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args(argv)

    try:
        rows = load_index()
        if args.validate:
            validate(rows)
            print(f"ok: {len(rows)} motion recipes", file=sys.stderr)
            return 0

        if args.get:
            if not args.ids:
                raise MotionRecipesError("--get requires id list")
            wanted = set(norm_ids(args.ids))
            picked = [r for r in rows if r["id"] in wanted]
            missing = wanted - {r["id"] for r in picked}
            if missing:
                raise MotionRecipesError(f"unknown ids: {sorted(missing)}")
            payload = []
            for row in picked:
                recipe_path = ROOT / "references" / str(row["recipe_path"])
                payload.append(
                    {
                        **row,
                        "recipe_abs": str(recipe_path),
                        "recipe_text": recipe_path.read_text(encoding="utf-8"),
                    }
                )
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            return 0

        if not args.index and not args.tag and not args.ids:
            args.index = True

        filtered = filter_rows(rows, tag=args.tag)
        if args.ids and not args.get:
            wanted = set(norm_ids(args.ids))
            filtered = [r for r in filtered if r["id"] in wanted]

        payload = {
            "count": len(filtered),
            "total": len(rows),
            "runtime": "hyperframes-gsap",
            "skill": "vidmuse-motion",
            "registry_policy": "optional-never-blocking",
            "recipes": [compact(r) for r in filtered],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0
    except MotionRecipesError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
