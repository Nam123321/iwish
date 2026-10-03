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
import glob
import re
import hashlib
import json
import subprocess

def get_git_diff_for_story(story_id):
    """
    Extracts the git diff for a given story by finding commits that mention the story ID.
    If no commits found, returns a placeholder.
    """
    try:
        # Search for commits containing the story ID in their message
        result = subprocess.run(
            ["git", "log", "--grep", f"{story_id}", "--format=%H"],
            cwd="{project-root}",
            capture_output=True,
            text=True
        )
        commit_hashes = result.stdout.strip().split('\n')
        
        if not commit_hashes or commit_hashes == ['']:
            return f"No git commits found mentioning Story {story_id}"
            
        # For simplicity, diff the first commit against its parent
        commit_hash = commit_hashes[-1] # earliest commit
        diff_result = subprocess.run(
            ["git", "show", commit_hash],
            cwd="{project-root}",
            capture_output=True,
            text=True
        )
        return diff_result.stdout
    except Exception as e:
        return str(e)

def prepare_batch():
    workspace_root = "{project-root}"
    sprint_status_path = os.path.join(workspace_root, "_iwish-output", "3. Development", "sprint-status.yaml")
    
    import yaml
    with open(sprint_status_path, 'r') as f:
        data = yaml.safe_load(f)
        
    epic_45_stories = []
    for key, status in data.items():
        if isinstance(key, str) and key.startswith("Story 45.") and status == "completed":
            match = re.search(r"Story (45\.\d+)", key)
            if match:
                epic_45_stories.append(match.group(1))
                
    # Sort for deterministic processing
    epic_45_stories.sort(key=lambda x: float(x))
    
    batches = []
    chunk_size = 2
    for i in range(0, len(epic_45_stories), chunk_size):
        chunk = epic_45_stories[i:i + chunk_size]
        batch_tasks = []
        for story_id in chunk:
            diff = get_git_diff_for_story(story_id)
            # Create Cryptographic Context Binding
            context_str = f"{story_id}-Epic45-BatchReview"
            context_hash = hashlib.sha256(context_str.encode()).hexdigest()[:8]
            
            # Save diff to a scratch file
            diff_path = os.path.join(workspace_root, "_iwish-output", "adhoc-workspace", "scratch", f"diff-{story_id}.diff")
            with open(diff_path, 'w') as df:
                df.write(diff)
                
            batch_tasks.append({
                "story_id": story_id,
                "context_hash": context_hash,
                "diff_path": diff_path
            })
        batches.append(batch_tasks)
        
    output_path = os.path.join(workspace_root, "_iwish-output", "adhoc-workspace", "scratch", "batch-review-epic-45.json")
    with open(output_path, 'w') as f:
        json.dump(batches, f, indent=2)
        
    print(f"Prepared {len(batches)} batches containing {len(epic_45_stories)} total stories for Epic 45.")
    print(f"Instructions saved to {output_path}")

if __name__ == "__main__":
    prepare_batch()
