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
    import sys
    print("❌ [Zero-Trust] CRITICAL: watchmen_core.py is missing or hijacked!")
    sys.exit(1)
# ---------------------------------
from watchmen_client import call_daemon, sign_evidence, verify_evidence

import os
import json
import uuid
import socket
import hashlib

SESSION_ID = os.environ.get("PIPELINE_SESSION_ID", str(uuid.uuid4()))

def main():
    json_path = "_iwish-output/3. Development/1. Epic & Story/FG-01-Platform-Foundation-Connectors/Epic-01/Story-01.10/traceability.json"
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    sig = sign_evidence(data)
    with open(json_path + ".sig", 'w') as f:
        f.write(sig)
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)

    print("Signed successfully.")

if __name__ == "__main__":
    main()
