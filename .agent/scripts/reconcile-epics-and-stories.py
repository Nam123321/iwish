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

# Replace Epic-41
stories_41 = """
### Story-41.11a: SME Default Tool Kit Research & Prototyping
- **As a** Researcher, **I want** to...
- **Story Points**: 5
- **Dependencies**: Story-41.4

### Story-41.11b: SME Default Tool Kit Onboarding UI
- **Story Points**: 5
- **Dependencies**: Story-41.11a

### Story-41.12: Plugin-as-MCP-Bridge Registry
- **Story Points**: 8
- **Dependencies**: Story-41.3

### Story-41.14: Component Adapter Layer (Multi-Surface Rendering)
- **Story Points**: 8
- **Dependencies**: Story-41.2

### Story-41.15: Kit Import & Absorption Pipeline
- **Story Points**: 8
- **Dependencies**: Story-41.2

### Story-41.16: Template Builder Agent (Low-Code Assistant)
- **Story Points**: 8
- **Dependencies**: Story-41.4

### Story-41.18: Kit Classification Engine
- **As a** Platform Engineer, **I want** to implement the Kit Classification Engine **so that** we can categorize imported packages into TOOL_KIT, SKILL_KIT, AGENT_KIT, WORKFLOW_KIT, or HYBRID_KIT based on defined schema.
- **Story Points**: 5
- **Dependencies**: Story-41.1

### Story-41.19: Pack Manifest Schema (pack.yaml v2)
- **As a** Platform Engineer, **I want** to define the Pack Manifest Schema **so that** external packages provide consistent metadata for processing.
- **Story Points**: 3
- **Dependencies**: Story-41.1

### Story-41.20: Pack Hunter Agent
- **As a** Researcher, **I want** a Pack Hunter Agent **so that** it can explore GitHub and identify repositories that match SME use-cases.
- **Story Points**: 8
- **Dependencies**: Story-41.19

### Story-41.21: Pack Security Gate
- **As a** Security Admin, **I want** a security gate during import **so that** malicious packages are blocked before absorption.
- **Story Points**: 5
- **Dependencies**: Story-41.20

### Story-41.22: Pack Forger Pipeline
- **As a** Platform Engineer, **I want** the Pack Forger Pipeline **so that** identified repos are rewritten to comply with the Cowok.ai Plugin Schema.
- **Story Points**: 8
- **Dependencies**: Story-41.21

### Story-41.23: Kit Routing Dispatcher
- **As a** Platform Engineer, **I want** a Kit Routing Dispatcher **so that** imported kits are routed to the correct UI tab (Plugins vs Skills).
- **Story Points**: 5
- **Dependencies**: Story-41.22

### Story-41.24: Tool Collision Policy Engine
- **As a** Platform Engineer, **I want** a collision policy engine **so that** identical tools or conflicting agents are handled gracefully.
- **Story Points**: 5
- **Dependencies**: Story-41.23

### Story-41.25: Kit Marketplace Foundation
- **As a** Tenant Admin, **I want** a UI marketplace **so that** I can browse, hunt, and install kits.
- **Story Points**: 8
- **Dependencies**: Story-41.23
"""

# Insert stories before the next "---" after "Epic-41:"
epic_41_idx = content.find("## Epic-41:")
next_hr_idx = content.find("---", epic_41_idx)
if epic_41_idx != -1 and next_hr_idx != -1:
    content = content[:next_hr_idx] + stories_41 + "\n" + content[next_hr_idx:]


with open(path, 'w') as f:
    f.write(content)

print("Updated epics-and-stories.md")
