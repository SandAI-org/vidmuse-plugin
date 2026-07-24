#!/usr/bin/env python3
"""Validate and resolve the structured film plan (film-plan.json).

The structured plan is the machine-readable mirror of film-plan.md for
non-Vox create films. It is the single input for shot_scaffold.py (GSAP
skeleton) and check_motion.py (post-render hard gate), so the shot_sequence
the user approved is the same one that gets implemented and verified.

Usage:
  python3 scripts/film_plan.py "$WORK_DIR" --validate
  python3 scripts/film_plan.py "$WORK_DIR" --resolve   # writes film-plan.resolved.json

Resolution:
  - shot_sequence window times (beat-local seconds) -> absolute film seconds
  - vo_cues (plain strings from the spoken line) -> {text, t} using the ATA
    word-level transcript.json (never guessed timestamps)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

PLAN_NAME = "film-plan.json"
RESOLVED_NAME = "film-plan.resolved.json"
TRANSCRIPT_NAME = "transcript.json"

PATHS = {"explainer", "promo"}
ROLES = {
    "hook", "pain_point", "product_intro", "feature_showcase",
    "benefit_highlight", "social_proof", "branding", "cta",
}
VISUAL_KINDS = {"type", "diagram", "real-ui", "dataviz", "quiet", "abstract", "branding"}
WINDOW_KINDS = {"reveal", "move", "morph", "camera", "exit", "hold"}
TRANSITIONS = {
    "cut", "crossfade", "blur-crossfade", "zoom-through", "squeeze",
    "push-slide LEFT", "push-slide RIGHT", "push-slide UP", "push-slide DOWN",
}
UI_PROOF = {"screenshot-camera", "hybrid-slices", "full-html-rebuild"}

# tolerances (seconds)
GAP_TOL = 0.30       # max uncovered gap between windows inside a beat
TAIL_TOL = 0.35      # window coverage may stop this early before ata end
OVERLAP_TOL = 0.05   # windows may overlap this much

_PUNCT = re.compile(r"[\s，。、！？!?,.;:；：·…—\-\"'“”‘’()（）\[\]【】]+")


class PlanError(ValueError):
    pass


def _norm(text: str) -> str:
    return _PUNCT.sub("", text).lower()


def load_plan(work: Path) -> dict[str, Any]:
    path = work / PLAN_NAME
    if not path.is_file():
        raise PlanError(f"missing {path} — write the structured plan next to film-plan.md")
    with path.open(encoding="utf-8") as handle:
        plan = json.load(handle)
    if not isinstance(plan, dict):
        raise PlanError(f"{PLAN_NAME}: expected a JSON object")
    return plan


def validate(plan: dict[str, Any]) -> list[str]:
    """Return a list of contract violations (empty = valid)."""
    errors: list[str] = []

    def err(msg: str) -> None:
        errors.append(msg)

    if plan.get("create_path") not in PATHS:
        err(f"create_path must be one of {sorted(PATHS)} (vox films do not use this file)")

    hero = plan.get("hero_throughline")
    if hero is not None:
        if not isinstance(hero, dict) or not hero.get("name") or not hero.get("dom_selector"):
            err("hero_throughline must be {name, dom_selector[, min_coverage]}")
        cov = (hero or {}).get("min_coverage", 0.5)
        if not isinstance(cov, (int, float)) or not 0 < cov <= 1:
            err("hero_throughline.min_coverage must be in (0, 1]")

    beats = plan.get("beats")
    if not isinstance(beats, list) or len(beats) < 2:
        err("beats must be a list with >=2 beats")
        return errors

    seen_ids: set[str] = set()
    prev_end = 0.0
    for idx, beat in enumerate(beats):
        bid = str(beat.get("id") or f"beat[{idx}]")
        where = f"beat {bid}"
        if not re.fullmatch(r"b\d{2}", str(beat.get("id", ""))):
            err(f"{where}: id must look like b01, b02, …")
        elif bid in seen_ids:
            err(f"{where}: duplicate id")
        seen_ids.add(bid)

        rng = beat.get("ata_range")
        if (
            not isinstance(rng, list) or len(rng) != 2
            or not all(isinstance(v, (int, float)) for v in rng) or rng[1] <= rng[0]
        ):
            err(f"{where}: ata_range must be [start_s, end_s] from transcript.json")
            continue
        if rng[0] < prev_end - 0.5:
            err(f"{where}: ata_range overlaps previous beat by more than 0.5s")
        prev_end = rng[1]
        span = rng[1] - rng[0]

        if beat.get("path_role") not in ROLES:
            err(f"{where}: path_role must be one of {sorted(ROLES)}")
        if not beat.get("key_message"):
            err(f"{where}: key_message missing")
        if beat.get("visual_kind") not in VISUAL_KINDS:
            err(f"{where}: visual_kind must be one of {sorted(VISUAL_KINDS)}")
        if beat.get("transition_in") not in TRANSITIONS:
            err(f"{where}: transition_in must be one of {sorted(TRANSITIONS)}")
        if not (beat.get("blueprint") or beat.get("shot_ref") or beat.get("compose")
                or beat.get("motion_recipe_ids")):
            err(f"{where}: needs blueprint / shot_ref / compose / motion_recipe_ids")

        proof = beat.get("ui_proof_path")
        if proof is not None and proof not in UI_PROOF:
            err(f"{where}: ui_proof_path must be one of {sorted(UI_PROOF)}")

        cues = beat.get("vo_cues")
        if not isinstance(cues, list) or not cues or not all(
            isinstance(c, str) and c.strip() for c in cues
        ):
            err(f"{where}: vo_cues must be a non-empty list of phrase strings (hard fail 6)")

        candidates = beat.get("asset_candidates")
        if candidates is not None and (
            not isinstance(candidates, list)
            or not all(isinstance(a, str) and a.strip() for a in candidates)
        ):
            err(f"{where}: asset_candidates must be a list of asset filenames")

        sfx = beat.get("sfx")
        if sfx is not None:
            if not isinstance(sfx, list):
                err(f"{where}: sfx must be a list of {{t, role}} cues")
            else:
                for sidx, cue in enumerate(sfx, start=1):
                    if (
                        not isinstance(cue, dict)
                        or not isinstance(cue.get("t"), (int, float))
                        or not (0 <= float(cue["t"]) <= span + TAIL_TOL)
                        or not cue.get("role")
                    ):
                        err(f"{where}: sfx[{sidx}] needs beat-local t within the "
                            f"ATA span and a role string")

        windows = beat.get("shot_sequence")
        if not isinstance(windows, list) or len(windows) < 2:
            err(f"{where}: shot_sequence needs >=2 windows (hard fail 1)")
            continue
        cursor = 0.0
        for widx, win in enumerate(windows, start=1):
            wid = f"{bid}.w{widx}"
            t = win.get("t") if isinstance(win, dict) else None
            if (
                not isinstance(t, list) or len(t) != 2
                or not all(isinstance(v, (int, float)) for v in t) or t[1] <= t[0]
            ):
                err(f"{wid}: t must be [local_start, local_end] seconds")
                continue
            if win.get("kind") not in WINDOW_KINDS:
                err(f"{wid}: kind must be one of {sorted(WINDOW_KINDS)}")
            if not win.get("on_screen") or not win.get("move"):
                err(f"{wid}: on_screen and move are required")
            if t[0] > cursor + GAP_TOL:
                err(f"{wid}: gap of {t[0] - cursor:.2f}s before window (uncovered VO)")
            if t[0] < cursor - OVERLAP_TOL:
                err(f"{wid}: overlaps previous window by {cursor - t[0]:.2f}s")
            cursor = max(cursor, t[1])
        if cursor < span - TAIL_TOL:
            err(f"{bid}: shot_sequence stops {span - cursor:.2f}s before the ATA span ends")
        if cursor > span + TAIL_TOL:
            err(f"{bid}: shot_sequence runs {cursor - span:.2f}s past the ATA span")
        last = windows[-1]
        if isinstance(last, dict) and last.get("kind") != "hold" and not beat.get("continuous"):
            err(
                f"{bid}: terminal window must be kind=hold "
                f"(or set beat continuous=true with a written exception)"
            )

    return errors


def load_words(work: Path) -> list[dict[str, Any]]:
    path = work / TRANSCRIPT_NAME
    if not path.is_file():
        raise PlanError(f"missing {path} — run the ATA voice spine first")
    with path.open(encoding="utf-8") as handle:
        words = json.load(handle)
    if not isinstance(words, list) or not words:
        raise PlanError(f"{TRANSCRIPT_NAME}: expected a non-empty word list")
    return words


def resolve_cues(beats: list[dict[str, Any]], words: list[dict[str, Any]]) -> None:
    """Attach absolute start times to every vo_cue, in spoken order."""
    stream = ""            # normalized full transcript
    starts: list[float] = []  # starts[i] = start time of stream[i]
    for word in words:
        chunk = _norm(str(word.get("text", "")))
        stream += chunk
        starts.extend([float(word["start"])] * len(chunk))

    cursor = 0
    for beat in beats:
        resolved = []
        for cue in beat["vo_cues"]:
            needle = _norm(cue)
            if not needle:
                raise PlanError(f"{beat['id']}: cue {cue!r} is empty after normalization")
            hit = stream.find(needle, cursor)
            if hit < 0:
                hit = stream.find(needle)  # tolerate slight cue reordering
            if hit < 0:
                raise PlanError(
                    f"{beat['id']}: cue {cue!r} not found in {TRANSCRIPT_NAME} — "
                    "cues must be verbatim phrases from the locked script"
                )
            resolved.append({"text": cue, "t": round(starts[hit], 3)})
            cursor = max(cursor, hit + len(needle))
        beat["vo_cues"] = resolved


def resolve(plan: dict[str, Any], words: list[dict[str, Any]]) -> dict[str, Any]:
    plan = json.loads(json.dumps(plan))  # deep copy
    resolve_cues(plan["beats"], words)
    for beat in plan["beats"]:
        base = float(beat["ata_range"][0])
        end = float(beat["ata_range"][1])
        for widx, win in enumerate(beat["shot_sequence"], start=1):
            win["id"] = f"{beat['id']}.w{widx}"
            win["abs"] = [
                round(min(base + float(win["t"][0]), end), 3),
                round(min(base + float(win["t"][1]), end), 3),
            ]
        for cue in beat["vo_cues"]:
            if not (base - 0.5 <= cue["t"] <= end + 0.5):
                raise PlanError(
                    f"{beat['id']}: cue {cue['text']!r} resolved to t={cue['t']}s, "
                    f"outside ata_range {beat['ata_range']} — beat/cue assignment is wrong"
                )
        for cue in beat.get("sfx") or []:
            cue["abs_t"] = round(min(base + float(cue["t"]), end), 3)
    plan["resolved"] = True
    return plan


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", help="film work directory containing film-plan.json")
    parser.add_argument("--validate", action="store_true", help="contract check only")
    parser.add_argument("--resolve", action="store_true",
                        help="validate + resolve cues/windows, write film-plan.resolved.json")
    args = parser.parse_args(argv)

    work = Path(args.work_dir).resolve()
    try:
        plan = load_plan(work)
        errors = validate(plan)
        if errors:
            for msg in errors:
                print(f"FAIL {msg}", file=sys.stderr)
            print(f"error: {len(errors)} contract violation(s) in {PLAN_NAME}", file=sys.stderr)
            return 1
        if args.resolve:
            resolved = resolve(plan, load_words(work))
            out = work / RESOLVED_NAME
            out.write_text(
                json.dumps(resolved, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            beats = resolved["beats"]
            cues = sum(len(b["vo_cues"]) for b in beats)
            wins = sum(len(b["shot_sequence"]) for b in beats)
            print(f"ok: {out.name} — {len(beats)} beats, {wins} windows, {cues} cues resolved")
        else:
            print(f"ok: {PLAN_NAME} passes the beat contract")
        return 0
    except (PlanError, json.JSONDecodeError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
