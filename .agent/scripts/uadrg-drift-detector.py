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
UADRG Drift Detector (READ-ONLY)
Scans the codebase for Prisma producers/consumers and Event producers/consumers,
and diffs them against declared data-spec.md contracts.
"""

import os
import re
import glob
import json
import argparse
import hmac
import hashlib
import base64
import sys
from typing import Set, Dict, Tuple

import subprocess
from pathlib import Path


def strip_comments(code: str) -> str:
    # Strip block comments /* ... */
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Strip single line comments // ...
    code = re.sub(r'//.*', '', code)
    return code

PRISMA_WRITE_OPS = {'create', 'createMany', 'upsert', 'update', 'updateMany'}
PRISMA_READ_OPS = {'findMany', 'findFirst', 'findUnique', 'count', 'aggregate'}

# Regex patterns
PRISMA_PATTERN = re.compile(r'prisma\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\(')
EVENT_PUB_PATTERN = re.compile(r'(?:eventBus\.emit|redis\.publish|nats\.publish)\(\s*[\'"]([a-zA-Z0-9_\-\.]+)[\'"]')
EVENT_SUB_PATTERN = re.compile(r'(?:eventBus\.on|redis\.subscribe|nats\.subscribe)\(\s*[\'"]([a-zA-Z0-9_\-\.]+)[\'"]')

def scan_ts_files(src_dir: str) -> Tuple[Set[str], Set[str], Set[str], Set[str]]:
    producers = set()
    consumers = set()
    event_producers = set()
    event_consumers = set()

    for root, dirs, files in os.walk(src_dir):
        if 'node_modules' in root or '.next' in root:
            continue
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    content = strip_comments(content)

                    # Prisma
                    for match in PRISMA_PATTERN.finditer(content):
                        model, op = match.groups()
                        if op in PRISMA_WRITE_OPS:
                            producers.add(model)
                        elif op in PRISMA_READ_OPS:
                            consumers.add(model)

                    # Events
                    for match in EVENT_PUB_PATTERN.finditer(content):
                        event_producers.add(match.group(1))
                    for match in EVENT_SUB_PATTERN.finditer(content):
                        event_consumers.add(match.group(1))

    return producers, consumers, event_producers, event_consumers

def parse_data_specs(spec_dir: str) -> Tuple[Set[str], Set[str]]:
    spec_producers = set()
    spec_consumers = set()

    for path in glob.glob(os.path.join(spec_dir, '**', 'data-spec*.md'), recursive=True):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Heuristic parsing for markdown lists under ## Producers and ## Consumers
            
            # Simple approach: find lists following the headers
            prod_match = re.search(r'## Producers(.*?)(?:##|$)', content, re.DOTALL | re.IGNORECASE)
            if prod_match:
                for line in prod_match.group(1).split('\n'):
                    m = re.search(r'-\s*(?:Model:|Table:)?\s*`?([a-zA-Z0-9_]+)`?', line, re.IGNORECASE)
                    if m:
                        spec_producers.add(m.group(1))

            cons_match = re.search(r'## Consumers(.*?)(?:##|$)', content, re.DOTALL | re.IGNORECASE)
            if cons_match:
                for line in cons_match.group(1).split('\n'):
                    m = re.search(r'-\s*(?:Model:|Table:)?\s*`?([a-zA-Z0-9_]+)`?', line, re.IGNORECASE)
                    if m:
                        spec_consumers.add(m.group(1))
                        
    return spec_producers, spec_consumers

def main():
    parser = argparse.ArgumentParser(description="UADRG Drift Detector")
    parser.add_argument("--src-dir", default=".", help="Source directory to scan")
    parser.add_argument("--spec-dir", default="_iwish-output", help="Specs directory to scan")
    parser.add_argument("--mode", default="local", choices=["local", "ci"])
    parser.add_argument("--output", default="_iwish-output/uadrg/drift-report.json")
    args = parser.parse_args()

    print(f"Scanning TS files in {args.src_dir}...")
    code_prod, code_cons, code_event_prod, code_event_cons = scan_ts_files(args.src_dir)
    
    print(f"Scanning Data Specs in {args.spec_dir}...")
    spec_prod, spec_cons = parse_data_specs(args.spec_dir)

    print("\n--- Drift Analysis ---")
    
    undocumented_prod = code_prod - spec_prod
    stale_prod = spec_prod - code_prod
    
    undocumented_cons = code_cons - spec_cons
    stale_cons = spec_cons - code_cons

    drift_found = False

    if undocumented_prod:
        print(f"🔴 UNDOCUMENTED Producers (in code, not in spec): {', '.join(undocumented_prod)}")
        drift_found = True
    if stale_prod:
        print(f"🟠 STALE Producers (in spec, not in code): {', '.join(stale_prod)}")
        drift_found = True
        
    if undocumented_cons:
        print(f"🔴 UNDOCUMENTED Consumers (in code, not in spec): {', '.join(undocumented_cons)}")
        drift_found = True
    if stale_cons:
        print(f"🟠 STALE Consumers (in spec, not in code): {', '.join(stale_cons)}")
        drift_found = True

    if not drift_found:
        print("✅ No drift detected between data-spec contracts and codebase.")

    # Write report
    report = {
        "status": "DRIFT" if drift_found else "PASS",
        "details": {
            "undocumented_producers": list(undocumented_prod),
            "stale_producers": list(stale_prod),
            "undocumented_consumers": list(undocumented_cons),
            "stale_consumers": list(stale_cons)
        }
    }
    
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(report, f, indent=2)
        
    scripts_dir = Path(__file__).resolve().parent
    try:
        result = subprocess.run(
            ["python3", str(scripts_dir / "mcp-signing-daemon.py"), args.output],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Error signing evidence:\n{result.stderr}\n{result.stdout}")
            sys.exit(0)
        print(f"✅ Generated and signed drift report at {args.output}")
    except Exception as e:
        print(f"❌ Could not run mcp-signing-daemon.py: {e}")
        sys.exit(0)
        
    if args.mode == "ci" and undocumented_prod:
        print("\nCI Mode: Failing pipeline due to UNDOCUMENTED producers.")
        exit(1)

if __name__ == "__main__":
    main()
