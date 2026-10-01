#!/usr/bin/env python3
"""Fail closed before tournament execution when isolation cannot be proven."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", *args], cwd=root, text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--candidate-root", action="append", default=[])
    args = parser.parse_args()
    root = Path(args.root).resolve()
    status = git(root, "status", "--porcelain", "--untracked-files=all")
    worktrees = [line.split(" ", 1)[1] for line in git(root, "worktree", "list", "--porcelain").splitlines() if line.startswith("worktree ")]
    candidates = [str(Path(value).resolve()) for value in args.candidate_root]
    failures = []
    if status.strip():
        failures.append("baseline checkout is dirty")
    if len(candidates) != len(set(candidates)):
        failures.append("candidate worktree paths are not unique")
    if candidates and any(value not in worktrees for value in candidates):
        failures.append("candidate path is not registered as a git worktree")
    if len(candidates) > 1 and len(set(candidates)) < 2:
        failures.append("parallel candidates do not have distinct worktrees")
    result = {"valid": not failures, "root": str(root), "registered_worktrees": worktrees, "candidate_roots": candidates, "failures": failures}
    print(json.dumps(result, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
