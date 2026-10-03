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
from pathlib import Path

import unicodedata

def fatal_error(msg):
    print(f"❌ FAIL: {msg}")
    print("FATAL: HALT_AND_WAIT_FOR_HUMAN")
    sys.exit(1)

def missing_design_error(msg):
    print(f"❌ MISSING DESIGN: {msg}")
    print("Code 3: Auto-Remediate by calling /make-story then /make-ui-spec")
    sys.exit(3)

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
        fatal_error(f"Error hashing {filepath}: {e}")
        return None

import re

def verify_design_tracking(content):
    # Normalize CRLF
    content = content.replace('\r\n', '\n')
    lines = content.split('\n')
    
    registry_start_idx = -1
    for i, line in enumerate(lines):
        if line.strip() == "### Screen Registry":
            registry_start_idx = i
            break
            
    if registry_start_idx == -1:
        return False
        
    table_rows = []
    # Start looking for table after heading
    for line in lines[registry_start_idx+1:]:
        if line.strip() == "":
            if len(table_rows) > 0: # end of table
                break
            continue
        if line.strip().startswith('|'):
            table_rows.append(line)
        else:
            if len(table_rows) > 0: # end of table
                break
                
    if len(table_rows) < 2: # At least header + 1 data row
        return False
        
    data_rows = []
    for row in table_rows:
        # Ignore divider
        if re.match(r'^\s*\|?[\s\-\:]+\|', row):
            continue
        # Ignore header row
        if "Screen Name" in row and "Design Tool" in row:
            continue
        data_rows.append(row)
        
    if len(data_rows) < 1:
        return False
        
    for row in data_rows:
        parts = [p.strip() for p in row.split('|') if p.strip()]
        if len(parts) >= 3:
            if not parts[1] or not parts[2]: # Design tool or Link is empty
                return False
        else:
            return False
            
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: validate-design-approval.py <story_dir>")
        sys.exit(1)

    story_dir = Path(sys.argv[1])
    ui_spec_path = story_dir / "ui-spec.md"
    preview_path = story_dir / "preview.html"
    approval_path = story_dir / "design-approval.json"

    story_path = story_dir / "story.md"
    is_ui_story = False

    if story_path.exists():
        import re, yaml
        with open(story_path, 'r', encoding='utf-8') as f:
            story_content = f.read()
        yaml_match = re.match(r'^---\n(.*?)\n---', story_content, re.DOTALL)
        if yaml_match:
            try:
                frontmatter = yaml.safe_load(yaml_match.group(1))
                stags = [t.lower() for t in frontmatter.get('tags', [])]
                if "ui" in stags or str(frontmatter.get("type", "")).lower() == "ui":
                    is_ui_story = True
            except Exception:
                pass
        
        # Also check ACs
        if not is_ui_story and ("ui " in story_content.lower() or "giao diện" in story_content.lower()):
            if "acceptance criteria" in story_content.lower():
                is_ui_story = True

    if not is_ui_story:
        print(f"✅ SKIP: Story is not a UI story based on tags/AC. Passing automatically.")
        sys.exit(0)

    # If it is a UI story but missing ui-spec.md, FAIL to force Agent to create it!
    if not ui_spec_path.exists():
        missing_design_error("Story is tagged as UI but ui-spec.md is missing. You MUST create ui-spec.md.")

    print(f"🔍 ui-spec.md found. Enforcing Zero-Trust Design Approval Gate...")

    with open(ui_spec_path, 'r', encoding='utf-8') as f:
        ui_spec_content = f.read()
        
    if not verify_design_tracking(ui_spec_content):
        missing_design_error("UI Spec is missing a tracked design source. You MUST record the design origin (Stitch ID, Figma link, Canva, Claude, Open Design, or 'Design Link:') in ui-spec.md.")

    # 1. Enforce preview.html existence and non-empty bypass prevention
    if not preview_path.exists():
        missing_design_error("preview.html is missing. Generating preview.html is mandatory for UI stories.")
    
    if preview_path.stat().st_size < 100:
        missing_design_error("preview.html is too small (< 100 bytes). Empty file bypass detected.")

    # 2. Check for approval JSON
    if not approval_path.exists():
        fatal_error("design-approval.json is missing. The human user must run approve-design.py after approving the design.")

    # 3. Read approval JSON
    try:
        with open(approval_path, 'r') as f:
            approval_data = json.load(f)
    except Exception as e:
        fatal_error(f"Failed to parse design-approval.json: {e}")

    if approval_data.get("status") != "approved":
        fatal_error("Design status is not 'approved' in design-approval.json.")

    # 4. State Transition (Stale Approval) Check - Hash Verification
    expected_ui_hash = approval_data.get("ui_spec_hash")
    expected_preview_hash = approval_data.get("preview_html_hash")

    actual_ui_hash = get_file_hash(ui_spec_path)
    actual_preview_hash = get_file_hash(preview_path)

    if not expected_ui_hash or not expected_preview_hash:
        fatal_error("design-approval.json is missing file hashes. Stale approval protection failed.")

    if actual_ui_hash != expected_ui_hash:
        fatal_error("ui-spec.md has been modified since approval (Hash mismatch). Approval is STALE.")

    if actual_preview_hash != expected_preview_hash:
        fatal_error("preview.html has been modified since approval (Hash mismatch). Approval is STALE.")

    # 5. Cryptographic Signature Verification (Delegated to MCP Daemon)
    sig_path = approval_path.with_suffix(approval_path.suffix + '.sig')
    
    if not sig_path.exists():
        fatal_error(f"Cryptographic signature verification failed. Missing detached signature {sig_path.name}.")
        
    try:
        with open(sig_path, 'r') as f:
            sig_data = json.load(f)
        sig_base64 = sig_data.get("signature")
        sig_story_id = sig_data.get("story_id")
        
        if not sig_base64 or not sig_story_id:
            raise ValueError("Missing signature or story_id in .sig file")
            
        try:
            verify_script = story_dir.parents[3] / ".agent" / "mcp" / "watchmen-mcp" / "verify.cjs"
        except IndexError:
            verify_script = Path(__file__).resolve().parent.parent / "mcp" / "watchmen-mcp" / "verify.cjs"
        
        if not verify_script.exists():
            # Fallback path if deep inside adhoc-workspace
            verify_script = Path(__file__).resolve().parent.parent / "mcp" / "watchmen-mcp" / "verify.cjs"
            
        result = subprocess.run(
            ["node", str(verify_script), sig_story_id, str(ui_spec_path), sig_base64],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"Output: {result.stderr.strip()}")
            fatal_error("Cryptographic signature verification failed. Invalid signature!")
            
    except Exception as e:
        fatal_error(f"Error verifying signature: {e}")
    
    print(f"✅ PASS: Design approval verified (Hashes match, Signature valid).")
    sys.exit(0)

if __name__ == "__main__":
    main()
