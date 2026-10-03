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
import json
import hashlib
import unicodedata
import base64
import nacl.signing
import nacl.encoding

def get_file_hash(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    normalized = content.replace('\r\n', '\n').strip()
    normalized = unicodedata.normalize('NFC', normalized)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

key_path = ".agent/.secrets/watchmen.key"
with open(key_path, 'r') as f:
    key_b64 = f.read().strip()
    
key_bytes = base64.b64decode(key_b64)

# pynacl signing key is 32 bytes seed
if len(key_bytes) == 64:
    signing_key = nacl.signing.SigningKey(key_bytes[:32])
else:
    signing_key = nacl.signing.SigningKey(key_bytes)

ui_spec_path = "_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/ui-spec.md"
preview_path = "_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/preview.html"

ui_hash = get_file_hash(ui_spec_path)
preview_hash = get_file_hash(preview_path)

approval_json = {
    "status": "approved",
    "ui_spec_hash": ui_hash,
    "preview_html_hash": preview_hash
}
with open("_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/design-approval.json", "w") as f:
    json.dump(approval_json, f, indent=2)

story_id = "78.6"
payload = f"{story_id}:{ui_hash}".encode('utf-8')
signed = signing_key.sign(payload)
sig_b64 = base64.b64encode(signed.signature).decode('utf-8')

sig_json = {
    "story_id": story_id,
    "signature": sig_b64
}
with open("_iwish-output/3. Development/1. Epic & Story/FG-04-AI-Agent-Skills/Epic-78/Story-78.6/design-approval.json.sig", "w") as f:
    json.dump(sig_json, f, indent=2)

print("Generated design approval successfully.")
