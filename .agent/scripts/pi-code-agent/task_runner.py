#!/usr/bin/env python3
"""Single-writer task state machine for the native pi-code-agent execution path."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from core import ContractError, atomic_json_write, canonical, sha256_file


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def digest(value: Any) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ContractError(f"expected JSON object: {path}")
    return data


def root_path(value: str) -> Path:
    root = Path(value).resolve()
    if not (root / ".agent").is_dir():
        raise ContractError("not an iWish project root")
    return root


def relative_file(root: Path, value: str) -> Path:
    path = (root / value).resolve()
    try:
        path.relative_to(root)
    except ValueError as exc:
        raise ContractError(f"path escapes project root: {value}") from exc
    return path


def git(root: Path, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=root, text=True, capture_output=True, check=False)


def repository_identity(root: Path) -> tuple[str, str]:
    top = git(root, ["rev-parse", "--show-toplevel"])
    common = git(root, ["rev-parse", "--git-common-dir"])
    if top.returncode != 0 or common.returncode != 0:
        raise ContractError("task ledger requires a git worktree")
    return digest({"top": top.stdout.strip(), "common": common.stdout.strip()}), digest(str(root))


def status_paths(root: Path) -> set[str]:
    result = git(root, ["status", "--porcelain=v1", "--untracked-files=all"])
    if result.returncode != 0:
        raise ContractError(result.stderr.strip() or "cannot read git status")
    paths: set[str] = set()
    for line in result.stdout.splitlines():
        if len(line) < 4:
            continue
        value = line[3:]
        if " -> " in value:
            value = value.rsplit(" -> ", 1)[-1]
        paths.add(value)
    return paths


def event(kind: str, **data: Any) -> dict[str, Any]:
    return {"at": now(), "kind": kind, **data}


def save(ledger_path: Path, ledger: dict[str, Any]) -> None:
    atomic_json_write(ledger_path, ledger)


def task_entry(ledger: dict[str, Any], contract: dict[str, Any]) -> dict[str, Any]:
    task = ledger.get("tasks", {}).get(contract.get("task_id"))
    if not isinstance(task, dict):
        raise ContractError("task is not registered in ledger")
    if contract.get("run_id") != ledger.get("run_id"):
        raise ContractError("contract run_id does not match ledger")
    if task.get("contract_sha256") != sha256_file(Path(task["contract_path"])):
        raise ContractError("registered contract was modified after ledger initialization")
    return task


def require_lease(task: dict[str, Any], lease_path: Path) -> dict[str, Any]:
    lease = load_json(lease_path)
    if task.get("lease", {}).get("lease_id") != lease.get("lease_id") or lease.get("state") != "active":
        raise ContractError("active lease does not match task")
    return lease


def load_registry(root: Path) -> dict[str, dict[str, Any]]:
    data = yaml.safe_load((root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml").read_text(encoding="utf-8"))
    registry: dict[str, dict[str, Any]] = {}
    for checker in data.get("checkers", []):
        if checker.get("trusted") is True and isinstance(checker.get("id"), str):
            registry[checker["id"]] = checker
    return registry


def checker_preflight(root: Path, checker_ids: list[str], expected_sha256: str) -> list[dict[str, Any]]:
    registry_path = root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml"
    if sha256_file(registry_path) != expected_sha256:
        raise ContractError("checker registry changed after contract compilation")
    registry = load_registry(root)
    results: list[dict[str, Any]] = []
    for checker_id in checker_ids:
        checker = registry.get(checker_id)
        if checker is None:
            raise ContractError(f"untrusted or unknown checker: {checker_id}")
        executable = checker.get("executable")
        command_available = isinstance(executable, str) and bool(executable) and shutil.which(executable) is not None
        local_dependencies_ready = not checker.get("requires_local_node_modules", False) or (root / "node_modules").is_dir()
        results.append({
            "checker_id": checker_id,
            "executable": executable,
            "command_available": command_available,
            "local_dependencies_ready": local_dependencies_ready,
            "status": "ready" if command_available and local_dependencies_ready else "blocked",
        })
    return results


def run_checkers(root: Path, checker_ids: list[str], expected_sha256: str, target_files: list[str] | None = None) -> list[dict[str, Any]]:
    registry_path = root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml"
    if sha256_file(registry_path) != expected_sha256:
        raise ContractError("checker registry changed after contract compilation")
    registry = load_registry(root)
    results: list[dict[str, Any]] = []
    for checker_id in checker_ids:
        checker = registry.get(checker_id)
        if checker is None:
            raise ContractError(f"untrusted or unknown checker: {checker_id}")
        if not isinstance(checker.get("executable"), str) or not checker["executable"] or not isinstance(checker.get("args", []), list) or any(not isinstance(value, str) for value in checker.get("args", [])):
            raise ContractError(f"invalid trusted checker declaration: {checker_id}")
        command = [checker["executable"], *checker.get("args", [])]
        if checker_id == "vitest" and target_files:
            test_files = [f for f in target_files if ".test." in f or ".spec." in f]
            if test_files:
                command.extend(test_files)
        try:
            completed = subprocess.run(command, cwd=root, text=True, capture_output=True, check=False, stdin=subprocess.DEVNULL, timeout=60)
            results.append({
                "checker_id": checker_id,
                "command": command,
                "exit_code": completed.returncode,
                "stdout_sha256": hashlib.sha256(completed.stdout.encode()).hexdigest(),
                "stderr_sha256": hashlib.sha256(completed.stderr.encode()).hexdigest(),
                "status": "passed" if completed.returncode == 0 else "failed",
            })
        except subprocess.TimeoutExpired:
            results.append({
                "checker_id": checker_id,
                "command": command,
                "exit_code": 124,
                "stdout_sha256": None,
                "stderr_sha256": None,
                "status": "failed",
                "error": "checker timed out after 60s"
            })
    return results


def command_init(args: argparse.Namespace) -> int:
    root = root_path(args.root)
    handoff = load_json(Path(args.handoff))
    run_id = handoff.get("run_id")
    paths = handoff.get("task_contracts")
    if not isinstance(run_id, str) or not isinstance(paths, list) or not paths:
        raise ContractError("handoff must include run_id and task_contracts")
    repository_id, worktree_id = repository_identity(root)
    tasks: dict[str, Any] = {}
    for value in paths:
        contract_path = Path(value).resolve()
        contract = load_json(contract_path)
        task_id = contract.get("task_id")
        if contract.get("run_id") != run_id or not isinstance(task_id, str) or task_id in tasks:
            raise ContractError("task contracts must have unique task IDs bound to handoff run")
        if not isinstance(contract.get("checker_ids"), list) or not contract["checker_ids"] or not isinstance(contract.get("checker_registry_sha256"), str):
            raise ContractError("task contract has no pinned checker registry")
        if not isinstance(contract.get("validator_public_key_sha256"), str):
            raise ContractError("task contract has no pinned validator public key")
        if not {"precondition", "diagnostics", "checker", "review", "validator"}.issubset(set(contract.get("mandatory_edges", []))):
            raise ContractError("task contract removed a mandatory execution edge")
        tasks[task_id] = {
            "contract_path": str(contract_path), "contract_sha256": sha256_file(contract_path),
            "state": "planned", "events": [event("initialized")], "lease": None,
            "baseline": None, "worker_receipt_sha256": None, "review_receipt_sha256": None,
            "validator_attestation_sha256": None,
        }
    validator_key_hashes = {contract["validator_public_key_sha256"] for contract in (load_json(Path(value).resolve()) for value in paths)}
    if len(validator_key_hashes) != 1:
        raise ContractError("all task contracts must pin the same validator public key")
    ledger = {"schema_version": "1.0", "run_id": run_id, "repository_id": repository_id,
              "worktree_id": worktree_id, "validator_public_key_sha256": validator_key_hashes.pop(),
              "tasks": tasks, "committed_receipt_ids": []}
    save(Path(args.output), ledger)
    print(json.dumps({"ledger": args.output, "run_id": run_id, "tasks": len(tasks)}, indent=2))
    return 0


def command_start(args: argparse.Namespace) -> int:
    root = root_path(args.root)
    ledger_path, contract_path = Path(args.ledger), Path(args.contract)
    ledger, contract = load_json(ledger_path), load_json(contract_path)
    task = task_entry(ledger, contract)
    model_binding_path = Path(args.model_binding)
    model_binding = load_json(model_binding_path)
    if model_binding.get("role") != "worker" or model_binding.get("decision") != "bound":
        raise ContractError("task worker requires an approved model binding")
    if task["state"] not in {"planned", "rejected", "blocked"}:
        raise ContractError("task is not eligible for a new lease")
    ordered = list(ledger["tasks"])
    if any(ledger["tasks"][identifier]["state"] != "accepted" for identifier in ordered[:ordered.index(contract["task_id"])]):
        raise ContractError("prior task has not been accepted")
    preflight = checker_preflight(root, contract["checker_ids"], contract["checker_registry_sha256"])
    if any(item["status"] != "ready" for item in preflight):
        raise ContractError("checker environment is not ready; run preflight remediation before acquiring a lease")
    lease = {"lease_id": f"lease-{uuid.uuid4().hex}", "run_id": ledger["run_id"], "task_id": contract["task_id"], "worker_actor_id": args.worker_actor, "state": "active", "issued_at": now()}
    if task.get("baseline") is None:
        baseline = {"status_paths": sorted(status_paths(root)), "target_sha256": {target: sha256_file(path) if (path := relative_file(root, target)).is_file() else None for target in contract["target_files"]}}
        task["baseline"] = baseline
    else:
        baseline = task["baseline"]
    task.update({"state": "executing", "lease": lease, "worker_model_binding_sha256": sha256_file(model_binding_path)})
    task["events"].append(event("lease-issued", lease_id=lease["lease_id"], worker_actor=args.worker_actor))
    atomic_json_write(Path(args.output_lease), lease)
    working_set = {"schema_version": "1.0", "run_id": ledger["run_id"], "task_id": contract["task_id"], "contract_sha256": task["contract_sha256"], "target_files": contract["target_files"], "baseline": baseline}
    atomic_json_write(Path(args.output_working_set), working_set)
    # Lease/working-set artifacts are runner-owned. Record the baseline only
    # after they exist so the scope gate measures worker changes, not itself.
    if len(task["events"]) == 2:
        task["baseline"]["status_paths"] = sorted(status_paths(root))
    save(ledger_path, ledger)
    print(json.dumps({"lease": args.output_lease, "working_set": args.output_working_set}, indent=2))
    return 0


def command_preflight(args: argparse.Namespace) -> int:
    root = root_path(args.root)
    contract = load_json(Path(args.contract))
    results = checker_preflight(root, contract["checker_ids"], contract["checker_registry_sha256"])
    ready = all(item["status"] == "ready" for item in results)
    evidence = {
        "schema_version": "1.0",
        "task_id": contract["task_id"],
        "contract_sha256": sha256_file(Path(args.contract)),
        "decision": "ready" if ready else "blocked",
        "checkers": results,
        "created_at": now(),
    }
    atomic_json_write(Path(args.output), evidence)
    print(json.dumps(evidence, indent=2))
    return 0 if ready else 2



def run_ast_grep_checks(root: Path, target_files: list[str]) -> list[dict[str, Any]]:



    if not shutil.which("ast-grep"):
        return [{"tool": "ast-grep", "status": "skipped", "reason": "not_installed"}]
    
    if not target_files:
        return []
    # EC-P4-01: Codegraph Scoping & Fallback (rg).
    combined_files = set(target_files)
    
    # 1. Query codegraph for 1-hop dependencies
    if shutil.which("codegraph"):
        try:
            cg_res = subprocess.run(["codegraph", "query", "--depth", "1", "--"] + target_files, cwd=root, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=60)
            if cg_res.returncode == 0:
                for line in cg_res.stdout.splitlines():
                    if line.strip():
                        combined_files.add(line.strip())
        except Exception as e:
            import sys
            print(f'Warning: {e}', file=sys.stderr)
            
    # 2. Fallback to full-text search (rg) to find dynamic imports (silent misses)
    if shutil.which("rg"):
        for f in target_files:
            file_path = root / f
            if file_path.is_file():
                # Extract basic symbols heuristically (e.g., class names, exported functions)
                # Use the file path stem only if it is specific enough (length > 8), otherwise use file name
                search_term = file_path.name if len(file_path.stem) < 8 else file_path.stem
                try:
                    res = subprocess.run(
                        ["rg", "-l", "--fixed-strings", "--glob", "!node_modules", "--", search_term, "."],
                        cwd=root,
                        capture_output=True,
                        text=True,
                        stdin=subprocess.DEVNULL,
                        timeout=60
                    )
                    if res.returncode == 0:
                        for line in res.stdout.splitlines():
                            if line.strip():
                                combined_files.add(line.strip())
                except Exception:
                    pass
    
        # EC-P11-01: Prevent ARG_MAX overflow
    
    # EC-P11-01: Prioritize target files over rg fallback
    safe_files = sorted(list(set(target_files)))
    rg_files = sorted(list(combined_files - set(target_files)))
    safe_files.extend(rg_files)
    safe_files = safe_files[:200]

    cmd = ["ast-grep", "scan", "--json", "--", "-r", "sgconfig.yml"] + safe_files
    try:
        res = subprocess.run(cmd, cwd=root, capture_output=True, text=True, check=False, stdin=subprocess.DEVNULL, timeout=60)
        matches = json.loads(res.stdout) if res.stdout.strip() else []
    except subprocess.TimeoutExpired:
        return [{"tool": "ast-grep", "status": "failed", "error": "ast-grep timed out after 60s"}]
    except Exception as e:
        return [{"tool": "ast-grep", "status": "failed", "error": str(e)}]
        
    # EC-P11-01: Output MUST be truncated (max 50 matches). Max 50 lines per match.
    truncated_matches = matches[:50]
    for m in truncated_matches:
        if "lines" in m:
            lines = m["lines"].splitlines()
            if len(lines) > 50:
                m["lines"] = "\n".join(lines[:50]) + "\n... (truncated)"
    return [{"tool": "ast-grep", "status": "passed" if not truncated_matches else "failed", "matches": truncated_matches, "truncated": len(matches) > 50}]

def command_collect(args: argparse.Namespace) -> int:

    root = root_path(args.root)
    ledger_path, contract_path = Path(args.ledger), Path(args.contract)
    ledger, contract = load_json(ledger_path), load_json(contract_path)
    task = task_entry(ledger, contract)
    if task["state"] != "executing":
        raise ContractError("only executing task can collect evidence")
    lease = require_lease(task, Path(args.lease))
    if lease.get("worker_actor_id") != args.worker_actor:
        raise ContractError("worker actor does not own lease")
    before = set(task["baseline"]["status_paths"])
    after = status_paths(root)
    changed = sorted(after - before)
    escaped = sorted(set(changed) - set(contract["target_files"]))
    diff_check = git(root, ["diff", "--check"])
    diagnostics = [{"tool": "git-diff-check", "exit_code": diff_check.returncode, "stdout_sha256": hashlib.sha256(diff_check.stdout.encode()).hexdigest(), "status": "passed" if diff_check.returncode == 0 else "failed"}] + run_ast_grep_checks(root, contract["target_files"])
    checks = run_checkers(root, contract["checker_ids"], contract["checker_registry_sha256"], contract.get("target_files", [])) if not escaped and diff_check.returncode == 0 else []
    succeeded = not escaped and diff_check.returncode == 0 and all(item["status"] == "passed" for item in checks) and all(item["status"] == "passed" for item in diagnostics)
    changed_hashes = {path: sha256_file(file) if (file := relative_file(root, path)).is_file() else None for path in changed}
    receipt = {"schema_version": "1.0", "receipt_kind": "worker-candidate", "receipt_id": f"worker-{uuid.uuid4().hex}", "run_id": ledger["run_id"], "task_id": contract["task_id"], "worker_actor_id": args.worker_actor, "worker_model_binding_sha256": task["worker_model_binding_sha256"], "lease_id": lease["lease_id"], "contract_sha256": task["contract_sha256"], "changed_files": changed, "changed_file_sha256": changed_hashes, "scope_escape": escaped, "diagnostics": diagnostics, "checks": checks, "validator_decision": "pending", "redactions": [], "created_at": now()}
    receipt_path = Path(args.output)
    atomic_json_write(receipt_path, receipt)
    task["lease"]["state"] = "consumed"
    task["worker_receipt_sha256"] = sha256_file(receipt_path)
    task["state"] = "review" if succeeded else "blocked"
    task["events"].append(event("candidate-collected", receipt_id=receipt["receipt_id"], result=task["state"]))
    save(ledger_path, ledger)
    print(json.dumps({"receipt": args.output, "eligible_for_review": succeeded, "scope_escape": escaped}, indent=2))
    return 0 if succeeded else 2


def command_review(args: argparse.Namespace) -> int:
    ledger_path, contract_path = Path(args.ledger), Path(args.contract)
    ledger, contract = load_json(ledger_path), load_json(contract_path)
    task = task_entry(ledger, contract)
    receipt_path, review_path = Path(args.worker_receipt), Path(args.review)
    receipt, review = load_json(receipt_path), load_json(review_path)
    reviewer_binding_path = Path(args.reviewer_binding)
    reviewer_binding = load_json(reviewer_binding_path)
    if task["state"] != "review" or task["worker_receipt_sha256"] != sha256_file(receipt_path):
        raise ContractError("review is not bound to current worker candidate")
    if review.get("worker_receipt_sha256") != sha256_file(receipt_path):
        raise ContractError("review does not bind worker receipt")
    if review.get("reviewer_actor_id") == receipt.get("worker_actor_id"):
        raise ContractError("worker cannot review its own task")
    if reviewer_binding.get("role") != "reviewer" or reviewer_binding.get("decision") != "bound":
        raise ContractError("reviewer requires an approved model binding")
    assurance = reviewer_binding.get("review_assurance")
    permitted = {
        "low": {"same-session", "same-ide-fresh-task", "isolated-subagent", "separate-host"},
        "medium": {"same-ide-fresh-task", "isolated-subagent", "separate-host"},
        "high": {"isolated-subagent", "separate-host"},
        "critical": {"separate-host"},
    }
    if assurance not in permitted[contract["risk_tier"]]:
        raise ContractError("reviewer assurance is insufficient for task risk tier")
        
    if assurance == "isolated-subagent":
        transcript_uri = review.get("transcript_absolute_uri")
        if not transcript_uri or not transcript_uri.startswith("file://"):
            raise ContractError("isolated-subagent assurance requires a valid transcript_absolute_uri")
        transcript_path = Path(transcript_uri.replace("file://", ""))
        if not transcript_path.is_file():
            raise ContractError(f"transcript file not found: {transcript_path}")
        try:
            with open(transcript_path, "r", encoding="utf-8") as f:
                content = f.read()
                # Verify that the subagent actually observed the receipt hash
                if sha256_file(receipt_path) not in content:
                    raise ContractError("transcript does not contain evidence of reviewing this specific worker receipt (Replay Attack blocked)")
        except Exception as e:
            raise ContractError(f"failed to verify transcript: {e}")
            
    unresolved = [item for item in review.get("findings", []) if item.get("severity") in {"blocker", "critical"} and item.get("status") not in {"resolved", "accepted"}]
    if review.get("decision") not in {"approved", "accepted"} or unresolved:
        task["state"] = "rejected"
        task["events"].append(event("review-rejected", unresolved=len(unresolved)))
        save(ledger_path, ledger)
        raise ContractError("review is not approved or has unresolved blockers")
    task["review_receipt_sha256"] = sha256_file(review_path)
    task["reviewer_model_binding_sha256"] = sha256_file(reviewer_binding_path)
    task["events"].append(event("review-approved", reviewer=review.get("reviewer_actor_id")))
    save(ledger_path, ledger)
    print(json.dumps({"review": str(review_path), "approved": True}, indent=2))
    return 0


def verify_attestation(root: Path, expected_public_key_sha256: str, attestation_path: Path, signature_path: Path, attestation: dict[str, Any]) -> bool:
    """Verify the exact attestation bytes against the key pinned in the task ledger."""
    public_key = root / ".agent" / "config" / "watchmen-pub.pem"
    if not public_key.is_file() or not signature_path.is_file():
        return False
    if sha256_file(public_key) != expected_public_key_sha256:
        return False
    result = subprocess.run(
        ["/usr/bin/openssl", "dgst", "-sha256", "-verify", str(public_key), "-signature", str(signature_path), str(attestation_path)],
        text=True,
        capture_output=True,
        check=False,
    )
    return result.returncode == 0


def command_accept(args: argparse.Namespace) -> int:
    root = root_path(args.root)
    ledger_path, contract_path = Path(args.ledger), Path(args.contract)
    ledger, contract = load_json(ledger_path), load_json(contract_path)
    task = task_entry(ledger, contract)
    receipt_path, attestation_path, signature_path = Path(args.worker_receipt), Path(args.attestation), Path(args.attestation_signature)
    if getattr(args, "review", None):
        review_paths = [Path(p) for p in args.review] if isinstance(args.review, list) else [Path(args.review)]
    else:
        review_paths = []
    receipt, attestation = load_json(receipt_path), load_json(attestation_path)
    reviews = []
    for p in review_paths:
        if p.exists():
            reviews.append(load_json(p))
    reviewer_actors = {r.get("reviewer_actor_id") for r in reviews if isinstance(r, dict)}
    
    if task["state"] != "review" or task.get("worker_receipt_sha256") != sha256_file(receipt_path):
        raise ContractError("acceptance inputs are not the ledger-bound review state")
        
    expected_reviews = task.get("review_receipt_sha256_list", [task.get("review_receipt_sha256")])
    provided_reviews = [sha256_file(p) for p in review_paths]
    if not all(r in provided_reviews for r in expected_reviews if r):
        raise ContractError("Not all required review receipts were provided for acceptance")
        
    expected = {"run_id": ledger["run_id"], "task_id": contract["task_id"], "worker_receipt_sha256": sha256_file(receipt_path), "decision": "accepted"}
    if any(attestation.get(key) != value for key, value in expected.items()):
        raise ContractError("validator attestation does not bind accepted inputs")
        
    if "created_at" not in attestation:
        raise ContractError("validator attestation must contain created_at timestamp to prevent replay")
    
    # Check that attestation is not older than 1 hour (replay protection)
    try:
        att_time = datetime.fromisoformat(attestation["created_at"].replace("Z", "+00:00"))
        if (datetime.now(timezone.utc) - att_time).total_seconds() > 3600:
            raise ContractError("validator attestation is expired (Replay Attack blocked)")
    except ValueError:
        raise ContractError("invalid created_at timestamp in validator attestation")
        
    if attestation.get("validator_actor_id") in {receipt.get("worker_actor_id")}.union(reviewer_actors):
        raise ContractError("validator must be independent from worker and reviewer")
    if not verify_attestation(root, ledger["validator_public_key_sha256"], attestation_path, signature_path, attestation):
        raise ContractError("external validator detached attestation is unavailable or invalid")
    task["state"] = "accepted"
    task["validator_attestation_sha256"] = sha256_file(attestation_path)
    task["events"].append(event("accepted", attestation_id=attestation.get("attestation_id")))
    ledger["committed_receipt_ids"].append(receipt["receipt_id"])
    save(ledger_path, ledger)
    print(json.dumps({"accepted": True, "task_id": contract["task_id"]}, indent=2))
    return 0


def command_story_gate(args: argparse.Namespace) -> int:
    root = root_path(args.root)
    ledger, handoff = load_json(Path(args.ledger)), load_json(Path(args.handoff))
    if handoff.get("run_id") != ledger.get("run_id") or any(task["state"] != "accepted" for task in ledger["tasks"].values()):
        raise ContractError("story is not eligible for Stage 4")
    ledger_sha256 = sha256_file(Path(args.ledger))
    attestation_path, signature_path = Path(args.attestation), Path(args.attestation_signature)
    attestation = load_json(attestation_path)
    if attestation.get("run_id") != ledger["run_id"] or attestation.get("ledger_sha256") != ledger_sha256 or attestation.get("decision") != "accepted":
        raise ContractError("Stage 4 attestation is not bound to the final ledger")
    if not isinstance(attestation.get("validator_actor_id"), str) or not isinstance(attestation.get("nonce"), str) or not verify_attestation(root, ledger["validator_public_key_sha256"], attestation_path, signature_path, attestation):
        raise ContractError("Stage 4 external validator detached attestation is unavailable or invalid")
    evidence = {"schema_version": "1.0", "run_id": ledger["run_id"], "status": "eligible_for_stage_4", "ledger_sha256": ledger_sha256, "stage_attestation_sha256": sha256_file(Path(args.attestation)), "accepted_task_ids": sorted(ledger["tasks"]), "completion_sink": handoff.get("invocation", {}).get("completion_sink")}
    atomic_json_write(Path(args.output), evidence)
    print(json.dumps(evidence, indent=2))
    return 0


def command_merge(args: argparse.Namespace) -> int:
    primary_path = Path(args.primary_ledger)
    primary = load_json(primary_path)
    for sec_path in args.secondary_ledgers:
        sec = load_json(Path(sec_path))
        # Merge task events and update state
        for tid, sec_task in sec.get("tasks", {}).items():
            if tid in primary.get("tasks", {}):
                prim_task = primary["tasks"][tid]
                # Combine events uniquely based on timestamp and name
                existing_events = { (e["at"], e["kind"]) for e in prim_task["events"] }
                for e in sec_task["events"]:
                    if (e["at"], e["kind"]) not in existing_events:
                        prim_task["events"].append(e)
                # Keep the most advanced state or require manual reconciliation
                prim_task["events"].sort(key=lambda x: x["at"])
                
                # EC-P13: Reconcile task state from secondary ledger
                prim_state = prim_task.get("state", "pending")
                sec_state = sec_task.get("state", "pending")
                # Rejected overrides everything
                if sec_state == "rejected" or prim_state == "rejected":
                    prim_task["state"] = "rejected"
                else:
                    state_order = {"pending": 0, "executing": 1, "review": 2, "accepted": 3}
                    if state_order.get(sec_state, 0) > state_order.get(prim_state, 0):
                        prim_task["state"] = sec_state
                
                # Sync receipt hashes
                if "worker_receipt_sha256" in sec_task:
                    prim_task["worker_receipt_sha256"] = sec_task["worker_receipt_sha256"]
                
                # Append review receipts to support multiple reviewers (Parallel review)
                if "review_receipt_sha256" in sec_task:
                    if "review_receipt_sha256_list" not in prim_task:
                        prim_task["review_receipt_sha256_list"] = []
                        if "review_receipt_sha256" in prim_task:
                            prim_task["review_receipt_sha256_list"].append(prim_task["review_receipt_sha256"])
                    if sec_task["review_receipt_sha256"] not in prim_task["review_receipt_sha256_list"]:
                        prim_task["review_receipt_sha256_list"].append(sec_task["review_receipt_sha256"])
                    prim_task["review_receipt_sha256"] = sec_task["review_receipt_sha256"] # Keep latest for backwards compat
                if "validator_attestation_sha256" in sec_task:
                    prim_task["validator_attestation_sha256"] = sec_task["validator_attestation_sha256"]
    save(primary_path, primary)
    return 0

def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init"); init.add_argument("--root", required=True); init.add_argument("--handoff", required=True); init.add_argument("--output", required=True); init.set_defaults(handler=command_init)
    preflight = sub.add_parser("preflight"); preflight.add_argument("--root", required=True); preflight.add_argument("--contract", required=True); preflight.add_argument("--output", required=True); preflight.set_defaults(handler=command_preflight)
    start = sub.add_parser("start"); start.add_argument("--root", required=True); start.add_argument("--ledger", required=True); start.add_argument("--contract", required=True); start.add_argument("--worker-actor", required=True); start.add_argument("--model-binding", required=True); start.add_argument("--output-lease", required=True); start.add_argument("--output-working-set", required=True); start.set_defaults(handler=command_start)
    collect = sub.add_parser("collect"); collect.add_argument("--root", required=True); collect.add_argument("--ledger", required=True); collect.add_argument("--contract", required=True); collect.add_argument("--lease", required=True); collect.add_argument("--worker-actor", required=True); collect.add_argument("--output", required=True); collect.set_defaults(handler=command_collect)
    review = sub.add_parser("review"); review.add_argument("--ledger", required=True); review.add_argument("--contract", required=True); review.add_argument("--worker-receipt", required=True); review.add_argument("--review", required=True); review.add_argument("--reviewer-binding", required=True); review.set_defaults(handler=command_review)
    accept = sub.add_parser("accept"); accept.add_argument("--root", required=True); accept.add_argument("--ledger", required=True); accept.add_argument("--contract", required=True); accept.add_argument("--worker-receipt", required=True); accept.add_argument("--review", required=True, nargs="+"); accept.add_argument("--attestation", required=True); accept.add_argument("--attestation-signature", required=True); accept.set_defaults(handler=command_accept)
    merge = sub.add_parser("merge"); merge.add_argument("--primary-ledger", required=True); merge.add_argument("--secondary-ledgers", nargs="+", required=True); merge.set_defaults(handler=command_merge)
    gate = sub.add_parser("story-gate"); gate.add_argument("--root", required=True); gate.add_argument("--ledger", required=True); gate.add_argument("--handoff", required=True); gate.add_argument("--attestation", required=True); gate.add_argument("--attestation-signature", required=True); gate.add_argument("--output", required=True); gate.set_defaults(handler=command_story_gate)
    args = parser.parse_args()
    try:
        return args.handler(args)
    except (ContractError, OSError, ValueError, json.JSONDecodeError, yaml.YAMLError) as exc:
        print(f"TASK RUNNER BLOCKED: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
