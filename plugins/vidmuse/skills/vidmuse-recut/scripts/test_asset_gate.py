from __future__ import annotations

import hashlib
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path

from asset_gate import check, request_fingerprint
from evaluation import EvaluationError, check as check_evaluation
from write_dsl import main as write_dsl_main


def write_plan(work: Path, *, with_asset: bool) -> dict:
    transcript = b'[{"text":"OpenAI","start":0,"end":1}]\n'
    (work / "transcript.json").write_bytes(transcript)
    opportunities = []
    if with_asset:
        query = {
            "type": "logo",
            "intent": "OpenAI official logo",
            "entity": "openai",
            "variant": "mono",
            "mode": "deterministic",
        }
        opportunities.append(
            {
                "id": "ao_openai",
                "mention": "OpenAI",
                "canonical_entity": "openai",
                "entity_type": "organization",
                "semantic_role": "subject",
                "visual_job": "establish-identity",
                "ranges": [[0, 1]],
                "decision": "show-logo",
                "reason": "Establish the named company.",
                "confidence": 0.99,
                "asset_query": query,
                "resolution": {
                    "status": "resolved",
                    "asset_id": "logo_001",
                    "path": ".media/images/logo_001.svg",
                    "provider": "lobehub.icons",
                    "variant": "mono",
                    "requested_entity": "openai",
                    "resolved_entity": "OpenAI",
                    "request_fingerprint": request_fingerprint(query),
                    "license_state": "verified-commercial",
                },
            }
        )
    plan = {
        "schema": "vidmuse.asset-plan.v1",
        "workflow": "recut",
        "transcript": "transcript.json",
        "pass_receipt": {
            "contract": "semantic-asset-pass.v1",
            "status": "completed",
            "input": {
                "path": "transcript.json",
                "sha256": hashlib.sha256(transcript).hexdigest(),
            },
            "opportunity_count": len(opportunities),
            "completed_at": "2026-07-29T00:00:00.000Z",
        },
        "opportunities": opportunities,
        "groups": [],
    }
    (work / "asset-plan.json").write_text(json.dumps(plan), encoding="utf-8")
    return plan


class RecutAssetGateTests(unittest.TestCase):
    def test_empty_deliberate_plan_passes_with_current_receipt(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            write_plan(work, with_asset=False)
            self.assertTrue(check(work)["ok"])

    def test_resolved_asset_must_be_bound_to_real_html_tag(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            write_plan(work, with_asset=True)
            local = work / ".media/images/logo_001.svg"
            local.parent.mkdir(parents=True)
            local.write_text("<svg/>", encoding="utf-8")
            html = work / "public/index.html"
            html.parent.mkdir(parents=True)
            html.write_text(
                '<img data-asset-ref="ao_openai" '
                'src=".media/images/logo_001.svg">',
                encoding="utf-8",
            )
            self.assertTrue(check(work, html)["ok"])
            html.write_text("<!-- ao_openai=.media/images/logo_001.svg -->", encoding="utf-8")
            report = check(work, html)
            self.assertFalse(report["ok"])
            self.assertTrue(any("no real data-asset-ref" in e for e in report["errors"]))

    def test_stale_fingerprint_and_identity_substitution_fail(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            plan = write_plan(work, with_asset=True)
            local = work / ".media/images/logo_001.svg"
            local.parent.mkdir(parents=True)
            local.write_text("<svg/>", encoding="utf-8")
            html = work / "public/index.html"
            html.parent.mkdir(parents=True)
            html.write_text(
                '<img data-asset-ref="ao_openai" '
                'src=".media/images/logo_001.svg">',
                encoding="utf-8",
            )
            item = plan["opportunities"][0]
            item["asset_query"]["variant"] = "text"
            item["resolution"]["resolved_entity"] = "ChatGPT"
            (work / "asset-plan.json").write_text(json.dumps(plan), encoding="utf-8")
            report = check(work, html)
            self.assertFalse(report["ok"])
            self.assertTrue(any("resolution is stale" in e for e in report["errors"]))
            self.assertTrue(any("resolved identity" in e for e in report["errors"]))
            self.assertTrue(any("resolved variant" in e for e in report["errors"]))

    def test_changed_transcript_invalidates_pass_receipt(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            write_plan(work, with_asset=False)
            (work / "transcript.json").write_text("changed", encoding="utf-8")
            report = check(work)
            self.assertFalse(report["ok"])
            self.assertTrue(any("changed after" in e for e in report["errors"]))

    def test_timeline_attachment_and_evaluation_run_the_gate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            write_plan(work, with_asset=False)
            (work / "transcript.json").write_text("changed", encoding="utf-8")
            with redirect_stderr(io.StringIO()):
                self.assertEqual(
                    write_dsl_main([str(work), "--mode", "layered"]),
                    1,
                )
            evaluation = work / "evaluation.json"
            evaluation.write_text(
                json.dumps(
                    {
                        "schema": "vidmuse.packaging.evaluation.v1",
                        "project_id": "test",
                        "status": "pending",
                        "render": {},
                        "hard_checks": {},
                        "aesthetic_review": {},
                        "feedback": {},
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(EvaluationError, "asset gate failed"):
                check_evaluation(evaluation)


if __name__ == "__main__":
    unittest.main()
