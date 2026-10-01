#!/usr/bin/env python3
import os, sys
script_dir = os.path.dirname(os.path.abspath(__file__))
agent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass

import sys
import json
import os
import argparse
import re
import fcntl
import stat
import hashlib
import tempfile
import yaml
from pathlib import Path

JSON_PATH = "_iwish-output/adhoc-workspace/scratch/pending-retro-fixes.json"

def verify_scope_gap(story_id):
    if not re.match(r"^story-\d+\.\d+$", story_id):
        print(f"Error: Invalid story_id format: {story_id}")
        sys.exit(1)
        
    story_file = None
    for path in Path("_iwish-output").rglob(f"{story_id.capitalize()}/story.md"):
        story_file = path
        break
    
    if not story_file:
        print(f"Error: Could not find story.md for {story_id}")
        sys.exit(1)
        
    try:
        with open(story_file, 'r') as f:
            content = f.read()
            if "status: completed" not in content and "status: 'completed'" not in content and 'status: "completed"' not in content:
                print(f"Error: {story_id} is not marked as completed")
                sys.exit(1)
            story_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    except Exception as e:
        print(f"Error reading {story_file}: {e}")
        sys.exit(1)
        
    snapshot_path = story_file.parent / "completion-snapshot.json"
    if not snapshot_path.exists():
        print("Error: completion-snapshot.json missing. Run /flow-auto-approve.")
        sys.exit(1)
        
    try:
        with open(snapshot_path, 'r') as f:
            snapshot = json.load(f)
            
        hashes = snapshot.get("dependency_hashes", {})
        expected = None
        for key, val in hashes.items():
            if key.endswith(f"{story_id.capitalize()}/story.md"):
                expected = val.replace("sha256:", "")
                break
        
        if not expected:
            print(f"Error: Snapshot does not contain hash for {story_file.name}. KeyError averted. Run /flow-auto-approve.")
            sys.exit(1)
            
        if expected != story_hash:
            print("Error: story.md hash does not match snapshot. Mtime spoofing detected.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error verifying scope_gap: {e}")
        sys.exit(1)

def verify_code_bug(evidence_path, fix_id):
    if not evidence_path:
        print("Error: --evidence is required for code_bug")
        sys.exit(1)
        
    if not os.path.exists(evidence_path):
        print("Error: Evidence file does not exist")
        sys.exit(1)
        
    if "pending-retro-fixes.json" in evidence_path:
        print("Error: Cannot use retro ledger as evidence (Circular Evidence)")
        sys.exit(1)
        
    try:
        mode = os.stat(evidence_path).st_mode
        if not stat.S_ISREG(mode):
            print("Error: Evidence must be a regular file (Tarpit prevention)")
            sys.exit(1)
            
        if os.path.getsize(evidence_path) > 10 * 1024 * 1024:
            print("Error: Evidence file exceeds 10MB (OOM DoS protection)")
            sys.exit(1)
    except Exception as e:
        print(f"Error stat-ing evidence file: {e}")
        sys.exit(1)
        
    try:
        with open(evidence_path, 'r') as f:
            data = json.load(f)
            
        if "pending_fixes" in data or "risks" in data:
             print("Error: Evidence schema matches ledger schema")
             sys.exit(1)
             
        has_test_key = any(k in data for k in ["suites", "duration", "errors", "stats", "test_results"])
        data_str = json.dumps(data)
        if fix_id not in data_str and not has_test_key:
             print("Error: Evidence does not contain test metrics or fix_id (Mock Evidence)")
             sys.exit(1)
             
    except json.JSONDecodeError:
        print("Error: Evidence is not a valid JSON")
        sys.exit(1)
    except Exception as e:
        print(f"Error parsing evidence file: {e}")
        sys.exit(1)

