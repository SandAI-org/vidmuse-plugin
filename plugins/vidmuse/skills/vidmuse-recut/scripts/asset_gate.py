#!/usr/bin/env python3
"""Hard-gate Recut semantic assets before Timeline attachment or approval.

The shared vidmuse-assets validator proves the Semantic Asset Pass was completed
against the current transcript. This Recut adapter additionally proves every
approved file opportunity still matches its query and is referenced by a real
DOM element in the packaging composition.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from html import escape
from pathlib import Path
from typing import Any


ASSET_PLAN = "asset-plan.json"
FILE_DECISIONS = {"show-logo", "show-icon", "show-photo", "reuse-existing"}
ASSET_PLAN_CLI = (
    Path(__file__).resolve().parents[2]
    / "vidmuse-assets"
    / "scripts"
    / "asset_plan.mjs"
)


def _identity(value: Any) -> str:
    return "".join(char for char in str(value or "").lower() if char.isalnum())


def request_fingerprint(query: dict[str, Any]) -> str:
    normalized = {
        "type": str(query.get("type", "")).strip().lower(),
        "mode": str(query.get("mode", "")).strip().lower(),
        "intent": re.sub(r"\s+", " ", str(query.get("intent", "")).strip()),
        "entity": _identity(query.get("entity")),
        "variant": str(query.get("variant", "")).strip().lower(),
        "provider": str(query.get("provider", "")).strip().lower(),
    }
    payload = json.dumps(
        normalized, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def pick_overlay(work: Path) -> Path | None:
    for candidate in (
        work / "public" / "index.html",
        work / "hyperframes" / "index.html",
        work / "index.html",
    ):
        if candidate.is_file():
            return candidate
    return None


def _shared_validation(work: Path) -> list[str]:
    try:
        run = subprocess.run(
            [
                "node",
                str(ASSET_PLAN_CLI),
                "--project",
                str(work),
                "--validate",
                "--json",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:
        return [f"cannot run shared vidmuse-assets validator: {exc}"]
    if run.returncode == 0:
        return []
    lines = [line for line in run.stdout.splitlines() if line.strip()]
    if lines:
        try:
            payload = json.loads(lines[-1])
            if isinstance(payload.get("errors"), list):
                return [str(error) for error in payload["errors"]]
            if payload.get("error"):
                return [str(payload["error"])]
        except json.JSONDecodeError:
            pass
    detail = run.stderr.strip() or "shared vidmuse-assets validation failed"
    return [detail]


def _asset_tag(html: str, asset_ref: str, local_path: str) -> str | None:
    pattern = (
        r"<(?!\!--)[a-zA-Z][^>]*\bdata-asset-ref=[\"']"
        + re.escape(asset_ref)
        + r"[\"'][^>]*>"
    )
    for match in re.finditer(pattern, html, flags=re.IGNORECASE):
        if local_path in match.group(0) or escape(local_path, quote=True) in match.group(0):
            return match.group(0)
    return None


def check(work: Path, html_path: Path | None = None) -> dict[str, Any]:
    work = work.resolve()
    problems = _shared_validation(work)
    plan_path = work / ASSET_PLAN
    try:
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
    except OSError as exc:
        problems.append(f"{ASSET_PLAN}: {exc}")
        plan = {}
    except json.JSONDecodeError as exc:
        problems.append(f"{ASSET_PLAN}: invalid JSON: {exc}")
        plan = {}

    if plan.get("workflow") != "recut":
        problems.append(f"{ASSET_PLAN}: workflow must be recut")

    file_opportunities = [
        item
        for item in plan.get("opportunities", [])
        if isinstance(item, dict) and item.get("decision") in FILE_DECISIONS
    ]
    overlay = html_path.resolve() if html_path else pick_overlay(work)
    html = ""
    if file_opportunities:
        if not overlay or not overlay.is_file():
            problems.append(
                "approved file assets require packaging HTML "
                "(public/index.html or explicit --html)"
            )
        else:
            html = overlay.read_text(encoding="utf-8")

    checked_refs: list[str] = []
    for item in file_opportunities:
        ref = str(item.get("id") or "<missing-id>")
        query = item.get("asset_query")
        receipt = item.get("resolution")
        if not isinstance(query, dict):
            problems.append(f"{ref}: asset_query is required")
            continue
        if not isinstance(receipt, dict) or receipt.get("status") != "resolved":
            problems.append(f"{ref}: no resolved local receipt")
            continue
        expected = request_fingerprint(query)
        if receipt.get("request_fingerprint") != expected:
            problems.append(f"{ref}: resolution is stale for its asset_query")

        if query.get("type") == "logo":
            requested = query.get("entity")
            canonical = item.get("canonical_entity")
            resolved = receipt.get("resolved_entity")
            if _identity(requested) != _identity(canonical):
                problems.append(
                    f"{ref}: query identity {requested!r} does not match "
                    f"canonical entity {canonical!r}"
                )
            if _identity(resolved) != _identity(requested):
                problems.append(
                    f"{ref}: resolved identity {resolved!r} does not match "
                    f"request {requested!r}"
                )
            variant = query.get("variant")
            if variant and receipt.get("variant") != variant:
                problems.append(
                    f"{ref}: resolved variant {receipt.get('variant')!r} "
                    f"does not satisfy {variant!r}"
                )

        local_path = receipt.get("path")
        if not isinstance(local_path, str) or not local_path.strip():
            problems.append(f"{ref}: resolved receipt has no local path")
            continue
        if not (work / local_path).is_file():
            problems.append(f"{ref}: resolved local file is missing: {local_path}")
            continue
        if html and not _asset_tag(html, ref, local_path):
            problems.append(
                f"{ref}: packaging HTML has no real data-asset-ref tag "
                f"pointing at {local_path}"
            )
        checked_refs.append(ref)

    problems = list(dict.fromkeys(problems))
    return {
        "ok": not problems,
        "workflow": plan.get("workflow"),
        "plan": str(plan_path),
        "html": str(overlay) if overlay else None,
        "file_opportunities": len(file_opportunities),
        "checked_refs": checked_refs,
        "errors": problems,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", type=Path)
    parser.add_argument("--html", type=Path, default=None)
    parser.add_argument("--check", action="store_true", help="validate and print JSON")
    args = parser.parse_args(argv)
    report = check(args.work_dir, args.html)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
