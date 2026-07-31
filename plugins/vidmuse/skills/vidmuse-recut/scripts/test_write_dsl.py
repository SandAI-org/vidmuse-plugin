#!/usr/bin/env python3
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from write_dsl import (
    build_dsl,
    build_overlay_items,
    display_units,
    extract_overlay_windows,
    words_to_subtitles,
)


class SubtitleGroupingTests(unittest.TestCase):
    @staticmethod
    def timed_words(tokens: list[str], step: float = 0.12) -> list[dict]:
        return [
            {"text": token, "start": i * step, "end": (i + 1) * step}
            for i, token in enumerate(tokens)
        ]

    def test_long_chinese_speech_is_split_before_it_overflows(self) -> None:
        text = "这是一段没有标点而且连续很长需要自动分段的中文口播字幕示例"

        cues = words_to_subtitles(self.timed_words(list(text)), duration=None)

        self.assertGreater(len(cues), 1)
        self.assertEqual("".join(cue["text"] for cue in cues), text)
        self.assertTrue(all(display_units(cue["text"]) <= 16 for cue in cues))

    def test_fifteen_units_stay_together_and_seventeen_rebalance(self) -> None:
        fifteen = "一二三四五六七八九十甲乙丙丁戊"
        seventeen = fifteen + "己庚"

        fifteen_cues = words_to_subtitles(self.timed_words(list(fifteen)), duration=None)
        seventeen_cues = words_to_subtitles(self.timed_words(list(seventeen)), duration=None)

        self.assertEqual([cue["text"] for cue in fifteen_cues], [fifteen])
        self.assertEqual([len(cue["text"]) for cue in seventeen_cues], [9, 8])

    def test_punctuation_after_soft_target_is_not_orphaned(self) -> None:
        text = "一二三四五六七八九十甲乙丙丁，"

        cues = words_to_subtitles(self.timed_words(list(text)), duration=None)

        self.assertEqual([cue["text"] for cue in cues], [text])

    def test_chinese_comma_breaks_a_complete_phrase(self) -> None:
        text = "这是一段完整的话，后面继续说明"

        cues = words_to_subtitles(self.timed_words(list(text)), duration=None)

        self.assertEqual(cues[0]["text"], "这是一段完整的话，")
        self.assertEqual("".join(cue["text"] for cue in cues), text)

    def test_english_grouping_is_not_changed_by_chinese_limits(self) -> None:
        words = self.timed_words(["This", "is", "still", "one", "caption."])

        cues = words_to_subtitles(words, duration=None)

        self.assertEqual([cue["text"] for cue in cues], ["This is still one caption."])

    def test_pause_threshold_is_language_specific(self) -> None:
        chinese = [
            {"text": "你好", "start": 0.0, "end": 0.1},
            {"text": "世界", "start": 0.251, "end": 0.4},
        ]
        english_short_pause = [
            {"text": "hello", "start": 0.0, "end": 0.1},
            {"text": "world", "start": 0.3, "end": 0.4},
        ]
        english_long_pause = [
            {"text": "hello", "start": 0.0, "end": 0.1},
            {"text": "world", "start": 0.551, "end": 0.7},
        ]

        self.assertEqual(len(words_to_subtitles(chinese, duration=None)), 2)
        self.assertEqual(len(words_to_subtitles(english_short_pause, duration=None)), 1)
        self.assertEqual(len(words_to_subtitles(english_long_pause, duration=None)), 2)

    def test_grouped_cues_keep_real_token_time_boundaries(self) -> None:
        words = self.timed_words(list("一二三四五六七八九十甲乙丙丁戊己庚"))

        cues = words_to_subtitles(words, duration=None)

        self.assertEqual(cues[0]["startTime"], words[0]["start"])
        self.assertEqual(cues[0]["endTime"], words[8]["end"])
        self.assertEqual(cues[1]["startTime"], words[9]["start"])
        self.assertEqual(cues[1]["endTime"], words[-1]["end"])

    def test_overlong_ata_token_is_preserved_and_reported(self) -> None:
        token = "这是一个明显超过十六个字而且不能拆开的单个对齐词"

        with patch("sys.stderr") as stderr:
            cues = words_to_subtitles(self.timed_words([token]), duration=None)

        self.assertEqual([cue["text"] for cue in cues], [token])
        self.assertTrue(stderr.write.called)

    def test_multi_character_tokens_do_not_overfill_the_last_group(self) -> None:
        for widths in ([7, 10, 7], [9, 9, 9]):
            with self.subTest(widths=widths):
                words = self.timed_words(["字" * width for width in widths])
                cues = words_to_subtitles(words, duration=None)
                self.assertTrue(all(display_units(cue["text"]) <= 16 for cue in cues))

    def test_long_latin_token_in_chinese_context_is_reported(self) -> None:
        words = self.timed_words(["中", "A" * 34, "文"])

        with patch("sys.stderr") as stderr:
            words_to_subtitles(words, duration=None)

        self.assertTrue(stderr.write.called)

    def test_chinese_word_zai_is_not_treated_as_punctuation(self) -> None:
        words = self.timed_words(["我们", "再", "继续"])

        cues = words_to_subtitles(words, duration=None)

        self.assertEqual([cue["text"] for cue in cues], ["我们再继续"])


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
