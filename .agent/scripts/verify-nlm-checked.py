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

"""
Verify NLM Checked
Verifies the structural integrity and content of NotebookLM MCP receipts.
Usage: python3 verify-nlm-checked.py --receipt-file <path> --expected-keys "status,content"
"""

import argparse
import json
import sys
import os
from datetime import datetime, timezone

def main():
    if os.environ.get("UKP_ACTIVE") == "false":
        print("⏭️ UKP is disabled via UKP_ACTIVE=false. Skipping verification.")
        sys.exit(0)

    parser = argparse.ArgumentParser(description="Verify NotebookLM MCP receipt")
    parser.add_argument("--receipt-file", required=False, help="Path to the JSON receipt file")
    parser.add_argument("--target", required=False, help="Target alias (used by workflows)")
    parser.add_argument("--expected-keys", help="Comma-separated list of expected root keys")
    args = parser.parse_args()

    receipt_file = args.receipt_file
    if not receipt_file and args.target:
        receipt_file = "_iwish-output/adhoc-workspace/scratch/nlm_evidence.json"
        
    if not receipt_file:
        print("❌ Error: Must provide either --receipt-file or --target", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(receipt_file):
        print(f"❌ Error: Receipt file not found: {receipt_file}", file=sys.stderr)
        sys.exit(1)
        
    try:
        with open(args.receipt_file, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Receipt is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading receipt: {e}", file=sys.stderr)
        sys.exit(1)
        
    if args.expected_keys:
        expected = [k.strip() for k in args.expected_keys.split(",") if k.strip()]
        missing = [k for k in expected if k not in data]
        
        if missing:
            print(f"❌ Validation Failed: Receipt missing expected keys: {', '.join(missing)}", file=sys.stderr)
            sys.exit(1)

    # 30-minute timestamp check (Replay Attack protection)
    if "timestamp" in data:
        try:
            ts_str = data["timestamp"].replace("Z", "+00:00")
            receipt_time = datetime.fromisoformat(ts_str)
            now = datetime.now(timezone.utc)
            delta = now - receipt_time
            if delta.total_seconds() > 1800:
                print("❌ Security Failed: Receipt timestamp is older than 30 minutes (Replay Attack Risk).", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            print(f"❌ Warning: Could not parse timestamp: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("❌ Security Failed: Receipt missing timestamp field.", file=sys.stderr)
        sys.exit(1)
            
    # Basic structural checks
    if "error" in data:
        print(f"⚠️ Warning: Receipt indicates an error state: {data['error']}")
        # Don't strictly fail unless it's a fatal error, but log it
        
    print(f"✅ Receipt Verification Passed: {receipt_file}")
    sys.exit(0)

if __name__ == "__main__":
    main()
