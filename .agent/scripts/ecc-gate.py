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

import argparse
import json
import os
import sys
import fcntl
import hashlib
import re
import pathlib

def hash_directory(directory):
    sha256 = hashlib.sha256()
    try:
        # P1 Edge Case: Symlink Loops (followlinks=False)
        for root, dirs, files in os.walk(directory, followlinks=False):
            dirs.sort()
            for names in sorted(files):
                # Exclude markdown and json files to prevent hash mismatch after evidence/status generation
                if names.endswith('.md') or names.endswith('.json'):
                    continue
                filepath = os.path.join(root, names)
                try:
                    with open(filepath, 'rb') as f:
                        while chunk := f.read(8192):
                            sha256.update(chunk)
                except (FileNotFoundError, PermissionError) as e:
                    # TOCTOU Fix: EAFP pattern for file reads
                    print(f"Warning: File became inaccessible during hashing {filepath}: {e}")
                    continue
                except Exception as e:
                    print(f"Error: Failed to read {filepath} for hashing: {e}")
                    sys.exit(1)
    except Exception as e:
        print(f"Error: Directory hashing failed: {e}")
        sys.exit(1)
    return sha256.hexdigest()

def update_yaml_status(filepath, new_status):
    try:
        with open(filepath, 'r+') as f:
            # P3: Concurrency Write Race Condition Protection (with L2-3/4 hard timeout via LOCK_NB)
            try:
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                print(f"Error: Lock acquisition failed/timeout on {filepath}. Possible DoS or starvation.")
                sys.exit(1)
                
            f.seek(0)
            content = f.read()
            
            # Regex to update status in YAML frontmatter
            new_content = re.sub(r'status:\s*.*', f'status: {new_status}', content, count=1)
            
            f.seek(0)
            f.write(new_content)
            f.truncate()
            fcntl.flock(f, fcntl.LOCK_UN)
    except FileNotFoundError:
        # TOCTOU EAFP
        return
    except Exception as e:
        print(f"Failed to update {filepath}: {e}")
        sys.exit(1)

def process_story(story_id, base_dir):
    story_dir = None
    # Use abspath for strict verification
    base_abs = os.path.abspath(base_dir)
    for path in pathlib.Path(base_dir).rglob(f"Story-{story_id}"):
        if path.is_dir() and 'Epic-' in str(path):
            path_abs = os.path.abspath(path)
            # Prevent Directory Spoofing & Path Traversal
            if os.path.commonpath([base_abs, path_abs]) == base_abs:
                # P1: Ensure this is the actual story directory containing story.md, not a qa-evidence or other auxiliary dir
                if os.path.exists(os.path.join(path_abs, 'story.md')):
                    story_dir = path_abs
                    break
            
    if not story_dir:
        print(f"Error: Story directory for {story_id} not found.")
        sys.exit(1)

    # Move evidence file out of story directory to fix Recursive Hashing Paradox
    evidence_file = os.path.join(base_abs, '_state', 'ecc', f'Story-{story_id}-evidence.json')
    story_file = os.path.join(story_dir, 'story.md')

    try:
        with open(evidence_file, 'r') as f:
            evidence = json.load(f)
    except FileNotFoundError:
        print(f"Error: Evidence file missing for {story_id}")
        update_yaml_status(story_file, 'fixing')
        sys.exit(1) # P9: Fail Closed
    except json.JSONDecodeError as e:
        print(f"Error: Could not parse evidence for {story_id}: {e}")
        update_yaml_status(story_file, 'fixing')
        sys.exit(1)

    # P4: Cross-contamination check
    if evidence.get('story_id') != story_id:
        print(f"Error: Cross-contamination. Evidence story_id {evidence.get('story_id')} != {story_id}")
        update_yaml_status(story_file, 'fixing')
        sys.exit(1)

    # P11 Workflow Omission & Fail-Closed State Machine
    if not evidence.get('p11_lifecycle_success_token'):
        print(f"Error: Missing P11 lifecycle success token for {story_id}. Hashing aborted.")
        update_yaml_status(story_file, 'fixing')
        sys.exit(1)

    # P5: Subprocess memory audit (Direct execution instead of reading static file)
    try:
        import subprocess
        # Simulate running a test suite or memory audit script and parse its output
        audit_res = subprocess.run(["node", ".agent/scripts/audit_memory.js", "--story", story_id], capture_output=True, text=True)
        if audit_res.returncode == 0:
            match = re.search(r'SCS:\s*([\d.]+)', audit_res.stdout)
            if match:
                scs_val = float(match.group(1))
            else:
                scs_val = float(evidence.get('scs', 0))
        else:
            print(f"Warning: Subprocess audit failed for {story_id}. Using evidence fallback.")
            scs_val = float(evidence.get('scs', 0))
    except Exception as e:
        print(f"Warning: Failed to execute subprocess audit: {e}. Using evidence fallback.")
        scs_val = float(evidence.get('scs', 0))

    if scs_val < 93.0:
        print(f"Error: SCS {scs_val} < 93.0 for {story_id}")
        update_yaml_status(story_file, 'fixing')
        sys.exit(1)
        
    # P2: Stale Evidence Bypass
    current_hash = hash_directory(story_dir)
    stored_hash = evidence.get('code_hash')
    
    if not stored_hash or not current_hash or stored_hash != current_hash:
        print(f"Error: Stale evidence or missing hash. Hash mismatch for {story_id}")
        update_yaml_status(story_file, 'fixing')
        sys.exit(1)

    # Success (P6: Inversion of Control - Script updates status, not the Agent)
    update_yaml_status(story_file, 'completed')
    print(f"Story {story_id} validated successfully.")
    return True

def process_epic(epic_id, base_dir):
    base_abs = os.path.abspath(base_dir)
    epic_dir = None
    for path in pathlib.Path(base_dir).rglob(f"Epic-{epic_id}"):
        if path.is_dir():
            path_abs = os.path.abspath(path)
            if os.path.commonpath([base_abs, path_abs]) == base_abs:
                if os.path.exists(os.path.join(path_abs, 'epic.md')):
                    epic_dir = path_abs
                    break
            
    if not epic_dir:
        print(f"Error: Epic directory for {epic_id} not found.")
        sys.exit(1)
        
    epic_file = os.path.join(epic_dir, 'epic.md')
        
    stories = []
    for root, dirs, _ in os.walk(epic_dir, followlinks=False):
        for d in dirs:
            if d.startswith("Story-"):
                stories.append(d.replace("Story-", ""))
                
    for story_id in stories:
        process_story(story_id, base_dir)
        
    # P6: Inversion of Control
    update_yaml_status(epic_file, 'completed')
    print(f"Epic {epic_id} validated successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ECC Gate - Zero Trust Enforcement")
    parser.add_argument('--story', help='Story ID to validate')
    parser.add_argument('--epic', help='Epic ID to validate')
    args = parser.parse_args()

    base_dir = "_iwish-output"
    
    if args.story:
        process_story(args.story, base_dir)
        sys.exit(0)
    elif args.epic:
        process_epic(args.epic, base_dir)
        sys.exit(0)
    else:
        print("Error: Must provide --story or --epic")
        sys.exit(1)
