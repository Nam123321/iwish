---
name: notebook-lifecycle-manager
description: Manages NotebookLM notebook lifecycle - CRUD, naming convention, health check, sync, foundation gate, sizing heuristic
inputs: ['registry_data', 'file_change_events', 'workflow_triggers']
outputs: ['notebook_confirmations', 'foundation_checklist_updates', 'sync_reports']
mcp_tools_required: ['notebooklm-mcp/notebook_create', 'notebooklm-mcp/notebook_delete', 'notebooklm-mcp/notebook_rename', 'notebooklm-mcp/notebook_list', 'notebooklm-mcp/notebook_get', 'notebooklm-mcp/source_add', 'notebooklm-mcp/source_delete', 'notebooklm-mcp/source_sync_drive', 'notebooklm-mcp/server_info']
subagent_triggers: []
---

# Notebook Lifecycle Manager

## 🎯 Purpose
The Notebook Lifecycle Manager is a FOUNDATION skill responsible for governing the end-to-end lifecycle of NotebookLM notebooks within the I-Wish ecosystem. It enforces strict naming conventions, manages synchronization protocols, ensures notebooks do not exceed size heuristics, and maintains the overall health of the notebook ecosystem to prevent sprawl and guarantee high-quality context retrieval.

## 📋 Prerequisites
- A configured `notebooklm-mcp` gateway.
- Valid authentication tokens for NotebookLM (can be verified via `notebooklm-mcp/server_info`).
- The `notebook-registry-manager` skill must be available for registry updates.

## 📏 Naming Convention
To ensure consistent organization and easy retrieval, all notebooks MUST adhere to the following naming conventions based on their purpose:

1. **Core Notebooks**: Long-lived, foundational knowledge bases.
   - Format: `{Project}/Core-{name}`
   - Example: `Cowok/Core-Architecture-Guidelines`
2. **Research Notebooks**: Thematic exploration and discovery.
   - Format: `{Project}/Research-{name}`
   - Example: `Cowok/Research-Competitor-Analysis`
3. **Operational Context Notebooks**: Specific to epics or sprints.
   - Format: `{Project}/Epic-{N}-Context`
   - Example: `Cowok/Epic-12-Context`
4. **Ephemeral Notebooks**: Short-lived, task-specific scratchpads.
   - Format: `Ephemeral: {desc}`
   - Example: `Ephemeral: Bug-Fix-404-Analysis`

## ⚖️ Sizing Heuristic
To maintain optimal retrieval quality and prevent context dilution, notebooks must be sized according to the following heuristics:

- **≤ 250 sources**: Optimal size. Maintain 1 notebook.
- **251 - 380 sources**: Nearing capacity. You must explicitly check domain diversity. If sources cover > 3 distinct sub-domains, consider splitting.
- **> 400 sources**: CRITICAL WARNING. Force split the notebook into specialized sub-notebooks.

## 🔄 3-Tier Sync Protocol
Synchronization between the physical file system and NotebookLM sources is managed via a 3-Tier protocol:

1. **Tier 1 (Trigger-based, real-time)**: Immediate sync upon file modification events (e.g., saving a PRD or Design document).
2. **Tier 2 (Staleness detection)**: Executed per `/flow` invocation. You MUST run `python3 .agent/scripts/audit_notebook_staleness.py`. If it returns Exit Code 1, you must perform a sync. Do NOT attempt to manually calculate or guess staleness.
3. **Tier 3 (Hash audit weekly)**: A comprehensive deep-scan that compares MD5 hashes of local files against source metadata in NotebookLM. (Also handled by the `audit_notebook_staleness.py` script).

## 📊 Sync Eligibility Matrix

> **⚠️ CRITICAL: Do NOT hardcode file names.** File naming follows a numbered prefix convention (e.g., `2.1. product-brief-or-prd.md`, `2.5. architecture.md`) that may evolve. Always resolve files by scanning the directory and matching by **semantic intent** (keywords/patterns), never by exact filename.

Defines how different artifact categories are synced to NotebookLM sources:

