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
Tool Script: Socratic Drill-Down (Adapter)
Outputs a Zero-Trust JSON mechanical receipt.
Reads the target markdown file (Epic or Story) to perform a deterministic ambiguity scan.
"""
import sys
import json
import argparse
import uuid
import glob
import os
import re
from datetime import datetime, timezone

def find_target_file(target_id):
    matches = glob.glob(f"_iwish-output/**/{target_id}/epic.md", recursive=True)
    if not matches:
        matches = glob.glob(f"_iwish-output/**/{target_id}.md", recursive=True)
    if matches:
        return matches[0]
    return None

def analyze_ambiguity(content, target_id):
    findings = []
    
    # Check for vague success measures or objectives
    vague_terms = ["fast", "seamless", "easy", "robust", "scalable", "user-friendly"]
    lines = content.split('\n')
    
    in_success_section = False
    for idx, line in enumerate(lines):
        if line.startswith('## Success measures') or line.startswith('## Success Criteria'):
            in_success_section = True
            continue
        elif line.startswith('## '):
            in_success_section = False
            
        if in_success_section and line.strip().startswith('-'):
            for term in vague_terms:
                if term in line.lower():
                    findings.append({
                        "id": f"SD-{target_id}-{idx}",
                        "description": f"Socratic Drill: Vague, non-falsifiable success criteria detected using term '{term}': {line.strip()}",
                        "severity": "medium",
                        "quadrant": "unknown-known"
                    })
                    
    # Check for empty tables
    if re.search(r'\|\s*---\s*\|\s*---\s*\|\n\s*\n', content):
        findings.append({
            "id": f"SD-{target_id}-EMPTY-TABLE",
            "description": "Socratic Drill: Found empty or incomplete tables that suggest missing detail.",
            "severity": "medium",
            "quadrant": "unknown-known"
        })

    return findings

def main():
    parser = argparse.ArgumentParser(description="Socratic Drill-Down Adapter")
    parser.add_argument('--target', type=str, help='Target epic or feature', default='unknown')
    parser.add_argument('--output', type=str, help='Output path for JSON receipt')
    args, unknown = parser.parse_known_args()

    findings = []
    coverage = 0.0
    
    target_file = find_target_file(args.target)
    if target_file and os.path.exists(target_file):
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        findings = analyze_ambiguity(content, args.target)
        coverage = 1.0
    else:
        findings.append({
            "id": f"SD-{args.target}-ERR",
            "description": f"Failed to locate markdown source for target {args.target}",
            "severity": "critical",
            "quadrant": "unknown-known"
        })

    receipt = {
        "tool_id": "uip-socratic-drill",
        "execution_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "target": args.target,
        "status": "VERIFIED" if coverage > 0 else "FAILED",
        "coverage": coverage,
        "findings": findings
    }
    
    if args.output:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(receipt, f, indent=2)
        print(f"Receipt written to {args.output}")
    else:
        print(json.dumps(receipt, indent=2))

if __name__ == "__main__":
    main()
