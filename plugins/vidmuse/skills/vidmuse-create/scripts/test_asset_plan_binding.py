from __future__ import annotations

import tempfile
import unittest
import json
import hashlib
import io
from contextlib import redirect_stdout
from pathlib import Path

from check_motion import Gate, run_static
from film_plan import main as film_plan_main
from film_plan import (
    _request_fingerprint,
    load_asset_plan,
    validate,
    validate_asset_refs,
    validate_preproduction,
)
from shot_scaffold import render as render_scaffold

ANIMATIC_BYTES = b"reviewed-animatic"
ANIMATIC_SHA256 = hashlib.sha256(ANIMATIC_BYTES).hexdigest()


def beat(bid: str, start: float, end: float) -> dict:
    return {
        "id": bid,
        "ata_range": [start, end],
        "path_role": "hook" if bid == "b01" else "cta",
        "key_message": "A clear message",
        "visual_kind": "branding",
        "transition_in": "cut",
        "world_id": "world-main",
        "continuity_in": "opening" if bid == "b01" else "graphic-match: identity persists",
        "camera_intent": "locked; internal mark action carries the beat",
        "focal_subject": "OpenAI identity mark",
        "layer_map": {
            "field": "quiet warm-gray ground",
            "evidence": "OpenAI identity mark",
            "reading_surface": "reserved negative space below the mark",
        },
        "storyboard_frames": [f"storyboard/{bid}.png"],
        "vo_cues": [{"text": "OpenAI", "role": "event"}],
        "compose": "identity lockup",
        "asset_refs": ["ao_openai_intro"] if bid == "b01" else [],
        "shot_sequence": [
            {
                "t": [0.0, 0.8],
                "kind": "reveal",
                "on_screen": "OpenAI identity",
                "move": "mark reveal",
            },
            {
                "t": [0.8, end - start],
                "kind": "hold",
                "on_screen": "resolved identity",
                "move": "stillness",
            },
        ],
    }


def film_plan() -> dict:
    return {
        "create_path": "explainer",
        "asset_plan": "asset-plan.json",
        "creative_direction": {
            "id": "direction-a",
            "single_minded_proposition": "One identity persists.",
            "primary_device": "one mark changes state across a continuous world",
            "spatial_model": "single graphic stage",
            "continuity_rule": "the identity mark persists between beats",
            "camera_grammar": "locked camera; internal transformation only",
            "negative_motifs": ["full-frame cue flash"],
        },
        "film_design_read": {
            "audience": "people evaluating an AI product",
            "promise": "one identity remains legible through change",
            "visual_language": "editorial identity study",
            "focal_strategy": "one centered mark against quiet space",
            "media_treatment": "vector identity evidence on a matte field",
            "typography_role": "small evidence label only",
            "composition_variance": 3,
            "motion_energy": 4,
            "information_density": 2,
            "depth_separation": 5,
            "persistent_motif": "none",
        },
        "continuity_strategy": {
            "mode": "world",
            "invariant": "the same matte identity stage",
            "variation": "the mark changes state while the camera stays locked",
        },
        "preproduction": {
            "contract": "agency-preproduction.v1",
            "brief": "creative-brief.md",
            "directions": "creative-directions.md",
            "selected_direction": "direction-selected.md",
            "director_treatment": "director-treatment.md",
            "storyboard": "STORYBOARD.md",
            "direction_ids": ["direction-a", "direction-b", "direction-c"],
            "storyboard_frames": ["storyboard/b01.png", "storyboard/b02.png"],
            "animatic": "animatic.mp4",
            "animatic_approval": "animatic-approved.md",
            "animatic_sha256": ANIMATIC_SHA256,
        },
        "beats": [beat("b01", 0.0, 2.0), beat("b02", 2.0, 4.0)],
    }


def write_preproduction(work: Path) -> None:
    for name in (
        "creative-brief.md",
        "creative-directions.md",
        "direction-selected.md",
        "director-treatment.md",
        "STORYBOARD.md",
    ):
        (work / name).write_text(f"# {name}\n", encoding="utf-8")
    board = work / "storyboard"
    board.mkdir()
    (board / "b01.png").write_bytes(b"frame-1")
    (board / "b02.png").write_bytes(b"frame-2")
    (work / "animatic.mp4").write_bytes(ANIMATIC_BYTES)
    (work / "animatic-approved.md").write_text(
        f"# Approved\n\ndirection-a\n\n{ANIMATIC_SHA256}\n",
        encoding="utf-8",
    )


