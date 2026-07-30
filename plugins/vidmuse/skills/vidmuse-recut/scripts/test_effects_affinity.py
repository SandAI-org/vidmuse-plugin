from __future__ import annotations

import unittest
from pathlib import Path

import effects


DESIGN_PACKS = (
    Path(__file__).resolve().parents[2]
    / "vidmuse-design"
    / "data"
    / "style-packs.jsonl"
)


class EffectAffinityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.packs = effects.load_jsonl(DESIGN_PACKS)
        cls.overlay = effects.load_jsonl(effects.DEFAULT_OVERLAY)
        ids = {
            effect_id
            for pack in cls.packs
            for bucket in ("prefer", "avoid")
            for effect_id in pack["effect_affinity"][bucket]
            if effect_id.startswith("hf:")
        }
        cls.catalog = [
            {"name": effect_id.removeprefix("hf:"), "type": "component"}
            for effect_id in sorted(ids)
        ]

    def test_affinity_accepts_ids_in_registry_catalog(self) -> None:
        report = effects.validate_affinity(self.packs, self.catalog, self.overlay)
        self.assertTrue(report["ok"])
        self.assertEqual(report["packs"], 13)
        self.assertEqual(report["referenced_ids"], 40)

    def test_affinity_rejects_unknown_id(self) -> None:
        incomplete = self.catalog[1:]
        with self.assertRaisesRegex(effects.EffectsError, "unknown effect_affinity"):
            effects.validate_affinity(self.packs, incomplete, self.overlay)


if __name__ == "__main__":
    unittest.main()
