#!/usr/bin/env python3
# --- [Watchmen Core Injection] ---
import os, sys
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------
"""
Category A Deterministic Staleness Auditor for Curriculum Sandbox.
Enforces freshness thresholds, clocks-kew defense, and missing directory alerts.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import uuid
import time
from pathlib import Path

DEFAULT_SANDBOX = Path(os.path.expanduser("~/.iwish/sandbox/ai-engineering-from-scratch")).resolve()


def get_sync_timestamp(sandbox: Path) -> tuple[float, str]:
    fetch_head = sandbox / ".git" / "FETCH_HEAD"
    if fetch_head.exists():
        return fetch_head.stat().st_mtime, "FETCH_HEAD"

    git_index = sandbox / ".git" / "index"
    if git_index.exists():
        return git_index.stat().st_mtime, "GIT_INDEX"

    git_head = sandbox / ".git" / "HEAD"
    if git_head.exists():
        return git_head.stat().st_mtime, "GIT_HEAD"

    try:
        res = subprocess.run(
            ["git", "-C", str(sandbox), "log", "-1", "--format=%ct"],
            capture_output=True, text=True, check=True
        )
        ts = float(res.stdout.strip())
        return ts, "GIT_COMMIT"
    except Exception:
        pass

    return sandbox.stat().st_mtime, "DIR_MTIME"


def audit_staleness(sandbox: Path, warn_days: float = 7.0, block_days: float = 30.0) -> dict:
    if not sandbox.exists() or not sandbox.is_dir():
        return {
            "status": "BLOCK",
            "exit_code": 1,
            "reason": f"Sandbox directory does not exist: {sandbox}",
            "action": "Run clone or bootstrap script first."
        }

    now = time.time()
    sync_ts, source = get_sync_timestamp(sandbox)

    # Clock Skew Defense: Reject future timestamps (> now + 300s)
    if sync_ts > now + 300:
        return {
            "status": "BLOCK",
            "exit_code": 1,
            "reason": f"Clock Skew detected: timestamp {sync_ts} is in the future relative to now {now}",
            "action": "Verify system time or NTP sync."
        }

    age_seconds = max(0.0, now - sync_ts)
    age_days = age_seconds / 86400.0

    report = {
        "sandbox_path": str(sandbox),
        "timestamp_source": source,
        "sync_timestamp": sync_ts,
        "age_seconds": round(age_seconds, 2),
        "age_days": round(age_days, 2),
        "warn_threshold_days": warn_days,
        "block_threshold_days": block_days
    }

    if age_days > block_days:
        report.update({
            "status": "BLOCK",
            "exit_code": 1,
            "warning": f"CRITICAL: Sandbox data is {round(age_days, 1)} days old (> {block_days} days). Sync is required before execution."
        })
    elif age_days > warn_days:
        report.update({
            "status": "WARN",
            "exit_code": 0,
            "warning": f"⚠️ Data may be stale: Sandbox was last synced {round(age_days, 1)} days ago (> {warn_days} days)."
        })
    else:
        report.update({
            "status": "FRESH",
            "exit_code": 0,
            "message": f"Sandbox is fresh ({round(age_days, 1)} days old)."
        })

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Sandbox Staleness")
    parser.add_argument("--sandbox", help="Path to sandbox repo")
    parser.add_argument("--warn-days", type=float, default=7.0, help="Warn threshold in days (default: 7)")
    parser.add_argument("--block-days", type=float, default=30.0, help="Block threshold in days (default: 30)")
    parser.add_argument("--output", help="Write JSON output to file")
    args = parser.parse_args()

    sandbox = Path(args.sandbox).expanduser().resolve() if args.sandbox else DEFAULT_SANDBOX
    report = audit_staleness(sandbox, warn_days=args.warn_days, block_days=args.block_days)
    output_str = json.dumps(report, indent=2)

    if args.output:
        Path(args.output).write_text(output_str, encoding="utf-8")

    print(output_str)
    if report.get("warning"):
        print(json.dumps({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": "ERROR",
        "service": "audit-staleness",
        "correlationId": str(uuid.uuid4()),
        "message": f"[STALENESS-GATE] {report['warning']}"
    }), flush=True)

    return report.get("exit_code", 0)


if __name__ == "__main__":
    sys.exit(main())
