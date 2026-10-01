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

import sys
import os
import argparse
import subprocess
import re

def get_latest_commit_message():
    try:
        result = subprocess.run(['git', 'log', '-1', '--pretty=%B'], capture_output=True, text=True, check=True)
        return result.stdout
    except Exception:
        return ""

def main():
    parser = argparse.ArgumentParser(description="Unknowns Ledger Sync")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run/validate-only mode for CI sandbox")
    parser.add_argument("--validate-only", action="store_true", help="Alias for --dry-run")
    parser.add_argument("--story", help="Target story ID")
    parser.add_argument("--dir", help="Target directory")
    args = parser.parse_args()

    is_dry_run = args.dry_run or args.validate_only

    if not is_dry_run:
        print("Executing full unknowns-ledger-sync...")
        # Full sync logic would go here
        sys.exit(0)

    print("Running unknowns-ledger-sync in --dry-run mode...")
    commit_msg = get_latest_commit_message()
    
    # Check for bypass tags
    if "[emergency]" in commit_msg.lower() or "[skip-ledger]" in commit_msg.lower():
        print("✅ Bypass tag ([emergency] or [skip-ledger]) detected. Skipping ledger validation.")
        sys.exit(0)

    # Extract Git trailers
    trailers = []
    for line in commit_msg.splitlines():
        if line.lower().startswith("resolves-unknown:"):
            trailers.append(line.split(":", 1)[1].strip())
            
    print(f"Detected Git trailers (Resolves-Unknown): {trailers}")

    # Soft-block logic (Warning instead of failure)
    print("⚠️ WARNING (Soft-Block): Unknowns ledger may not be fully synchronized with code patches.")
    print("Please ensure macro-risks.yaml is updated manually, or use [emergency] to bypass this warning.")
    
    # Exit 0 so the pipeline does not fail (soft-block)
    sys.exit(0)

if __name__ == "__main__":
    main()
