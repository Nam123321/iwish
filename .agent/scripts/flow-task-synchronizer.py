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
    import sys
    print("❌ [Zero-Trust] CRITICAL: watchmen_core.py is missing or hijacked!")
    sys.exit(1)
# ---------------------------------
from watchmen_client import call_daemon, sign_evidence, verify_evidence

import sys
import os
import argparse
import json
import hashlib
import hmac
import base64
import subprocess
from pathlib import Path
import tempfile
import re


def load_and_verify_evidence(file_path, expected_story_id=None):
    if not file_path.exists():
        return False
        
    # P8 Mitigation: Support na-evidence.json bypass
    if file_path.name == "na-evidence.json":
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if "hmac_signature" in data:
                sig = data.pop("hmac_signature")
                if verify_evidence(data, sig):
                    if expected_story_id and data.get("story_id") != expected_story_id:
                        print(f"❌ Diagnostic: na-evidence.json valid, but Story-ID mismatch. Expected {expected_story_id}, got {data.get('story_id')}")
                        return False
                    return True
        except Exception as e:
            print(f"⚠️ Warning: Malformed na-evidence.json: {e}")
        return False

    try:
        # P1 Mitigation: Safe JSON loading
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if "hmac_signature" in data:
            signature = data.pop("hmac_signature")
            is_valid = verify_evidence(data, signature)
        elif file_path.name == "traceability.json":
            sig_path = file_path.with_name("traceability.json.sig")
            if not sig_path.exists():
                print(f"❌ Diagnostic: traceability.json missing signature file.")
                return False
            signature = sig_path.read_text(encoding='utf-8').strip()
            is_valid = verify_evidence(data, signature)
        else:
            print(f"❌ Diagnostic: {file_path.name} lacks an hmac_signature.")
            return False # Unsigned or manually generated file
            
        if is_valid:
            if expected_story_id and "story_id" in data and data["story_id"] != expected_story_id:
                print(f"❌ Diagnostic: Signature valid but Story-ID mismatch in {file_path.name}. Expected {expected_story_id}, got {data['story_id']}")
                return False
            return True
        else:
            print(f"❌ Diagnostic: Invalid HMAC signature in {file_path.name}")
            return False
    except Exception as e:
        print(f"⚠️ Warning: Malformed evidence file {file_path.name}: {e}")
        return False

def atomic_replace_markdown(file_path, content):
    """
    P3 / P7 / P12 Mitigation: File locking combined with write to prevent lost updates and deadlocks.
    """
    import fcntl
    if not file_path.exists():
        return
    with open(file_path, 'r+', encoding='utf-8') as f:
        try:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            f.seek(0)
            f.write(content)
            f.truncate()
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)

def sync_micro_layer(story_dir, story_id):
    """
    Synchronizes task.md and story.md checkboxes based on evidence files.
    P2 Mitigation: Actively unchecks items without evidence.
    """
    task_file = story_dir / "task.md"
    story_file = next(story_dir.glob("story*.md"), None)

    # Evidence Mapping
    # Define which evidence file verifies which step
    evidence_map = {
        "Step 1: Document Discovery": "pipeline-evidence-pre-code.json",
        "Step 2: Understand & Investigate": "pipeline-evidence-pre-code.json", 
        "Step 3: Implementation Strategy": "pipeline-evidence-pre-code.json",
        "Step 4: Final Validation": "pipeline-evidence-post-code.json",
        "Step 5: Adversarial Review": "pipeline-evidence-review.json",
        "Step 6: Resolve Findings": "pipeline-evidence-review.json",
        "Zero-Trust Gate: Spec Completeness": "pipeline-evidence-pre-code.json",
        "Zero-Trust Gate: Implementation Coverage": "pipeline-evidence-post-code.json",
        "Zero-Trust Gate: Architectural Coherence": "pipeline-evidence-pre-code.json",
        "Zero-Trust Gate: Traceability Validation": "traceability.json"
    }

    evidence_status = {}
    for step, filename in evidence_map.items():
        if filename == "traceability.json":
            evidence_status[step] = load_and_verify_evidence(story_dir / filename, story_id)
        else:
            evidence_status[step] = load_and_verify_evidence(story_dir / filename, story_id)

    if task_file.exists():
        content = task_file.read_text(encoding='utf-8')
        new_lines = []
        for line in content.splitlines():
            # Check if this line is a checkbox list item that maps to a step/gate
            is_mapped = False
            for step, has_evidence in evidence_status.items():
                if step in line and line.strip().startswith("- ["):
                    is_mapped = True
                    # Inversion of Control: Force status based on evidence
                    checkbox_pattern = r'- \[[ x/]\]'
                    if has_evidence:
                        line = re.sub(checkbox_pattern, '- [x]', line, count=1)
                    else:
                        line = re.sub(checkbox_pattern, '- [ ]', line, count=1)
                    break
            new_lines.append(line)
            
        atomic_replace_markdown(task_file, "\n".join(new_lines) + "\n")

    if story_file and story_file.exists():
        # Syncing Engineering Tasks in story.md
        # If traceability.json shows they are completed and has valid signature
        has_traceability = load_and_verify_evidence(story_dir / "traceability.json", story_id)
        content = story_file.read_text(encoding='utf-8')
        new_lines = []
        in_tasks_section = False
        
        for line in content.splitlines():
            if line.strip().startswith("## Tasks") or line.strip().startswith("## Engineering Tasks"):
                in_tasks_section = True
            elif line.strip().startswith("## ") and in_tasks_section:
                in_tasks_section = False
                
            if in_tasks_section and line.strip().startswith("- ["):
                checkbox_pattern = r'- \[[ x/]\]'
                if has_traceability:
                    line = re.sub(checkbox_pattern, '- [x]', line, count=1)
                else:
                    line = re.sub(checkbox_pattern, '- [ ]', line, count=1)
                    
            new_lines.append(line)
        atomic_replace_markdown(story_file, "\n".join(new_lines) + "\n")
        
    return all(evidence_status.values()) if evidence_status else False

