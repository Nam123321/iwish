# NotebookLM Foundation Setup Implementation

This document defines the implementation specifications for the `/nlm-setup` workflow. Execute these steps sequentially to initialize the NotebookLM foundation.

---

## Step 1: Verify MCP Connection
First, verify that the `notebooklm-mcp` server is accessible and authenticated.
- Call the `server_info` tool from `notebooklm-mcp`.
- **If it fails:** Halt the workflow and guide the user through authentication recovery (e.g., checking credentials, running `refresh_auth`). Do not proceed until the connection is established.

## Step 2: Query User for Inherited Notebooks
Ask the user explicitly:
> "Bạn có notebooks/folders nào đã có trên NotebookLM có thể dùng cho dự án này không? (Ví dụ: Notebook về domain knowledge cũ, tài liệu kỹ thuật có sẵn)"

## Step 3: List Existing Notebooks
- Call the `notebook_list()` tool to retrieve all accessible notebooks under the current account.
- Present this list to the user so they can select which ones to inherit/map into the current project's registry.

## Step 4: Create/Verify Notebook Registry
Create or update the file `_iwish-output/notebooks/notebook-registry.yaml`.
- Ensure it contains the standard structure.
- Add any user-selected inherited notebooks with their respective IDs and metadata.
- If the directory `_iwish-output/notebooks/` does not exist, create it.

*Example structure for `notebook-registry.yaml`:*
```yaml
notebooks:
  - id: "notebook-id-123"
    name: "Legacy Domain Knowledge"
    type: "inherited"
    last_synced: "2024-01-01T00:00:00Z"
```

## Step 5: Create/Verify Domain Taxonomy
Create or update the file `_iwish-output/notebooks/domain-taxonomy.yaml`.
- This file should define the conceptual domains for the project (e.g., Core Architecture, UI/UX, Backend Services, Domain Research).
- Map the inherited notebooks (from Step 4) into these domains.

## Step 6: Create/Verify Foundation Checklist
Create or update the file `_iwish-output/notebooks/foundation-checklist.yaml`.
- This checklist defines the 14 standard foundation notebooks expected in a complete I-Wish project (e.g., PRD Node, Architecture Node, UI Spec Node, etc.).
- Mark the status of each standard notebook as `active`, `missing`, or `inherited` based on the current registry.

## Step 7: Final Report
Generate a summary report for the user containing:
- **Registry Summary:** Total notebooks registered.
- **Inherited Count:** Number of external notebooks successfully linked.
- **Foundation Gate Status:** A brief overview of the `foundation-checklist.yaml` (e.g., "3/14 foundation notebooks initialized").
- **Next Steps:** Recommend running `/nlm-research` or `/nlm push` to populate missing nodes.
