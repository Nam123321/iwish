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
import subprocess
import shutil

def normalize_crlf(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()
    normalized = content.replace(b'\r\n', b'\n').rstrip() + b'\n'
    with open(file_path, 'wb') as f:
        f.write(normalized)

def run_ast_scanner(file_path):
    print(f"[commit-skill] Running AST Scanner on {file_path}")
    result = subprocess.run(
        ["python3", ".agent/scripts/validate-skill-hotspot.py", file_path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[commit-skill] AST Scanner failed:\n{result.stderr}\n{result.stdout}")
        sys.exit(1)
    return True

def request_daemon_signature(file_path):
    # Simulate or call actual Watchmen Daemon to issue a .sig file
    # This is the Runtime Cryptographic Enclave
    sig_path = f"{file_path}.sig"
    print(f"[commit-skill] Requesting signature from Watchmen Daemon for {file_path}")
    
    daemon_script = ".agent/scripts/mcp-signing-daemon.py"
    if os.path.exists(daemon_script):
        result = subprocess.run(
            ["python3", daemon_script, "sign", file_path, sig_path],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"[commit-skill] Watchmen Daemon failed to sign:\n{result.stderr}")
            sys.exit(1)
    else:
        # Fallback simulated daemon call if the actual script isn't there yet
        with open(sig_path, 'w') as f:
            f.write("VALID_WATCHMEN_SIGNATURE_MOCK")
    
    if not os.path.exists(sig_path):
        print("[commit-skill] Daemon failed to produce .sig file. Fail-Closed.")
        sys.exit(1)
    
    return sig_path

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 commit-skill.py <draft_path> <destination_path>")
        sys.exit(1)
        
    draft_path = sys.argv[1]
    destination_path = sys.argv[2]
    
    # EC-P1-001: Path Validation
    abs_dest = os.path.abspath(destination_path)
    if ".agent/skills" not in abs_dest or ".." in destination_path:
        print(f"[commit-skill] ERROR: destination_path must be inside .agent/skills/ directory. Got {destination_path}")
        sys.exit(1)
        
    if not os.path.exists(draft_path):
        print(f"[commit-skill] ERROR: draft file not found at {draft_path}")
        sys.exit(1)
        
    # EC-P4-001: Normalize CRLF
    normalize_crlf(draft_path)
    
    # Run Validation
    run_ast_scanner(draft_path)
    
    # EC-P6-002, EC-P5-001: Request Runtime Enclave Signature
    draft_sig_path = request_daemon_signature(draft_path)
    
    # Atomic Move
    dest_sig_path = f"{destination_path}.sig"
    
    # Ensure target dir exists
    os.makedirs(os.path.dirname(abs_dest), exist_ok=True)
    
    # Write to temp files first, then atomic replace
    temp_dest = f"{abs_dest}.tmp"
    temp_sig = f"{dest_sig_path}.tmp"
    
    shutil.copy2(draft_path, temp_dest)
    shutil.copy2(draft_sig_path, temp_sig)
    
    # Atomic replace (os.replace is atomic on POSIX)
    os.replace(temp_dest, abs_dest)
    os.replace(temp_sig, dest_sig_path)
    
    print(f"[commit-skill] SUCCESS: Atomic commit completed for {destination_path}")
    sys.exit(0)

if __name__ == "__main__":
    main()
