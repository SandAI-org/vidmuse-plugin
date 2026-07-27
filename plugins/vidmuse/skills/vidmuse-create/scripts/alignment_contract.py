#!/usr/bin/env python3
"""Static semantic-alignment checks for VidMuse create compositions.

The contract makes precise overlays correct by construction:

- a shared wrapper declares ``data-vm-align-space``
- an overlay declares ``data-vm-anchor-target="#target-id"``
- raster sub-regions use normalized inline percentage geometry
- spatial motion targets the shared space, not the target/overlay separately

This module intentionally uses only the Python standard library so
``check_motion.py`` can run in a clean plugin environment.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Any

SPACE_ATTR = "data-vm-align-space"
TARGET_ATTR = "data-vm-anchor-target"
LOCAL_MOTION_ATTR = "data-vm-anchor-local-motion"
SPACE_SIZE_ATTR = "data-vm-space-size"

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
RASTER_TAGS = {"img", "video"}
SPATIAL_PROP_RE = re.compile(
    r"\b(?:x|y|xPercent|yPercent|scale|scaleX|scaleY|rotation|rotationX|rotationY)\s*:"
)


@dataclass
class Element:
    tag: str
    attrs: dict[str, str]
    parent: "Element | None" = None
    children: list["Element"] = field(default_factory=list)

    @property
    def element_id(self) -> str:
        return self.attrs.get("id", "")


class CompositionParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Element("document", {})
        self.stack = [self.root]
        self.elements: list[Element] = []
        self.by_id: dict[str, Element] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name: value or "" for name, value in attrs}
        node = Element(tag.lower(), values, self.stack[-1])
        self.stack[-1].children.append(node)
        self.elements.append(node)
        if node.element_id:
            self.by_id[node.element_id] = node
        if tag.lower() not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID_TAGS:
            self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return


def _nearest_attr(node: Element | None, name: str) -> Element | None:
    while node is not None:
        if name in node.attrs:
            return node
        node = node.parent
    return None


def _is_descendant(node: Element, ancestor: Element) -> bool:
    current: Element | None = node
    while current is not None:
        if current is ancestor:
            return True
        current = current.parent
    return False


def _style_percent_box(style: str) -> tuple[float, float, float, float] | None:
    values: dict[str, float] = {}
    for name, raw in re.findall(
        r"(?:^|;)\s*(left|top|width|height)\s*:\s*"
        r"([-+]?(?:\d+(?:\.\d*)?|\.\d+))%\s*(?=;|$)",
        style,
        re.IGNORECASE,
    ):
        values[name.lower()] = float(raw) / 100.0
    if set(values) != {"left", "top", "width", "height"}:
        return None
    return values["left"], values["top"], values["width"], values["height"]


def _valid_box(box: tuple[float, float, float, float]) -> bool:
    x, y, width, height = box
    return (
        all(math.isfinite(value) for value in box)
        and x >= 0
        and y >= 0
        and width > 0
        and height > 0
        and x + width <= 1.000001
        and y + height <= 1.000001
    )


def _valid_space_size(value: str) -> bool:
    parts = re.split(r"[\s,×x]+", value.strip())
    if len(parts) != 2:
        return False
    try:
        width, height = (float(part) for part in parts)
    except ValueError:
        return False
    return math.isfinite(width) and math.isfinite(height) and width > 0 and height > 0


def _has_spatial_tween(html: str, element_id: str) -> bool:
    if not element_id:
        return False
    selector = re.escape(element_id)
    call = re.compile(
        rf"\b[A-Za-z_$][\w$]*\.(?:to|from|fromTo)\(\s*"
        rf"([\"'])#{selector}\1\s*,(?P<body>.*?)\)\s*;",
        re.DOTALL,
    )
    return any(SPATIAL_PROP_RE.search(match.group("body")) for match in call.finditer(html))


def evaluate_alignment(html: str, proof_beats: list[str]) -> list[dict[str, Any]]:
    """Return alignment checks as ``{id, ok, where, detail}`` dictionaries."""
    parser = CompositionParser()
    parser.feed(html)
    checks: list[dict[str, Any]] = []

    beat_nodes = {
        node.attrs["data-beat"]: node
        for node in parser.elements
        if "data-beat" in node.attrs
    }

    for beat_id in proof_beats:
        beat = beat_nodes.get(beat_id)
        spaces = (
            [node for node in parser.elements
             if SPACE_ATTR in node.attrs and _is_descendant(node, beat)]
            if beat is not None else []
        )
        checks.append({
            "id": "S5.align-space",
            "ok": bool(spaces),
            "where": beat_id,
            "detail": (
                f"{len(spaces)} shared alignment space(s)"
                if spaces else
                f"promo proof beat needs a [{SPACE_ATTR}] wrapper; "
                "camera motion must target that wrapper, not the capture alone"
            ),
        })

    anchors = [node for node in parser.elements if TARGET_ATTR in node.attrs]
    for index, anchor in enumerate(anchors, 1):
        where = anchor.element_id or f"anchor-{index}"
        target_ref = anchor.attrs.get(TARGET_ATTR, "").strip()
        problems: list[str] = []

        if not re.fullmatch(r"#[A-Za-z_][\w:.-]*", target_ref):
            problems.append(f"{TARGET_ATTR} must be a local #id selector")
            target = None
        else:
            target = parser.by_id.get(target_ref[1:])
            if target is None:
                problems.append(f"target {target_ref} does not exist")

        anchor_space = _nearest_attr(anchor, SPACE_ATTR)
        target_space = _nearest_attr(target, SPACE_ATTR) if target else None
        if anchor_space is None:
            problems.append(f"anchor is outside a [{SPACE_ATTR}] wrapper")
        elif target_space is not anchor_space:
            problems.append("anchor and target are in different transform spaces")

        if target is not None and target.tag in RASTER_TAGS:
            if anchor_space is not None and not _valid_space_size(
                anchor_space.attrs.get(SPACE_SIZE_ATTR, "")
            ):
                problems.append(
                    f"raster space needs {SPACE_SIZE_ATTR}=\"<width> <height>\""
                )
            box = _style_percent_box(anchor.attrs.get("style", ""))
            if box is None:
                problems.append(
                    "raster anchor needs inline left/top/width/height percentages"
                )
            elif not _valid_box(box):
                problems.append("normalized anchor box must stay inside 0–100%")

        for role, node in (("target", target), ("anchor", anchor)):
            if (
                node is not None
                and node is not anchor_space
                and _has_spatial_tween(html, node.element_id)
                and not node.attrs.get(LOCAL_MOTION_ATTR, "").strip()
            ):
                problems.append(
                    f"{role} #{node.element_id} has direct spatial tween; "
                    f"animate [{SPACE_ATTR}] or declare {LOCAL_MOTION_ATTR} with a reason"
                )

        checks.append({
            "id": "S5.anchor",
            "ok": not problems,
            "where": where,
            "detail": (
                f"{target_ref} shares "
                f"{SPACE_ATTR}={anchor_space.attrs.get(SPACE_ATTR)!r}"
                if not problems and anchor_space is not None else
                "; ".join(problems)
            ),
        })

    return checks
