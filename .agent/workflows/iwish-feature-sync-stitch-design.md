---
name: sync-stitch-design
description: 'Synchronizes the local DESIGN.md file with the Stitch MCP server, creating or updating a design system asset dynamically.'
disable-model-invocation: true
---

# Sync Stitch Design Workflow

**Goal:** Push the local `DESIGN.md` content of a specific portal to Stitch MCP to create or update a Design System Asset dynamically (without hardcoding Project or Asset IDs). This ensures consistency between local files and Stitch's cloud environment.

**Handled By:** ux-agent (UX Designer) or dev-agent (Developer).

---

## PREREQUISITES

1. The user must have a `DESIGN.md` file located at:
   - Default Master: `_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md`
   - Or portal specific: `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`
2. The user MUST explicitly approve syncing before this workflow runs.

---

## EXECUTION STEPS

### 1. Identify Target Project & Dynamic SSOT Resolution (NO HARD LINKS)
- Determine the active portal/project to sync (default: `cowokai` Master Portal, or portal-specific e.g. `admin-portal`).
- Locate the correct `DESIGN.md` file:
  `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md` (or `_iwish-output/2. Product Planning/design-system/cowokai/DESIGN.md`).
- Read the YAML frontmatter of `DESIGN.md` using `view_file` to dynamically extract:
  - `projectId` / `stitch_project_id` -> `{resolved_project_id}`
  - `assetId` / `stitch_asset_id` -> `{resolved_asset_id}`
- If a `stitch-project.json` exists in the portal directory, inherit any configuration properties from it.
- If `{resolved_project_id}` is not found:
  - Call `call_mcp_tool("stitch", "list_projects", {})` to query registered Stitch projects.
  - Or ask the user if they wish to create a new Stitch project via `call_mcp_tool("stitch", "create_project", { "title": "<Portal Name>" })`.

### 2. Read and Base64 Encode DESIGN.md
- Read the full contents of `DESIGN.md`.
- Convert the contents to a base64 string:
  ```bash
  base64 -i "<path_to_design.md>" | tr -d '\n'
  ```

### 3. Upload and Create/Update Design System via Stitch MCP

> **Note on Tool Invocations:**
> Stitch MCP tools are lazily-loaded. Always invoke via the native `call_mcp_tool` interface:
> `call_mcp_tool(ServerName: "stitch", ToolName: "<tool_name>", Arguments: { ... })`.
> Do NOT use outdated prefixes like `mcp_StitchMCP_` or hardcoded IDs.

#### Step 3.1: Discover Existing Assets (Optional / Verification)
If verifying whether an asset is already registered in the project:
Call `call_mcp_tool`:
```json
{
  "ServerName": "stitch",
  "ToolName": "list_design_systems",
  "Arguments": {
    "projectId": "{resolved_project_id}"
  }
}
```

#### Step 3.2: Upload DESIGN.md (Markdown Asset Upload)
Upload the base64-encoded markdown to the Stitch project:
Call `call_mcp_tool`:
```json
{
  "ServerName": "stitch",
  "ToolName": "upload_design_md",
  "Arguments": {
    "projectId": "{resolved_project_id}",
    "designMdBase64": "<base64_string>"
  }
}
```
*Note: This creates a screen instance representing the uploaded Markdown inside the Stitch project.*

#### Step 3.3: Create or Update Design System Asset

##### Case A: Create New Design System Asset from Uploaded Markdown
Immediately after `upload_design_md`, create the design system referencing the screen instance returned or fetched via `get_project`:
Call `call_mcp_tool`:
```json
{
  "ServerName": "stitch",
  "ToolName": "create_design_system_from_design_md",
  "Arguments": {
    "projectId": "{resolved_project_id}",
    "selectedScreenInstance": {
      "id": "<screen_instance_id>",
      "sourceScreen": "projects/{resolved_project_id}/screens/<source_screen_id>"
    },
    "deviceType": "DESKTOP"
  }
}
```

##### Case B: Update Existing Design System Asset (Direct Token / Theme Sync)
When updating an already-registered design system asset (`{resolved_asset_id}`):
Call `call_mcp_tool`:
```json
{
  "ServerName": "stitch",
  "ToolName": "update_design_system",
  "Arguments": {
    "projectId": "{resolved_project_id}",
    "name": "{resolved_asset_id}",
    "designSystem": {
      "displayName": "Cowok.ai Design System",
      "theme": {
        "colorMode": "LIGHT",
        "headlineFont": "PLUS_JAKARTA_SANS",
        "bodyFont": "INTER",
        "roundness": "ROUND_EIGHT",
        "customColor": "#0057FF",
        "designMd": "<markdown_content_string>"
      }
    }
  }
}
```

### 4. Complete & Record Evidence
- Output the `{resolved_project_id}` and `{resolved_asset_id}` to the user.
- Update YAML frontmatter in `DESIGN.md` (and `stitch-project.json` if used) if a new `assetId` was generated.
- Remind the user that downstream `/flow-stage-2a-design-gen` and `/make-ui-spec` will dynamically inherit this synced asset.
