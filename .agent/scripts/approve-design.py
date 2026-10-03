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
    """Calculate SHA256 hash of a file matching Watchmen MCP logic"""
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(10 * 1024 * 1024) # 10MB limit
            if f.read(1): # If there's more to read, the file is too large
                raise ValueError("File exceeds 10MB limit")
        # Normalize line endings strictly to prevent cross-platform mismatch
        normalized = content.replace('\r\n', '\n').replace('\r', '\n').strip()
        normalized = unicodedata.normalize('NFC', normalized)
        return hashlib.sha256(normalized.encode('utf-8')).hexdigest()
    except Exception as e:
        print(f"❌ Error hashing {filepath}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Approve a UI design and generate Zero-Trust signature.")
    parser.add_argument("--story_dir", required=True, help="Path to the story directory (e.g., _iwish-output/3. Development/1. Epic & Story/.../Story-10.11)")
    
    args = parser.parse_args()
    story_dir = Path(args.story_dir)
    
    if not story_dir.exists():
        print(f"❌ ERROR: Story directory {story_dir} does not exist.")
        sys.exit(1)
        
    ui_spec_path = story_dir / "ui-spec.md"
    preview_path = story_dir / "preview.html"
    
    if not ui_spec_path.exists():
        print(f"❌ ERROR: ui-spec.md not found in {story_dir}.")
        sys.exit(1)
        
    if not preview_path.exists():
        print(f"❌ ERROR: preview.html not found in {story_dir}.")
        sys.exit(1)

    # 1. Determine Story ID from directory name
    story_id = story_dir.name.replace("Story-", "")

    # 2. Get Hashes
    ui_hash = get_file_hash(ui_spec_path)
    preview_hash = get_file_hash(preview_path)
    
    if not ui_hash or not preview_hash:
        print("❌ ERROR: Failed to compute hashes.")
        sys.exit(1)

    # 3. Read Key
    # Find .agent/.secrets/watchmen.key
    # Assuming this script is run from project root, or we can resolve it
    try:
        # Traverse up to find .agent
        current = Path.cwd()
        key_path = None
        for _ in range(5):
            candidate = current / ".agent" / ".secrets" / "watchmen.key"
            if candidate.exists():
                key_path = candidate
                break
            current = current.parent
            
        if not key_path:
            # Fallback relative to script location
            key_path = Path(__file__).resolve().parent.parent / ".secrets" / "watchmen.key"
            
        if not key_path.exists():
            print(f"❌ ERROR: Watchmen key not found at {key_path}")
            sys.exit(1)
            
        with open(key_path, 'r') as f:
            key_b64 = f.read().strip()
            
        key_bytes = base64.b64decode(key_b64)
        
        if len(key_bytes) >= 32:
            signing_key = nacl.signing.SigningKey(key_bytes[:32])
        else:
            signing_key = nacl.signing.SigningKey(key_bytes)
            
    except Exception as e:
        print(f"❌ ERROR: Failed to read or parse Watchmen key: {e}")
        sys.exit(1)

    # 4. Generate JSON
    approval_json = {
        "status": "approved",
        "ui_spec_hash": ui_hash,
        "preview_html_hash": preview_hash
    }
    
    approval_path = story_dir / "design-approval.json"
    with open(approval_path, "w", encoding="utf-8") as f:
        json.dump(approval_json, f, indent=2)

    # 5. Generate Signature
    payload = f"{story_id}:{ui_hash}".encode('utf-8')
    signed = signing_key.sign(payload)
    sig_b64 = base64.b64encode(signed.signature).decode('utf-8')

    sig_json = {
        "story_id": story_id,
        "signature": sig_b64
    }
    
    sig_path = story_dir / "design-approval.json.sig"
    with open(sig_path, "w", encoding="utf-8") as f:
        json.dump(sig_json, f, indent=2)

    print(f"✅ SUCCESS: Design approval generated for Story {story_id}")
    print(f"   - Hashed UI Spec: {ui_spec_path.name}")
    print(f"   - Hashed Preview: {preview_path.name}")
    print(f"   - Wrote {approval_path.name}")
    print(f"   - Wrote {sig_path.name}")

if __name__ == "__main__":
    main()
