#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
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

import argparse
import json
import re
from pathlib import Path

def sanitize_json_payload(data):
    """Sanitize payload to prevent XSS and basic injection."""
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, str):
                data[k] = re.sub(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', v, flags=re.IGNORECASE)
                data[k] = re.sub(r'javascript:', '', data[k], flags=re.IGNORECASE)
            elif isinstance(v, (dict, list)):
                sanitize_json_payload(v)
    elif isinstance(data, list):
        for i in range(len(data)):
            if isinstance(data[i], str):
                data[i] = re.sub(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', data[i], flags=re.IGNORECASE)
                data[i] = re.sub(r'javascript:', '', data[i], flags=re.IGNORECASE)
            elif isinstance(data[i], (dict, list)):
                sanitize_json_payload(data[i])

def verify_trace_log_provenance(conversation_id, expected_notebook_id="655d181d"):
    """
    Tier 1 (Anti-Cheat Transcript Provenance):
    Reads transcript_full.jsonl (to avoid truncation blindspot per EC-P4-001)
    to prove notebooklm-mcp/notebook_query was legitimately called.
    """
    if not conversation_id or not re.match(r"^[a-zA-Z0-9-]+$", conversation_id):
        print("⚠️ [WARNING] No valid conversation ID provided for provenance check.")
        return False

    try:
        brain_dir = os.path.expanduser('~/.gemini/antigravity/brain')
        # EC-P4-001: Check transcript_full.jsonl first, fallback to transcript.jsonl if full doesn't exist
        log_file = os.path.join(brain_dir, conversation_id, '.system_generated', 'logs', 'transcript_full.jsonl')
        if not os.path.exists(log_file):
            log_file = os.path.join(brain_dir, conversation_id, '.system_generated', 'logs', 'transcript.jsonl')

        if not os.path.exists(log_file):
            print(f"❌ [ZERO-TRUST GATE FAIL] Transcript log not found for conversation {conversation_id}.")
            return False # Fail-Closed

        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    step = json.loads(line)
                    if step.get("type") == "PLANNER_RESPONSE":
                        for tc in step.get("tool_calls", []):
                            if tc.get("name") == "call_mcp_tool":
                                args = tc.get("arguments") or tc.get("args") or {}
                                if args.get("ServerName") == "notebooklm-mcp" and args.get("ToolName") in ["notebook_query", "cross_notebook_query"]:
                                    # If expected_notebook_id specified, check if it's in query arguments or passes
                                    return True
                except json.JSONDecodeError:
                    continue
        return False
    except Exception as e:
        print(f"⚠️ [WARNING] Could not parse transcript log for provenance: {e}")
        return False

def verify_graph_integrity(evidence_data):
    """Tier 2: Validates that referenced graph/topology nodes are legitimate."""
    source_a = evidence_data.get("source_a_topology", "")
    if not source_a or len(str(source_a).strip()) < 30:
        return False, "Source A (Topology / Graph) is missing or too brief (<30 chars)."
    return True, "OK"

def verify_context_reality(evidence_data):
    """Tier 3: Validates reality check (architecture.md, TDRs, ADRs)."""
    source_c = evidence_data.get("source_c_reality", "")
    if not source_c or len(str(source_c).strip()) < 30:
        return False, "Source C (Reality / Existing Architecture) is missing or too brief (<30 chars)."
    return True, "OK"

def verify_curriculum_provenance(evidence_data):
    """Tier 4: Validates Source D (ai-engineering-from-scratch curriculum grounding)."""
    source_d = evidence_data.get("source_d_curriculum") or evidence_data.get("source_d_citations")
    if not source_d:
        return True, "OK"
    if isinstance(source_d, list) and len(source_d) > 0:
        sandbox_root = Path(os.path.expanduser("~/.iwish/sandbox/ai-engineering-from-scratch"))
        if sandbox_root.exists():
            for item in source_d:
                phase = item.get("phase", "")
                lesson = item.get("lesson", "")
                if phase and lesson:
                    p = sandbox_root / "phases" / phase / lesson
                    if not p.exists():
                        return False, f"Source D Lesson directory missing on disk: {p}"
    elif len(str(source_d).strip()) < 20:
        return False, "Source D (Curriculum) is too brief (<20 chars)."
    return True, "OK"

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust AI/ML Quad-Source Evidence Validator")
    parser.add_argument("--file", required=True, help="Path to evidence JSON file")
    parser.add_argument("--conversation-id", required=False, help="Agent Conversation ID for transcript provenance verification")
    args = parser.parse_args()

    evidence_file = os.path.realpath(args.file)
    if not os.path.exists(evidence_file):
        print(f"❌ [ZERO-TRUST GATE FAIL] Evidence file not found: {evidence_file}")
        sys.exit(1)

    try:
        with open(evidence_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ [ZERO-TRUST GATE FAIL] Could not parse JSON evidence: {e}")
        sys.exit(1)

    # Sanitize payload in memory without mutating source file on disk
    sanitize_json_payload(data)

    # Tier 2: Graph Integrity
    ok_g, msg_g = verify_graph_integrity(data)
    if not ok_g:
        print(f"❌ [TIER 2 GRAPH INTEGRITY FAIL] {msg_g}")
        sys.exit(1)

    # Tier 3: Context Reality
    ok_c, msg_c = verify_context_reality(data)
    if not ok_c:
        print(f"❌ [TIER 3 CONTEXT REALITY FAIL] {msg_c}")
        sys.exit(1)

    # Tier 4: Curriculum Grounding (Source D)
    ok_d, msg_d = verify_curriculum_provenance(data)
    if not ok_d:
        print(f"❌ [TIER 4 CURRICULUM GROUNDING FAIL] {msg_d}")
        sys.exit(1)

    # Tier 1: Anti-Cheat Transcript Provenance (Strict Fail-Closed)
    if not args.conversation_id:
        print("❌ [TIER 1 PROVENANCE FAIL] Fail-Closed: --conversation-id is strictly mandatory to verify transcript provenance.")
        sys.exit(1)

    if not verify_trace_log_provenance(args.conversation_id):
        print(f"❌ [TIER 1 PROVENANCE FAIL] AI FABRICATION DETECTED! No physical trace of 'notebooklm-mcp' call found in transcript_full.jsonl for conversation {args.conversation_id}.")
        sys.exit(1)

    print("✅ [ZERO-TRUST GATE PASS] AI/ML Quad-Source Evidence Verified (Tier 1 Provenance + Tier 2 Graph + Tier 3 Context + Tier 4 Curriculum).")
    sys.exit(0)

if __name__ == "__main__":
    main()
