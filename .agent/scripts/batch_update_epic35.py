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

base_dir = "_iwish-output/3. Development/1. Epic & Story/FG-01. Platform Foundation & Connectors/Epic-35"

pbac_content = """## 🔒 Access Control (PBAC)
- **Workspace Connectors (MCP Servers Tab):**
  - **Required Roles:** ADMIN
  - **Policy Definition:** `PlatformCredential` records at the workspace level are isolated by `tenantId`. Only users with the ADMIN role belonging to the matching tenant can read, create, update, or delete workspace-wide connectors.
- **Personal Connectors (Personal MCP Servers Tab):**
  - **Required Roles:** MEMBER, STAFF
  - **Policy Definition:** `PlatformCredential` records at the personal level are strictly isolated by `userId`. Users can only read, create, update, or delete their own personal connector configurations. Row-Level Security (RLS) policies enforce this isolation to prevent multi-tenant exposure or other members from accessing personal local configurations.
"""

async_processing_content = """
### Asynchronous Processing (Alignment with Epic-56 & Epic-62)
To comply with **Epic-56 (Asynchronous MCP Runtime)** and **Epic-62 (Data Store Separation)**, any MCP tool execution or external webhook callback MUST NOT be processed synchronously.
1. **Queueing**: The gateway validates the request, then immediately pushes the payload to the **BullMQ Task Queue**.
2. **Infrastructure**: BullMQ relies on the dedicated Queue Redis instance configured in Epic-62.
3. **Execution**: A background worker picks up the job and executes the necessary MCP tools or API interactions.
"""

def update_story(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace PBAC section
    if "## 🔒 Access Control (PBAC)" in content:
        # Regex to match from PBAC to the next H2 or EOF
        new_content = re.sub(r'## 🔒 Access Control \(PBAC\).*?(?=\n## |\Z)', pbac_content, content, flags=re.DOTALL)
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated PBAC in {filepath}")

def update_ui_spec(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Update portal to 2-tabs
    if "- **Portal**:" in content and "Workspace Connectors Tab" not in content:
        new_content = re.sub(r'- \*\*Portal\*\*:.*?(?=\n- \*\*Status\*\*:)', 
                             "- **Portal**: \n  1. Workspace Connectors Tab (Admin only)\n  2. Personal Connectors Tab (Staff)\n", 
                             content, flags=re.DOTALL)
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated Portal in {filepath}")

def update_data_spec(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    changed = False
    # 1. Update PlatformCredential model
    if "model PlatformCredential" in content and "userId" not in content:
        new_content = content.replace("  tenantId       String\n", "  tenantId       String\n  userId         String?  // NULL = Workspace-level. Set = Personal-level.\n")
        new_content = new_content.replace("  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n}", "  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n  user           User?    @relation(fields: [userId], references: [id], onDelete: Cascade)\n}")
        content = new_content
        changed = True
    
    # 2. Append Async Processing alignment if not present
    if "Epic-56" not in content and "Epic-62" not in content:
        # Append before the status line or at the end
        if "**Status:**" in content:
            content = content.replace("**Status:**", async_processing_content + "\n**Status:**")
        else:
            content += async_processing_content
        changed = True
        
    if changed:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated Data Spec in {filepath}")

for story_dir in glob.glob(os.path.join(base_dir, "Story-*")):
    story_file = os.path.join(story_dir, "story.md")
    ui_spec_file = os.path.join(story_dir, "ui-spec.md")
    data_spec_file = os.path.join(story_dir, "data-spec.md")
    
    if os.path.exists(story_file):
        update_story(story_file)
    if os.path.exists(ui_spec_file):
        update_ui_spec(ui_spec_file)
    if os.path.exists(data_spec_file):
        update_data_spec(data_spec_file)

print("Batch update complete.")