| Category | Discovery Pattern | Target Notebook | Sync Mode | Notes |
|----------|------------------|-----------------|-----------|-------|
| **PRD / Product Brief** | Scan `_iwish-output/2. Product Planning/` for files matching `*prd*`, `*product-brief*`, or `*product-requirement*` | PC-1 (Core-PRD) | Replace | Full doc re-upload to maintain SSOT |
| **Architecture** | Scan `_iwish-output/2. Product Planning/` for files matching `*architecture*` | PC-2 (Core-Architecture) | Replace | Entire doc replaced |
| **Design System** | Scan `_iwish-output/2. Product Planning/design-system/` for `DESIGN.md` or `*.md` files | PC-2 (Core-Architecture) | Replace | Design tokens & component registry |
| **UX Spec** | Scan `_iwish-output/2. Product Planning/` for files matching `*ui-ux*`, `*ux-spec*`, `*ui-spec*` | PC-3 (Core-UX) | Replace | Global UX guidelines |
| **Database Spec** | Scan `_iwish-output/2. Product Planning/` for files matching `*database*`, `*data-spec*`, `*db-spec*` | PC-2 (Core-Architecture) | Replace | Schema definitions |
| **AE Documents** | Scan `_iwish-output/2. Product Planning/advanced-elicitation/` for `AE-R*.md` | PC-2 (Core-Architecture) | Append | Historical decision records |
| **Global ADRs** | Scan `_iwish-output/2. Product Planning/ADRs/` for `ADR-*.md` | PC-2 (Core-Architecture) | Append | Architecture Decision Records |
| **Epic ADRs** | Scan `_iwish-output/3. Development/1. Epic & Story/*/Epic-*/` for `ADR-*.md` | OP-1 (Epic Context) | Append | Epic-scoped decisions |
| **Story files** | `story.md` within story directories | OP-1 (Epic Context) | **Upsert** | Per-story context. Uses NLM Upsert Protocol to prevent duplicates. |
| **Completed Story (approve-qa)** | `story.md` in story directory post-QA | OP-1 (Epic Context) | **Upsert** | Final story state after QA approval. Tier 1 trigger. |
| **Refactored Story (refactor-story)** | `story.md` in story directory post-refactor | OP-1 (Epic Context) | **Upsert** | Amended ACs post-refactor. Tier 1 trigger. |
| **Research reports** | Scan `_iwish-output/2. Product Planning/` for `*research*`, `*competitor*`, `*domain*`, `*market*` | RL (Research Library) | Append | Domain & market research |
| **Product Strategy** | Scan `_iwish-output/1. Idea Discovery/` for `*product-strategy*`, `*strategy*` | PC-1 (Core-PRD) | Append | Strategic context |
| **Idea Discovery** | Scan `_iwish-output/1. Idea Discovery/` for `*idea*`, `*challenge*`, `*discovery*` | PC-1 (Core-PRD) | Append | Ideation artifacts |

### File Resolution Algorithm
When syncing, the agent MUST:
1. **Scan the target directory** (e.g., `_iwish-output/2. Product Planning/`).
2. **Match files by keyword patterns** listed in the "Discovery Pattern" column (case-insensitive).
3. **Exclude** validation reports (`*validation-report*`), index files (`index.md`), and temporary files.
4. **If multiple matches** are found for a "Replace" category, use the file with the highest numbered prefix (e.g., `2.1.` > unnumbered).
5. **Log all resolved paths** to the sync report for auditability.

## 🏗️ Foundation Gate
Before executing major operations, the lifecycle manager MUST check the foundation checklist:
- File: `_iwish-output/notebooks/foundation-checklist.yaml`
- **Validation**: If the checklist score is `< 10/14`, trigger a **SOFT WARNING mode**. Operations can proceed, but the user must be alerted to the foundational gaps.

## 🔐 Auth Recovery
If any MCP operation fails with an authentication error (e.g., 401 Unauthorized or token expiration):
1. **Halt operations.**
2. Instruct the user to run the `refresh_auth` or `save_auth_tokens` tools from the `notebooklm-mcp` server.
3. Retry the operation only after successful validation via `server_info`.

## 🩺 Health Check
Routine health checks ensure the physical NotebookLM state matches the I-Wish registry:
1. Invoke `notebook_list()`.
2. Compare the returned list with `notebook-registry.yaml`.
3. **Flag anomalies**: Identify orphan notebooks (exist in NotebookLM, not in registry) or missing notebooks (exist in registry, missing in NotebookLM).

## 👣 Step-by-step Instructions
1. **Initialize/Trigger**: Receive trigger from file change, workflow, or direct command.
2. **Validate Auth**: Check connection via `server_info`. Handle auth recovery if needed.
3. **Determine Operation**: 
   - Is it a CRUD operation? Apply Naming Convention.
   - Is it a source addition? Apply Sizing Heuristic.
   - Is it a sync event? Consult Sync Eligibility Matrix.
4. **Execute MCP Calls**: Perform the necessary `notebook_*` or `source_*` MCP tool calls.
5. **Verify Foundation Gate**: Read `foundation-checklist.yaml` and warn if necessary.
6. **Update State**: Report back to `notebook-registry-manager` for registry updates.

## 🛠️ MCP Tool Usage Examples

**Creating a Notebook:**
```json
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "notebook_create",
  "Arguments": {
    "title": "Cowok/Epic-12-Context"
  }
}
```

**Checking Health (Listing):**
```json
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "notebook_list",
  "Arguments": {}
}
```

## 🚨 Error Handling
- **Size Limit Exceeded**: If `source_add` fails due to capacity, execute the split heuristic.
- **Rate Limiting**: Apply exponential backoff if NotebookLM API limits are hit.
- **Naming Violations**: If an external force renames a notebook improperly, flag it during the Health Check.

## 🔗 Integration Points
- Interacts closely with `notebook-registry-manager` to ensure state consistency.
- Subscribes to events from `/flow` and file watcher hooks.
