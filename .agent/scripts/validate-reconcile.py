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
import time

def check_file_updated_recently(filepath, threshold_minutes=5):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} does not exist.")
        return False
    mtime = os.path.getmtime(filepath)
    now = time.time()
    if (now - mtime) > (threshold_minutes * 60):
        print(f"Error: {filepath} has not been updated in the last {threshold_minutes} minutes.")
        return False
    return True

print("Validating Reconcile-Change Zero-Trust Gates...")

files_to_check = [
    "_iwish-output/3. Development/sprint-status.yaml",
    "_iwish-output/2. Product Planning/2.4. epics-and-stories.md",
    "_iwish-output/3. Development/cross-dependency-index.json"
]

all_passed = True
for f in files_to_check:
    if not check_file_updated_recently(f, 30): # Allow up to 30 mins since reconcile might take time
        all_passed = False

if all_passed:
    print("Zero-Trust Validation: PASSED. All SSOT files updated.")
    sys.exit(0)
else:
    print("Zero-Trust Validation: FAILED. One or more steps were skipped.")
    sys.exit(1)
