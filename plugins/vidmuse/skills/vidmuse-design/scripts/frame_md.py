#!/usr/bin/env python3
"""Load a project's FRAME.md and lint it mechanically.

FRAME.md is the single authored design artifact in the work directory,
written in the private VidMuse frame-pack shape: one YAML frontmatter
block carrying every concrete token (colors, typography, spacing, motion,
components), followed by the prose spec the LLM follows while writing
composition HTML. There is no separate machine-spec JSON to keep in sync.

This tool checks only what a parser can check — the file parses, tokens the
downstream showcase and composition need are present, colors are real hex.
Whether the design is any good is judged by eyes: the FRAME.md self-audit
prose and the frame-showcase confirmation gate, never by this script.

Loading order:
  1. YAML frontmatter (`vidmuse.design.frame.v1`; legacy Recut v4/v5 accepted).
  2. First ```json fence, or a bare .json file — legacy v3 artifacts.

Examples:
  frame_md.py videos/demo/FRAME.md --check      # mechanical lint
  frame_md.py videos/demo/FRAME.md --extract    # print the parsed tokens as JSON
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


class FrameMdError(ValueError):
    pass


FRONTMATTER = re.compile(r"\A---\s*\n(.*?)^---\s*$", re.DOTALL | re.MULTILINE)
SPEC_FENCE = re.compile(r"^```json\s*\n(.*?)^```\s*$", re.DOTALL | re.MULTILINE)
HEX_COLOR = re.compile(r"\A#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\Z")
# Private frame packs also declare translucency as rgba()/hsla(); accept those
# for pack lint so their design tokens are not rejected as invalid colors.
CSS_COLOR = re.compile(
    r"\A(?:"
    r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})"
    r"|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)"
    r"|hsla?\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+)?\s*\)"
    r")\Z",
    re.IGNORECASE,
)

SCHEMA_DESIGN_V1 = "vidmuse.design.frame.v1"
SCHEMA_V4 = "vidmuse.recut.frame.v4"
SCHEMA_V5 = "vidmuse.recut.frame.v5"
CURRENT_SCHEMAS = (SCHEMA_DESIGN_V1, SCHEMA_V4, SCHEMA_V5)
MODES = ("preset", "composed")
PRODUCTION_MODES = ("packaging", "director")
FILM_MODES = ("recut-packaging", "recut-director", "create")
CREATE_PATHS = ("promo", "explainer", "vox")
REQUIRED_MOTION = ("dur_fast", "dur_base", "dur_slow", "ease_enter", "ease_exit")
REQUIRED_FILM_SPINE = (
    "editorial_stance",
    "global_typography_logic",
    "color_relationship",
    "material_bridge",
    "motion_physics",
    "sound_motif",
    "caption_behavior",
    "source_image_policy",
)
REQUIRED_ACT_WORLD = (
    "id",
    "narrative_job",
    "visual_culture",
    "material",
    "typography_character",
    "palette_shift",
    "composition_behavior",
    "camera_language",
    "transition_language",
    "sound_state",
    "allowed_mechanisms",
    "avoid",
)


def _parse_frontmatter(markdown: str, source: str) -> dict[str, Any] | None:
    match = FRONTMATTER.match(markdown)
    if not match:
        return None
    try:
        import yaml
    except ImportError as exc:
        raise FrameMdError(
            f"{source}: PyYAML is required to parse FRAME.md frontmatter (pip install pyyaml)"
        ) from exc
    raw = match.group(1)
    try:
        data = yaml.safe_load(raw)
    except yaml.YAMLError:
        # Upstream frame packs write `token:{ ... }` (no space after the
        # colon), which strict YAML rejects. Retry with the space restored.
        relaxed = re.sub(r"^(\s*[\w-]+):\{", r"\1: {", raw, flags=re.MULTILINE)
        try:
            data = yaml.safe_load(relaxed)
        except yaml.YAMLError as exc:
            raise FrameMdError(f"{source}: frontmatter is not valid YAML: {exc}") from exc
    if not isinstance(data, dict):
        raise FrameMdError(f"{source}: frontmatter must be a YAML mapping")
    return data


def _parse_legacy_spec(text: str, source: str) -> dict[str, Any]:
    matches = SPEC_FENCE.findall(text)
    if not matches:
        raise FrameMdError(f"{source}: no YAML frontmatter and no ```json spec block found")
    try:
        spec = json.loads(matches[0])
    except json.JSONDecodeError as exc:
        raise FrameMdError(f"{source}: spec block is not valid JSON: {exc}") from exc
    if not isinstance(spec, dict):
        raise FrameMdError(f"{source}: spec must be a JSON object")
    return spec


def load_design_document(path: Path) -> dict[str, Any]:
    """Load the design tokens from FRAME.md (frontmatter first, legacy fallback)."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise FrameMdError(f"{path}: {exc}") from exc

    if path.suffix.lower() in {".md", ".markdown"}:
        spec = _parse_frontmatter(text, source=str(path))
        if spec is not None and spec.get("schema") not in CURRENT_SCHEMAS and not _is_template_pack(spec):
            spec = None
        if spec is None:
            spec = _parse_legacy_spec(text, source=str(path))
    else:
        try:
            spec = json.loads(text)
        except json.JSONDecodeError as exc:
            raise FrameMdError(f"{path}: not valid JSON: {exc}") from exc
        if not isinstance(spec, dict):
            raise FrameMdError(f"{path}: spec must be a JSON object")

    # Legacy shim: older tools read implementation.motion; a v4 document
    # carries motion at the top level.
    if "motion" in spec and "implementation" not in spec:
        spec["implementation"] = {"motion": spec["motion"]}
    return spec


