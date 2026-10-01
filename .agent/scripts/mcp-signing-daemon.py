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
import argparse
import hmac
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone

from markdown_it import MarkdownIt

def get_secure_key() -> str:
    key = os.environ.get("WATCHMEN_SIGNING_KEY")
    if not key:
        # Fallback for existing tests, since environment might not be set
        # But per the plan: "replace it with a simulated out-of-band secret retrieval."
        try:
            key = Path("/tmp/watchmen_vault_key").read_text().strip()
        except FileNotFoundError:
            raise RuntimeError("CRITICAL: Watchmen signing key not found in environment or vault.")
    return key

def generate_signature(filepath: Path) -> str:
    content = filepath.read_bytes()
    # HMAC-SHA256 signature
    signature = hmac.new(
        get_secure_key().encode('utf-8'),
        content,
        hashlib.sha256
    ).hexdigest()
    return signature

def calculate_wis(filepath: Path) -> int:
    """Calculate Watchmen Injection Score for a capability file using AST."""
    content = filepath.read_text(encoding='utf-8')
    md = MarkdownIt()
    tokens = md.parse(content)
    
    score = 0
    list_items = 0
    code_blocks = 0
    
    for token in tokens:
        if token.type == "list_item_open":
            list_items += 1
        elif token.type in ("fence", "code_block"):
            code_blocks += 1
            if "eval" in token.content.lower() or "bash" in token.info.lower():
                score += 3
            if "prompt injection" in token.content.lower():
                score += 2
            if "ignore previous instructions" in token.content.lower():
                score += 3
    
    # If structural elements are missing, increase risk score
    if list_items < 3:
        score += 2
    if code_blocks == 0:
        score += 1
        
    return score


def verify_signature(filepath: Path, expected_signature: str) -> bool:
    content = filepath.read_bytes()
    # HMAC-SHA256 signature
    actual_signature = hmac.new(
        get_secure_key().encode('utf-8'),
        content,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(actual_signature, expected_signature)

def main():
    parser = argparse.ArgumentParser(description="Watchmen Mode 1 & 2: MCP Signing Daemon")
    parser.add_argument("file", help="Path to the file to sign or verify")
    parser.add_argument("--assess-injection", action="store_true", help="Run Mode 2 Capability Audit")
    parser.add_argument("--verify", type=str, help="Verify the file against the provided signature")
    args = parser.parse_args()
    
    filepath = Path(args.file).resolve()
    
    if not filepath.exists():
        print(f"❌ Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)
        
    try:
        real_filepath = os.path.realpath(filepath)
        restricted_paths = [
            os.path.realpath(os.path.dirname(__file__)),
            os.path.realpath("/tmp")
        ]
        
        for restricted in restricted_paths:
            try:
                if os.path.commonpath([real_filepath, restricted]) == restricted:
                    print(f"❌ Error: Restricted file target.", file=sys.stderr)
                    sys.exit(1)
            except ValueError:
                pass
            
        if args.verify:
            # Verification Mode
            is_valid = verify_signature(filepath, args.verify)
            if is_valid:
                print("✅ Signature is valid")
                sys.exit(0)
            else:
                print("❌ Signature is invalid", file=sys.stderr)
                sys.exit(1)
                
        elif args.assess_injection:
            wis = calculate_wis(filepath)
            
            evidence = {
                "file": str(filepath.name),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "wis_score": wis,
                "requires_integration_gate": wis >= 6,
                "status": "APPROVED" if wis < 6 else "FLAGGED"
            }
            
            # Sign the evidence
            evidence_bytes = json.dumps(evidence, sort_keys=True).encode('utf-8')
            signature = hmac.new(
                get_secure_key().encode('utf-8'),
                evidence_bytes,
                hashlib.sha256
            ).hexdigest()
            
            evidence["signature"] = signature
            
            print(json.dumps(evidence, indent=2))
        else:
            # Standard Mode 1 File Signing
            signature = generate_signature(filepath)
            
            # Write signature to a detached .sig file
            sig_file = filepath.with_suffix(filepath.suffix + '.sig')
            sig_file.write_text(signature)
            
            print(f"✅ Successfully signed {filepath.name}")
            print(f"Signature: {signature}")
            print(f"Saved detached signature to: {sig_file.name}")
            
    except Exception as e:
        print(f"❌ Operation failed: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
