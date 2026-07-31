#!/usr/bin/env python3
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from write_dsl import build_dsl, build_overlay_items, extract_overlay_windows


class OverlayWindowTests(unittest.TestCase):
    def write_html(self, html: str) -> tuple[tempfile.TemporaryDirectory[str], Path, Path]:
        tmp = tempfile.TemporaryDirectory()
        work = Path(tmp.name)
        overlay = work / "public" / "index.html"
        overlay.parent.mkdir()
        overlay.write_text(html, encoding="utf-8")
        return tmp, work, overlay

    def test_sparse_top_level_clips_become_separate_windows(self) -> None:
        tmp, work, overlay = self.write_html(
            """
            <div data-composition-id="host">
              <video class="clip" data-start="0" data-duration="10"></video>
              <div id="title" class="clip" data-start="1" data-duration="2">
                <div class="clip" data-start="1.2" data-duration="0.5"></div>
              </div>
              <div id="callout" class="clip" data-start="6" data-duration="1.5"></div>
              <div class="clip" data-start="8" data-duration="1" data-hidden></div>
            </div>
            """
        )
        self.addCleanup(tmp.cleanup)

        self.assertEqual(
            extract_overlay_windows(overlay, 10),
            [
                {"start": 1.0, "duration": 2.0, "id": "title"},
                {"start": 6.0, "duration": 1.5, "id": "callout"},
            ],
        )
        items = build_overlay_items(work, overlay, 10)
        self.assertEqual([item["id"] for item in items], ["hyperframes-title", "hyperframes-callout"])
        self.assertEqual([item["startTime"] for item in items], [1.0, 6.0])
        self.assertEqual(items[1]["params"]["sourceStartTime"], 6.0)

    def test_overlapping_sibling_nodes_merge_into_one_intervention(self) -> None:
        tmp, _work, overlay = self.write_html(
            """
            <div data-composition-id="host">
              <div id="frame" class="clip" data-start="2" data-duration="3"></div>
              <div id="label" class="clip" data-start="3" data-duration="1"></div>
              <div id="later" class="clip" data-start="7" data-duration="1"></div>
            </div>
            """
        )
        self.addCleanup(tmp.cleanup)

        self.assertEqual(
            extract_overlay_windows(overlay, 10),
            [
                {"start": 2.0, "duration": 3.0, "id": "frame"},
                {"start": 7.0, "duration": 1.0, "id": "later"},
            ],
        )

    def test_relative_clip_start_is_resolved(self) -> None:
        tmp, _work, overlay = self.write_html(
            """
            <div data-composition-id="host">
              <div id="first" class="clip" data-start="1" data-duration="2"></div>
              <div id="second" class="clip" data-start="first + 1" data-duration="2"></div>
            </div>
            """
        )
        self.addCleanup(tmp.cleanup)

        self.assertEqual(
            extract_overlay_windows(overlay, 10),
            [
                {"start": 1.0, "duration": 2.0, "id": "first"},
                {"start": 4.0, "duration": 2.0, "id": "second"},
            ],
        )

    def test_single_overlay_flag_keeps_legacy_full_duration_item(self) -> None:
        tmp, work, overlay = self.write_html(
            '<div class="clip" data-start="2" data-duration="1"></div>'
        )
        self.addCleanup(tmp.cleanup)

        self.assertEqual(
            build_overlay_items(work, overlay, 10, single_overlay=True),
            [
                {
                    "id": "hyperframes-packaging",
                    "type": "hyperframes",
                    "startTime": 0.0,
                    "duration": 10,
                    "htmlSourceFilePath": "public/index.html",
                    "params": {"enabled": True, "sourceStartTime": 0.0},
                }
            ],
        )

    def test_layered_dsl_uses_sparse_overlay_items(self) -> None:
        tmp, work, overlay = self.write_html(
            """
            <div data-composition-id="host">
              <div id="title" class="clip" data-start="1" data-duration="2"></div>
              <div id="callout" class="clip" data-start="6" data-duration="1"></div>
            </div>
            """
        )
        self.addCleanup(tmp.cleanup)
        source = work / "public" / "input-video.mp4"
        source.touch()

        with patch(
            "write_dsl.read_meta",
            return_value={"duration": 10.0, "width": 1920, "height": 1080, "fps": 30.0},
        ):
            dsl = build_dsl(
                work,
                mode="layered",
                no_overlay=False,
                overlay_path=overlay,
                source_path=source,
                baked_path=None,
                force_duration=None,
            )

        overlay_track = next(track for track in dsl["videoTracks"] if track["id"] == "overlay-track")
        self.assertEqual(
            [(item["startTime"], item["duration"]) for item in overlay_track["items"]],
            [(1.0, 2.0), (6.0, 1.0)],
        )


if __name__ == "__main__":
    unittest.main()
