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

import sys, os, yaml

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: validate-implementation-readiness.py")
        sys.exit(0)

    # Gate 1: Check readiness report exists
    readiness_path = "_iwish-output/2. Product Planning/implementation-readiness-report.md"
    if not os.path.exists(readiness_path):
        print("❌ BLOCK: /check-implementation-readiness has NOT been run.")
        print("   You MUST run /check-implementation-readiness before starting /flow.")
        sys.exit(1)

    # Gate 2: Check sprint-status.yaml exists (populated by readiness)
    sprint_path = "_iwish-output/3. Development/sprint-status.yaml"
    if not os.path.exists(sprint_path):
        print("❌ BLOCK: sprint-status.yaml missing. Run /sprint-planning first.")
        sys.exit(1)

    # Gate 3: Check physical story stubs exist (populated by readiness)
    try:
        with open(sprint_path) as f:
            sprint = yaml.safe_load(f)
    except yaml.YAMLError as exc:
        print(f"❌ BLOCK: Invalid YAML in sprint-status.yaml: {exc}")
        sys.exit(1)

    story_count = 0
    if isinstance(sprint, dict):
        if 'epics' in sprint:
            for epic in sprint.get('epics', []):
                story_count += sum(1 for s in epic.get('stories', []) if isinstance(s, dict) and s.get('status'))
        elif 'stories' in sprint:
            story_count = sum(1 for s in sprint.get('stories', []) if isinstance(s, dict) and s.get('status'))
        elif 'development_status' in sprint:
            story_count = sum(1 for k in sprint['development_status'].keys() if str(k).startswith("story-"))
        else:
            story_count = sum(1 for k in sprint.keys() if str(k).startswith("Story ") or str(k).startswith("story-"))
    
    if story_count == 0:
        print("❌ BLOCK: No stories found in sprint-status.yaml")
        sys.exit(1)

    print(f"✅ PASS: Implementation readiness verified. {story_count} stories found.")
    sys.exit(0)

if __name__ == "__main__":
    main()
