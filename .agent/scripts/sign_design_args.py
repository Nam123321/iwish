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

import sys
import os
import json
import hashlib
import unicodedata
import base64
import socket

def get_file_hash(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    normalized = content.replace('\r\n', '\n').strip()
    normalized = unicodedata.normalize('NFC', normalized)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


story_id = sys.argv[1]
story_dir = sys.argv[2]
ui_spec_path = os.path.join(story_dir, "ui-spec.md")
preview_path = os.path.join(story_dir, "preview.html")

ui_hash = get_file_hash(ui_spec_path)
preview_hash = get_file_hash(preview_path)

approval_json = {
    "status": "approved",
    "ui_spec_hash": ui_hash,
    "preview_html_hash": preview_hash
}
with open(os.path.join(story_dir, "design-approval.json"), "w") as f:
    json.dump(approval_json, f, indent=2)

payload_str = f"{story_id}:{ui_hash}"
payload_digest = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
sig_hex = sign_evidence(payload_digest)

sig_json = {
    "story_id": story_id,
    "signature": sig_hex
}

with open(os.path.join(story_dir, "design-approval.json.sig"), "w") as f:
    json.dump(sig_json, f, indent=2)

print("Generated design approval successfully.")
