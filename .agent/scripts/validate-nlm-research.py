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
import argparse

def validate_nlm_research(topic: str):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    
    # Define required paths
    research_file_path = os.path.join(base_dir, '_iwish-output', 'research', f'research-record-{topic}.md')
    push_intent_path = os.path.join(base_dir, '_iwish-output', 'adhoc-workspace', 'scratch', 'ae_push_intent.json')
    post_push_path = os.path.join(base_dir, '_iwish-output', 'adhoc-workspace', 'scratch', 'ae_post_push.json')
    
    missing_files = []
    
    if not os.path.isfile(research_file_path):
        missing_files.append(f'research-record-{topic}.md')
        
    if not os.path.isfile(push_intent_path):
        missing_files.append('ae_push_intent.json')
        
    if not os.path.isfile(post_push_path):
        missing_files.append('ae_post_push.json')
        
    if missing_files:
        print(f"❌ [ZERO-TRUST FAIL] Missing physical evidence files for NLM Research:")
        for f in missing_files:
            print(f"  - {f}")
        print("Agents MUST NOT bypass file generation. Halting workflow.")
        sys.exit(1)
        
    print(f"✅ [ZERO-TRUST PASS] NLM Research integrity verified for topic: {topic}")
    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate physical evidence of /nlm-research workflow.")
    parser.add_argument("--topic", required=True, help="The research topic (used in filename).")
    args = parser.parse_args()
    
    validate_nlm_research(args.topic)
