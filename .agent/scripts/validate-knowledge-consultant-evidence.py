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
Category A Deterministic Evidence Validator for AI Engineering Knowledge Consultant.
Validates:
1. Streaming transcript provenance (zero OOM crash on >50MB JSONL)
2. Dual-Oracle physical execution trace (NotebookLM MCP + Sandbox view_file)
3. Graceful degradation fallback when MCP is unavailable
4. Token budget & file limit circuit breaker
5. Anti-Replay attack (conversation_id & timestamp binding)
6. Cryptographic HMAC validation
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import sys
import time
from pathlib import Path

MAX_FUTURE_SKEW = 300  # 5 minutes
DEFAULT_TTL = 3600     # 1 hour


def get_transcript_path(conversation_id: str) -> Path | None:
    brain_dir = Path(os.path.expanduser("~/.gemini/antigravity/brain")) / conversation_id / ".system_generated" / "logs"
    full_path = brain_dir / "transcript_full.jsonl"
    if full_path.exists():
        return full_path
    short_path = brain_dir / "transcript.jsonl"
    if short_path.exists():
        return short_path
    return None

def process_transcript_step(step: dict, sandbox_files_read: list, nlm_mcp_calls: list, mcp_outages: list):
    step_type = step.get("type")
    if step_type == "PLANNER_RESPONSE":
        for tc in step.get("tool_calls", []):
            name = tc.get("name")
            args = tc.get("arguments") or tc.get("args") or {}

            if name == "view_file":
                path_val = args.get("AbsolutePath", "")
                if "ai-engineering-from-scratch" in path_val:
                    sandbox_files_read.append(path_val)

            elif name == "call_mcp_tool":
                server = args.get("ServerName", "")
                tool = args.get("ToolName", "")
                if "notebooklm" in server.lower() or "notebook_query" in tool.lower():
                    nlm_mcp_calls.append({"server": server, "tool": tool})

    elif step_type in ["USER_INPUT", "MODEL"]:
        content = step.get("content", "")
        if "mcp_outage_fallback" in content:
            mcp_outages.append(content[:200])

def scan_transcript_streaming(transcript_path: Path) -> dict:
    """Reads JSONL file line by line without holding full document in memory."""
    sandbox_files_read = []
    nlm_mcp_calls = []
    mcp_outages = []

    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    step = json.loads(line)
                    process_transcript_step(step, sandbox_files_read, nlm_mcp_calls, mcp_outages)
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        return {"error": f"Failed to stream transcript: {e}"}

    return {
        "sandbox_files_read": sandbox_files_read,
        "nlm_mcp_calls": nlm_mcp_calls,
        "mcp_outages": mcp_outages,
        "unique_sandbox_files": sorted(set(sandbox_files_read))
    }

def verify_hmac(payload: dict, signature: str, secret: str) -> bool:
    try:
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        expected = hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False

def check_timing_and_auth(evidence_data: dict, current_cid: str | None, secret: str | None) -> dict | None:
    cid = evidence_data.get("conversation_id", "")
    ts = evidence_data.get("timestamp", 0)
    signature = evidence_data.get("signature")

    if current_cid and cid != current_cid:
        return {"status": "FAIL", "code": "REPLAY_ATTACK_DETECTED", "reason": f"Conversation ID mismatch: evidence={cid}, current={current_cid}"}

    now = time.time()
    if ts > now + MAX_FUTURE_SKEW:
        return {"status": "FAIL", "code": "CLOCK_SKEW_FUTURE", "reason": f"Evidence timestamp {ts} is in the future relative to now {now}"}
    if now - ts > DEFAULT_TTL:
        return {"status": "FAIL", "code": "EVIDENCE_EXPIRED", "reason": f"Evidence is older than {DEFAULT_TTL}s (age: {round(now - ts, 1)}s)"}

    if signature and secret:
        clean_payload = {k: v for k, v in evidence_data.items() if k != "signature"}
        if not verify_hmac(clean_payload, signature, secret):
            return {"status": "FAIL", "code": "INVALID_SIGNATURE", "reason": "HMAC signature mismatch"}
            
    return None

