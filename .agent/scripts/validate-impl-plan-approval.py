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
import re
import yaml
from pathlib import Path
import unicodedata

def fatal_error(msg):
    print(f"❌ FAIL: {msg}")
    print("FATAL: HALT_AND_WAIT_FOR_HUMAN")
    sys.exit(1)

def missing_plan_error(msg):
    print(f"❌ MISSING PLAN: {msg}")
    print("Code 3: Auto-Remediate by generating plan")
    sys.exit(3)

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
        fatal_error(f"Error hashing {filepath}: {e}")
        return None

def verify_file_manifest(content):
    if "## 3. File Manifest" not in content:
        return False
    
    parts = content.split("## 3. File Manifest")
    if len(parts) < 2:
        return False
        
    manifest_section = parts[1].split("## ")[0]
    
    # Very basic check: are there files listed as [NEW] or [MODIFY] or [DELETE]?
    if not re.search(r'\[(NEW|MODIFY|DELETE)\]', manifest_section):
        return False
        
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: validate-impl-plan-approval.py <story_dir>")
        sys.exit(1)

    story_dir = Path(sys.argv[1])
    impl_plan_path = story_dir / "impl-plan.md"
    approval_path = story_dir / "impl-plan-approval.json.sig"
    
    # Try to find story id from folder name (e.g. Story-74.1 or story-74.1)
    story_id = story_dir.name.replace("Story-", "").replace("story-", "")
    sec_compiled_path = story_dir / f"sec-compiled-{story_id}.json"

    if not impl_plan_path.exists():
        missing_plan_error("impl-plan.md is missing. You MUST generate it.")

    print(f"🔍 impl-plan.md found. Enforcing Implementation Plan Gate...")

    with open(impl_plan_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not yaml_match:
        fatal_error("Missing YAML frontmatter in impl-plan.md")
        
    try:
        frontmatter = yaml.safe_load(yaml_match.group(1))
    except Exception as e:
        fatal_error(f"Invalid YAML frontmatter: {e}")
        
    # --- [DUAL-CONDITION GATE: CONDITION 1 - PLAN PROVEN SAFE] ---
    proven_safe_script = Path(__file__).resolve().parent / "validate-plan-proven-safe.py"
    if proven_safe_script.exists():
        proven_res = subprocess.run([sys.executable, str(proven_safe_script), "--file", str(impl_plan_path), "--story-id", story_id, "--story-dir", str(story_dir)], capture_output=True, text=True)
        if proven_res.returncode != 0:
            print(proven_res.stdout)
            print(proven_res.stderr)
            fatal_error("Condition 1 FAILED: impl-plan.md has NOT passed /plan-proven-safe. Both Plan Proven Safe and Human Approval are strictly mandatory.")
    else:
        # Fallback check directly if script path not found
        if not re.search(r'(?:VERDICT:\s*PROVEN_SAFE|STATUS:\s*PROVEN_SAFE|✅\s*PROVEN_SAFE|\*\*Verdict\*\*:\s*PROVEN_SAFE)', content, re.IGNORECASE):
            fatal_error("Condition 1 FAILED: impl-plan.md is missing 'VERDICT: PROVEN_SAFE'. Run /plan-proven-safe first.")

    # --- [DUAL-CONDITION GATE: CONDITION 2 - EXPLICIT HUMAN APPROVAL] ---
    if str(frontmatter.get("status", "")).lower() != "approved":
        fatal_error("Condition 2 FAILED: Implementation plan status is not 'approved'. You MUST obtain user approval via watchmen-mcp sign_human_gate.")

    if not verify_file_manifest(content):
        fatal_error("impl-plan.md is missing ## 3. File Manifest or has no files listed.")

    # Hash check with sec-compiled.json
    if not sec_compiled_path.exists():
        fatal_error(f"{sec_compiled_path.name} is missing, cannot verify sec_hash.")
        
    actual_sec_hash = get_file_hash(sec_compiled_path)
    expected_sec_hash = str(frontmatter.get("sec_hash", ""))
    
    if not expected_sec_hash:
        fatal_error("impl-plan.md frontmatter is missing sec_hash.")
        
    if not actual_sec_hash.startswith(expected_sec_hash):
        fatal_error(f"sec-compiled JSON hash mismatch. Expected: {expected_sec_hash}, Actual: {actual_sec_hash}. SEC has changed since plan generation.")

    # Cryptographic Human Signature Check
    if not approval_path.exists():
        fatal_error("impl-plan-approval.json.sig is missing. Human approval is strictly mandatory via watchmen-mcp sign_human_gate.")

    try:
        with open(approval_path, 'r') as f:
            sig_data = json.load(f)
        sig_base64 = sig_data.get("signature")
        sig_story_id = sig_data.get("story_id")
        
        if not sig_base64 or not sig_story_id:
            fatal_error("Missing signature or story_id in impl-plan-approval.json.sig")
            
        verify_script = Path(__file__).resolve().parent.parent / "mcp" / "watchmen-mcp" / "verify.cjs"
        if verify_script.exists():
            result = subprocess.run(
                ["node", str(verify_script), sig_story_id, str(impl_plan_path), sig_base64],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"Verify Output: {result.stderr.strip()}")
                fatal_error("Cryptographic signature verification failed! Signature is invalid or tampered.")
            
    except Exception as e:
        fatal_error(f"Error verifying cryptographic human signature: {e}")
    
    print(f"✅ PASS: Implementation Plan Dual-Condition verified (1: Proven Safe, 2: Human Approved).")
    sys.exit(0)

if __name__ == "__main__":
    main()