def _is_template_pack(spec: dict[str, Any]) -> bool:
    """A private VidMuse frame-pack template without a project schema tag."""
    return "schema" not in spec and isinstance(spec.get("colors"), dict) and isinstance(spec.get("typography"), dict)


def _is_color_token(value: str) -> bool:
    text = value.strip()
    return bool(HEX_COLOR.match(text) or CSS_COLOR.match(text))


def _lint_template_pack(spec: dict[str, Any], source: str) -> dict[str, Any]:
    problems: list[str] = []
    for name, value in spec["colors"].items():
        if not isinstance(value, str) or not _is_color_token(value):
            problems.append(f"colors.{name}: {value!r} is not a hex/rgba color token")
    for name, style in spec["typography"].items():
        if not isinstance(style, dict) or not style.get("fontFamily"):
            problems.append(f"typography.{name}: missing fontFamily")
    if problems:
        raise FrameMdError(f"{source}: " + "; ".join(problems))
    missing = [key for key in REQUIRED_MOTION if key not in (spec.get("motion") or {})]
    return {
        "ok": True,
        "path": source,
        "mode": "template-pack",
        "name": spec.get("name", ""),
        "colors": len(spec["colors"]),
        "typography": len(spec["typography"]),
        "components": len(spec.get("components") or {}),
        "to_adopt": (["mode", "project"] + (["motion"] if missing else [])),
        "note": "template source, not a project FRAME.md — adopt via preset mode and add the missing keys",
    }


