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

import re

path = "_iwish-output/2. Product Planning/2.4. epics-and-stories.md"
with open(path, 'r') as f:
    content = f.read()

stories_50 = """
### Story-50.5: WORKSPACE_KIT Executor
- **As a** Platform Engineer, **I want** the executor to handle WORKSPACE_KIT loading.
- **Story Points**: 5
- **Dependencies**: Epic-41

### Story-50.6: WorkspaceSession State Management
- **As a** Platform Engineer, **I want** state management for WorkspaceSession.
- **Story Points**: 8

### Story-50.7: Workspace Collaboration (Y.js Bridge)
- **As a** User, **I want** real-time collaboration within workspaces.
- **Story Points**: 8

### Story-50.8: Workspace UI Panel
- **As a** User, **I want** a UI panel to interact with active workspaces.
- **Story Points**: 5
"""

stories_51 = """
### Story-51.10: WorkTeam Workspace Adapter
- **As a** Platform Engineer, **I want** WorkTeam agents to integrate seamlessly with WorkspaceSession models.
- **Story Points**: 8
"""

# Insert stories before the next "---" after "Epic-50:"
epic_50_idx = content.find("## Epic-50:")
next_hr_idx = content.find("---", epic_50_idx)
if epic_50_idx != -1 and next_hr_idx != -1:
    content = content[:next_hr_idx] + stories_50 + "\n" + content[next_hr_idx:]

# Insert stories before the next "---" after "Epic-51:"
epic_51_idx = content.find("## Epic-51:")
next_hr_idx = content.find("---", epic_51_idx)
if epic_51_idx != -1 and next_hr_idx != -1:
    content = content[:next_hr_idx] + stories_51 + "\n" + content[next_hr_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Updated epics-and-stories.md for Epic 50 and 51")
