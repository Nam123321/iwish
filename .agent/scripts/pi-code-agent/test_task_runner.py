#!/usr/bin/env python3
"""Regression tests for the single-writer Pi task ledger."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RUNNER = Path(__file__).with_name("task_runner.py")


class TaskRunnerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.root = Path(tempfile.mkdtemp(prefix="pi-task-ledger-"))
        (self.root / ".agent" / "config" / "pi-code-agent").mkdir(parents=True)
        (self.root / ".agent" / "config" / "watchmen-pub.pem").write_text("test-public-key\n", encoding="utf-8")
        (self.root / "src").mkdir()
        (self.root / "src" / "owned.ts").write_text("export const value = 1;\n", encoding="utf-8")
        (self.root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml").write_text("schema_version: '1.0'\ncheckers:\n  - id: true-check\n    executable: 'true'\n    args: []\n    trusted: true\n", encoding="utf-8")
        self.run_git("init")
        self.run_git("config", "user.email", "test@example.com")
        self.run_git("config", "user.name", "Pi Test")
        self.run_git("add", ".")
        self.run_git("commit", "-m", "baseline")
        self.contract = self.root / "contract.json"
        registry_sha = __import__("hashlib").sha256((self.root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml").read_bytes()).hexdigest()
        public_key_sha = __import__("hashlib").sha256((self.root / ".agent" / "config" / "watchmen-pub.pem").read_bytes()).hexdigest()
        self.write_json(self.contract, {"schema_version": "1.0", "run_id": "run-12345678", "task_id": "T1", "story_id": "S1", "plan_sha256": "a" * 64, "capability_catalog_sha256": "b" * 64, "target_files": ["src/owned.ts"], "checker_ids": ["true-check"], "checker_registry_sha256": registry_sha, "validator_public_key_sha256": public_key_sha, "risk_tier": "medium", "allowed_tools": ["patch"], "mandatory_edges": ["precondition", "diagnostics", "checker", "review", "validator"], "state": "planned"})
        self.handoff = self.root / "handoff.json"
        self.write_json(self.handoff, {"run_id": "run-12345678", "task_contracts": [str(self.contract)]})
        self.ledger = self.root / "ledger.json"
        self.binding = self.root / "worker-binding.json"
        self.write_json(self.binding, {"schema_version": "1.0", "binding_id": "binding-12345678", "platform_id": "test", "role": "worker", "policy_sha256": "a" * 64, "binding_sha256": "b" * 64, "requested_model": "test-model", "observed_model": "test-model", "reasoning": "test", "decision": "bound", "review_assurance": "not-applicable", "routing_enforcement": "native-hard"})
        self.reviewer_binding = self.root / "reviewer-binding.json"
        self.write_json(self.reviewer_binding, {"schema_version": "1.0", "binding_id": "binding-87654321", "platform_id": "test", "role": "reviewer", "policy_sha256": "a" * 64, "binding_sha256": "b" * 64, "requested_model": "review-model", "observed_model": "review-model", "reasoning": "high", "decision": "bound", "review_assurance": "isolated-subagent", "routing_enforcement": "native-hard"})
        self.call("init", "--root", str(self.root), "--handoff", str(self.handoff), "--output", str(self.ledger))

    def run_git(self, *args: str) -> None:
        subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True, text=True)

    def write_json(self, path: Path, data: dict) -> None:
        path.write_text(json.dumps(data), encoding="utf-8")

    def call(self, *args: str, expected: int = 0) -> subprocess.CompletedProcess[str]:
        result = subprocess.run([sys.executable, str(RUNNER), *args], cwd=self.root, text=True, capture_output=True, env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"})
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        return result

    def start(self) -> tuple[Path, Path]:
        lease, working_set = self.root / "lease.json", self.root / "working-set.json"
        self.call("start", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-actor", "native-worker", "--model-binding", str(self.binding), "--output-lease", str(lease), "--output-working-set", str(working_set))
        return lease, working_set

    def test_rejects_contract_with_mismatched_run(self) -> None:
        contract = json.loads(self.contract.read_text(encoding="utf-8")); contract["run_id"] = "run-87654321"; self.write_json(self.contract, contract)
        self.call("start", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-actor", "native-worker", "--model-binding", str(self.binding), "--output-lease", str(self.root / "lease.json"), "--output-working-set", str(self.root / "working-set.json"), expected=2)

    def test_collect_blocks_scope_escape(self) -> None:
        lease, _ = self.start()
        (self.root / "src" / "owned.ts").write_text("export const value = 2;\n", encoding="utf-8")
        (self.root / "src" / "escaped.ts").write_text("export const escaped = true;\n", encoding="utf-8")
        self.call("collect", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--lease", str(lease), "--worker-actor", "native-worker", "--output", str(self.root / "candidate.json"), expected=2)
        ledger = json.loads(self.ledger.read_text(encoding="utf-8"))
        self.assertEqual(ledger["tasks"]["T1"]["state"], "blocked")

    def test_preflight_blocks_missing_local_dependencies_without_lease(self) -> None:
        registry_path = self.root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml"
        registry_path.write_text("schema_version: '1.0'\ncheckers:\n  - id: true-check\n    executable: 'true'\n    args: []\n    trusted: true\n    requires_local_node_modules: true\n", encoding="utf-8")
        registry_sha = __import__("hashlib").sha256(registry_path.read_bytes()).hexdigest()
        contract = json.loads(self.contract.read_text(encoding="utf-8")); contract["checker_registry_sha256"] = registry_sha; self.write_json(self.contract, contract)
        ledger = json.loads(self.ledger.read_text(encoding="utf-8")); ledger["tasks"]["T1"]["contract_sha256"] = __import__("hashlib").sha256(self.contract.read_bytes()).hexdigest(); self.write_json(self.ledger, ledger)
        self.call("preflight", "--root", str(self.root), "--contract", str(self.contract), "--output", str(self.root / "preflight.json"), expected=2)
        self.call("start", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-actor", "native-worker", "--model-binding", str(self.binding), "--output-lease", str(self.root / "lease.json"), "--output-working-set", str(self.root / "working-set.json"), expected=2)
        ledger = json.loads(self.ledger.read_text(encoding="utf-8"))
        self.assertEqual(ledger["tasks"]["T1"]["state"], "planned")
        self.assertIsNone(ledger["tasks"]["T1"]["lease"])

    def test_retry_preserves_the_first_lease_baseline(self) -> None:
        lease, _ = self.start()
        (self.root / "src" / "owned.ts").write_text("export const value = 2;\n", encoding="utf-8")
        ledger = json.loads(self.ledger.read_text(encoding="utf-8"))
        initial_baseline = ledger["tasks"]["T1"]["baseline"]
        ledger["tasks"]["T1"].update({"state": "blocked", "lease": {**json.loads(lease.read_text(encoding="utf-8")), "state": "consumed"}})
        self.write_json(self.ledger, ledger)
        retry_lease, _ = self.start()
        self.call("collect", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--lease", str(retry_lease), "--worker-actor", "native-worker", "--output", str(self.root / "retry-candidate.json"))
        candidate = json.loads((self.root / "retry-candidate.json").read_text(encoding="utf-8"))
        self.assertEqual(candidate["changed_files"], ["src/owned.ts"])
        ledger = json.loads(self.ledger.read_text(encoding="utf-8"))
        self.assertEqual(ledger["tasks"]["T1"]["baseline"], initial_baseline)

    def test_self_review_is_rejected_before_validator(self) -> None:
        lease, _ = self.start()
        (self.root / "src" / "owned.ts").write_text("export const value = 2;\n", encoding="utf-8")
        candidate = self.root / "candidate.json"
        self.call("collect", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--lease", str(lease), "--worker-actor", "native-worker", "--output", str(candidate))
        review = self.root / "review.json"
        self.write_json(review, {"worker_receipt_sha256": __import__("hashlib").sha256(candidate.read_bytes()).hexdigest(), "reviewer_actor_id": "native-worker", "independent_context": True, "decision": "approved", "findings": []})
        self.call("review", "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-receipt", str(candidate), "--review", str(review), "--reviewer-binding", str(self.reviewer_binding), expected=2)

    def test_acceptance_fails_closed_without_external_validator(self) -> None:
        lease, _ = self.start()
        (self.root / "src" / "owned.ts").write_text("export const value = 2;\n", encoding="utf-8")
        candidate = self.root / "candidate.json"
        self.call("collect", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--lease", str(lease), "--worker-actor", "native-worker", "--output", str(candidate))
        digest = __import__("hashlib").sha256(candidate.read_bytes()).hexdigest()
        review = self.root / "review.json"; self.write_json(review, {"worker_receipt_sha256": digest, "reviewer_actor_id": "independent-reviewer", "independent_context": True, "decision": "approved", "findings": []})
        self.call("review", "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-receipt", str(candidate), "--review", str(review), "--reviewer-binding", str(self.reviewer_binding))
        signature = self.root / "attestation.json.sig"; signature.write_bytes(b"not-a-real-detached-signature")
        attestation = self.root / "attestation.json"; self.write_json(attestation, {"schema_version": "1.0", "attestation_id": "attestation-12345678", "run_id": "run-12345678", "task_id": "T1", "worker_receipt_sha256": digest, "review_receipt_sha256": __import__("hashlib").sha256(review.read_bytes()).hexdigest(), "decision": "accepted", "validator_actor_id": "external-validator", "nonce": "nonce-12345678"})
        self.call("accept", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-receipt", str(candidate), "--review", str(review), "--attestation", str(attestation), "--attestation-signature", str(signature), expected=2)

    def test_acceptance_requires_a_valid_signature_from_the_pinned_key(self) -> None:
        private_key, public_key = self.root / "validator-private.pem", self.root / ".agent" / "config" / "watchmen-pub.pem"
        subprocess.run(["/usr/bin/openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048", "-out", str(private_key)], check=True, capture_output=True, text=True)
        subprocess.run(["/usr/bin/openssl", "pkey", "-in", str(private_key), "-pubout", "-out", str(public_key)], check=True, capture_output=True, text=True)
        contract = json.loads(self.contract.read_text(encoding="utf-8")); contract["validator_public_key_sha256"] = __import__("hashlib").sha256(public_key.read_bytes()).hexdigest(); self.write_json(self.contract, contract)
        ledger = json.loads(self.ledger.read_text(encoding="utf-8")); ledger["validator_public_key_sha256"] = contract["validator_public_key_sha256"]; ledger["tasks"]["T1"]["contract_sha256"] = __import__("hashlib").sha256(self.contract.read_bytes()).hexdigest(); self.write_json(self.ledger, ledger)
        lease, _ = self.start()
        (self.root / "src" / "owned.ts").write_text("export const value = 2;\n", encoding="utf-8")
        candidate = self.root / "candidate.json"
        self.call("collect", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--lease", str(lease), "--worker-actor", "native-worker", "--output", str(candidate))
        digest = __import__("hashlib").sha256(candidate.read_bytes()).hexdigest()
        review = self.root / "review.json"; self.write_json(review, {"worker_receipt_sha256": digest, "reviewer_actor_id": "independent-reviewer", "independent_context": True, "decision": "approved", "findings": []})
        self.call("review", "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-receipt", str(candidate), "--review", str(review), "--reviewer-binding", str(self.reviewer_binding))
        attestation = self.root / "attestation.json"
        signature = self.root / "attestation.json.sig"
        self.write_json(attestation, {"schema_version": "1.0", "attestation_id": "attestation-12345678", "run_id": "run-12345678", "task_id": "T1", "worker_receipt_sha256": digest, "review_receipt_sha256": __import__("hashlib").sha256(review.read_bytes()).hexdigest(), "decision": "accepted", "validator_actor_id": "external-validator", "nonce": "nonce-12345678"})
        subprocess.run(["/usr/bin/openssl", "dgst", "-sha256", "-sign", str(private_key), "-out", str(signature), str(attestation)], check=True, capture_output=True, text=True)
        self.call("accept", "--root", str(self.root), "--ledger", str(self.ledger), "--contract", str(self.contract), "--worker-receipt", str(candidate), "--review", str(review), "--attestation", str(attestation), "--attestation-signature", str(signature))


if __name__ == "__main__":
    unittest.main()
