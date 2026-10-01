#!/usr/bin/env python3
"""Compile one impl-plan task into the bounded native execution contract."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from core import atomic_json_write, compile_catalog, sha256_file


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--impl-plan", required=True)
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--root", default=".")
    parser.add_argument("--output", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--checker-id", action="append", default=[])
    args = parser.parse_args()
    root = Path(args.root).resolve()
    plan_path = Path(args.impl_plan).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    task = next((item for item in plan.get("tasks", []) if item.get("task_id") == args.task_id), None)
    if task is None:
        raise SystemExit(f"task not found: {args.task_id}")
    catalog = compile_catalog(root)
    targets = task.get("target_files")
    if not isinstance(targets, list):
        target = task.get("target") or task.get("target_file")
        targets = [target] if isinstance(target, str) and target else []
    if not targets or any(not isinstance(target, str) or not target for target in targets):
        raise SystemExit("task target_files are required")
    checker_ids = task.get("checker_ids") or args.checker_id
    if not isinstance(checker_ids, list) or not checker_ids or any(not isinstance(value, str) or not value for value in checker_ids):
        raise SystemExit("task checker_ids must be explicitly declared; plan-level test_command is not a task checker")
    contract = {
        "schema_version": "1.0",
        "run_id": args.run_id,
        "task_id": args.task_id,
        "story_id": plan.get("story_id", "unknown-story"),
        "plan_sha256": sha256_file(plan_path),
        "capability_catalog_sha256": catalog["catalog_sha256"],
        "target_files": sorted(set(targets)),
        "checker_ids": sorted(set(checker_ids)),
        "checker_registry_sha256": sha256_file(root / ".agent" / "config" / "pi-code-agent" / "checker-registry.yaml"),
        "validator_public_key_sha256": sha256_file(root / ".agent" / "config" / "watchmen-pub.pem"),
        "risk_tier": task.get("risk_tier", plan.get("risk_tier", "medium")),
        "allowed_tools": ["read", "patch", "diagnostics", "test"],
        "mandatory_edges": ["precondition", "diagnostics", "checker", "review", "validator"],
        "state": "planned",
    }
    atomic_json_write(Path(args.output), contract)
    print(json.dumps(contract, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
