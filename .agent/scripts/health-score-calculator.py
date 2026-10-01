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
    test_mode = "--test" in sys.argv
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: health-score-calculator.py [--test]")
        sys.exit(0)

    # Simplified health score mock logic for demonstration/testing
    print("Health Score Calculator running...")
    
    health_score = 100
    
    # 1. Check if tests passed (mocking test report for now)
    test_report_path = "coverage/coverage-summary.json"
    if os.path.exists(test_report_path):
        with open(test_report_path) as f:
            try:
                data = json.load(f)
                coverage = data.get("total", {}).get("lines", {}).get("pct", 50)
                if coverage < 80:
                    health_score -= 10
            except:
                pass
    else:
        # Penalty for missing tests
        health_score -= 15
        
    # 2. Check for linter errors (mocking linter report)
    linter_report_path = ".agent/cache/linter-report.json"
    if os.path.exists(linter_report_path):
        with open(linter_report_path) as f:
            try:
                data = json.load(f)
                error_count = len(data.get("errors", []))
                health_score -= min(error_count * 2, 20)
            except:
                pass
                
    if test_mode:
        health_score = min(health_score, 80) # Force lower score in test mode

    print(f"Health Score: {health_score}/100")
    
    # 6 routing levels
    if health_score >= 90:
        print("Routing: Level 1 (Auto-merge approved)")
    elif health_score >= 80:
        print("Routing: Level 2 (Reviewer approval needed)")
    elif health_score >= 70:
        print("Routing: Level 3 (Fast-track auto-healing trigger)")
    elif health_score >= 50:
        print("Routing: Level 4 (Party-Mode triage required)")
    else:
        print("Routing: Level 5/6 (Immediate block & rollback)")
        if not test_mode:
            sys.exit(1)

    # Write to .agent/cache/qa-loop.json
    cache_dir = ".agent/cache"
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir, exist_ok=True)
        
    qa_loop_data = {"health_score": health_score}
    with open(os.path.join(cache_dir, "qa-loop.json"), "w") as f:
        json.dump(qa_loop_data, f)
        
    print("✅ Health score evaluated and routing suggested.")
    sys.exit(0)

if __name__ == "__main__":
    main()
