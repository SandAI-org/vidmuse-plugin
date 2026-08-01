#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from packaging_lint import lint_fonts, lint_overlay


def work_dir(html: str, duration: float | None = 120.0) -> Path:
    work = Path(tempfile.mkdtemp())
    (work / "public").mkdir()
    (work / "public" / "index.html").write_text(html, encoding="utf-8")
    if duration is not None:
        (work / "metadata.json").write_text(json.dumps({"duration": duration}), encoding="utf-8")
    return work


CLIP = '<section id="{id}" class="clip" data-start="{start}" data-duration="{dur}"><span>x</span></section>'


def page(*clips: str) -> str:
    return "<!doctype html><html><body>" + "".join(clips) + "</body></html>"


class OverlayLintTests(unittest.TestCase):
    def run_lint(self, work: Path, allow: set[str] | None = None) -> dict:
        return lint_overlay(work, dwell_limit=8.0, coverage_limit=0.6,
                            allow_continuous=allow or set(), duration=None)

    def test_timed_interventions_pass(self) -> None:
        work = work_dir(page(
            CLIP.format(id="title", start=4, dur=3),
            CLIP.format(id="callout", start=18.5, dur=4),
        ))
        report = self.run_lint(work)
        self.assertTrue(report["pass"], report)

    def test_overlong_dwell_is_a_finding(self) -> None:
        work = work_dir(page(CLIP.format(id="big-graphic", start=20, dur=13)))
        report = self.run_lint(work)
        self.assertFalse(report["pass"])
        self.assertIn("dwells 13s", report["findings"][0]["error"])

    def test_whole_film_takeover_fails_three_ways(self) -> None:
        work = work_dir(page(CLIP.format(id="full-takeover", start=0, dur=120)))
        report = self.run_lint(work)
        errors = " | ".join(f["error"] for f in report["findings"])
        self.assertIn("dwells", errors)
        self.assertIn("never breathes", errors)
        self.assertIn("spans nearly the whole film", errors)

    def test_exempted_continuous_system_passes(self) -> None:
        work = work_dir(page(
            CLIP.format(id="captions-band", start=0, dur=120),
            CLIP.format(id="title", start=4, dur=3),
        ))
        report = self.run_lint(work, allow={"captions-band"})
        self.assertTrue(report["pass"], report)

    def test_no_timed_windows_warns_about_fallback(self) -> None:
        work = work_dir('<html><body><div id="x">no clips</div></body></html>')
        report = self.run_lint(work)
        self.assertFalse(report["pass"])
        self.assertIn("full-duration overlay item", report["findings"][0]["error"])

    def test_missing_duration_skips_coverage_but_keeps_dwell(self) -> None:
        work = work_dir(page(CLIP.format(id="big", start=0, dur=30)), duration=None)
        report = self.run_lint(work)
        self.assertFalse(report["pass"])
        self.assertEqual(len(report["findings"]), 1)
        self.assertIn("dwells", report["findings"][0]["error"])
        self.assertIn("coverage checks skipped", report["note"])

    def test_overlapping_clips_count_occupancy_once(self) -> None:
        # Two 40s clips overlapping 30-70 and 50-90: union is 60s of 120 = 50% < 60%
        work = work_dir(page(
            CLIP.format(id="a", start=30, dur=40),
            CLIP.format(id="b", start=50, dur=40),
        ))
        report = lint_overlay(work, dwell_limit=45.0, coverage_limit=0.6,
                              allow_continuous=set(), duration=None)
        self.assertTrue(report["pass"], report)

    def test_no_overlay_html_is_a_pass(self) -> None:
        work = Path(tempfile.mkdtemp())
        report = self.run_lint(work)
        self.assertTrue(report["pass"])
        self.assertIn("no overlay HTML", report["note"])


class FontLintTests(unittest.TestCase):
    def lint_html(self, css: str, allow: list[str]) -> list[dict]:
        path = Path(tempfile.mkdtemp()) / "index.html"
        path.write_text(f"<html><style>body{{font-family:{css};}}</style></html>", encoding="utf-8")
        return lint_fonts([path], allow)

    def test_bare_serif_fallback_fails(self) -> None:
        findings = self.lint_html("'Noto Sans SC', serif", ["Noto Sans SC"])
        self.assertTrue(any("bare serif" in f["error"] for f in findings))

    def test_allowed_stack_passes(self) -> None:
        findings = self.lint_html("'Noto Sans SC', sans-serif", ["Noto Sans SC"])
        self.assertEqual(findings, [])

    def test_banned_family_fails(self) -> None:
        findings = self.lint_html("宋体, sans-serif", ["Noto Sans SC"])
        self.assertTrue(any("banned" in f["error"] for f in findings))


if __name__ == "__main__":
    unittest.main()
