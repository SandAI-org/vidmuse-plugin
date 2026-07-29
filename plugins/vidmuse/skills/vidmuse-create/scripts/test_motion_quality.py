from __future__ import annotations

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from check_motion import (
    WASH_MEAN_SHIFT,
    WASH_REPEAT_MAX,
    _cluster_times,
    _near_beat_boundary,
    in_declared_full_frame_window,
    main as check_motion_main,
    wash_signature,
)


def plan(windows: list[tuple[str, float, float]]) -> dict:
    """One beat spanning 0–10s with the given (kind, abs_start, abs_end) windows."""
    return {
        "beats": [
            {
                "id": "b01",
                "ata_range": [0.0, 10.0],
                "shot_sequence": [
                    {"id": f"b01.w{i}", "kind": kind, "abs": [lo, hi]}
                    for i, (kind, lo, hi) in enumerate(windows, start=1)
                ],
            }
        ]
    }


class GlobalWashTests(unittest.TestCase):
    def test_uniform_full_frame_luminance_change_is_a_wash(self) -> None:
        before = bytes([40] * 144)
        after = bytes([58] * 144)
        result = wash_signature(before, after)
        self.assertTrue(result["like"], result)
        self.assertEqual(result["coverage"], 1.0)
        self.assertEqual(result["coherence"], 1.0)

    def test_local_object_change_is_not_a_wash(self) -> None:
        before = bytes([40] * 100)
        after = bytes([80] * 20 + [40] * 80)
        result = wash_signature(before, after)
        self.assertFalse(result["like"], result)
        self.assertLess(result["coverage"], 0.70)

    def test_mixed_direction_camera_texture_is_not_a_wash(self) -> None:
        before = bytes([80] * 100)
        after = bytes([60] * 50 + [100] * 50)
        result = wash_signature(before, after)
        self.assertFalse(result["like"], result)
        self.assertLess(result["coherence"], 0.88)

    def test_invisible_same_direction_drift_is_not_a_wash(self) -> None:
        """A +5 shift is coherent and full-frame but no viewer reads it as a flash."""
        before = bytes([80] * 100)
        after = bytes([85] * 100)
        result = wash_signature(before, after)
        self.assertEqual(result["coverage"], 1.0)
        self.assertEqual(result["coherence"], 1.0)
        self.assertLess(result["mean_shift"], WASH_MEAN_SHIFT)
        self.assertFalse(result["like"], result)

    def test_mean_shift_measures_changed_pixels_not_whole_frame(self) -> None:
        """A bright flash over 3/4 of frame must not be diluted by the still quarter."""
        before = bytes([40] * 100)
        after = bytes([100] * 75 + [40] * 25)
        result = wash_signature(before, after)
        self.assertEqual(result["mean_shift"], 60.0)
        self.assertTrue(result["like"], result)


class SeamExemptionTests(unittest.TestCase):
    def test_beat_end_is_a_seam_not_only_beat_start(self) -> None:
        doc = plan([("reveal", 0.0, 10.0)])
        self.assertTrue(_near_beat_boundary(0.2, doc))
        self.assertTrue(_near_beat_boundary(9.8, doc), "beat end must be a seam too")
        self.assertFalse(_near_beat_boundary(5.0, doc))

    def test_declared_full_frame_kinds_are_exempt(self) -> None:
        doc = plan([("reveal", 0.0, 4.0), ("morph", 4.0, 6.0), ("hold", 6.0, 10.0)])
        self.assertFalse(in_declared_full_frame_window(2.0, doc), "reveal is gated")
        self.assertTrue(in_declared_full_frame_window(5.0, doc), "morph is exempt")
        self.assertFalse(in_declared_full_frame_window(8.0, doc), "hold is gated")

    def test_exit_and_camera_windows_are_exempt(self) -> None:
        doc = plan([("exit", 0.0, 3.0), ("camera", 3.0, 7.0), ("move", 7.0, 10.0)])
        self.assertTrue(in_declared_full_frame_window(1.5, doc))
        self.assertTrue(in_declared_full_frame_window(5.0, doc))
        self.assertFalse(in_declared_full_frame_window(8.5, doc))


class ClusterTests(unittest.TestCase):
    def test_gap_is_measured_from_the_cluster_head(self) -> None:
        """Not chained: 6.4 opens a new cluster because it is >0.8s from 5.0."""
        self.assertEqual(_cluster_times([5.0, 5.7, 6.4, 7.1]), [5.0, 6.4])

    def test_contiguous_run_collapses_to_one_event(self) -> None:
        self.assertEqual(_cluster_times([5.0, 5.2, 5.5]), [5.0])

    def test_separated_events_stay_separate(self) -> None:
        self.assertEqual(_cluster_times([5.0, 5.1, 12.0, 12.3]), [5.0, 12.0])

    def test_nested_clustering_can_undercount_events(self) -> None:
        """Regression for the nested `_cluster_times` call R3 used to make.

        Pre-clustering `step_washes` drops members that would have anchored their
        own cluster in the merged ordering. Here 12.41 is swallowed by 12.23's
        cluster, so 13.17 is no longer >0.8s from a head and disappears: the
        nested form reports 3 wash events where the union reports 4. Under
        WASH_REPEAT_MAX that is the difference between a pass and a fail, so R3
        must cluster once over the union.
        """
        cue_washes = [9.94, 12.23]
        step_washes = [7.75, 12.41, 13.17]
        nested = _cluster_times(cue_washes + _cluster_times(step_washes))
        single = _cluster_times(cue_washes + step_washes)
        self.assertEqual(nested, [7.75, 9.94, 12.23])
        self.assertEqual(single, [7.75, 9.94, 12.23, 13.17])
        self.assertLess(len(nested), len(single), "nested form under-reports")

    def test_repeat_budget_allows_one_punctuation(self) -> None:
        self.assertLessEqual(len(_cluster_times([5.0, 5.2])), WASH_REPEAT_MAX)
        self.assertGreater(len(_cluster_times([5.0, 12.0])), WASH_REPEAT_MAX)


class ReviewModeTests(unittest.TestCase):
    def test_default_mode_is_static_and_needs_no_video(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            (work / "public").mkdir()
            plan_doc = {
                "beats": [
                    {
                        "id": "b01",
                        "ata_range": [0.0, 2.0],
                        "vo_cues": [],
                        "shot_sequence": [
                            {
                                "id": "b01.w1",
                                "kind": "read",
                                "abs": [0.0, 2.0],
                            }
                        ],
                    }
                ]
            }
            (work / "film-plan.resolved.json").write_text(
                json.dumps(plan_doc),
                encoding="utf-8",
            )
            (work / "public" / "index.html").write_text(
                '<main><section data-beat="b01"></section></main>'
                '<script>tl.addLabel("b01.w1", 0);</script>',
                encoding="utf-8",
            )

            with redirect_stdout(io.StringIO()):
                result = check_motion_main([str(work)])

            self.assertEqual(result, 0)
            report = json.loads((work / "motion-check.json").read_text())
            self.assertEqual(report["mode"], "static-preflight")
            self.assertIsNone(report["video"])
            self.assertTrue(report["pass"])


if __name__ == "__main__":
    unittest.main()
