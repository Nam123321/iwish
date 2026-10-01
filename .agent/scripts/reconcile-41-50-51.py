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
import yaml
import os

print("Updating sprint-status.yaml")
yaml_path = "_iwish-output/3. Development/sprint-status.yaml"
with open(yaml_path, 'r') as f:
    lines = f.readlines()

def add_stories(lines, epic_anchor, new_stories):
    # find the epic_anchor
    idx = -1
    for i, line in enumerate(lines):
        if epic_anchor in line:
            idx = i
            break
    if idx == -1:
        return lines
    
    # insert after the last story in this epic section (before empty line or next epic)
    insert_idx = idx + 1
    while insert_idx < len(lines) and (lines[insert_idx].strip().startswith("story-") or lines[insert_idx].strip() == ""):
        insert_idx += 1
    
    # go back if we are at empty lines
    while insert_idx > 0 and lines[insert_idx-1].strip() == "":
        insert_idx -= 1
        
    for story in reversed(new_stories):
        lines.insert(insert_idx, f"  {story}: backlog\n")
    return lines

lines = add_stories(lines, "epic-41-plugin-standards", [
    "story-41-11a-sme-toolkit-research-prototype",
    "story-41-11b-sme-toolkit-onboarding-ui",
    "story-41-12-plugin-as-mcp-bridge-registry",
    "story-41-14-component-adapter-layer-multi-surface-rendering",
    "story-41-15-kit-import-and-absorption-pipeline",
    "story-41-16-template-builder-agent-low-code-assistant",
    "story-41-18-kit-classification-engine",
    "story-41-19-pack-manifest-schema-v2",
    "story-41-20-pack-hunter-agent",
    "story-41-21-pack-security-gate",
    "story-41-22-pack-forger-pipeline",
    "story-41-23-kit-routing-dispatcher",
    "story-41-24-tool-collision-policy-engine",
    "story-41-25-kit-marketplace-foundation"
])

lines = add_stories(lines, "epic-50", [
    "story-50-5-workspace-kit-executor",
    "story-50-6-workspacesession-state-management",
    "story-50-7-workspace-collaboration-yjs-bridge",
    "story-50-8-workspace-ui-panel"
])

lines = add_stories(lines, "epic-51", [
    "story-51-10-workteam-workspace-adapter"
])

# Remove duplicates
seen = set()
new_lines = []
for line in lines:
    key = line.split(':')[0].strip() if ':' in line else line
    if key and key.startswith("story-"):
        if key in seen:
            continue
        seen.add(key)
    new_lines.append(line)

with open(yaml_path, 'w') as f:
    f.writelines(new_lines)

print("sprint-status.yaml updated.")
