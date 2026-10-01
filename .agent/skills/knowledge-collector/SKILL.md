---
name: knowledge-collector
description: Post-action learning - captures workflow knowledge, routes to correct destination (Graph vs Notebook), auto-promotes ephemeral to persistent
inputs: ['workflow_output', 'ae_files', 'review_findings', 'debate_transcripts']
outputs: ['updated_notebooks', 'updated_instincts', 'promoted_notebooks']
mcp_tools_required: ['notebooklm-mcp/source_add', 'notebooklm-mcp/notebook_create', 'notebooklm-mcp/notebook_describe']
subagent_triggers: ['notebook-lifecycle-manager', 'notebook-registry-manager']
---

# Knowledge Collector

## Purpose
The Knowledge Collector is the system's memory consolidator. It ensures that valuable insights, decisions, and patterns discovered during workflows (like reviews, debates, or coding) are not lost when the turn ends. It acts as an intelligent router, determining exactly where knowledge should live (CodeGraph, FeatureGraph, Notebooks, or Instincts) and automatically promotes recurring ephemeral knowledge to persistent status.

## Prerequisites
- Write access to the local `.agent/` directory (for instincts).
- Active authentication with NotebookLM MCP server.
- Understanding of the project's Graph Architecture (CodeGraph, FeatureGraph, MemoryGraph).

## Core Protocols & Mechanics

### 1. Routing Engine Decision Table
Not all knowledge belongs in a NotebookLM Notebook. The collector must strictly adhere to the following routing rules:
- **CodeGraph ONLY**: Knowledge concerning physical file structures, dependencies, or syntax quirks.
- **FeatureGraph ONLY**: Knowledge concerning user impact, feature toggles, or cross-feature dependencies.
- **MemoryGraph ONLY**: Agent behavioral rules, prompt engineering tweaks, or operational instincts.
- **Notebook ONLY**: Deep external research, domain knowledge, lengthy architectural debates, or comprehensive tech-stack documentation.
- **HYBRID (Notebook + Graph)**: Major architectural decisions (ADRs). The reasoning goes into the Notebook; the structural impact goes into the Graph.
- **LOCAL FIRST**: Simple scratch files or temporary debug logs. Keep in workspace; do not upload to NotebookLM.

### 2. Auto-Promote Rule
Knowledge is initially captured as ephemeral notes.
- The engine tracks the frequency of specific knowledge patterns being referenced or re-discovered.
- If a pattern is discovered or referenced `≥ 2 occurrences`, it triggers the Auto-Promote rule.
- The knowledge is automatically promoted from ephemeral (scratchpad) to persistent (formal Notebook source or `instincts.jsonl` entry) WITHOUT requiring user approval.

### 3. Classification Logic (General vs Project-Specific)
Before routing, knowledge must be classified:
- **General**: Best practices, framework tricks, or debugging patterns that apply to any software project. (Route to global instincts or Global Knowledge Notebooks).
- **Project-Specific**: Business rules, specific API contracts, or domain logic tailored to this specific repository. (Route to local project notebooks or Project FeatureGraph).

### 4. Post-Action Capture Triggers
The Knowledge Collector MUST be invoked automatically at the end of these critical workflow events:
- **AE (Advanced Elicitation) Completion**: Capture the finalized specs and the user's implicit preferences discovered during the Q&A. Push `AE-R{N}.md` to PC-2 (Architecture) notebook via `source_add`.
- **ADR Creation/Update**: When a new `ADR-*.md` is created (globally or within an Epic), automatically push it to the appropriate notebook: Global ADRs → PC-2, Epic ADRs → OP-1 Epic Context.
- **Party-Mode Conclusion**: Capture the final consensus, the winning arguments, and the rejected alternatives (to prevent re-litigating the same issue later).
- **Review Completion**: Capture recurring review findings (e.g., if the agent keeps failing the same security check, create an instinct to prevent it).
- **Dev-Story Completion**: Capture any novel solutions or workarounds discovered during implementation.

### 5. Instincts Update Protocol
When knowledge is classified as behavioral or procedural, it MUST be appended to `instincts.jsonl`.
- Format: `{"trigger": "...", "action": "...", "context": "..."}`
- Ensure the newly learned pattern does not conflict with `AGENTS.md` Iron Laws.

## Step-by-Step Instructions

1. **Ingest Artifacts**: Receive the inputs (`workflow_output`, `ae_files`, `review_findings`, `debate_transcripts`).
2. **Extract Knowledge Concepts**: Parse the inputs to identify actionable patterns, decisions, or domain knowledge.
3. **Classify Knowledge**: Determine if each concept is General or Project-Specific.
4. **Apply Routing Engine**: For each concept, use the Decision Table to determine the target destination (Graph vs Notebook).
5. **Check Frequency (Auto-Promote)**: Check if this concept has been seen before. If occurrences ≥ 2, mark for promotion to persistent storage.
6. **Execute Routing**:
   - For Layer 1/2 Notebooks: Use `source_add` to update existing notebooks or `notebook_create` for entirely new domains.
   - For Layer 3 Notebooks (OP-1 Epic Context, story/epic sources): **MUST use NLM Upsert Protocol** (`.agent/fragments/nlm-upsert-protocol.md`) instead of raw `source_add` to prevent duplicate sources.
   - For Instincts: Update the local `instincts.jsonl` file.
7. **Generate Report**: Output the list of `updated_notebooks`, `updated_instincts`, and any `promoted_notebooks`.

## MCP Tool Usage Examples

### Adding Source to a Notebook
```json
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "source_add",
  "Arguments": {
    "notebook_id": "nb_project_architecture",
    "text": "ADR-004: Decision to use Zustand over Redux for lightweight state management due to bundle size constraints. (Consensus reached in Party-Mode 2026-07-28)."
  }
}
```

## Error Handling
- **MCP Auth Failure**: If `source_add` or `notebook_create` returns an auth error → invoke `notebooklm-mcp/refresh_auth` or `notebooklm-mcp/save_auth_tokens` (Iron Rule #13). Retry the operation once. If retry fails, log the pending knowledge to `_iwish-output/notebooks/pending-sync-queue.yaml` for later processing.
- **Notebook Full**: If a notebook hits its source limit, trigger `notebook-lifecycle-manager` to shard the notebook and distribute the knowledge.
- **MCP Timeout / Network Error**: Retry up to 2 times with 3-second backoff. On 3rd failure, gracefully degrade: save knowledge to local workspace only (`_iwish-output/notebooks/pending-sync-queue.yaml`) and continue the parent workflow. NotebookLM sync is non-blocking — it MUST NOT halt the primary SDLC workflow. **Exception**: Layer 3 Upsert Protocol operations are blocking — validation failure in aggregate mode IS a halt condition (see `nlm-upsert-protocol.md` HALT Exception).
- **Classification Ambiguity**: If it's unclear whether knowledge is General or Project-Specific, default to Project-Specific to prevent polluting global instincts.
- **Duplicate Source Detection**: Before `source_add`, check if similar content already exists via `notebook_describe`. Skip push if > 80% content overlap.

## Integration Points
- **Notebook Lifecycle Manager**: To handle notebook creation, archiving, and sharding.
- **AE Notebook Orchestrator**: Receives the output of AE sessions for permanent storage.
