#!/usr/bin/env python3
"""One-command mechanical gate for a VidMuse work directory.

Bundles every cheap deterministic check into a single call so the agent's
discipline cost is one command, not five:

  1. FRAME.md parses and carries required tokens (frame_md.py --check)
  2. Packaging design-lock hashes, exact treatment sub-composition mounts,
     rendered-vs-approved treatment comparisons, and executable card budgets
  3. Every font stack in composition/showcase HTML resolves inside FRAME.md's
     own fontFamily tokens; no banned CJK face; no bare-serif CJK fallback
  4. Overlay dwell budgets and span coverage (packaging_lint.py overlay):
     no clip outstays its dwell budget, timed clip windows are readable so
     write_dsl does not fall back to one full-duration item, and packaging
     does not blanket the runtime
  5. Rendered frame vs source frame face-overlap, for every pair the caller
     names (rendered snapshot + clean source frame at the same timestamp)
  6. Optionally (--full) effects-overlay.jsonl catalog integrity — a
     plugin-maintenance check, not a per-film gate

Exit 0 = all checks pass. Non-zero = at least one blocking finding; the JSON
report names each one. Open-ended taste remains an eyes-on review, but fidelity
to an already approved direction is no longer an opinion: changed hashes,
redrawn treatment sources, surface-category drift, and materially different
comparison frames are mechanical failures.

This gate is seek-blind by construction: it samples states, it cannot watch
playback. The continuous-playback check in references/vidmuse-timeline.md
remains a separate, mandatory human/agent watch step.

Examples:
  precheck.py "$WORK_DIR"
  precheck.py "$WORK_DIR" --pair snap_45s.png:frames/f45s.jpg --pair snap_65s.png:frames/f65s.jpg
  precheck.py "$WORK_DIR" --design-pair chapter-marker=evidence/rendered/chapter-marker.png
  precheck.py "$WORK_DIR" --allow-continuous captions-band --full
"""

from __future__ import annotations

import argparse
import json
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
    parser.add_argument(
        "--design-pair",
        action="append",
        default=[],
        metavar="TREATMENT=RENDERED",
        help="rendered developed state for one locked treatment (repeatable; required for every used Packaging treatment)",
    )
    parser.add_argument("--face-limit", type=float, default=0.10)
    parser.add_argument("--dwell-limit", type=float, default=8.0,
                        help="max seconds one overlay clip may stay on screen (default 8)")
    parser.add_argument("--coverage-limit", type=float, default=0.6,
                        help="max share of the runtime packaging windows may occupy (default 0.6)")
    parser.add_argument("--allow-continuous", default="",
                        help="comma-separated clip ids exempt from the dwell limit")
    parser.add_argument(
        "--allow-banned-fonts",
        default="",
        help="comma-separated BRIEF-approved display families (for example Kaiti)",
    )
    parser.add_argument("--full", action="store_true",
                        help="also validate the plugin's effects-overlay catalog (maintenance check)")
    args = parser.parse_args()

    work = args.work_dir.resolve()
    report: dict = {
        "work_dir": str(work),
        "checks": {},
        "pass": True,
        "coverage": "full",
    }

    # 1. FRAME.md
    frame_md = work / "FRAME.md"
    families: set[str] = set()
    design_tokens: dict = {}
    if frame_md.is_file():
        code, payload, err = run_json([sys.executable, str(DESIGN_SCRIPTS / "frame_md.py"), str(frame_md), "--check"])
        report["checks"]["frame_md"] = {"pass": code == 0, "detail": payload or err}
        if code != 0:
            report["pass"] = False
        _, tokens, _ = run_json([sys.executable, str(DESIGN_SCRIPTS / "frame_md.py"), str(frame_md), "--extract"])
        if isinstance(tokens, dict):
            design_tokens = tokens
            families = collect_families(tokens)
    else:
        report["checks"]["frame_md"] = {"pass": False, "detail": "FRAME.md missing"}
        report["pass"] = False

    # 2. The selected Packaging direction is executable input, not a visual
    # reference that production may reinterpret. Director/Create use their own
    # review contracts, so this lock applies only to recut-packaging.
    if design_tokens.get("film_mode") == "recut-packaging":
        cmd = [
            sys.executable,
            str(DESIGN_SCRIPTS / "design_lock.py"),
            str(work),
            "--check",
            "--require-pairs",
        ]
        for pair in args.design_pair:
            cmd += ["--pair", pair]
        code, payload, err = run_json(cmd)
        report["checks"]["design_adherence"] = {"pass": code == 0, "detail": payload or err}
        if isinstance(payload, dict) and payload.get("coverage") == "partial":
            report["coverage"] = "partial"
        if code != 0:
            report["pass"] = False
    else:
        report["checks"]["design_adherence"] = {
            "pass": True,
            "status": "not-applicable",
            "detail": "design-lock applies to recut-packaging projects",
        }

    # 3. Fonts in every composition/showcase HTML
    html_files = sorted({
        *work.glob("public/**/*.html"),
        *work.glob("hyperframes/**/*.html"),
        *work.glob("*.html"),
    })
    if html_files:
        cmd = [sys.executable, str(SCRIPTS / "packaging_lint.py"), "fonts", *map(str, html_files)]
        if families:
            cmd += ["--allow", ",".join(sorted(families))]
        if args.allow_banned_fonts:
            cmd += ["--allow-banned", args.allow_banned_fonts]
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

    # 4. Overlay dwell budgets and span coverage
    cmd = [sys.executable, str(SCRIPTS / "packaging_lint.py"), "overlay", str(work),
           "--dwell-limit", str(args.dwell_limit),
           "--coverage-limit", str(args.coverage_limit)]
    if args.allow_continuous:
        cmd += ["--allow-continuous", args.allow_continuous]
    code, payload, err = run_json(cmd)
    report["checks"]["overlay_windows"] = {"pass": code == 0, "detail": payload or err}
    if code != 0:
        report["pass"] = False

    # 6. Effects catalog integrity — plugin maintenance, opt-in per film
    if args.full:
        code, payload, err = run_json([sys.executable, str(SCRIPTS / "effects.py"), "--validate"])
        report["checks"]["effects_overlay"] = {"pass": code == 0, "detail": payload or err}
        if code != 0:
            report["pass"] = False

    # 5. Face overlap per named pair
    pairs = []
    for spec in args.pair:
        rendered, _, source = spec.partition(":")
        code, payload, err = run_json([
            sys.executable, str(SCRIPTS / "packaging_lint.py"), "faces",
            "--rendered", str((work / rendered) if not Path(rendered).is_absolute() else rendered),
            "--source", str((work / source) if not Path(source).is_absolute() else source),
            "--limit", str(args.face_limit),
        ])
        entry = payload if isinstance(payload, dict) else {"error": err}
        unavailable = entry.get("status") == "unavailable"
        entry["pass"] = None if unavailable else code == 0 and not entry.get("error")
        pairs.append(entry)
        if unavailable:
            report["coverage"] = "partial"
        elif not entry["pass"]:
            report["pass"] = False
    if pairs:
        available_pairs = [pair for pair in pairs if pair.get("pass") is not None]
        faces_pass = all(pair.get("pass") for pair in available_pairs) if available_pairs else None
        face_status = "checked" if available_pairs else "unavailable"
    else:
        faces_pass = None
        face_status = "skipped"
        report["coverage"] = "partial"
    report["checks"]["faces"] = {
        "pass": faces_pass,
        "status": face_status,
        "pairs": pairs,
        **({"note": "no rendered/source pairs supplied"} if not pairs else {}),
    }

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