def asset_plan(path: str) -> dict:
    query = {
        "type": "logo",
        "intent": "OpenAI official logo",
        "entity": "openai",
        "variant": "mono",
        "mode": "deterministic",
    }
    return {
        "schema": "vidmuse.asset-plan.v1",
        "workflow": "create",
        "opportunities": [
            {
                "id": "ao_openai_intro",
                "mention": "OpenAI",
                "beat_id": "b01",
                "canonical_entity": "openai",
                "entity_type": "organization",
                "semantic_role": "subject",
                "visual_job": "establish-identity",
                "ranges": [[0.0, 1.0]],
                "decision": "show-logo",
                "reason": "Establish the named organization.",
                "confidence": 0.99,
                "asset_query": query,
                "resolution": {
                    "status": "resolved",
                    "asset_id": "logo_001",
                    "path": path,
                    "provider": "lobehub.icons",
                    "variant": "mono",
                    "resolved_entity": "openai",
                    "request_fingerprint": _request_fingerprint(query),
                    "license_state": "verified-commercial",
                },
            }
        ],
    }


class AssetPlanBindingTests(unittest.TestCase):
    def test_film_plan_requires_agency_preproduction_contract(self) -> None:
        value = film_plan()
        value.pop("preproduction")
        self.assertTrue(any("pre-production" in error for error in validate(value)))

    def test_animatic_hash_and_approval_are_verified(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            write_preproduction(work)
            self.assertEqual(validate_preproduction(work, film_plan()), [])
            (work / "animatic.mp4").write_bytes(b"changed-after-approval")
            errors = validate_preproduction(work, film_plan())
            self.assertTrue(any("does not match" in error for error in errors))

    def test_film_plan_requires_semantic_asset_plan_receipt(self) -> None:
        value = film_plan()
        value.pop("asset_plan")
        self.assertTrue(any("Semantic Asset Pass" in error for error in validate(value)))

    def test_silent_read_beat_is_valid(self) -> None:
        value = film_plan()
        value["beats"][0]["vo_cues"] = []
        value["beats"][0]["shot_sequence"] = [
            {
                "t": [0.0, 2.0],
                "kind": "read",
                "on_screen": "resolved identity evidence",
                "move": "locked stillness",
            }
        ]
        self.assertEqual(validate(value), [])

    def test_persistent_motif_requires_semantic_rationale(self) -> None:
        value = film_plan()
        value["film_design_read"]["persistent_motif"] = "a colored line"
        errors = validate(value)
        self.assertTrue(any("motif_rationale" in error for error in errors))

        value["film_design_read"]["motif_rationale"] = {
            "semantic_role": "the line is the routed request path",
            "state_change": "it branches only when the request delegates",
            "yield_rule": "it exits before product proof and remains absent on the CTA",
        }
        self.assertEqual(validate(value), [])

    def test_asset_ref_must_resolve_to_existing_local_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            errors = validate_asset_refs(
                work, film_plan(), asset_plan(".media/images/logo_001.svg")
            )
            self.assertTrue(any("local file is missing" in error for error in errors))

    def test_approved_file_opportunity_cannot_be_orphaned_from_film_plan(self) -> None:
        value = film_plan()
        value["beats"][0]["asset_refs"] = []
        errors = validate_asset_refs(
            Path("."), value, asset_plan(".media/images/logo_001.svg")
        )
        self.assertTrue(any("not bound by any film-plan beat" in error for error in errors))

    def test_resolved_asset_ref_passes_and_reaches_scaffold(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            local = Path(".media/images/logo_001.svg")
            (work / local).parent.mkdir(parents=True)
            (work / local).write_text("<svg/>", encoding="utf-8")
            assets = asset_plan(str(local))
            self.assertEqual(validate_asset_refs(work, film_plan(), assets), [])

            resolved = film_plan()
            resolved["beats"][0]["assets"] = [
                {
                    "ref": "ao_openai_intro",
                    "path": str(local),
                    "canonical_entity": "openai",
                }
            ]
            for current in resolved["beats"]:
                base = current["ata_range"][0]
                current["vo_cues"] = [
                    {"text": "OpenAI", "role": "event", "t": base + 0.1}
                ]
                for index, window in enumerate(current["shot_sequence"], start=1):
                    window["id"] = f"{current['id']}.w{index}"
                    window["abs"] = [
                        base + window["t"][0],
                        base + window["t"][1],
                    ]
            html = render_scaffold(resolved)
            self.assertIn('data-asset-ref="ao_openai_intro"', html)
            self.assertIn('src=".media/images/logo_001.svg"', html)

            out = work / "public" / "index.html"
            out.parent.mkdir(parents=True)
            out.write_text(html, encoding="utf-8")
            gate = Gate()
            with redirect_stdout(io.StringIO()):
                run_static(gate, work, out, resolved)
            self.assertFalse(
                [failure for failure in gate.failures if failure["id"] == "S6.assets"]
            )

            out.write_text(
                html.replace('data-asset-ref="ao_openai_intro"', ""),
                encoding="utf-8",
            )
            broken_gate = Gate()
            with redirect_stdout(io.StringIO()):
                run_static(broken_gate, work, out, resolved)
            self.assertTrue(
                [failure for failure in broken_gate.failures if failure["id"] == "S6.assets"]
            )

    def test_load_asset_plan_requires_current_pass_receipt(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            transcript = b'[{"text":"OpenAI"}]\n'
            (work / "transcript.json").write_bytes(transcript)
            value = asset_plan(".media/images/logo_001.svg")
            value["transcript"] = "transcript.json"
            value["pass_receipt"] = {
                "contract": "semantic-asset-pass.v1",
                "status": "completed",
                "input": {
                    "path": "transcript.json",
                    "sha256": hashlib.sha256(transcript).hexdigest(),
                },
                "opportunity_count": 1,
                "completed_at": "2026-07-29T00:00:00.000Z",
            }
            (work / "asset-plan.json").write_text(json.dumps(value), encoding="utf-8")
            self.assertEqual(load_asset_plan(work)["workflow"], "create")
            (work / "transcript.json").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(Exception, "stale"):
                load_asset_plan(work)

    def test_stale_query_fingerprint_and_identity_substitution_fail(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            local = Path(".media/images/logo_001.svg")
            (work / local).parent.mkdir(parents=True)
            (work / local).write_text("<svg/>", encoding="utf-8")
            value = asset_plan(str(local))
            value["opportunities"][0]["asset_query"]["variant"] = "text"
            value["opportunities"][0]["resolution"]["resolved_entity"] = "chatgpt"
            errors = validate_asset_refs(work, film_plan(), value)
            self.assertTrue(any("resolution is stale" in error for error in errors))
            self.assertTrue(any("resolved identity" in error for error in errors))
            self.assertTrue(any("resolved variant" in error for error in errors))

    def test_cli_resolve_hydrates_asset_receipt_into_film_plan(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            write_preproduction(work)
            local = Path(".media/images/logo_001.svg")
            (work / local).parent.mkdir(parents=True)
            (work / local).write_text("<svg/>", encoding="utf-8")
            (work / "asset-plan.json").write_text(
                json.dumps(
                    {
                        **asset_plan(str(local)),
                        "transcript": "transcript.json",
                        "pass_receipt": {
                            "contract": "semantic-asset-pass.v1",
                            "status": "completed",
                            "input": {
                                "path": "transcript.json",
                                "sha256": hashlib.sha256(
                                    json.dumps(
                                        [
                                            {"text": "OpenAI", "start": 0.1, "end": 0.8},
                                            {"text": "OpenAI", "start": 2.1, "end": 2.8},
                                        ]
                                    ).encode("utf-8")
                                ).hexdigest(),
                            },
                            "opportunity_count": 1,
                            "completed_at": "2026-07-29T00:00:00.000Z",
                        },
                    }
                ),
                encoding="utf-8",
            )
            (work / "film-plan.json").write_text(
                json.dumps(film_plan()),
                encoding="utf-8",
            )
            (work / "transcript.json").write_text(
                json.dumps(
                    [
                        {"text": "OpenAI", "start": 0.1, "end": 0.8},
                        {"text": "OpenAI", "start": 2.1, "end": 2.8},
                    ]
                ),
                encoding="utf-8",
            )
            self.assertEqual(film_plan_main([str(work), "--resolve"]), 0)
            resolved = json.loads(
                (work / "film-plan.resolved.json").read_text(encoding="utf-8")
            )
            self.assertEqual(
                resolved["beats"][0]["assets"][0]["ref"],
                "ao_openai_intro",
            )
            self.assertEqual(
                resolved["beats"][0]["assets"][0]["path"],
                ".media/images/logo_001.svg",
            )


if __name__ == "__main__":
    unittest.main()
