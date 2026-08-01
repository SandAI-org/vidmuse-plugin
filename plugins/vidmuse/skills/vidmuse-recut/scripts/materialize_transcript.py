#!/usr/bin/env python3
"""Materialize media-use's transcript receipt as Recut's canonical flat words.

The media capability returns ``{text, words, utterances, ...}``; Recut's
mechanical tools intentionally consume only ``[{text,start,end}, ...]``. This
adapter keeps the original receipt untouched and writes the canonical view
atomically so every downstream tool sees the same shape.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any


def materialize(value: Any) -> list[dict[str, Any]]:
    raw_words = value if isinstance(value, list) else value.get("words") if isinstance(value, dict) else None
    if not isinstance(raw_words, list) or not raw_words:
        raise ValueError("input must be a non-empty word array or an object with words[]")

    words: list[dict[str, Any]] = []
    previous_start = -1.0
    for index, raw in enumerate(raw_words):
        if not isinstance(raw, dict):
            raise ValueError(f"words[{index}] must be an object")
        text = str(raw.get("text", raw.get("word", ""))).strip()
        start = raw.get("start", raw.get("start_time", raw.get("startTime")))
        end = raw.get("end", raw.get("end_time", raw.get("endTime")))
        if not text:
            raise ValueError(f"words[{index}].text is empty")
        if not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
            raise ValueError(f"words[{index}] needs numeric start and end")
        start, end = float(start), float(end)
        if not math.isfinite(start) or not math.isfinite(end) or start < 0 or end < start:
            raise ValueError(f"words[{index}] has invalid time range {start!r}..{end!r}")
        if start < previous_start:
            raise ValueError(f"words[{index}] starts before the previous word")
        previous_start = start
        words.append({"text": text, "start": start, "end": end})
    return words


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="media-use receipt or existing flat transcript")
    parser.add_argument("--out", type=Path, required=True, help="canonical transcript.json path")
    args = parser.parse_args(argv)
    try:
        value = json.loads(args.input.read_text(encoding="utf-8"))
        words = materialize(value)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.out.with_suffix(args.out.suffix + ".tmp")
        temporary.write_text(
            json.dumps(words, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temporary.replace(args.out)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, "input": str(args.input), "output": str(args.out), "words": len(words)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
