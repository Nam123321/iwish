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

import json
import argparse

def validate_payload(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ CRITICAL: Failed to parse JSON payload - {e}")
        sys.exit(1)

    required_keys = ['query', 'headless']
    for key in required_keys:
        if key not in data:
            print(f"❌ CRITICAL: Missing required key '{key}' in payload.")
            sys.exit(1)

    if not data['query'].strip():
        print(f"❌ CRITICAL: 'query' field cannot be empty.")
        sys.exit(1)

    if not isinstance(data['headless'], bool):
        print(f"❌ CRITICAL: 'headless' must be a boolean.")
        sys.exit(1)

    if 'hybrid_rag_context' in data:
        ctx = data['hybrid_rag_context']
        if 'notebook_id' not in ctx or 'falkordb_graph' not in ctx:
            print(f"❌ CRITICAL: Missing required keys in hybrid_rag_context.")
            sys.exit(1)

    print("✅ Zero-Trust Payload Validated.")
    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Validate JSON Skill Intake Payload')
    parser.add_argument('--file', required=True, help='Path to JSON payload file')
    args = parser.parse_args()
    validate_payload(args.file)
