---
name: notebook-registry-manager
description: Manages notebook-registry.yaml - CRUD, taxonomy search, auto-classification, inheritance, Enrich vs Create decision
inputs: ['research_topics', 'agent_queries', 'notebook_events']
outputs: ['notebook_id_lookups', 'enrich_vs_create_decisions', 'updated_registry']
mcp_tools_required: ['notebooklm-mcp/notebook_list']
subagent_triggers: []
---

# Notebook Registry Manager

## 🎯 Purpose
The Notebook Registry Manager is a FOUNDATION skill that acts as the single source of truth for the local tracking of all active NotebookLM notebooks. It manages the `notebook-registry.yaml` file, orchestrates taxonomy-based searching, handles cross-project inheritance, and critically decides whether new knowledge should enrich an existing notebook or spawn a new one.

## 📋 Prerequisites
- Access to the workspace filesystem to read/write `_iwish-output/notebooks/notebook-registry.yaml`.
- Access to `_iwish-output/notebooks/domain-taxonomy.yaml`.

## 🗂️ Registry File Path
All state is persisted in:
`_iwish-output/notebooks/notebook-registry.yaml`

## 🔍 Domain Taxonomy Tree Search Algorithm
To accurately route queries and source additions, the manager uses a taxonomy tree search:
1. **Tokenize Topic**: Break down the incoming topic or query into core keywords (e.g., "authentication, jwt, session" -> `[auth, security, token]`).
2. **Search Taxonomy**: Traverse `_iwish-output/notebooks/domain-taxonomy.yaml` using the tokens to find the best matching domain node.
3. **Match to Notebook**: Map the identified domain node to its registered notebook ID in the registry.

## ⚖️ Enrich vs Create Decision Logic
When new knowledge or a new research topic is introduced, the manager must decide the optimal action to prevent fragmentation:
- **Enrich**: If a fuzzy match of the topic keywords shows **> 60% overlap** with an existing notebook's domain, append the sources to the existing notebook.
- **Create**: If the topic breadth covers **≥ 3 distinct sub-topics** not currently modeled, or overlap is `< 60%`, create a NEW notebook following the Naming Convention.

## 🚫 Anti-Patterns
The Registry Manager actively guards against these structural failures:
- **Notebook Sprawl (Story 14.3 Pattern)**: Creating micro-notebooks for every single story or minor task. (Mitigated by the Enrich logic).
- **Duplicates**: Having two notebooks covering the exact same domain taxonomy node.
- **Orphans**: Tracking notebook IDs in the registry that have been deleted in NotebookLM (cleaned up via Lifecycle Manager health checks).

## 🧬 Inheritance
For enterprise or multi-project workspaces, knowledge can be shared:
- **Cross-Project Inheritance**: A registry entry can specify an `inherits_from: [Notebook_ID]` array. When compiling context for a local project notebook, the system will explicitly reference or query the inherited upstream core notebooks.

## 👣 Step-by-step Instructions
1. **Receive Request**: Input received (e.g., a new research topic).
2. **Execute Taxonomy Search**: Tokenize and traverse the domain tree.
3. **Apply Enrich vs Create Logic**: Calculate overlap percentage.
4. **Action Routing**:
   - If **Create**: Request `notebook-lifecycle-manager` to instantiate, then write new entry to `notebook-registry.yaml`.
   - If **Enrich**: Return the target Notebook ID for source addition.
5. **[ZERO-TRUST GATE] Update Registry**: You MUST use the programmatic script to modify the registry. Do NOT write or replace the YAML manually.
   - To Add: `python3 .agent/scripts/registry_crud_manager.py add '{"id":"nb123","name":"New NB"}'`
   - To Update: `python3 .agent/scripts/registry_crud_manager.py update '{"id":"nb123","type":"research"}'`
   - To Remove: `python3 .agent/scripts/registry_crud_manager.py remove nb123`

## 🛠️ MCP Tool Usage Examples

**Listing Notebooks (for reconciliation):**
```json
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "notebook_list",
  "Arguments": {}
}
```

## 🚨 Error Handling
- **Taxonomy Miss**: If a topic cannot be mapped to any existing taxonomy node, default to **Create** but tag the notebook as `Uncategorized` for manual review.
- **File Lock/Write Error**: If `notebook-registry.yaml` is inaccessible, buffer changes in memory and retry with exponential backoff.

## 🔗 Integration Points
- Provides lookup services for `notebook-request-engineer`.
- Relies on `notebook-lifecycle-manager` to perform actual CRUD operations via MCP.
