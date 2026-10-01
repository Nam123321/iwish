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
import argparse
import re
from pathlib import Path

def get_project_root():
    return Path(__file__).resolve().parents[2]

def extract_story_status(story_content):
    # Parse YAML frontmatter for status: <status>
    match = re.search(r'^status:\s*([a-zA-Z0-9_-]+)', story_content, re.MULTILINE)
    if match:
        return match.group(1).lower().strip()
    return None

def find_epic_file(story_id, project_root):
    # Extract epic_id from story_id (e.g. 55.2 -> 55, or 55 -> 55)
    epic_id_match = re.match(r'^(\d+)', str(story_id))
    if not epic_id_match:
        return None
    epic_id = epic_id_match.group(1)
    
    # Hierarchical Layout
    search_path = project_root / "_iwish-output" / "3. Development" / "1. Epic & Story"
    if search_path.exists():
        for epic_dir in search_path.rglob(f"Epic-{epic_id}"):
            if epic_dir.is_dir() and (epic_dir / "epic.md").is_file():
                return epic_dir / "epic.md"
                
    # Flat Layout
    flat_path = project_root / "_iwish-output" / "epics"
    if flat_path.exists():
        epic_file = flat_path / f"epic-{epic_id}.md"
        if epic_file.is_file():
            return epic_file
            
    return None

def check_sync(story_path, story_id=None):
    try:
        story_content = Path(story_path).read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ Error reading {story_path}: {e}")
        return 1

    story_status = extract_story_status(story_content)
    if not story_status:
        # Not a valid story file or missing status, just warn and pass
        print(f"⚠️ Warning: Could not extract status from {story_path}. Assuming bypass.")
        return 0

    if not story_id:
        # Extract from filename e.g. story-55.2.md or parse directory
        m = re.search(r'story-(\d+\.\d+)\.md', str(story_path))
        if m:
            story_id = m.group(1)
        else:
            # Maybe it's in a folder Epic-55/Story-55.2/story.md
            m = re.search(r'Story-(\d+\.\d+)', str(story_path))
            if m:
                story_id = m.group(1)
            else:
                print(f"⚠️ Warning: Could not deduce story ID from {story_path}")
                return 0

    project_root = get_project_root()
    epic_file = find_epic_file(story_id, project_root)
    
    if not epic_file:
        print(f"⚠️ Warning: Could not find parent epic file for Story {story_id}")
        return 0

    try:
        epic_content = epic_file.read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ Error reading {epic_file}: {e}")
        return 1

    # Robust regex for table: | **Story-55.2** | Title | Dep | Status |
    # We want the last column
    # The table can have markdown formatting like bold (**), different spacing.
    # Regex: \| \**Story-55\.2\** \|.*?\|.*?\|\s*(\w+)\s*\|
    escaped_id = re.escape(story_id)
    # E.g. | **Story-55.2** | Feature | | backlog |
    # Regex will match a line starting with | containing the story ID (with optional bold/Story- prefix)
    # Then capturing the status in the 4th column.
    
    pattern = r'\|\s*(?:\[)?\**(?:Story-)?' + escaped_id + r'\**(?:\]\(.*?\))?\s*\|.*?\|.*?\|\s*([a-zA-Z0-9_-]+)\s*\|'
    epic_match = re.search(pattern, epic_content, re.IGNORECASE)
    
    if not epic_match:
        print(f"⚠️ Warning: Story {story_id} not found in epic table of {epic_file}")
        return 0
        
    epic_status = epic_match.group(1).lower().strip()
    
    if story_status != epic_status:
        print(f"❌ [GIT HOOK BLOCK] Context Drift Detected for Story {story_id}!")
        print(f"   Story Status: {story_status} (in {story_path})")
        print(f"   Epic Status:  {epic_status} (in {epic_file})")
        print("----------------------------------------------------------------------")
        print("[LLM DIRECTIVE] Context drift detected! DO NOT manually edit epic.md.")
        print("You MUST run `/reconcile-change` or `python3 .agent/scripts/sprint-manager.py`")
        print("to synchronize the index before retrying.")
        print("----------------------------------------------------------------------")
        return 1
        
    print(f"✅ Epic Sync Validation Passed: Story {story_id} ({story_status}) matches Epic.")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Validate Epic/Story sync status.")
    parser.add_argument("--story-dir", help="Directory of the story")
    parser.add_argument("--story-id", help="ID of the story (e.g. 55.2)")
    parser.add_argument("--staged-file", help="Path to a staged story.md file")
    
    args = parser.parse_args()
    
    if args.staged_file:
        sys.exit(check_sync(args.staged_file))
    elif args.story_dir and args.story_id:
        # Find the story file
        sdir = Path(args.story_dir)
        sf1 = sdir / "story.md"
        sf2 = sdir / f"story-{args.story_id}.md"
        story_file = sf1 if sf1.exists() else sf2
        
        if not story_file.exists():
            print(f"❌ Error: Cannot find story markdown in {args.story_dir}")
            sys.exit(1)
            
        sys.exit(check_sync(story_file, args.story_id))
    else:
        print("❌ Error: Must provide either --staged-file or both --story-dir and --story-id")
        sys.exit(1)

if __name__ == "__main__":
    main()
