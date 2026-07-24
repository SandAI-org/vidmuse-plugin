#!/usr/bin/env python3
"""Index and fetch the curated video-shotcraft → VidMuse create bridge.

Examples:
  python3 scripts/shot_cards.py --index
  python3 scripts/shot_cards.py --recipe recipe:saas-promo-30s
  python3 scripts/shot_cards.py --role proof
  python3 scripts/shot_cards.py deck-deal-flyin,spotlight-hero-card --get
  python3 scripts/shot_cards.py --validate
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "references" / "shot-cards" / "bridge.jsonl"
CARDS_DIR = ROOT / "references" / "shot-cards" / "cards"
ROLES = {"open", "proof", "type", "data", "transition", "outro"}
COSTS = {"low", "medium", "high", "very-high"}
REQUIRED = {
    "id",
    "upstream_id",
    "source",
    "license",
    "role",
    "production_cost",
    "recipe_affinity",
    "port_status",
    "implement_runtime",
    "recut_ok",
    "card_path",
}


class ShotCardsError(ValueError):
    pass


def load_bridge(path: Path = BRIDGE) -> list[dict[str, Any]]:
    if not path.is_file():
        raise ShotCardsError(f"missing bridge: {path}")
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_number, raw in enumerate(handle, start=1):
            line = raw.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ShotCardsError(f"{path}:{line_number}: {exc}") from exc
            if not isinstance(row, dict):
                raise ShotCardsError(f"{path}:{line_number}: expected object")
            rows.append(row)
    return rows


def validate(rows: list[dict[str, Any]]) -> None:
    seen: set[str] = set()
    for row in rows:
        missing = sorted(REQUIRED - set(row))
        if missing:
            raise ShotCardsError(f"{row.get('id', '?')}: missing {missing}")
        rid = str(row["id"])
        if rid in seen:
            raise ShotCardsError(f"duplicate id {rid}")
        seen.add(rid)
        if row["role"] not in ROLES:
            raise ShotCardsError(f"{rid}: bad role {row['role']!r}")
        if row["production_cost"] not in COSTS:
            raise ShotCardsError(f"{rid}: bad cost {row['production_cost']!r}")
        if row.get("implement_runtime") != "hyperframes-gsap":
            raise ShotCardsError(f"{rid}: implement_runtime must be hyperframes-gsap")
        if row.get("recut_ok") is not False:
            raise ShotCardsError(f"{rid}: this extract requires recut_ok=false")
        card = ROOT / "references" / "shot-cards" / str(row["card_path"])
        if not card.is_file():
            raise ShotCardsError(f"{rid}: missing card file {card}")
    # card files without bridge rows are tolerated only if bridge is intentional


def norm_ids(spec: str) -> list[str]:
    out: list[str] = []
    for part in spec.split(","):
        token = part.strip()
        if not token:
            continue
        if token.startswith("shotcraft:"):
            token = token.split(":", 1)[1]
        out.append(token)
    return out


def filter_rows(
    rows: list[dict[str, Any]],
    *,
    recipe: str | None,
    role: str | None,
) -> list[dict[str, Any]]:
    out = rows
    if recipe:
        key = recipe if recipe.startswith("recipe:") else f"recipe:{recipe}"
        out = [r for r in out if key in (r.get("recipe_affinity") or [])]
    if role:
        out = [r for r in out if r.get("role") == role]
    return out


def compact(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "role": row["role"],
        "production_cost": row["production_cost"],
        "energy": row.get("energy") or "",
        "duration_hint": row.get("duration_hint") or "",
        "one_liner": row.get("one_liner") or "",
        "use_when": row.get("use_when_meta") or "",
        "recipe_affinity": row.get("recipe_affinity") or [],
        "hf_blueprint": row.get("hf_blueprint"),
        "registry_hypotheses": row.get("registry_hypotheses") or [],
        "port_status": row.get("port_status"),
        "card_path": row.get("card_path"),
        "gallery": row.get("gallery"),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "ids",
        nargs="?",
        help="comma-separated upstream ids or shotcraft: ids (with --get)",
    )
    parser.add_argument("--index", action="store_true", help="print compact index")
    parser.add_argument("--get", action="store_true", help="print full bridge rows + card paths")
    parser.add_argument("--recipe", help="filter by structure recipe id")
    parser.add_argument("--role", choices=sorted(ROLES), help="filter by beat role")
    parser.add_argument("--validate", action="store_true", help="validate bridge + card files")
    parser.add_argument(
        "--json",
        action="store_true",
        help="machine-readable JSON on stdout (default for --get/--index)",
    )
    args = parser.parse_args(argv)

    try:
        rows = load_bridge()
        if args.validate:
            validate(rows)
            print(f"ok: {len(rows)} shot cards", file=sys.stderr)
            return 0

        if args.get:
            if not args.ids:
                raise ShotCardsError("--get requires id list")
            wanted = set(norm_ids(args.ids))
            picked = [r for r in rows if r["upstream_id"] in wanted or r["id"] in wanted]
            missing = wanted - {r["upstream_id"] for r in picked} - {r["id"] for r in picked}
            if missing:
                raise ShotCardsError(f"unknown ids: {sorted(missing)}")
            payload = []
            for row in picked:
                card_path = ROOT / "references" / "shot-cards" / str(row["card_path"])
                payload.append(
                    {
                        **row,
                        "card_abs": str(card_path),
                        "card_text_preview": card_path.read_text(encoding="utf-8")[:1200],
                    }
                )
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            return 0

        # default: index (optionally filtered)
        if not args.index and not args.recipe and not args.role and not args.ids:
            args.index = True

        filtered = filter_rows(rows, recipe=args.recipe, role=args.role)
        if args.ids and not args.get:
            wanted = set(norm_ids(args.ids))
            filtered = [
                r
                for r in filtered
                if r["upstream_id"] in wanted or r["id"] in wanted
            ]

        payload = {
            "count": len(filtered),
            "total_extract": len(rows),
            "upstream_catalog_size": 106,
            "runtime": "hyperframes-gsap",
            "gallery": "https://vincentwei1021.github.io/video-shotcraft/",
            "cards": [compact(r) for r in filtered],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0
    except ShotCardsError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
