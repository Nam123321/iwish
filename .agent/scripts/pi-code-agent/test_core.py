#!/usr/bin/env python3
import tempfile
import unittest
from pathlib import Path

from core import (ContractError, compile_catalog, resolve_skill, validate_catalog,
                  validate_catalog_pin, validate_invocation_dag, validate_lease,
                  validate_mandatory_edges, validate_receipt,
                  validate_receipt_namespace, validate_role_output,
                  validate_transition)


class PiCodeAgentCoreTests(unittest.TestCase):
    def make_project(self) -> Path:
        root = Path(tempfile.mkdtemp(prefix="pi-code-agent-test-"))
        (root / ".agent" / "workflows").mkdir(parents=True)
        (root / ".agent" / "skills" / "safe-skill").mkdir(parents=True)
        (root / ".agent" / "workflows" / "code.md").write_text("---\nname: code\ndescription: code\n---\n", encoding="utf-8")
        (root / ".agent" / "skills" / "safe-skill" / "SKILL.md").write_text("---\nname: safe-skill\ndescription: safe\n---\n", encoding="utf-8")
        return root

    def test_catalog_is_hash_pinned_and_workflow_wins_collision(self):
        root = self.make_project()
        (root / ".agent" / "skills" / "code").mkdir(parents=True)
        (root / ".agent" / "skills" / "code" / "SKILL.md").write_text("---\nname: code\ndescription: shadow\n---\n", encoding="utf-8")
        catalog = compile_catalog(root)
        validate_catalog(catalog)
        self.assertEqual(catalog["sources"][0]["name"], "code")
        self.assertEqual(catalog["sources"][0]["kind"], "workflow")
        self.assertEqual(len(catalog["collisions"]), 1)
        catalog["sources"][0]["description"] = "tampered"
        with self.assertRaises(ContractError):
            validate_catalog(catalog)

    def test_routed_skill_requires_authorization(self):
        catalog = compile_catalog(self.make_project())
        denied = resolve_skill(catalog, "safe-skill", "routed", False)
        self.assertFalse(denied["authorized"])
        accepted = resolve_skill(catalog, "safe-skill", "routed", True)
        self.assertTrue(accepted["authorized"])

    def test_accepted_receipt_requires_tests_and_review(self):
        base = {
            "schema_version": "1.0", "receipt_id": "receipt-12345678", "run_id": "run-12345678",
            "task_id": "T1", "plan_sha256": "a" * 64, "diff_sha256": "b" * 64,
            "tool_events": [], "diagnostics": [], "tests": [], "reviewer_decisions": [], "redactions": [],
            "validator_decision": "accepted",
        }
        with self.assertRaises(ContractError):
            validate_receipt(base)
        base["tests"] = [{"name": "focused", "status": "passed"}]
        base["reviewer_decisions"] = [{"role": "independent", "decision": "accepted"}]
        validate_receipt(base)

    def test_state_transition_cannot_skip_review(self):
        with self.assertRaises(ContractError):
            validate_transition("executing", "accepted")

    def test_duplicate_lease_and_invocation_cycle_are_rejected(self):
        lease = {"lease_id": "lease-1", "run_id": "run-1", "task_id": "T1", "state": "active"}
        with self.assertRaises(ContractError):
            validate_lease(lease, {"lease-1"})
        with self.assertRaises(ContractError):
            validate_invocation_dag([{"from": "a", "to": "b"}, {"from": "b", "to": "a"}])

    def test_role_output_requires_input_binding_boundary_and_independence(self):
        base = {"input_hash": "a" * 64, "changed_files": ["src/a.ts"], "independent_context": False}
        with self.assertRaises(ContractError):
            validate_role_output(base, "b" * 64, {"src/a.ts"})
        with self.assertRaises(ContractError):
            validate_role_output(base, "a" * 64, {"src/b.ts"})
        with self.assertRaises(ContractError):
            validate_role_output(base, "a" * 64, {"src/a.ts"}, independent_required=True)
        base["independent_context"] = True
        validate_role_output(base, "a" * 64, {"src/a.ts"}, independent_required=True)

    def test_stale_catalog_replay_and_mandatory_edge_bypass_are_rejected(self):
        catalog = compile_catalog(self.make_project())
        with self.assertRaises(ContractError):
            validate_catalog_pin(catalog, "f" * 64)
        receipt = {
            "schema_version": "1.0", "receipt_id": "receipt-12345678", "run_id": "run-12345678",
            "task_id": "T1", "plan_sha256": "a" * 64, "diff_sha256": "b" * 64,
            "tool_events": [], "diagnostics": [], "tests": [{"name": "focused", "status": "passed"}],
            "reviewer_decisions": [{"role": "independent", "decision": "accepted"}],
            "validator_decision": "accepted", "redactions": [],
        }
        with self.assertRaises(ContractError):
            validate_receipt_namespace(receipt, {receipt["receipt_id"]})
        with self.assertRaises(ContractError):
            validate_mandatory_edges({"security-review"}, set())


if __name__ == "__main__":
    unittest.main()
