#!/usr/bin/env python3
"""Determine review execution mode and roles based on platform registry capabilities."""

import argparse
import json
import sys
from pathlib import Path
import yaml


def main() -> int:
    parser = argparse.ArgumentParser(description="Route review execution based on platform capabilities.")
    parser.add_argument("--root", default=".", help="Project root directory")
    parser.add_argument("--platform", required=True, help="Target platform identifier (codex, antigravity, claude-code)")
    parser.add_argument("--risk-tier", choices=["low", "medium", "high", "critical"], required=True, help="Task risk tier")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    registry_file = root / ".agent" / "config" / "pi-code-agent" / "platform-registry.yaml"
    if not registry_file.is_file():
        print(json.dumps({"error": f"platform registry missing: {registry_file}"}), file=sys.stderr)
        return 2

    registry = yaml.safe_load(registry_file.read_text(encoding="utf-8"))
    platform = next((p for p in registry.get("platforms", []) if p.get("id") == args.platform), None)
    if not platform:
        print(json.dumps({"error": f"unknown platform: {args.platform}"}), file=sys.stderr)
        return 2

    caps = platform.get("capabilities", {})
    can_parallel = bool(caps.get("independent_context")) and bool(caps.get("subagents"))
    needs_security = args.risk_tier in ("medium", "high", "critical")
    roles = ["reviewer", "security"] if needs_security else ["reviewer"]
    review_mode = "parallel" if can_parallel and needs_security else "sequential"

    # EC-P13-01: Isolated output namespaces for parallel execution
    output_ledgers = {
        "reviewer": "ledger-reviewer.json",
        "security": "ledger-sec-reviewer.json",
    } if review_mode == "parallel" else {
        "reviewer": "ledger.json",
        "security": "ledger.json",
    }

    result = {
        "platform": args.platform,
        "risk_tier": args.risk_tier,
        "review_mode": review_mode,
        "can_parallel": can_parallel,
        "roles": roles,
        "output_ledgers": output_ledgers,
        "isolation_mandate": "read-only-or-separate-worktrees",
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
