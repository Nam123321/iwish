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
import subprocess

stories = ["17.1", "17.4", "17.5", "17.6", "17.7", "17.9", "17.10"]

def run_cmd(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"FAILED: {cmd}\n{res.stdout}\n{res.stderr}")
        return False
    else:
        print(f"SUCCESS: {cmd}")
        return True

for s in stories:
    print(f"--- Checking pipeline integrity for Story {s} ---")
    
    # Run pipeline integrity phases
    for phase in ["pre-code", "post-code", "review", "delivery"]:
        cmd = f"python3 .agent/scripts/pipeline-integrity-runner.py --target \"{s}\" --type story --phase {phase}"
        if not run_cmd(cmd):
            print(f"Pipeline failed for {s} at {phase}")
            sys.exit(1)
    
    # Finally, ecc-gate
    cmd = f"python3 .agent/scripts/ecc-gate.py --story \"{s}\""
    if not run_cmd(cmd):
        print(f"ecc-gate failed for {s}")
        sys.exit(1)

print("ALL PASSED")
