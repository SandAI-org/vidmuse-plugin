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
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

PLAN_NAME = "film-plan.json"
RESOLVED_NAME = "film-plan.resolved.json"
TRANSCRIPT_NAME = "transcript.json"
ASSET_PLAN_NAME = "asset-plan.json"
PASS_CONTRACT = "semantic-asset-pass.v1"
ASSET_PLAN_CLI = (
    Path(__file__).resolve().parents[2]
    / "vidmuse-assets"
    / "scripts"
    / "asset_plan.mjs"
)

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
    if plan.get("asset_plan") != ASSET_PLAN_NAME:
        err(f"asset_plan must equal {ASSET_PLAN_NAME} (Semantic Asset Pass is required)")

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
            err(f"{where}: asset_candidates must be a list of site-capture filenames")

        asset_refs = beat.get("asset_refs")
        if asset_refs is not None and (
            not isinstance(asset_refs, list)
            or not all(isinstance(a, str) and a.startswith("ao_") for a in asset_refs)
            or len(set(asset_refs)) != len(asset_refs)
        ):
            err(f"{where}: asset_refs must be a unique list of ao_* opportunity ids")

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


def load_asset_plan(work: Path) -> dict[str, Any]:
    path = work / ASSET_PLAN_NAME
    if not path.is_file():
        raise PlanError(
            f"missing {path} — run the vidmuse-assets Semantic Asset Pass first"
        )
    with path.open(encoding="utf-8") as handle:
        plan = json.load(handle)
    if not isinstance(plan, dict):
        raise PlanError(f"{ASSET_PLAN_NAME}: expected a JSON object")
    if plan.get("schema") != "vidmuse.asset-plan.v1":
        raise PlanError(f"{ASSET_PLAN_NAME}: schema must be vidmuse.asset-plan.v1")
    if not isinstance(plan.get("opportunities"), list):
        raise PlanError(f"{ASSET_PLAN_NAME}: opportunities must be an array")
    if plan.get("workflow") != "create":
        raise PlanError(f"{ASSET_PLAN_NAME}: workflow must be create")
    receipt = plan.get("pass_receipt")
    if not isinstance(receipt, dict):
        raise PlanError(f"{ASSET_PLAN_NAME}: pass_receipt is required")
    if receipt.get("contract") != PASS_CONTRACT or receipt.get("status") != "completed":
        raise PlanError(
            f"{ASSET_PLAN_NAME}: Semantic Asset Pass receipt is not completed"
        )
    transcript = plan.get("transcript")
    input_receipt = receipt.get("input")
    if (
        not isinstance(transcript, str)
        or not isinstance(input_receipt, dict)
        or input_receipt.get("path") != transcript
    ):
        raise PlanError(
            f"{ASSET_PLAN_NAME}: pass_receipt.input.path must equal transcript"
        )
    transcript_path = work / transcript
    if not transcript_path.is_file():
        raise PlanError(f"{ASSET_PLAN_NAME}: receipt input is missing: {transcript}")
    actual_sha = hashlib.sha256(transcript_path.read_bytes()).hexdigest()
    if input_receipt.get("sha256") != actual_sha:
        raise PlanError(
            f"{ASSET_PLAN_NAME}: pass_receipt is stale; {transcript} changed"
        )
    if receipt.get("opportunity_count") != len(plan["opportunities"]):
        raise PlanError(f"{ASSET_PLAN_NAME}: pass_receipt opportunity_count is stale")
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
        raise PlanError(
            f"{ASSET_PLAN_NAME}: cannot run shared asset validator: {exc}"
        ) from exc
    if run.returncode != 0:
        details = run.stderr.strip()
        lines = [line for line in run.stdout.splitlines() if line.strip()]
        if lines:
            try:
                payload = json.loads(lines[-1])
                if isinstance(payload.get("errors"), list):
                    details = "; ".join(str(error) for error in payload["errors"])
                elif payload.get("error"):
                    details = str(payload["error"])
            except json.JSONDecodeError:
                pass
        raise PlanError(
            f"{ASSET_PLAN_NAME}: shared asset validation failed: "
            f"{details or 'unknown violation'}"
        )
    return plan


def _identity(value: Any) -> str:
    return "".join(char for char in str(value or "").lower() if char.isalnum())


def _request_fingerprint(query: dict[str, Any]) -> str:
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


