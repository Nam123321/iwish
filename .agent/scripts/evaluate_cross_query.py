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
import json

def evaluate(json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)
        
    weights = {
        'tech_stack': 0.35,
        'architecture': 0.30,
        'requirements': 0.20,
        'design_system': 0.15
    }
    
    score = 0.0
    for dim, weight in weights.items():
        val = data.get('scores', {}).get(dim, 0.0)
        score += val * weight
        
    iron_law_violations = data.get('iron_law_violations', [])
    if iron_law_violations:
        print(f"CONFLICT: Iron Law Violations detected: {iron_law_violations}")
        sys.exit(1)
        
    print(f"Calculated Score: {score:.2f}")
    if score >= 0.8:
        print("VERDICT: COMPATIBLE")
        sys.exit(0)
    elif score >= 0.5:
        print("VERDICT: ADAPTABLE")
        sys.exit(0)
    else:
        print("VERDICT: CONFLICT")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 evaluate_cross_query.py <cross_query_result_json>")
        sys.exit(1)
    evaluate(sys.argv[1])
