---
name: notebook-retrieval-engine
description: Pulls knowledge from NotebookLM with 3-layer sufficiency protocol, Notes Recursive precision mode, and Dual-Source Triangulation
inputs: ['query', 'target_notebooks', 'context_level']
outputs: ['retrieved_knowledge', 'sufficiency_verdict', 'triangulation_report']
mcp_tools_required: ['notebooklm-mcp/notebook_query', 'notebooklm-mcp/notebook_query_start', 'notebooklm-mcp/notebook_query_status', 'notebooklm-mcp/cross_notebook_query', 'notebooklm-mcp/note', 'notebooklm-mcp/source_add', 'notebooklm-mcp/chat_list', 'notebooklm-mcp/chat_get', 'notebooklm-mcp/chat_export']
banned_tools: ['search_web', 'read_url_content']
subagent_triggers: ['notebook-registry-manager', 'notebook-cross-query-engine']
---

# Notebook Retrieval Engine

## Purpose
The Notebook Retrieval Engine is the core intelligence extraction component for the NotebookLM Integration System. It ensures that any knowledge pulled from NotebookLM is factually grounded, sufficiently detailed, and triangulated against multiple sources. It actively prevents "shallow" or "hallucinated" context retrieval by enforcing rigorous validation gates and precision enhancement modes.

## Prerequisites
- Active authentication with NotebookLM MCP server.
- Existing Notebooks configured in the target workspace.
- The `notebooklm-mcp` tools must be fully available and responsive.

## Core Protocols & Mechanics

### 1. 3-Layer Sufficiency Protocol
Every piece of retrieved knowledge MUST pass this 3-layer gate before it can be used in downstream workflows (like coding or architecture planning).

- **Gate 1: Citation Density Gate (≥3)**
  - Any answer provided by NotebookLM MUST contain at least 3 unique source citations for the primary claims.
  - If `< 3` citations are present, the answer is deemed "Thin" and must be rejected or retried with broader queries.

- **Gate 2: Dimension Coverage (≥80%)**
  - The response must cover at least 80% of the dimensions explicitly requested in the prompt.
  - *Example*: If asked for "Performance, Security, and Scalability", the response must address all three. If it only covers Performance and Security, it fails the gate.

- **Gate 3: Dual-Source Triangulation**
  - Critical claims must be verifiable across at least two distinct sources within the notebook (or across two notebooks).
  - If a claim relies entirely on a single source, it is marked as "Single-Point-of-Failure" and flagged for human review or additional pulling.

### 2. Triangulation Triggers (Mandatory)
The engine MUST automatically enforce Dual-Source Triangulation when any of the following conditions are met:
- **Party-Mode Deadlock**: When agents cannot agree during a Socratic Debate, the engine must triangulate external facts to break the tie.
- **`/unknowns` MACRO confidence < 0.5**: Any macro assumption with low confidence must be fortified with triangulated research.
- **`/review` REJECT ≥ 3 findings**: If a code review yields a high number of rejections, triangulate the architectural patterns to ensure the spec wasn't flawed.

### 3. Notes Recursive Precision Mode
Standard RAG can return answers that are accurate but too broad. When `citation_count ≥ 3` BUT the answer lacks actionable precision, invoke Notes Recursive Precision Mode.

**Steps:**
1. **Initial Retrieval**: Run `notebook_query` on the target notebook.
2. **Distillation**: Extract the most relevant core concepts from the broad answer.
3. **Note Creation**: Use the `note` (create) tool to store this distilled summary.
4. **Source Injection**: Use `source_add` (text) to inject this note back into the notebook as a synthetic, highly-focused source.
5. **Secondary Retrieval**: Run `notebook_query` again, specifically targeting the newly added source alongside original sources.
6. **Constraint**: Maximum 2 rounds of recursion to prevent infinite loops.
7. **Anti-Echo-Chamber Constraint**: The final output MUST be verified against at least one *original* raw source to ensure the synthetic note didn't hallucinate.

### 4. Scatter/Gather/Synthesize Pattern
Used for multi-dimensional queries (e.g., researching a new tech stack that requires UI, DB, and Auth dimensions).
- **Scatter**: Dispatch separate `notebook_query` calls for each dimension in parallel.
- **Gather**: Collect the results and store them as individual temporary notes in the workspace.
- **Synthesize**: Combine the gathered notes into a master prompt and execute a final synthesis query to generate a unified architectural recommendation.

### 5. Evidence Delta Calculation
When comparing newly retrieved knowledge against existing project context (or previous knowledge), calculate the Evidence Delta:
- **<20% Delta (SUFFICIENT)**: The new knowledge aligns closely with existing context. Proceed normally.
- **20-50% Delta (ENRICHED)**: The new knowledge offers significant new insights but doesn't break the existing architecture. Merge both sources.
- **>50% Delta (CRITICAL_GAP)**: The new knowledge fundamentally contradicts or rewrites existing context. HALT execution and trigger a `/party-mode` debate.

## Step-by-Step Instructions

1. **Parse Input**: Analyze the `query`, `target_notebooks`, and required `context_level`.
2. **Determine Query Strategy**: If multi-dimensional, use Scatter/Gather/Synthesize. Otherwise, use standard `notebook_query`.
3. **[ZERO-TRUST GATE] Execute Retrieval & Verify Provenance**: Call the appropriate MCP tools. Save the raw JSON output to a temporary file (e.g., `_iwish-output/adhoc-workspace/scratch/retrieval_output.json`) and you MUST run:
   `python3 .agent/scripts/verify_notebooklm_provenance.py <notebook_id> _iwish-output/adhoc-workspace/scratch/retrieval_output.json`
   If the script fails (Exit Code 1), HALT immediately. Do not process the results.
4. **Evaluate Sufficiency**: Pass the output through the 3-Layer Sufficiency Protocol.
5. **Apply Precision Mode (If Needed)**: If Gate 1 passes but the answer is too broad, invoke Notes Recursive Precision Mode.
6. **Calculate Evidence Delta**: Compare against known context and assign a status (Sufficient, Enriched, Critical Gap).
7. **Format Output**: Generate the final `retrieved_knowledge`, `sufficiency_verdict`, and `triangulation_report`.

## MCP Tool Usage Examples

### Scatter/Gather/Synthesize Example
```json
// Scatter: Execute multiple queries
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "notebook_query",
  "Arguments": {
    "notebook_id": "nb_tech_stack",
    "query": "What are the recommended authentication patterns?"
  }
}
// Gather: Add note
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "source_add",
  "Arguments": {
    "notebook_id": "nb_project_synthesis",
    "text": "Auth patterns: OAuth2 with JWT..."
  }
}
```

## Error Handling
- **Query Timeout**: If a query takes too long, fall back to `notebook_query_start` and poll with `notebook_query_status`.
- **Low Citation Failure**: If Gate 1 fails, automatically rewrite the query to be more specific and retry once before failing gracefully.
- **Authentication Loss**: Trigger the `refresh_auth` tool if MCP returns a 401 Unauthorized.

## Integration Points
- **Notebook Registry Manager**: To discover which notebooks contain the required knowledge.
- **Notebook Cross-Query Engine**: If the retrieved knowledge needs to be evaluated against the Backbone notebooks.
- **Party-Mode**: For resolving Critical Gaps detected during Evidence Delta calculation.