def validate_asset_refs(
    work: Path, film_plan: dict[str, Any], asset_plan: dict[str, Any]
) -> list[str]:
    errors: list[str] = []
    opportunities = {
        item.get("id"): item
        for item in asset_plan.get("opportunities", [])
        if isinstance(item, dict) and item.get("id")
    }
    no_file_decisions = {"diagram-node", "text-label-only", "suppress"}
    file_decisions = {"show-logo", "show-icon", "show-photo", "reuse-existing"}
    used_refs: set[str] = set()
    for beat in film_plan.get("beats") or []:
        bid = beat.get("id", "unknown")
        for ref in beat.get("asset_refs") or []:
            used_refs.add(ref)
            item = opportunities.get(ref)
            if not item:
                errors.append(f"beat {bid}: asset_ref {ref} is missing from {ASSET_PLAN_NAME}")
                continue
            if item.get("beat_id") and item["beat_id"] != bid:
                errors.append(
                    f"beat {bid}: asset_ref {ref} belongs to beat {item['beat_id']}"
                )
            if item.get("decision") in no_file_decisions:
                errors.append(
                    f"beat {bid}: asset_ref {ref} has non-file decision {item.get('decision')}"
                )
                continue
            receipt = item.get("resolution")
            if not isinstance(receipt, dict) or receipt.get("status") != "resolved":
                errors.append(f"beat {bid}: asset_ref {ref} has no resolved local receipt")
                continue
            query = item.get("asset_query")
            if not isinstance(query, dict):
                errors.append(f"beat {bid}: asset_ref {ref} has no asset_query")
                continue
            expected_fingerprint = _request_fingerprint(query)
            if receipt.get("request_fingerprint") != expected_fingerprint:
                errors.append(
                    f"beat {bid}: asset_ref {ref} resolution is stale for its asset_query"
                )
            if query.get("type") == "logo":
                requested = query.get("entity")
                canonical = item.get("canonical_entity")
                resolved_entity = receipt.get("resolved_entity")
                if _identity(requested) != _identity(canonical):
                    errors.append(
                        f"beat {bid}: asset_ref {ref} query identity {requested!r} "
                        f"does not match canonical entity {canonical!r}"
                    )
                if _identity(resolved_entity) != _identity(requested):
                    errors.append(
                        f"beat {bid}: asset_ref {ref} resolved identity "
                        f"{resolved_entity!r} does not match request {requested!r}"
                    )
                requested_variant = query.get("variant")
                if requested_variant and receipt.get("variant") != requested_variant:
                    errors.append(
                        f"beat {bid}: asset_ref {ref} resolved variant "
                        f"{receipt.get('variant')!r} does not satisfy "
                        f"{requested_variant!r}"
                    )
            path = receipt.get("path")
            if not isinstance(path, str) or not path.strip():
                errors.append(f"beat {bid}: asset_ref {ref} receipt has no local path")
            elif not (work / path).is_file():
                errors.append(f"beat {bid}: asset_ref {ref} local file is missing: {path}")
    for ref, item in opportunities.items():
        if item.get("decision") in file_decisions and ref not in used_refs:
            errors.append(
                f"{ASSET_PLAN_NAME}: approved file opportunity {ref} is not bound "
                "by any film-plan beat asset_refs"
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


def resolve(
    plan: dict[str, Any],
    words: list[dict[str, Any]],
    asset_plan: dict[str, Any],
) -> dict[str, Any]:
    plan = json.loads(json.dumps(plan))  # deep copy
    opportunities = {
        item["id"]: item
        for item in asset_plan.get("opportunities", [])
        if isinstance(item, dict) and item.get("id")
    }
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
        beat["assets"] = []
        for ref in beat.get("asset_refs") or []:
            item = opportunities[ref]
            receipt = item["resolution"]
            beat["assets"].append(
                {
                    "ref": ref,
                    "canonical_entity": item.get("canonical_entity"),
                    "decision": item.get("decision"),
                    "asset_id": receipt.get("asset_id"),
                    "path": receipt.get("path"),
                    "provider": receipt.get("provider"),
                    "variant": receipt.get("variant"),
                    "license_state": receipt.get("license_state"),
                }
            )
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
        asset_plan = load_asset_plan(work)
        errors.extend(validate_asset_refs(work, plan, asset_plan))
        if errors:
            for msg in errors:
                print(f"FAIL {msg}", file=sys.stderr)
            print(f"error: {len(errors)} contract violation(s) in {PLAN_NAME}", file=sys.stderr)
            return 1
        if args.resolve:
            resolved = resolve(plan, load_words(work), asset_plan)
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