def _lint_current(spec: dict[str, Any], source: str) -> dict[str, Any]:
    problems: list[str] = []
    schema = spec.get("schema")

    mode = spec.get("mode")
    if mode not in MODES:
        problems.append(f"mode must be one of {MODES}, got {mode!r}")
    if not spec.get("project"):
        problems.append("project is missing")

    colors = spec.get("colors")
    if not isinstance(colors, dict) or not colors:
        problems.append("colors must be a non-empty mapping")
    else:
        for name, value in colors.items():
            # Same token set as private packs so offline-adopted presets
            # (which may carry rgba translucency keys) still lint as v4.
            if not isinstance(value, str) or not _is_color_token(value):
                problems.append(f"colors.{name}: {value!r} is not a hex/rgba color token")

    typography = spec.get("typography")
    if not isinstance(typography, dict) or not typography:
        problems.append("typography must be a non-empty mapping")
    else:
        for name, style in typography.items():
            if not isinstance(style, dict) or not style.get("fontFamily"):
                problems.append(f"typography.{name}: missing fontFamily")

    motion = spec.get("motion")
    if not isinstance(motion, dict):
        problems.append("motion must be a mapping (template packs stop at composition; this pipeline requires it)")
    else:
        missing = [key for key in REQUIRED_MOTION if key not in motion]
        if missing:
            problems.append(f"motion missing {', '.join(missing)}")

    # spacing is required by the FRAME.md contract; packs ship it and project
    # docs ask agents to copy it on preset adopt. A missing or empty map is a
    # mechanical defect (content quality still lives in prose / eyes).
    spacing = spec.get("spacing")
    if not isinstance(spacing, dict) or not spacing:
        problems.append("spacing must be a non-empty mapping")

    components = spec.get("components")
    if components is not None and not isinstance(components, dict):
        problems.append("components must be a mapping when present")

    film_mode: str | None = None
    create_path: str | None = None
    production_mode: str | None = None
    film_spine: dict[str, Any] | None = None
    act_worlds: list[Any] | None = None
    director_mode = False
    if schema == SCHEMA_DESIGN_V1:
        film_mode = spec.get("film_mode")
        if film_mode not in FILM_MODES:
            problems.append(f"film_mode must be one of {FILM_MODES}, got {film_mode!r}")
        director_mode = film_mode == "recut-director"
        if film_mode == "create":
            create_path = spec.get("create_path")
            if create_path not in CREATE_PATHS:
                problems.append(
                    f"create_path must be one of {CREATE_PATHS} in create mode, "
                    f"got {create_path!r}"
                )
    elif schema == SCHEMA_V5:
        production_mode = spec.get("production_mode")
        if production_mode not in PRODUCTION_MODES:
            problems.append(
                f"production_mode must be one of {PRODUCTION_MODES}, got {production_mode!r}"
            )
        director_mode = production_mode == "director"

    if director_mode:
        film_spine = spec.get("film_spine")
        if not isinstance(film_spine, dict):
            problems.append("film_spine must be a mapping in Director mode")
        else:
            missing_spine = [key for key in REQUIRED_FILM_SPINE if not film_spine.get(key)]
            if missing_spine:
                problems.append(f"film_spine missing {', '.join(missing_spine)}")

        act_worlds = spec.get("act_worlds")
        if not isinstance(act_worlds, list) or not act_worlds:
            problems.append("act_worlds must be a non-empty list in Director mode")
        else:
            seen_ids: set[str] = set()
            for index, world in enumerate(act_worlds):
                if not isinstance(world, dict):
                    problems.append(f"act_worlds[{index}] must be a mapping")
                    continue
                missing_world = [
                    key
                    for key in REQUIRED_ACT_WORLD
                    if key not in world
                    or world[key] is None
                    or world[key] == ""
                    or (isinstance(world[key], list) and key == "allowed_mechanisms" and not world[key])
                ]
                if missing_world:
                    problems.append(
                        f"act_worlds[{index}] missing {', '.join(missing_world)}"
                    )
                world_id = world.get("id")
                if isinstance(world_id, str):
                    if world_id in seen_ids:
                        problems.append(f"act_worlds[{index}].id duplicates {world_id!r}")
                    seen_ids.add(world_id)

    if problems:
        raise FrameMdError(f"{source}: " + "; ".join(problems))
    report = {
        "ok": True,
        "path": source,
        "schema": schema,
        "project": spec["project"],
        "mode": mode,
        "colors": len(colors),
        "typography": len(typography),
        "spacing": len(spacing),
        "components": len(components or {}),
    }
    if schema == SCHEMA_DESIGN_V1:
        report.update(
            {
                "film_mode": film_mode,
                "create_path": create_path,
                "film_spine": bool(film_spine),
                "act_worlds": len(act_worlds or []),
            }
        )
    elif schema == SCHEMA_V5:
        report.update(
            {
                "production_mode": production_mode,
                "film_spine": bool(film_spine),
                "act_worlds": len(act_worlds or []),
            }
        )
    return report


def _lint_legacy(spec: dict[str, Any], source: str) -> dict[str, Any]:
    missing = [key for key in ("schema", "project_id", "implementation") if key not in spec]
    if missing:
        raise FrameMdError(f"{source}: legacy spec missing fields {missing}")
    impl = spec.get("implementation")
    if not isinstance(impl, dict) or not impl.get("palette") or not impl.get("fonts"):
        raise FrameMdError(f"{source}: legacy implementation must carry concrete palette and fonts")
    return {
        "ok": True,
        "path": source,
        "schema": spec["schema"],
        "project": spec["project_id"],
        "mode": "legacy",
    }


def check(path: Path, *, allow_template_pack: bool = False) -> dict[str, Any]:
    spec = load_design_document(path)
    if spec.get("schema") in CURRENT_SCHEMAS:
        return _lint_current(spec, str(path))
    if _is_template_pack(spec):
        if allow_template_pack:
            return _lint_template_pack(spec, str(path))
        raise FrameMdError(
            f"{path}: project FRAME.md is missing schema; "
            "template packs may be checked only with --template-pack"
        )
    return _lint_legacy(spec, str(path))


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("path", type=Path, help="FRAME.md (or a legacy design-system .json)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="mechanical lint; JSON report on success")
    group.add_argument("--extract", action="store_true", help="print the parsed tokens as JSON")
    parser.add_argument(
        "--template-pack",
        action="store_true",
        help="allow a schema-less official/private frame-pack source",
    )
    args = parser.parse_args()

    try:
        if args.extract:
            print(json.dumps(load_design_document(args.path), ensure_ascii=False, indent=2))
        else:
            print(json.dumps(
                check(args.path, allow_template_pack=args.template_pack),
                ensure_ascii=False,
                indent=2,
            ))
    except FrameMdError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
