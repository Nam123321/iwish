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
import re
import json
import argparse
import subprocess
import tempfile
from pathlib import Path

def get_workspace_root() -> Path:
    return Path.cwd()

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Edge Case Guardian Approval Validator")
    parser.add_argument("file", help="Path to the file to validate (e.g. implementation_plan.md)")
    args = parser.parse_args()
    
    filepath = Path(args.file).resolve()
    
    if not filepath.exists():
        print(f"❌ Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)
        
    content = filepath.read_text(encoding='utf-8')
    
    # 1. Look for the seal exactly at the end of the file
    seal_match = re.search(r"(\n\n> \*\*\[EDGE-CASE-GUARDIAN-SEAL: ([a-f0-9]{64})\]\*\*\n*)$", content)
    
    if not seal_match:
        print("❌ Validation Failed: No valid Edge Case Guardian seal found at the end of the file.")
        sys.exit(1)
        
    seal_string = seal_match.group(1)
    signature = seal_match.group(2)
    
    # Remove the exact seal string to get the exact original content
    original_content = content[:-len(seal_string)]
    
    # 2. Verify with out-of-band daemon
    daemon_path = Path(__file__).parent / "mcp-signing-daemon.py"
    
    if not daemon_path.exists():
        print("❌ System Error: mcp-signing-daemon.py not found.")
        sys.exit(1)
        
    # Write original content to temp file for daemon verification
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(original_content.encode('utf-8'))
        temp_file_path = temp_file.name
        
    try:
        result = subprocess.run(
            ["python3", str(daemon_path), temp_file_path, "--verify", signature],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print("❌ Validation Failed: Cryptographic seal is INVALID. The file may have been tampered with or halluinated.")
            print(f"Daemon error: {result.stderr.strip()}")
            sys.exit(1)
    finally:
        os.unlink(temp_file_path)

    # 3. Verify Physical JSON Evidence Exists
    # Standardize the absolute path for physical evidence generation
    workspace_root = get_workspace_root()
    evidence_dir = workspace_root / "_iwish-output/edge-case-knowledge/approvals"
    evidence_file = evidence_dir / f"approval-{signature}.json"
    
    # Let's check standard location:
    std_evidence_path = workspace_root / "_iwish-output" / "edge-case-knowledge" / "approvals" / f"approval-{signature}.json"
    
    # Also check relative to the file if standard doesn't exist
    rel_evidence_path = filepath.parent.parent / "edge-case-knowledge" / "approvals" / f"approval-{signature}.json"
    
    if std_evidence_path.exists():
        evidence_file = std_evidence_path
    elif rel_evidence_path.exists():
        evidence_file = rel_evidence_path
    else:
        print(f"❌ Validation Failed: Physical JSON evidence file not found for signature {signature}.", file=sys.stderr)
        print(f"Looked in:\n - {std_evidence_path}\n - {rel_evidence_path}", file=sys.stderr)
        sys.exit(1)
        
    try:
        with open(evidence_file, 'r') as f:
            evidence = json.load(f)
            
        if evidence.get("status") != "PROVEN_SAFE":
            print(f"❌ Validation Failed: Evidence file indicates status is NOT PROVEN_SAFE (status: {evidence.get('status')})", file=sys.stderr)
            sys.exit(1)
            
        print(f"✅ Physical Evidence Validated: {evidence_file}")
        
    except json.JSONDecodeError:
        print("❌ Validation Failed: Evidence file is corrupted (invalid JSON).", file=sys.stderr)
        sys.exit(1)

    print("\n✅ ZERO-TRUST APPROVAL GRANTED.")
    print(f"File: {filepath.name}")
    print(f"Seal: {signature}")

if __name__ == "__main__":
    main()
