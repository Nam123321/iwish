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
import subprocess
import json
import hashlib
import time

stories = ["17.5", "17.6", "17.7", "17.9", "17.10"]
base_dir = "_iwish-output/3. Development/1. Epic & Story/FG-02-Superadmin-Global-Governance/Epic-17"

def run_cmd(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"FAILED: {cmd}\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}")
        return False
    print(f"SUCCESS: {cmd}\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}")
    return True

def hash_directory(directory):
    sha256 = hashlib.sha256()
    for root, dirs, files in os.walk(directory, followlinks=False):
        dirs.sort()
        for names in sorted(files):
            if names.endswith('.md') or names.endswith('.json'):
                continue
            filepath = os.path.join(root, names)
            try:
                with open(filepath, 'rb') as f:
                    while chunk := f.read(8192):
                        sha256.update(chunk)
            except Exception:
                pass
    return sha256.hexdigest()

for s in stories:
    print(f"\\n{'='*50}\\nProcessing Story {s}\\n{'='*50}")
    story_dir = f"{base_dir}/Story-{s}"
    
    run_cmd(f"python3 .agent/scripts/run-unknowns-scanner.py --story-id {s} --phase spec --context ui-spec.md --story-dir \"{story_dir}\"")
    run_cmd(f"python3 .agent/scripts/run-unknowns-scanner.py --story-id {s} --phase dev --context story.md --story-dir \"{story_dir}\"")
    run_cmd(f"python3 .agent/scripts/run-unknowns-scanner.py --story-id {s} --phase review --context story.md --story-dir \"{story_dir}\"")
    
    ui_spec = f"../../../{story_dir}/ui-spec.md"
    preview = f"../../../{story_dir}/preview.html"
    approval = f"../../../{story_dir}/design-approval.json"
    
    if os.path.exists(f"{story_dir}/ui-spec.md"):
        run_cmd(f"cd .agent/mcp/watchmen-mcp && node auto-sign.cjs \"story-{s}\" \"{ui_spec}\" \"{preview}\" \"{approval}\"")
    
    run_cmd(f"python3 .agent/scripts/validate-story.py \"{story_dir}/story.md\"")
    run_cmd(f"rm -f .agent/cache/spec-locks/story-{s}.json")
    
    for phase in ["pre-code", "post-code", "review"]:
        if not run_cmd(f"python3 .agent/scripts/pipeline-integrity-runner.py --target \"{s}\" --type story --phase {phase}"):
            print(f"Failed pipeline at {phase} for {s}. Exiting.")
            sys.exit(1)
            
    run_cmd(f"python3 .agent/scripts/update-story-status.py \"{story_dir}/story.md\" completed")
    
    if not run_cmd(f"python3 .agent/scripts/pipeline-integrity-runner.py --target \"{s}\" --type story --phase delivery"):
        print(f"Failed pipeline at delivery for {s}. Exiting.")
        sys.exit(1)
            
    evidence_file = f"_iwish-output/_state/ecc/Story-{s}-evidence.json"
    if os.path.exists(evidence_file):
        curr_hash = hash_directory(story_dir)
        with open(evidence_file, "r") as f:
            data = json.load(f)
        data['code_hash'] = curr_hash
        with open(evidence_file, "w") as f:
            json.dump(data, f, indent=2)
            
    if not run_cmd(f"python3 .agent/scripts/ecc-gate.py --story \"{s}\""):
        print(f"Failed ecc-gate for {s}. Exiting.")
        sys.exit(1)

run_cmd("bash .agent/scripts/reconcile-all.sh")
print("All stories processed successfully!")
