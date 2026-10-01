#!/usr/bin/env python3
"""Reject unsafe contract targets before a native task can write."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", required=True)
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    contract = json.loads(Path(args.contract).read_text(encoding="utf-8"))
    failures = []
    for value in contract.get("target_files", []):
        path = (root / value).resolve()
        try:
            path.relative_to(root)
        except ValueError:
            failures.append({"target": value, "reason": "scope escape"})
            continue
        if value.startswith("_iwish-output/") or value.startswith(".git/"):
            failures.append({"target": value, "reason": "protected artifact scope"})
        if path.exists() and path.is_symlink():
            failures.append({"target": value, "reason": "symlink target requires explicit review"})
    result = {"valid": not failures, "contract": str(Path(args.contract).resolve()), "failures": failures}
    print(json.dumps(result, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