def verify_capability_gap(skill_name):
    if not re.match(r"^[a-zA-Z0-9_-]+$", skill_name):
        print("Error: Invalid skill_name format (Path Traversal prevention)")
        sys.exit(1)
        
    skill_file = Path(f".agent/skills/{skill_name}/SKILL.md")
    if not skill_file.exists():
        skill_file = Path(f".agent/workflows/{skill_name}.md")
        if not skill_file.exists():
            skill_file = Path(f".agent/plugins/{skill_name}/skills/{skill_name}/SKILL.md")
            if not skill_file.exists():
                print(f"Error: Skill/Workflow {skill_name} not found")
                sys.exit(1)
        
    if skill_file.stat().st_size < 200:
        print("Error: Skill file too small (Hollow Skill)")
        sys.exit(1)
        
    try:
        with open(skill_file, 'r') as f:
            content = f.read()
            
        if "<agent-activation" not in content and "type: I-Wish Workflow" not in content and "type: I-Wish Story" not in content:
            print("Error: Missing agent-activation block or workflow type")
            sys.exit(1)
            
        match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
        if not match:
            print("Error: Missing YAML frontmatter")
            sys.exit(1)
            
        frontmatter = yaml.safe_load(match.group(1))
        if frontmatter.get('name') != skill_name:
            print("Error: Skill name in YAML does not match folder name (Plagiarism)")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error verifying capability_gap: {e}")
        sys.exit(1)

def load_data_unlocked():
    if not os.path.exists(JSON_PATH):
        return {"risks": []}
    try:
        with open(JSON_PATH, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                return {"risks": data}
            return data
    except json.JSONDecodeError:
        return {"risks": []}

def main():
    parser = argparse.ArgumentParser(description="Manage pending retro fixes")
    parser.add_argument("--resolve", help="Story ID or Bug ID to mark as resolved")
    parser.add_argument("--check", action="store_true", help="Check if there are pending risks")
    parser.add_argument("--evidence", help="Path to evidence JSON file (required for code_bug)")
    args = parser.parse_args()

    if args.check:
        data = load_data_unlocked()
        risks = data.get("risks", [])
        if len(risks) > 0:
            print(f"Warning: There are {len(risks)} pending risks.")
            for r in risks:
                print(f"- {r.get('id', 'Unknown')}: {r.get('type', 'Unknown risk')}")
            sys.exit(1)
        else:
            print("No pending risks.")
            sys.exit(0)

    if args.resolve:
        os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
        lock_file_path = JSON_PATH + ".lock"
        
        with open(lock_file_path, 'w') as lock_file:
            fcntl.flock(lock_file, fcntl.LOCK_EX)
            try:
                data = load_data_unlocked()
                risks = data.get("risks", [])
                
                target_risk = next((r for r in risks if r.get('id') == args.resolve), None)
                if not target_risk:
                    print("No risks were pending or risk ID not found.")
                    sys.exit(0)
                    
                risk_type = target_risk.get('type')
                if risk_type == 'scope_gap':
                    for sid in target_risk.get('story_ids', []):
                        verify_scope_gap(sid.lower())
                elif risk_type == 'code_bug':
                    verify_code_bug(args.evidence, args.resolve)
                elif risk_type == 'capability_gap':
                    verify_capability_gap(target_risk.get('skill_name') or target_risk.get('proposed_skill', {}).get('name'))
                    
                initial_count = len(risks)
                risks = [r for r in risks if r.get('id') != args.resolve]
                data["risks"] = risks
                
                dir_name = os.path.dirname(JSON_PATH)
                fd, tmp_path = tempfile.mkstemp(dir=dir_name, prefix="pending-retro-", suffix=".tmp.json")
                with os.fdopen(fd, 'w') as tmp_f:
                    json.dump(data, tmp_f, indent=2)
                    tmp_f.flush()
                    os.fsync(tmp_f.fileno())
                os.replace(tmp_path, JSON_PATH)
                
            finally:
                fcntl.flock(lock_file, fcntl.LOCK_UN)
                
        if len(risks) == 0 and initial_count > 0:
            print("All risks have been cleared.")
            sys.exit(2)
        elif len(risks) > 0:
            print(f"Risk {args.resolve} cleared. {len(risks)} remaining.")
            sys.exit(0)

if __name__ == "__main__":
    main()
