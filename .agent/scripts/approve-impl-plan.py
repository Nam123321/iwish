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

import sys
import os
import json
import hashlib
import subprocess
import unicodedata
import base64
import argparse
from pathlib import Path

try:
    import nacl.signing
    import nacl.encoding
except ImportError:
    print("❌ ERROR: pynacl is not installed. Please run `pip install pynacl`.")
    sys.exit(1)

def get_file_hash(filepath):
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(10 * 1024 * 1024)
        normalized = content.replace('\r\n', '\n').replace('\r', '\n').strip()
        normalized = unicodedata.normalize('NFC', normalized)
        return hashlib.sha256(normalized.encode('utf-8')).hexdigest()
    except Exception as e:
        print(f"❌ Error hashing {filepath}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--story_dir", required=True)
    args = parser.parse_args()
    story_dir = Path(args.story_dir)
    
    if not story_dir.exists():
        sys.exit(1)
        
    impl_plan_path = story_dir / "impl-plan.md"
    
    if not impl_plan_path.exists():
        sys.exit(1)

    story_id = story_dir.name.replace("Story-", "").replace("story-", "")
    
    # --- [DUAL-CONDITION GATE: CONDITION 1 - PLAN PROVEN SAFE] ---
    proven_safe_script = Path(__file__).resolve().parent / "validate-plan-proven-safe.py"
    if proven_safe_script.exists():
        proven_res = subprocess.run([sys.executable, str(proven_safe_script), "--file", str(impl_plan_path), "--story-id", story_id, "--story-dir", str(story_dir)], capture_output=True, text=True)
        if proven_res.returncode != 0:
            print(f"❌ CANNOT APPROVE: {impl_plan_path} has NOT passed /plan-proven-safe.")
            print(proven_res.stdout)
            sys.exit(1)
            
    impl_hash = get_file_hash(impl_plan_path)

    key_path = Path(__file__).resolve().parent.parent / ".secrets" / "watchmen.key"
    with open(key_path, 'r') as f:
        key_b64 = f.read().strip()
    key_bytes = base64.b64decode(key_b64)
    signing_key = nacl.signing.SigningKey(key_bytes[:32])

    approval_json = {
        "status": "approved",
        "impl_plan_hash": impl_hash
    }
    
    approval_path = story_dir / "impl-plan-approval.json"
    with open(approval_path, "w", encoding="utf-8") as f:
        json.dump(approval_json, f, indent=2)

    payload = f"{story_id}:{impl_hash}".encode('utf-8')
    signed = signing_key.sign(payload)
    sig_b64 = base64.b64encode(signed.signature).decode('utf-8')

    sig_json = {
        "story_id": story_id,
        "signature": sig_b64
    }
    
    sig_path = story_dir / "impl-plan-approval.json.sig"
    with open(sig_path, "w", encoding="utf-8") as f:
        json.dump(sig_json, f, indent=2)

    print(f"✅ SUCCESS")

if __name__ == "__main__":
    main()
