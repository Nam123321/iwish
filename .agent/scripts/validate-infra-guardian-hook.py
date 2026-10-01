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

import os
import sys
import json

def main():
    transcript_path = "_iwish-output/adhoc-workspace/scratch/debate-transcript.md"
    infra_evidence_path = "_iwish-output/adhoc-workspace/scratch/infra-drift-evidence.json"
    
    # If no debate transcript exists, there's nothing to validate
    if not os.path.exists(transcript_path):
        print(f"Skipping: {transcript_path} not found.")
        sys.exit(0)
        
    with open(transcript_path, 'r', encoding='utf-8') as f:
        content = f.read().lower()
        
    # Keywords that imply architectural or infrastructure decisions
    infra_keywords = ['architecture', 'infrastructure', 'database', 'middleware', 'security strategy', 'pipeline', 'deployment', 'pii']
    
    requires_infra_check = any(keyword in content for keyword in infra_keywords)
    
    if requires_infra_check:
        if not os.path.exists(infra_evidence_path):
            print(f"ZERO-TRUST BLOCK: Architectural decisions detected in {transcript_path} but {infra_evidence_path} is missing.")
            print("You MUST explicitly load and execute `.agent/skills/infrastructure-sync-guardian/SKILL.md` to evaluate drift before completing the workflow.")
            sys.exit(1)
        else:
            print("Zero-Trust Check Passed: Infra drift evidence found.")
            
    else:
        print("Zero-Trust Check Passed: No major architectural keywords detected in debate.")

    sys.exit(0)

if __name__ == "__main__":
    main()
