#!/usr/bin/env python3

from __future__ import annotations

import unittest

from alignment_contract import evaluate_alignment
from shot_scaffold import render as render_scaffold


def composition(body: str, script: str = "") -> str:
    return f"""<!doctype html>
<html><body><main>{body}</main><script>{script}</script></body></html>"""


class AlignmentContractTests(unittest.TestCase):
    def test_raster_anchor_in_shared_space_passes(self) -> None:
        html = composition("""
          <section data-beat="b01">
            <div id="ui-camera" data-vm-align-space="ui" data-vm-space-size="1920 1080">
              <img id="ui-proof" src="ui.png">
              <div id="input-frame" data-vm-anchor-target="#ui-proof"
                style="position:absolute;left:21%;top:35%;width:58%;height:16%"></div>
            </div>
          </section>
        """, 'tl.to("#ui-camera", { x: -20, scale: 1.05 }, 1);')
        checks = evaluate_alignment(html, ["b01"])
        self.assertTrue(all(check["ok"] for check in checks), checks)

    def test_proof_beat_without_space_fails(self) -> None:
        html = composition('<section data-beat="b01"><img id="ui-proof"></section>')
        checks = evaluate_alignment(html, ["b01"])
        self.assertFalse(checks[0]["ok"])
        self.assertEqual(checks[0]["id"], "S5.align-space")

    def test_anchor_and_target_in_different_spaces_fail(self) -> None:
        html = composition("""
          <section data-beat="b01">
            <div data-vm-align-space="a" data-vm-space-size="1920 1080">
              <img id="ui-proof">
            </div>
            <div data-vm-align-space="b">
              <div id="frame" data-vm-anchor-target="#ui-proof"
                style="left:10%;top:10%;width:20%;height:20%"></div>
            </div>
          </section>
        """)
        checks = evaluate_alignment(html, ["b01"])
        anchor = next(check for check in checks if check["id"] == "S5.anchor")
        self.assertFalse(anchor["ok"])
        self.assertIn("different transform spaces", anchor["detail"])

    def test_raster_anchor_requires_normalized_percent_box(self) -> None:
        html = composition("""
          <section data-beat="b01">
            <div data-vm-align-space="ui" data-vm-space-size="1920 1080">
              <img id="ui-proof">
              <div id="frame" data-vm-anchor-target="#ui-proof"
                style="left:490px;top:382px;width:980px;height:170px"></div>
            </div>
          </section>
        """)
        checks = evaluate_alignment(html, ["b01"])
        anchor = next(check for check in checks if check["id"] == "S5.anchor")
        self.assertFalse(anchor["ok"])
        self.assertIn("percentages", anchor["detail"])

    def test_direct_target_motion_fails_without_explicit_waiver(self) -> None:
        html = composition("""
          <section data-beat="b01">
            <div data-vm-align-space="ui" data-vm-space-size="1920 1080">
              <img id="ui-proof">
              <div id="frame" data-vm-anchor-target="#ui-proof"
                style="left:10%;top:10%;width:20%;height:20%"></div>
            </div>
          </section>
        """, 'tl.to("#ui-proof", { x: -20, scale: 1.05 }, 1);')
        checks = evaluate_alignment(html, ["b01"])
        anchor = next(check for check in checks if check["id"] == "S5.anchor")
        self.assertFalse(anchor["ok"])
        self.assertIn("direct spatial tween", anchor["detail"])

    def test_local_motion_reason_allows_intentional_anchor_pulse(self) -> None:
        html = composition("""
          <section data-beat="b01">
            <div data-vm-align-space="ui" data-vm-space-size="1920 1080">
              <img id="ui-proof">
              <div id="frame" data-vm-anchor-target="#ui-proof"
                data-vm-anchor-local-motion="brief confirmation pulse; returns to 1"
                style="left:10%;top:10%;width:20%;height:20%"></div>
            </div>
          </section>
        """, 'tl.to("#frame", { scale: 1.03 }, 1);')
        checks = evaluate_alignment(html, ["b01"])
        self.assertTrue(all(check["ok"] for check in checks), checks)

    def test_scaffold_marks_ui_proof_as_alignment_required(self) -> None:
        html = render_scaffold({
            "composition_id": "test-film",
            "beats": [{
                "id": "b01",
                "ata_range": [0, 2],
                "path_role": "feature_showcase",
                "visual_kind": "real-ui",
                "key_message": "show the real interface",
                "transition_in": "cut",
                "ui_proof_path": "screenshot-camera",
                "vo_cues": [],
                "shot_sequence": [{
                    "id": "b01.w1",
                    "abs": [0, 2],
                    "kind": "hold",
                    "on_screen": "real UI",
                    "move": "hold",
                }],
            }],
        })
        self.assertIn("ALIGNMENT REQUIRED", html)
        self.assertIn("data-vm-align-space", html)


if __name__ == "__main__":
    unittest.main()
