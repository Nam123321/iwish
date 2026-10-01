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

import json
import hashlib
import sys
import socket

def main():
    json_path = sys.argv[1]
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    data.pop("nonce", None)
        
    res = call_daemon("request_nonce")
    nonce = res.get("nonce", "mock-nonce")
    
    payload_str = json.dumps(data, sort_keys=True)
    digest = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
    
    data["nonce"] = nonce
    
    res_sign = call_daemon("sign_payload", {"nonce": nonce, "digest": digest})
    signature = res_sign.get("signature")
    
    if not signature:
        print("Failed to get signature")
        sys.exit(1)
        
    # Write back the data with nonce
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    sig_path = json_path + ".sig"
    with open(sig_path, 'w') as f:
        f.write(signature)
        
    print(f"Signed successfully. Signature written to {sig_path}")

if __name__ == '__main__':
    main()
