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

import sys, json, os

def main():
    tags = []
    phases = []
    severities = []
    domains = []
    ledger_path = "_iwish-output/lessons/lessons-ledger.jsonl"

    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == "--tags" and i+1 < len(sys.argv):
            tags = sys.argv[i+1].split(",")
            i += 2
        elif arg == "--phase" and i+1 < len(sys.argv):
            phases = sys.argv[i+1].split(",")
            i += 2
        elif arg == "--severity" and i+1 < len(sys.argv):
            severities = sys.argv[i+1].split(",")
            i += 2
        elif arg == "--domain" and i+1 < len(sys.argv):
            domains = sys.argv[i+1].split(",")
            i += 2
        elif arg == "--ledger" and i+1 < len(sys.argv):
            ledger_path = sys.argv[i+1]
            i += 2
        else:
            i += 1

    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: lookup-lessons.py [--tags <tags>] [--phase <phases>] [--severity <sevs>] [--domain <domains>] [--ledger <path>]")
        sys.exit(0)

    if not os.path.exists(ledger_path):
        print("No lessons ledger found.")
        sys.exit(0)

    results = []
    with open(ledger_path, "r") as f:
        for line in f:
            if not line.strip(): continue
            try:
                entry = json.loads(line)
            except:
                continue
            
            # Filtering logic
            match = True
            if tags and not set(tags).intersection(set(entry.get("tags", []))):
                match = False
            if phases and not set(phases).intersection(set(entry.get("target_phase", []))):
                match = False
            if severities and entry.get("severity") not in severities:
                match = False
            if domains and entry.get("domain") not in domains:
                match = False

            if match:
                results.append(entry)

    if not results:
        print("No matching lessons found.")
    else:
        for r in results:
            sev = str(r.get('severity', 'GUIDELINE')).upper()
            dom = str(r.get('domain', 'GENERAL')).upper()
            rule = r.get('enforcement_rule', r.get('lesson', ''))
            ctx = r.get('context', '')
            print(f"- [{sev}] [{dom}] MANDATORY RULE: {rule} (Context: {ctx})")
            
    sys.exit(0)

if __name__ == "__main__":
    main()
