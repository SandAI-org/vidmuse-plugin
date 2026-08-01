#!/usr/bin/env python3
"""One-command mechanical gate for a VidMuse work directory.

Bundles every cheap deterministic check into a single call so the agent's
discipline cost is one command, not five:

  1. FRAME.md parses and carries required tokens (frame_md.py --check)
  2. Every font stack in composition/showcase HTML resolves inside FRAME.md's
     own fontFamily tokens; no banned CJK face; no bare-serif CJK fallback
  3. effects-overlay.jsonl validates (when effect records changed)
  4. Rendered frame vs source frame face-overlap, for every pair the caller
     names (rendered snapshot + clean source frame at the same timestamp)

Exit 0 = all checks pass. Non-zero = at least one blocking finding; the JSON
report names each one. Style opinions are out of scope by design — this gate
asks "did you break something," never "is it beautiful."

Examples:
  precheck.py "$WORK_DIR"
  precheck.py "$WORK_DIR" --pair snap_45s.png:frames/f45s.jpg --pair snap_65s.png:frames/f65s.jpg
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPTS.parent
DESIGN_SCRIPTS = SKILL_ROOT.parent / "vidmuse-design" / "scripts"


def run_json(cmd: list[str]) -> tuple[int, dict | list | None, str]:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    out = proc.stdout.strip()
    try:
        return proc.returncode, json.loads(out) if out else None, proc.stderr.strip()
    except json.JSONDecodeError:
        return proc.returncode, None, (out + "\n" + proc.stderr).strip()


def collect_families(tokens) -> set[str]:
    """Every fontFamily value anywhere in the FRAME.md token tree, first family of each stack included whole."""
    found: set[str] = set()

    def walk(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "fontFamily" and isinstance(value, str):
                    for fam in value.split(","):
                        fam = fam.strip().strip("'\"")
                        if fam and fam.lower() not in {"serif", "sans-serif", "monospace", "system-ui"}:
                            found.add(fam)
                else:
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(tokens)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", type=Path)
    parser.add_argument("--pair", action="append", default=[],
                        metavar="RENDERED:SOURCE",
                        help="rendered snapshot and clean source frame at the same timestamp (repeatable)")
    parser.add_argument("--face-limit", type=float, default=0.10)
    args = parser.parse_args()

    work = args.work_dir.resolve()
    report: dict = {"work_dir": str(work), "checks": {}, "pass": True}

    def fail(name: str) -> None:
        report["pass"] = False
        report["checks"][name]["pass"] = False

    # 1. FRAME.md
    frame_md = work / "FRAME.md"
    families: set[str] = set()
    if frame_md.is_file():
        code, payload, err = run_json(["python3", str(DESIGN_SCRIPTS / "frame_md.py"), str(frame_md), "--check"])
        report["checks"]["frame_md"] = {"pass": code == 0, "detail": payload or err}
        if code != 0:
            report["pass"] = False
        _, tokens, _ = run_json(["python3", str(DESIGN_SCRIPTS / "frame_md.py"), str(frame_md), "--extract"])
        if tokens:
            families = collect_families(tokens)
    else:
        report["checks"]["frame_md"] = {"pass": False, "detail": "FRAME.md missing"}
        report["pass"] = False

    # 2. Fonts in every composition/showcase HTML
    html_files = sorted({*work.glob("public/**/*.html"), *work.glob("*.html")})
    if html_files:
        cmd = ["python3", str(SCRIPTS / "packaging_lint.py"), "fonts", *map(str, html_files)]
        if families:
            cmd += ["--allow", ",".join(sorted(families))]
        code, payload, err = run_json(cmd)
        report["checks"]["fonts"] = {
            "pass": code == 0,
            "allow": sorted(families),
            "files": len(html_files),
            "detail": payload or err,
        }
        if code != 0:
            report["pass"] = False
    else:
        report["checks"]["fonts"] = {"pass": True, "detail": "no HTML yet"}

    # 3. Effects overlay
    code, payload, err = run_json(["python3", str(SCRIPTS / "effects.py"), "--validate"])
    report["checks"]["effects_overlay"] = {"pass": code == 0, "detail": payload or err}
    if code != 0:
        report["pass"] = False

    # 4. Face overlap per named pair
    pairs = []
    for spec in args.pair:
        rendered, _, source = spec.partition(":")
        code, payload, err = run_json([
            "python3", str(SCRIPTS / "packaging_lint.py"), "faces",
            "--rendered", str((work / rendered) if not Path(rendered).is_absolute() else rendered),
            "--source", str((work / source) if not Path(source).is_absolute() else source),
            "--limit", str(args.face_limit),
        ])
        entry = payload if isinstance(payload, dict) else {"error": err}
        entry["pass"] = code == 0 and not entry.get("error")
        pairs.append(entry)
        if not entry["pass"]:
            report["pass"] = False
    report["checks"]["faces"] = {"pass": all(p.get("pass") for p in pairs) if pairs else True,
                                 "pairs": pairs or "none supplied"}

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
