---
name: sync-stitch-design
description: 'Synchronizes the local DESIGN.md file with the Stitch MCP server, creating or updating a design system asset.'
disable-model-invocation: true
---

# Sync Stitch Design Workflow

**Goal:** Push the local `DESIGN.md` content of a specific portal to Stitch MCP to create or update a Design System Asset. This ensures consistency between local files and Stitch's cloud environment.

**Handled By:** ux-agent (UX Designer) or dev-agent (Developer).

---

## PREREQUISITES

1. The user must have a `DESIGN.md` file located at `{planning_artifacts}/design-system/{portal-slug}/DESIGN.md`.
2. The user MUST explicitly approve syncing before this workflow runs.

---

## EXECUTION STEPS

### 1. Identify Target Project
- Identify the portal/project the user wants to sync.
- Locate the correct `DESIGN.md` file for that portal.
- Check if a `stitch-project.json` exists for that portal to retrieve an existing `projectId` and `assetId`. If not, ask the user if they want to create a new Stitch project or link an existing one.

### 2. Read DESIGN.md
- Use the `view_file` tool to read the full contents of the `DESIGN.md` file.
- Convert the contents to a base64 string (run `base64 -w 0 <path>`).

### 3. Upload and Create/Update Design System
- **If new project/asset:**
  1. Call `mcp_StitchMCP_upload_design_md` with the `designMdBase64`.
  2. Call `mcp_StitchMCP_create_design_system_from_design_md` using the returned screen instance.
  3. Store the newly generated `projectId` and `assetId` in a local config file (e.g., `stitch-project.json` in the portal's design-system folder) for future reference.
- **If existing project/asset:**
  1. Call `mcp_StitchMCP_upload_design_md`.
  2. Call `mcp_StitchMCP_update_design_system` to update the existing asset.

### 4. Complete
- Announce to the user that the synchronization is complete.
- Output the `projectId` and `assetId` for their reference.
- Remind the user that future `/create-ui-spec` requests for this portal will use this newly synced asset.
