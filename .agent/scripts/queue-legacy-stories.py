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
import subprocess
import json
from pathlib import Path

def main():
    base_dir = "{project-root}/_iwish-output/3. Development/1. Epic & Story/"
    queue_file = "{project-root}/_iwish/runtime/refactoring-queue/legacy-upgrade-queue.json"
    
    os.makedirs(os.path.dirname(queue_file), exist_ok=True)
    
    legacy_queue = []
    
    # Find all story.md files
    story_files = glob.glob(os.path.join(base_dir, "**", "story.md"), recursive=True)
    
    for file_path in story_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                if "status: completed" in content.lower():
                    # Check validation
                    result = subprocess.run(["python3", "{project-root}/.agent/scripts/validate-story.py", file_path], capture_output=True, text=True)
                    if result.returncode != 0 or "EC-P9-001" in result.stdout:
                        legacy_queue.append({
                            "file": file_path,
                            "stdout": result.stdout,
                            "stderr": result.stderr
                        })
                        print(f"Queued: {file_path}")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    with open(queue_file, "w", encoding="utf-8") as f:
        json.dump(legacy_queue, f, indent=2, ensure_ascii=False)
        
    print(f"\nTotal legacy completed stories needing upgrade: {len(legacy_queue)}")
    print(f"Queue written to {queue_file}")

if __name__ == "__main__":
    main()