def evaluate_mode_rules(mode: str, scan: dict) -> dict | None:
    sandbox_reads = scan["sandbox_files_read"]
    nlm_calls = scan["nlm_mcp_calls"]
    mcp_outages = scan["mcp_outages"]
    
    if mode == "DUAL-ORACLE":
        if len(sandbox_reads) < 1:
            return {"status": "FAIL", "code": "SOURCE_D_FABRICATED", "reason": "Dual-Oracle mode required physical read to sandbox, but 0 view_file calls were found"}
        if len(nlm_calls) < 1 and len(mcp_outages) < 1:
            return {"status": "FAIL", "code": "DUAL_ORACLE_COLLAPSE", "reason": "Dual-Oracle mode required NotebookLM MCP query, but 0 calls found and no mcp_outage_fallback recorded"}
    elif mode == "CONSULTANT":
        if len(sandbox_reads) < 1:
            return {"status": "FAIL", "code": "CURRICULUM_NOT_READ", "reason": "Consultant mode required at least 1 view_file into curriculum sandbox"}
            
    return None

def validate_evidence(evidence_data: dict, current_cid: str | None = None, secret: str | None = None) -> dict:
    mode = evidence_data.get("mode", "CONSULTANT").upper()
    cid = evidence_data.get("conversation_id", "")

    auth_err = check_timing_and_auth(evidence_data, current_cid, secret)
    if auth_err: return auth_err

    transcript_path = get_transcript_path(cid)
    if not transcript_path:
        return {"status": "FAIL", "code": "TRANSCRIPT_NOT_FOUND", "reason": f"No transcript log found for conversation {cid}"}

    scan = scan_transcript_streaming(transcript_path)
    if "error" in scan:
        return {"status": "FAIL", "code": "TRANSCRIPT_PARSE_ERROR", "reason": scan["error"]}

    rule_err = evaluate_mode_rules(mode, scan)
    if rule_err: return rule_err

    unique_files = scan["unique_sandbox_files"]
    budget_limits = {"PASSIVE": 2, "CONSULTANT": 5, "DUAL-ORACLE": 10}
    max_files = budget_limits.get(mode, 10)
    warnings = []
    if len(unique_files) > max_files:
        warnings.append(f"Token Circuit Breaker: Loaded {len(unique_files)} files (budget is {max_files})")

    return {
        "status": "PASS",
        "mode": mode,
        "conversation_id": cid,
        "verified_sandbox_reads": len(scan["sandbox_files_read"]),
        "unique_curriculum_files": len(unique_files),
        "verified_nlm_calls": len(scan["nlm_mcp_calls"]),
        "degraded_mode_used": len(scan["mcp_outages"]) > 0 and len(scan["nlm_mcp_calls"]) == 0,
        "warnings": warnings,
        "files": unique_files[:5]
    }

def print_log(level: str, msg: str, cid: str):
    print(json.dumps({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": level,
        "service": "validate-evidence",
        "correlationId": cid,
        "message": msg
    }), flush=True)

def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Knowledge Consultant Evidence")
    parser.add_argument("--evidence", required=True, help="Path to evidence JSON")
    parser.add_argument("--conversation-id", help="Current execution conversation ID")
    parser.add_argument("--secret", help="HMAC secret key")
    parser.add_argument("--output", help="Output verification receipt path")
    args = parser.parse_args()

    cid = args.conversation_id or "unknown"
    ev_path = Path(args.evidence).resolve()
    if not ev_path.exists():
        print_log("ERROR", f"❌ FAIL: Evidence file missing: {ev_path}", cid)
        return 1

    try:
        with open(ev_path, "r", encoding="utf-8", errors="replace") as f:
            evidence_data = json.load(f)
    except Exception as e:
        print_log("ERROR", f"❌ FAIL: Could not parse evidence JSON: {e}", cid)
        return 1

    secret = args.secret or os.environ.get("WATCHMEN_SECRET") or os.environ.get("WATCHMEN_TOKEN")
    report = validate_evidence(evidence_data, current_cid=args.conversation_id, secret=secret)
    output_str = json.dumps(report, indent=2)

    if args.output:
        Path(args.output).write_text(output_str, encoding="utf-8")

    print(output_str)
    return 0 if report.get("status") == "PASS" else 1

if __name__ == "__main__":
    sys.exit(main())
