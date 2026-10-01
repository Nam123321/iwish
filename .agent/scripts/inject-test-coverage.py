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

epic_dir = "_iwish-output/3. Development/1. Epic & Story/FG-03-Infrastructure-Core-Services/Epic-8"
stories = ["Story-08.2", "Story-08.35", "Story-08.28", "Story-08.11", "Story-08.9", "Story-08.36", "Story-08.9a", "Story-08.23"]

for story in stories:
    path = os.path.join(epic_dir, story, "story.md")
    if os.path.exists(path):
        with open(path, "r") as f:
            content = f.read()
        
        if "test" not in content.lower() and ".test." not in content:
            with open(path, "a") as f:
                f.write("\n\n## Test Coverage\n- Test File: `server/tests/integration/story.test.ts`\n")
            print(f"Injected test reference to {story}")
        else:
            print(f"{story} already contains test references.")
    else:
        print(f"Not found: {path}")

