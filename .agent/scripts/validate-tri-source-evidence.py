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
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import argparse
import json
import re
import glob

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

def verify_trace_log_provenance(conversation_id):
    """Reads the Gemini agent's physical transcript log to ensure the MCP tool was actually called, preventing AI fabrication."""
    if not conversation_id or not re.match(r"^[a-zA-Z0-9-]+$", conversation_id):
        print("⚠️ [WARNING] No conversation ID provided, falling back to legacy provenance (insecure).")
        return False

    try:
        brain_dir = os.path.expanduser('~/.gemini/antigravity/brain')
        log_file = os.path.join(brain_dir, conversation_id, '.system_generated', 'logs', 'transcript.jsonl')
        
        if not os.path.exists(log_file):
            print(f"❌ [ZERO-TRUST GATE FAIL] Transcript log not found for conversation {conversation_id}.")
            return False # Fail-Closed
            
        # We look for proof that notebooklm-mcp was explicitly called in the tool_calls trace
        # by properly parsing the JSON lines to avoid string match hallucination
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    step = json.loads(line)
                    if step.get("type") == "PLANNER_RESPONSE":
                        tool_calls = step.get("tool_calls", [])
                        for tc in tool_calls:
                            if tc.get("name") == "call_mcp_tool":
                                args = tc.get("arguments", {})
                                if args.get("ServerName") == "notebooklm-mcp" and args.get("ToolName") == "notebook_query":
                                    return True
                except json.JSONDecodeError:
                    continue
        return False
    except Exception as e:
        print(f"⚠️ [WARNING] Could not parse transcript log for provenance: {e}")
        return False # Fail-Closed

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Tri-Source RAG Validator")
    parser.add_argument('--file', required=True, help="Path to the evidence JSON file")
    parser.add_argument('--conversation-id', required=False, help="The current agent conversation ID to verify provenance")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"❌ [ZERO-TRUST GATE FAIL] Evidence file not found: {args.file}")
        sys.exit(1)

    try:
        with open(args.file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ [ZERO-TRUST GATE FAIL] Could not parse JSON evidence: {e}")
        sys.exit(1)
        
    sanitize_json_payload(data)
    
    with open(args.file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    required_keys = ['source_a_topology', 'source_b_notebook', 'source_c_reality']
    missing = []
    
    for key in required_keys:
        val = data.get(key)
        if not val or len(str(val).strip()) < 50:
            missing.append(key)

    source_c = data.get('source_c_reality', '')
    if not source_c or len(str(source_c).strip()) < 10:
        print("⚠️ [WARNING] Source C (Reality) is empty or very short. Passing due to potential Greenfield project.")

    if missing:
        print(f"❌ [ZERO-TRUST GATE FAIL] Agent skipped Mandatory Retrieval! Missing or insufficient evidence for: {', '.join(missing)}")
        sys.exit(1)

    # ZERO-TRUST AI FABRICATION GATE
    if not verify_trace_log_provenance(args.conversation_id):
        print(f"❌ [ZERO-TRUST GATE FAIL] PROVENANCE ALERT: The agent fabricated the JSON evidence! No physical trace of 'notebook_query' found in the agent's MCP execution logs.")
        sys.exit(1)

    print("✅ [ZERO-TRUST GATE PASS] Tri-Source Evidence Verified (Sanitized & Provenance Checked).")
    print("Agent is authorized to generate the Cross-Validation Matrix and Archify HTML.")
    sys.exit(0)

if __name__ == '__main__':
    main()
