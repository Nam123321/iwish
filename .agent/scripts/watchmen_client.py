import sys
import os
import socket
import json

# ZTIV: Bắt buộc xác thực TCB chính nó
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    print("❌ [Zero-Trust] CRITICAL: watchmen_core.py is missing or hijacked!")
    sys.exit(1)

import watchmen_policy

def call_daemon(action, kwargs=None):
    if watchmen_policy.OFFLINE_MODE:
        if action == "request_nonce": return {"nonce": "mock_nonce"}
        if action == "sign_payload": return {"signature": "mock_sig"}
        if action == "verify_and_consume": return {"success": True}
        return {"error": "Offline mode activated"}

    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    client.settimeout(5.0)
    try:
        client.connect("/tmp/watchmen.sock")
        
        # Ngăn chặn kwargs ghi đè các trường bảo mật cốt lõi
        req = kwargs.copy() if kwargs else {}
        req["action"] = action
        req["token"] = os.environ.get("WATCHMEN_TOKEN", "DEFAULT_TOKEN")
        
        client.sendall(json.dumps(req).encode('utf-8') + b'\n')
        
        sock_file = client.makefile('r', encoding='utf-8')
        response_data = sock_file.readline()
        if not response_data:
            return {"error": "Empty response from Watchmen Daemon"}
        return json.loads(response_data.strip())
    except socket.timeout:
        return {"error": "Watchmen Daemon connection timed out (Daemon might be hung)"}
    except Exception as e:
        return {"error": f"Watchmen Daemon connection failed: {str(e)}"}
    finally:
        client.close()

def sign_evidence(data):
    res = call_daemon("sign_payload", {"payload": data})
    if "error" in res: sys.exit(f"Security/Daemon Error (sign): {res['error']}")
    return res.get("signature")

def verify_evidence(data, signature):
    if "nonce" not in data: return False
    res = call_daemon("verify_and_consume", {"payload": data, "signature": signature})
    if "error" in res: sys.exit(f"Security/Daemon Error (verify): {res['error']}")
    return res.get("success", False)
