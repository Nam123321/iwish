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
import fcntl
import argparse
import hashlib
import json
import time
import re
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Zero-Trust OOB AST Validator for State Mutations")
    parser.add_argument("--file", required=True, help="Path to the file to validate")
    parser.add_argument("--property", required=True, help="The YAML frontmatter property to check (e.g., 'status')")
    parser.add_argument("--expected", required=True, help="The expected value (e.g., 'completed')")
    parser.add_argument("--signature-file", default="_iwish-output/runtime/signatures.log", help="Path to append the HMAC signature")
    return parser.parse_args()

def generate_signature(filepath, prop, value):
    # In a true production system, this secret would be injected via env vars from a vault.
    # For this workspace, we use a local runtime secret to prevent agent forgery.
    secret_path = Path(".agent/secrets/hmac_secret.key")
    if not secret_path.exists():
        secret_path.parent.mkdir(parents=True, exist_ok=True)
        secret_path.write_bytes(os.urandom(32))
    
    secret = secret_path.read_bytes()
    timestamp = int(time.time())
    
    message = f"{filepath}:{prop}:{value}:{timestamp}".encode('utf-8')
    h = hashlib.sha256()
    h.update(secret)
    h.update(message)
    signature = h.hexdigest()
    
    return {
        "file": str(filepath),
        "property": prop,
        "value": value,
        "timestamp": timestamp,
        "signature": signature
    }

def extract_frontmatter(content):
    # Matches YAML frontmatter between --- and ---
    match = re.match(r'^\s*---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return None
    return match.group(1)

def check_property(frontmatter, prop, expected):
    # Robustly check for the property in the frontmatter
    # Handles `prop: value` or `prop: "value"`
    lines = frontmatter.split('\n')
    for idx, line in enumerate(lines):
        line = line.strip()
        if line.startswith(f"{prop}:"):
            # Extract the value
            val_part = line[len(prop)+1:].strip()
            # Strip quotes if any
            if (val_part.startswith('"') and val_part.endswith('"')) or \
               (val_part.startswith("'") and val_part.endswith("'")):
                val_part = val_part[1:-1]
            
            if val_part.lower() == expected.lower():
                return True
            else:
                print(f"[AST Error] L{idx+2}: Property '{prop}' found but value '{val_part}' does not match expected '{expected}'.", file=sys.stderr)
                return False
                
    print(f"[AST Error] Property '{prop}' not found in YAML frontmatter.", file=sys.stderr)
    return False

def main():
    args = parse_args()
    target_path = Path(args.file).resolve()
    
    # Path Traversal Prevention (EC-P6-001)
    workspace_root = Path(os.getcwd()).resolve()
    if not str(target_path).startswith(str(workspace_root)):
        print(f"[Security Error] Target path {target_path} is outside the workspace root.", file=sys.stderr)
        sys.exit(1)
        
    if not target_path.exists():
        print(f"[AST Error] File not found: {target_path}", file=sys.stderr)
        sys.exit(1)
        
    try:
        with open(target_path, 'r', encoding='utf-8') as f:
            # File Locking (EC-P3-001)
            fcntl.flock(f, fcntl.LOCK_SH)
            try:
                content = f.read()
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
    except Exception as e:
        print(f"[AST Error] Could not read file: {e}", file=sys.stderr)
        sys.exit(1)
        
    frontmatter = extract_frontmatter(content)
    if not frontmatter:
        print(f"[AST Error] L1: No valid YAML frontmatter (---) found at the top of the file.", file=sys.stderr)
        sys.exit(1)
        
    if check_property(frontmatter, args.property, args.expected):
        sig = generate_signature(target_path, args.property, args.expected)
        
        sig_file = Path(args.signature_file)
        sig_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Write append-only signature ledger (EC-P6-001)
        with open(sig_file, 'a', encoding='utf-8') as sf:
            fcntl.flock(sf, fcntl.LOCK_EX)
            try:
                sf.write(json.dumps(sig) + "\n")
            finally:
                fcntl.flock(sf, fcntl.LOCK_UN)
                
        # We do NOT print the signature to stdout to prevent agent forgery
        print("VALIDATION SUCCESS: State mutation verified out-of-band and cryptographically signed.")
        sys.exit(0)
    else:
        print("VALIDATION FAILED: The expected state was not found.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
