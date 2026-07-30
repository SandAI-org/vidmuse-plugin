from __future__ import annotations

import unittest
from pathlib import Path

import frame_md
import taste


def design_spec(film_mode: str) -> dict:
    spec = {
        "schema": frame_md.SCHEMA_DESIGN_V1,
        "project": "contract-test",
        "film_mode": film_mode,
        "mode": "composed",
        "colors": {"canvas": "#ffffff", "ink": "#111111"},
        "typography": {"body": {"fontFamily": "Inter"}},
        "spacing": {"unit": 8},
        "motion": {
            "dur_fast": 0.2,
            "dur_base": 0.4,
            "dur_slow": 0.8,
            "ease_enter": "power2.out",
            "ease_exit": "power2.in",
        },
        "components": {},
    }
    if film_mode == "create":
        spec["create_path"] = "promo"
    return spec


class DesignContractTests(unittest.TestCase):
    def test_create_uses_generic_design_schema(self) -> None:
        report = frame_md._lint_current(design_spec("create"), "FRAME.md")
        self.assertTrue(report["ok"])
        self.assertEqual(report["film_mode"], "create")
        self.assertEqual(report["create_path"], "promo")

    def test_director_still_requires_spine_and_worlds(self) -> None:
        with self.assertRaisesRegex(frame_md.FrameMdError, "film_spine"):
            frame_md._lint_current(design_spec("recut-director"), "FRAME.md")

    def test_legacy_recut_v5_remains_readable(self) -> None:
        spec = design_spec("create")
        spec["schema"] = frame_md.SCHEMA_V5
        spec["production_mode"] = "packaging"
        spec.pop("film_mode")
        spec.pop("create_path")
        report = frame_md._lint_current(spec, "FRAME.md")
        self.assertTrue(report["ok"])
        self.assertEqual(report["production_mode"], "packaging")

    def test_get_resolves_pack_paths_independent_of_cwd(self) -> None:
        record = taste.get(["pack:coral"], "packs")[0]
        source = record["source"]
        self.assertTrue(Path(source["skill_root"]).is_absolute())
        self.assertTrue(Path(source["resolved_frame_md"]).is_file())
        self.assertTrue(Path(source["resolved_caption_skin"]).is_file())
        self.assertEqual(
            source["frame_md"],
            "library/frame-packs/coral/FRAME.md",
        )


if __name__ == "__main__":
    unittest.main()
