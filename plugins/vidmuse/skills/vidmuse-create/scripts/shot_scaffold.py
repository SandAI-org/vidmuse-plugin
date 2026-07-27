#!/usr/bin/env python3
"""Generate the HyperFrames/GSAP skeleton from film-plan.resolved.json.

The skeleton turns implementation from "free-write a timeline" into
"fill locked slots": every approved shot_sequence window becomes a
tl.addLabel() at its absolute time plus a FILL comment carrying the
approved on_screen / move / cue text. check_motion.py later verifies the
labels survived and every non-hold window has at least one tween
positioned at its label — so the plan the user confirmed is the plan
that ships.

Usage:
  python3 scripts/film_plan.py "$WORK_DIR" --resolve
  python3 scripts/shot_scaffold.py "$WORK_DIR"            # -> public/index.html
  python3 scripts/shot_scaffold.py "$WORK_DIR" --force    # overwrite existing
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

RESOLVED_NAME = "film-plan.resolved.json"

CONTRACT_BANNER = """\
      /* ── SCAFFOLD CONTRACT — enforced by scripts/check_motion.py ─────────────
         1. Keep every tl.addLabel("bXX.wY", …). Label times are locked to the
            confirmed film plan; move the plan (re-resolve), never the label.
         2. Every non-hold window needs >=1 tween positioned at its label:
              tl.fromTo(el, {...}, {...}, "bXX.wY")        // or "bXX.wY+=0.15"
         3. NO uniform per-section fade-in/fade-out helper (the appear()/autoAlpha
            template is the PPT signature). transition_in owns each beat's
            entry, and the NEXT transition owns this beat's exit.
         4. kind=hold windows are planned stillness — leave them still; do not
            add screensaver drift to pass checks.
         5. Reveal on the cue: content named by a vo_cue should change state
            within ±0.3s of that cue time (check_motion samples the render).
         6. Pixel-precise UI/image overlays use the alignment contract:
            target + overlay inside one data-vm-align-space; animate that
            shared wrapper, not either child. check_motion S5 enforces it.
         ───────────────────────────────────────────────────────────────────── */
"""


def _fmt(t: float) -> str:
    return f"{t:.3f}".rstrip("0").rstrip(".")


def _cues_in(win: dict[str, Any], cues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    lo, hi = win["abs"]
    return [c for c in cues if lo - 0.15 <= c["t"] < hi + 0.15]


def render(plan: dict[str, Any]) -> str:
    beats = plan["beats"]
    duration = beats[-1]["ata_range"][1]
    fps = plan.get("fps", 30)
    width = plan.get("width", 1920)
    height = plan.get("height", 1080)
    comp_id = plan.get("composition_id", "create-film")
    hero = plan.get("hero_throughline")

    sections: list[str] = []
    script: list[str] = [CONTRACT_BANNER]

    for idx, beat in enumerate(beats):
        bid = beat["id"]
        start, end = beat["ata_range"]
        span = end - start

        hero_note = ""
        if hero:
            hero_note = (
                f"\n        <!-- HERO THROUGHLINE: keep '{hero['name']}' on stage here"
                f" (selector contains: {hero['dom_selector']}) -->"
            )
        asset_note = ""
        if beat.get("asset_candidates"):
            asset_note = (
                "\n        <!-- ASSETS (from capture inventory): "
                + ", ".join(beat["asset_candidates"]) + " -->"
            )
        alignment_note = ""
        if beat.get("ui_proof_path") in ("screenshot-camera", "hybrid-slices"):
            alignment_note = (
                "\n        <!-- ALIGNMENT REQUIRED: wrap real UI + precise overlays in one "
                "data-vm-align-space; see references/alignment-contract.md -->"
            )
        sections.append(
            f"""      <section id="{bid}" class="beat" data-beat="{bid}"
        data-start="{_fmt(start)}" data-duration="{_fmt(span)}" data-track-index="{idx + 1}">
        <!-- {beat['path_role']} · {beat['visual_kind']} · {beat.get('key_message', '')} -->{hero_note}{asset_note}{alignment_note}
        <!-- FILL: static hero layout first (fully entered, readable), then animate INTO it -->
      </section>"""
        )

        prev = beats[idx - 1]["id"] if idx else None
        script.append(
            f"      // ═══ {bid} · {beat['path_role']} · {_fmt(start)}s → {_fmt(end)}s ═══"
        )
        if prev:
            script.append(
                f"      /* TRANSITION {prev}→{bid} ({beat['transition_in']}):\n"
                f"         implement around t={_fmt(start)} — this transition owns {prev}'s exit;\n"
                f"         {prev} must NOT empty itself with its own exit tweens first. */"
            )
        else:
            script.append(f"      /* OPEN ({beat['transition_in']}): film starts inside {bid}. */")
        for cue in beat.get("sfx") or []:
            script.append(
                f"      /* SFX @{_fmt(cue['abs_t'])}s — {cue['role']} "
                f"(Timeline sound track entry, not GSAP; visual mech moment should land here) */"
            )

        for win in beat["shot_sequence"]:
            wid = win["id"]
            lo, hi = win["abs"]
            cue_txt = "".join(
                f"\n         cue “{c['text']}” @{_fmt(c['t'])}s" for c in _cues_in(win, beat["vo_cues"])
            )
            if win["kind"] == "hold":
                script.append(
                    f"      /* HOLD {wid} [{_fmt(lo)} → {_fmt(hi)}] — planned stillness for the read:"
                    f"\n         {win['on_screen']} */"
                )
            else:
                script.append(
                    f"      /* FILL {wid} [{_fmt(lo)} → {_fmt(hi)}] {win['kind']}:{cue_txt}"
                    f"\n         on_screen: {win['on_screen']}"
                    f"\n         move: {win['move']}"
                    f"\n         position tweens at the {wid} label (quoted, as a GSAP position) */"
                )
            script.append(f'      tl.addLabel("{wid}", {_fmt(lo)});')
        script.append("")

    joined_sections = "\n\n".join(sections)
    joined_script = "\n".join(script)
    return f"""<!doctype html>
