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
Tool Script: Pre-Mortem Analysis (Adapter)
Outputs a Zero-Trust JSON mechanical receipt.
Reads the target markdown file (Epic or Story) to perform a deterministic risk scan.
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
    # Try finding an Epic file
    matches = glob.glob(f"_iwish-output/**/{target_id}/epic.md", recursive=True)
    if not matches:
        matches = glob.glob(f"_iwish-output/**/{target_id}.md", recursive=True)
    if matches:
        return matches[0]
    return None

def analyze_pre_mortem(content, target_id):
    findings = []
    
    # Heuristic 1: Large number of dependencies
    deps_match = re.search(r'dependencies:\s*\[(.*?)\]', content)
    if deps_match:
        deps = [d.strip() for d in deps_match.group(1).split(',') if d.strip()]
        if len(deps) >= 4:
            findings.append({
                "id": f"PM-{target_id}-01",
                "description": f"Pre-mortem Elephant: High dependency count ({len(deps)}) increases systemic risk of cascading failure.",
                "severity": "high",
                "quadrant": "unknown-unknown",
                "type": "elephant"
            })
            
    # Heuristic 2: Missing Success Measures
    if '## Success measures' not in content and '## Success Criteria' not in content:
        findings.append({
            "id": f"PM-{target_id}-02",
            "description": "Pre-mortem Tiger: Missing measurable success criteria. Project may drift indefinitely without clear exit conditions.",
            "severity": "high",
            "quadrant": "unknown-known",
            "type": "tiger"
        })
        
    return findings

def main():
    parser = argparse.ArgumentParser(description="Pre-Mortem Analysis Adapter")
    parser.add_argument('--target', type=str, help='Target epic or feature', default='unknown')
    parser.add_argument('--output', type=str, help='Output path for JSON receipt')
    args, unknown = parser.parse_known_args()

    findings = []
    coverage = 0.0
    
    target_file = find_target_file(args.target)
    if target_file and os.path.exists(target_file):
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        findings = analyze_pre_mortem(content, args.target)
        coverage = 1.0
    else:
        findings.append({
            "id": f"PM-{args.target}-ERR",
            "description": f"Failed to locate markdown source for target {args.target}",
            "severity": "critical",
            "quadrant": "known-unknown",
            "type": "elephant"
        })

    receipt = {
        "tool_id": "uip-pre-mortem",
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
