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
Category A Deterministic Validator for Citation Integrity.
Enforces physical existence, anti-path traversal, anti-hardlink,
and routing-index consistency for ai-engineering-from-scratch curriculum citations.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import uuid
from pathlib import Path

DEFAULT_SANDBOX = Path(os.path.expanduser("~/.iwish/sandbox/ai-engineering-from-scratch")).resolve()


def get_sandbox_root(custom_path: str | None = None) -> Path:
    if custom_path:
        root = Path(custom_path).expanduser().resolve()
    else:
        root = DEFAULT_SANDBOX
    if not root.exists() or not root.is_dir():
        print(json.dumps({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": "ERROR",
        "service": "validate-citation",
        "correlationId": str(uuid.uuid4()),
        "message": f"❌ FAIL: Sandbox root does not exist: {root}"
    }), flush=True)
        sys.exit(1)
    return root


def verify_file_path(file_path: Path, sandbox_root: Path) -> tuple[bool, str]:
    """Verify that file exists, is inside sandbox_root, and is not a hardlink."""
    try:
        resolved = file_path.resolve()
    except Exception as e:
        return False, f"Path resolution error: {e}"

    # Anti-Path Traversal Check
    try:
        resolved.relative_to(sandbox_root)
    except ValueError:
        return False, f"Path traversal detected: {resolved} is outside sandbox {sandbox_root}"

    # Physical Existence Check
    if not resolved.exists() or not resolved.is_file():
        return False, f"Physical file missing: {resolved}"

    # Anti-Hardlink Check (st_nlink == 1)
    try:
        st = resolved.stat()
        if st.st_nlink > 1:
            return False, f"Hardlink attack detected: st_nlink={st.st_nlink} > 1 for {resolved}"
    except OSError as e:
        return False, f"Stat error: {e}"

    # Safe Read Verification (Check binary crash resilience)
    try:
        with open(resolved, "r", encoding="utf-8", errors="replace") as f:
            _ = f.read(1024)
    except Exception as e:
        return False, f"Read error: {e}"

    return True, "OK"


def verify_citations(citations: list[dict], sandbox_root: Path) -> dict:
    verified = []
    failed = []

    for item in citations:
        phase = item.get("phase", "")
        lesson = item.get("lesson", "")
        rel_file = item.get("file", "docs/en.md")
        raw_path = item.get("path")

        if raw_path:
            target = (sandbox_root / raw_path).resolve()
        elif phase and lesson:
            target = (sandbox_root / "phases" / phase / lesson / rel_file).resolve()
        elif phase:
            target = (sandbox_root / "phases" / phase / rel_file).resolve()
        else:
            failed.append({"citation": item, "reason": "Missing phase/lesson/path spec"})
            continue

        ok, reason = verify_file_path(target, sandbox_root)
        if ok:
            verified.append({
                "phase": phase,
                "lesson": lesson,
                "file": rel_file,
                "resolved_path": str(target)
            })
        else:
            failed.append({"citation": item, "reason": reason, "attempted_path": str(target)})

    total = len(citations)
    verified_count = len(verified)
    ratio = (verified_count / total) if total > 0 else 0.0

    return {
        "total_citations": total,
        "verified_citations": verified_count,
        "failed_citations": len(failed),
        "ratio": ratio,
        "verified": verified,
        "failed": failed,
        "status": "PASS" if (ratio >= 0.8 and total > 0) else ("FAIL" if total > 0 else "EMPTY")
    }


def verify_routing_index(index_path: Path, sandbox_root: Path) -> dict:
    import yaml
    if not index_path.exists():
        return {"status": "FAIL", "reason": f"Routing index not found: {index_path}"}

    try:
        with open(index_path, "r", encoding="utf-8", errors="replace") as f:
            data = yaml.safe_load(f)
    except Exception as e:
        return {"status": "FAIL", "reason": f"Failed to parse index YAML: {e}"}

    phases = data.get("phases", {})
    results = []
    orphan_count = 0
    total_lessons = 0

    for phase_key, phase_val in phases.items():
        phase_dir = sandbox_root / "phases" / phase_key
        phase_exists = phase_dir.exists() and phase_dir.is_dir()
        lessons = phase_val.get("lessons", [])
        total_lessons += len(lessons)

        for lesson in lessons:
            lesson_dir = phase_dir / lesson
            if not lesson_dir.exists():
                orphan_count += 1
                results.append({"phase": phase_key, "lesson": lesson, "status": "MISSING"})

    orphan_ratio = (orphan_count / total_lessons) if total_lessons > 0 else 0.0
    return {
        "status": "PASS" if orphan_ratio <= 0.1 else "FAIL",
        "total_lessons_indexed": total_lessons,
        "orphan_count": orphan_count,
        "orphan_ratio": orphan_ratio,
        "orphans": results
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Deterministic Citation Integrity Validator")
    parser.add_argument("--sandbox", help="Sandbox root directory")
    parser.add_argument("--evidence", help="Path to evidence JSON file")
    parser.add_argument("--citations", help="JSON array string of citations")
    parser.add_argument("--mode", choices=["citations", "index-check"], default="citations")
    parser.add_argument("--index", help="Path to routing-index.yaml for index-check mode")
    parser.add_argument("--output", help="Write JSON report to file")
    args = parser.parse_args()

    sandbox_root = get_sandbox_root(args.sandbox)

    if args.mode == "index-check":
        if not args.index:
            print(json.dumps({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": "ERROR",
        "service": "validate-citation",
        "correlationId": str(uuid.uuid4()),
        "message": "❌ FAIL: --index required for index-check mode"
    }), flush=True)
            return 1
        report = verify_routing_index(Path(args.index), sandbox_root)
        print(json.dumps(report, indent=2))
        return 0 if report.get("status") == "PASS" else 1

    citations = []
    if args.evidence:
        ev_path = Path(args.evidence).resolve()
        if not ev_path.exists():
            print(json.dumps({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": "ERROR",
        "service": "validate-citation",
        "correlationId": str(uuid.uuid4()),
        "message": f"❌ FAIL: Evidence file missing: {ev_path}"
    }), flush=True)
            return 1
        with open(ev_path, "r", encoding="utf-8", errors="replace") as f:
            ev_data = json.load(f)
            citations = ev_data.get("source_d_citations", [])
    elif args.citations:
        try:
            citations = json.loads(args.citations)
        except json.JSONDecodeError as e:
            print(json.dumps({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": "ERROR",
        "service": "validate-citation",
        "correlationId": str(uuid.uuid4()),
        "message": f"❌ FAIL: Invalid JSON for citations: {e}"
    }), flush=True)
            return 1

    report = verify_citations(citations, sandbox_root)
    output_str = json.dumps(report, indent=2)

    if args.output:
        Path(args.output).write_text(output_str, encoding="utf-8")

    print(output_str)
    return 0 if report.get("status") == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