<html lang="zh-CN" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={width}, height={height}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <style>
      /* FILL: FRAME.md tokens (palette / type / material) — seed from brand capture
         or one hyperframes-creative frame preset; no anonymous black + white type. */
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {width}px; height: {height}px; overflow: hidden; }}
      #root {{ position: relative; width: {width}px; height: {height}px; overflow: hidden; }}
      .beat {{ position: absolute; inset: 0; }}
    </style>
  </head>
  <body>
    <main
      id="root"
      data-composition-id="{comp_id}"
      data-start="0"
      data-duration="{_fmt(duration)}"
      data-width="{width}"
      data-height="{height}"
      data-fps="{fps}"
    >
{joined_sections}
    </main>

    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});

{joined_script}
      window.__timelines["{comp_id}"] = tl;
    </script>
  </body>
</html>
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("work_dir", help="film work directory with film-plan.resolved.json")
    parser.add_argument("--out", help="output path (default: <work>/public/index.html)")
    parser.add_argument("--force", action="store_true", help="overwrite an existing file")
    args = parser.parse_args(argv)

    work = Path(args.work_dir).resolve()
    resolved = work / RESOLVED_NAME
    if not resolved.is_file():
        print(f"error: missing {resolved} — run film_plan.py --resolve first", file=sys.stderr)
        return 1
    plan = json.loads(resolved.read_text(encoding="utf-8"))
    if not plan.get("resolved"):
        print("error: plan is not resolved (no absolute times)", file=sys.stderr)
        return 1

    out = Path(args.out).resolve() if args.out else work / "public" / "index.html"
    if out.exists() and not args.force:
        print(f"error: {out} exists — use --force to overwrite", file=sys.stderr)
        return 1
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(plan), encoding="utf-8")

    beats = plan["beats"]
    wins = sum(len(b["shot_sequence"]) for b in beats)
    holds = sum(1 for b in beats for w in b["shot_sequence"] if w["kind"] == "hold")
    print(f"ok: {out} — {len(beats)} beats, {wins} window labels ({holds} holds), "
          f"duration {beats[-1]['ata_range'][1]:.2f}s")
    print("next: fill each FILL slot, keep every addLabel, then check_motion.py after render")
    return 0


if __name__ == "__main__":
    sys.exit(main())
