#!/usr/bin/env python3
"""Word-level beat lookup: turn ASR word timestamps into packaging cue times.

The transcript is a JSON array of {text, start, end} word entries (the ASR
output already produced by the pipeline). Packaging that lands on the spoken
word is the difference between a template and a directed film; this tool is
how an agent finds those instants without re-reading the whole transcript.

Examples:
  word_sync.py transcript.json --find "杀死很多AI初创"
  word_sync.py transcript.json --find "一个月前" --all
  word_sync.py transcript.json --window 43 48
  word_sync.py transcript.json --gaps 0.8        # silences ≥0.8s (quiet beats)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def load_words(path: Path) -> list[dict]:
    words = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(words, list) or not words or "start" not in words[0]:
        raise SystemExit("transcript must be a JSON array of {text,start,end} words")
    return words


def normalize(s: str) -> str:
    return "".join(c for c in s if not c.isspace() and c not in "，。！？、,.!?…:;：；\"'（）()")


def find_phrase(words: list[dict], phrase: str, find_all: bool) -> list[dict]:
    target = normalize(phrase)
    hits = []
    for i in range(len(words)):
        joined = ""
        for j in range(i, min(i + 80, len(words))):
            joined += normalize(words[j]["text"])
            if joined == target:
                span = words[i : j + 1]
                hits.append({
                    "phrase": phrase,
                    "start": span[0]["start"],
                    "end": span[-1]["end"],
                    "words": [
                        {"text": w["text"], "start": w["start"], "end": w["end"]} for w in span
                    ],
                })
                if not find_all:
                    return hits
                break
            if len(joined) >= len(target):
                break
    return hits


def gaps(words: list[dict], min_gap: float) -> list[dict]:
    out = []
    for a, b in zip(words, words[1:]):
        g = b["start"] - a["end"]
        if g >= min_gap:
            out.append({
                "start": round(a["end"], 3), "end": round(b["start"], 3),
                "gap": round(g, 3),
                "after": a["text"], "before": b["text"],
            })
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("transcript", type=Path)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--find", help="phrase to locate (whitespace/punctuation ignored)")
    action.add_argument("--window", nargs=2, type=float, metavar=("START", "END"),
                        help="list every word inside a time window")
    action.add_argument("--gaps", type=float, metavar="SECONDS",
                        help="list speech silences at least this long (quiet-beat candidates)")
    parser.add_argument("--all", action="store_true", help="with --find, return every occurrence")
    args = parser.parse_args()

    words = load_words(args.transcript)
    if args.find:
        hits = find_phrase(words, args.find, args.all)
        if not hits:
            print(json.dumps({"phrase": args.find, "hits": []}, ensure_ascii=False))
            return 1
        result = {"phrase": args.find, "hits": hits}
    elif args.window:
        lo, hi = args.window
        result = {"window": [lo, hi], "words": [
            w for w in words if w["end"] > lo and w["start"] < hi
        ]}
    else:
        result = {"min_gap": args.gaps, "silences": gaps(words, args.gaps)}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
