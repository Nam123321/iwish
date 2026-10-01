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
Tool Script: Assumption Mapping (Adapter)
Outputs a Zero-Trust JSON mechanical receipt.
Reads the target markdown file (Epic or Story) to perform a deterministic assumption scan.
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

def analyze_assumptions(content, target_id):
    findings = []
    
    # Simple semantic heuristics for unstated assumptions
    assumption_keywords = ["assume", "assuming", "expected to", "should automatically", "will rely on"]
    lines = content.split('\n')
    
    for idx, line in enumerate(lines):
        for keyword in assumption_keywords:
            if keyword in line.lower():
                findings.append({
                    "id": f"AM-{target_id}-{idx}",
                    "description": f"Detected implicit assumption '{keyword}' at line {idx + 1}: {line.strip()}",
                    "severity": "medium",
                    "quadrant": "known-unknown",
                    "importance": "high" if "rely" in keyword or "expect" in keyword else "medium",
                    "evidence": "low"
                })
    
    # If no explicit risk/assumptions section
    if '## Risks' not in content and '## Assumptions' not in content:
        findings.append({
            "id": f"AM-{target_id}-NO-SEC",
            "description": "Missing explicit Risks or Assumptions section in specification.",
            "severity": "high",
            "quadrant": "unknown-known",
            "importance": "high",
            "evidence": "none"
        })
        
    return findings

def main():
    parser = argparse.ArgumentParser(description="Assumption Mapping Adapter")
    parser.add_argument('--target', type=str, help='Target epic or feature', default='unknown')
    parser.add_argument('--output', type=str, help='Output path for JSON receipt')
    args, unknown = parser.parse_known_args()

    findings = []
    coverage = 0.0
    
    target_file = find_target_file(args.target)
    if target_file and os.path.exists(target_file):
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        findings = analyze_assumptions(content, args.target)
        coverage = 1.0
    else:
        findings.append({
            "id": f"AM-{args.target}-ERR",
            "description": f"Failed to locate markdown source for target {args.target}",
            "severity": "critical",
            "quadrant": "known-unknown",
            "importance": "high",
            "evidence": "none"
        })

    receipt = {
        "tool_id": "uip-assumption-map",
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
