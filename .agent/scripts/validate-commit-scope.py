#!/usr/bin/env python3
"""
validate-commit-scope.py — Pre-Commit Scope Guard
Prevents cross-story code contamination by verifying staged files
belong to the current story's branch.

Usage (standalone):  python3 validate-commit-scope.py
Usage (pre-commit):  Integrated into .git/hooks/pre-commit

Exit codes:
  0 = Clean commit, all files belong to current story scope
  1 = Cross-story contamination detected — commit BLOCKED
  2 = Warning only (--warn mode)
"""
import subprocess
import sys
import re
import os
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

def run_cmd(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()

def get_current_branch():
    return run_cmd(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])

def extract_story_id(branch_name):
    """Extract story ID from branch name like feature/story-46.11"""
    match = re.search(r'story-(\d+\.\d+[a-z]?)', branch_name)
    return match.group(1) if match else None

def extract_epic_id(story_id):
    """Extract epic ID from story ID like 46.11 -> 46"""
    return story_id.split('.')[0] if story_id else None

def get_staged_files():
    """Get list of files staged for commit."""
    output = run_cmd(['git', 'diff', '--cached', '--name-only'])
    return [f for f in output.split('\n') if f.strip()]

def classify_file(filepath, story_id, epic_id):
    """
    Classify a file as belonging to current story, shared infra, or foreign.
    Returns: ('own', 'shared', 'foreign', 'suspect')
    """
    # Shared infrastructure files (always allowed)
    shared_patterns = [
        r'^\.gitignore$',
        r'^\.gitattributes$',
        r'^package\.json$',
        r'^package-lock\.json$',
        r'^pnpm-lock\.yaml$',
        r'^tsconfig',
        r'^vite\.config',
        r'^prisma/',
        r'^\.eslint',
        r'^\.prettier',
    ]
    for pat in shared_patterns:
        if re.match(pat, filepath):
            return 'shared'

    # Agent/workflow files (always allowed — agents modify these)
    if filepath.startswith('.agent/') or filepath.startswith('.agents/'):
        return 'shared'

    # _iwish-output: check if it belongs to current story's epic
    if filepath.startswith('_iwish-output/'):
        # Story-specific files
        story_match = re.search(r'Story-(\d+\.\d+[a-z]?)', filepath)
        if story_match:
            file_story = story_match.group(1)
            if file_story == story_id:
                return 'own'
            else:
                return 'foreign'
        # Epic-level files
        epic_match = re.search(r'Epic-(\d+)', filepath)
        if epic_match:
            file_epic = epic_match.group(1)
            if file_epic == epic_id:
                return 'own'
        # Generic _iwish-output (reviews, adhoc, etc.) — allowed
        return 'shared'

    # Source code: check for story annotations in filename or path
    # Files like tests/e2e/Story-23.10.spec.ts
    story_in_path = re.search(r'[Ss]tory[-_]?(\d+\.\d+[a-z]?)', filepath)
    if story_in_path:
        file_story = story_in_path.group(1)
        if file_story == story_id:
            return 'own'
        else:
            return 'foreign'

    # Epic in test path like tests/e2e/Epic-23/
    epic_in_path = re.search(r'Epic[-_]?(\d+)', filepath)
    if epic_in_path:
        file_epic = epic_in_path.group(1)
        if file_epic == epic_id:
            return 'own'
        else:
            return 'suspect'

    # Generic source code — could be anything
    return 'own'

def main():
    warn_only = '--warn' in sys.argv

    branch = get_current_branch()
    story_id = extract_story_id(branch)

    if not story_id:
        # Not on a story branch (e.g., master, develop)
        print(f"ℹ️  Branch '{branch}' is not a story branch. Scope check skipped.")
        sys.exit(0)

    epic_id = extract_epic_id(story_id)
    staged_files = get_staged_files()

    if not staged_files:
        sys.exit(0)

    foreign_files = []
    suspect_files = []

    for f in staged_files:
        classification = classify_file(f, story_id, epic_id)
        if classification == 'foreign':
            foreign_files.append(f)
        elif classification == 'suspect':
            suspect_files.append(f)

    # GATE 1: Kitchen-sink detection
    BULK_THRESHOLD = 50
    if len(staged_files) > BULK_THRESHOLD:
        print(f"⚠️  WARNING: {len(staged_files)} files staged (threshold: {BULK_THRESHOLD}).")
        print(f"   Possible 'git add .' detected. Please use 'git add <specific-files>' instead.")
        if not warn_only:
            print(f"❌ BLOCKED: Bulk commit on story branch '{branch}'.")
            print(f"   Use 'git add <file1> <file2> ...' to stage only Story-{story_id} files.")
            sys.exit(1)

    # GATE 2: Cross-story contamination
    if foreign_files:
        print(f"❌ CROSS-STORY CONTAMINATION DETECTED on branch '{branch}' (Story-{story_id}):")
        print(f"   The following {len(foreign_files)} file(s) belong to OTHER stories:")
        for f in foreign_files[:20]:
            print(f"   ⛔ {f}")
        if len(foreign_files) > 20:
            print(f"   ... and {len(foreign_files) - 20} more")
        if not warn_only:
            print(f"\n❌ COMMIT BLOCKED. Remove foreign files from staging:")
            print(f"   git reset HEAD {' '.join(foreign_files[:5])}")
            sys.exit(1)
        else:
            print(f"\n⚠️  WARNING MODE: Commit allowed but contamination detected.")
            sys.exit(2)

    # GATE 3: Suspect files (different epic in test path)
    if suspect_files:
        print(f"⚠️  SUSPECT FILES on branch '{branch}' (Story-{story_id}, Epic-{epic_id}):")
        for f in suspect_files[:10]:
            print(f"   ❓ {f}")
        print(f"   These files reference a different Epic. Verify they belong to Story-{story_id}.")

    print(f"✅ Commit scope validated for Story-{story_id} on '{branch}'. {len(staged_files)} file(s) OK.")
    sys.exit(0)

if __name__ == '__main__':
    main()