def sync_macro_layer(story_dir, story_id, project_root):
    """
    P4 Mitigation: Wraps macro script invocation in try/except and implements rollback/pending-state.
    """
    scripts_dir = project_root / ".agent" / "scripts"
    
    print("▶ Invoking Macro-layer synchronizers...")
    try:
        # Update story status
        story_file = next(story_dir.glob("story*.md"), None)
        if story_file:
            subprocess.run(["python3", str(scripts_dir / "update-story-status.py"), str(story_file), "completed"], check=True)
            
        # Update sprint status (if applicable)
        sync_script = scripts_dir / "sync_all_statuses.py"
        if sync_script.exists():
            subprocess.run(["python3", str(sync_script)], check=True)
            
        # Sync unknowns
        unknowns_script = scripts_dir / "unknowns-ledger-sync.py"
        if unknowns_script.exists():
            subprocess.run(["python3", str(unknowns_script), "--story", story_id, "--dir", str(story_dir)], check=True)
            
        print("✅ Macro-layer synchronization completed.")
    except Exception as e:
        print(f"⚠️ Warning [Macro Sync Error]: Failed to execute macro sync: {e}")
        print("▶ Rollback: Writing pending-sync state file to prevent desynchronization lockout (EC-P4-002)")
        pending_file = story_dir / "pending-macro-sync.flag"
        pending_file.write_text("Pending macro synchronization.")

def main():
    parser = argparse.ArgumentParser(description="Zero-Trust Task Synchronizer")
    parser.add_argument("--story-dir", required=True, help="Path to story directory")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    
    # Path Sanitization (EC-P1-002)
    story_dir = Path(os.path.abspath(args.story_dir))
    allowed_roots = [str(project_root), "/tmp", "/private/tmp"]
    if not any(str(story_dir).startswith(root) for root in allowed_roots):
        print(f"❌ Error [Watchmen]: Path traversal blocked. Directory must be within project root or sandbox: {story_dir}")
        sys.exit(1)

    if not story_dir.exists() or not story_dir.is_dir():
        print(f"❌ Error: Directory not found: {story_dir}")
        sys.exit(1)
        
    project_root = Path(__file__).resolve().parents[2]
    
    story_id = None
    match = re.search(r'Story[-_]?(\d+\.\d+[a-z]?)', story_dir.name, re.IGNORECASE)
    if match:
        story_id = match.group(1)
    
    print(f"▶ Running Micro-layer synchronization for {story_dir.name}...")
    is_fully_complete = sync_micro_layer(story_dir, story_id)
    
    if is_fully_complete and story_id:
        # Check if delivery evidence exists to trigger macro completion
        delivery_evidence = story_dir / "pipeline-evidence-delivery.json"
        if load_and_verify_evidence(delivery_evidence):
            sync_macro_layer(story_dir, story_id, project_root)
            
    print("✅ Task synchronization complete.")
    sys.exit(0)

if __name__ == "__main__":
    main()
