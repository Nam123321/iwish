---
name: notebook-cross-query-engine
description: Enforces Backbone Rule - cross-queries external research with internal project context for compatibility scoring
inputs: ['external_research_result', 'backbone_notebook_id']
outputs: ['compatibility_score', 'verdict', 'conflict_report']
mcp_tools_required: ['notebooklm-mcp/notebook_query', 'notebooklm-mcp/cross_notebook_query']
subagent_triggers: ['notebook-registry-manager']
---

# Notebook Cross-Query Engine

## Purpose
The Notebook Cross-Query Engine is responsible for safely integrating external research or external domain knowledge into the current project workspace. It acts as an architectural immune system, preventing the adoption of technologies, patterns, or requirements that clash with the established foundation.

## Prerequisites
- Active authentication with NotebookLM MCP server.
- The Backbone Notebooks (PC-1, PC-2, PC-3) MUST exist and be fully indexed.
- The `cross_notebook_query` tool must be available.

## Core Protocols & Mechanics

### 1. The Backbone Rule
**ALL** external knowledge pull requests MUST be cross-queried against at least ONE Backbone Notebook.
- **PC-1**: Project Context (Vision, Goals, Constraints)
- **PC-2**: Architecture & Tech Stack
- **PC-3**: Design System & UI Patterns

External research cannot be accepted at face value; it must be proven compatible with the Backbone.

### 2. 4-Dimension Compatibility Scoring
When cross-querying, the engine calculates a weighted compatibility score based on 4 dimensions:
1. **Tech Stack (35%)**: Does the external pattern use our approved frameworks? (e.g., Does it suggest Angular when we are on React?)
2. **Architecture (30%)**: Does it fit our state management and API design paradigms?
3. **Requirements (20%)**: Does it align with the non-functional requirements (NFRs) like performance and security?
4. **Design System (15%)**: Does it use our semantic CSS tokens, or does it try to introduce raw Tailwind classes?

### 3. Verdict Classification
Based on the final compatibility score, the engine issues one of three verdicts:
- **≥ 0.8: COMPATIBLE**: The external knowledge integrates seamlessly. Use as-is.
- **0.5 - 0.79: ADAPTABLE**: The core concept is sound, but it requires structural adjustment (e.g., swapping a library). The engine must outline the necessary adaptations.
- **< 0.5: CONFLICT**: The external knowledge is fundamentally incompatible. Automatically escalate to `/party-mode` for a human-in-the-loop architectural debate.

### 4. Cross-Query Templates
The engine uses predefined templates to drive the `cross_notebook_query` evaluations:
- **Architecture Compatibility**: "Compare the architectural patterns proposed in [External Notebook] with the constraints defined in [PC-2]. Identify any violations of our state management or data fetching rules."
- **Requirements Alignment**: "Evaluate the solution in [External Notebook] against the NFRs in [PC-1]. Will this solution meet our P99 latency and RBAC security requirements?"
- **Design System Consistency**: "Analyze the UI components in [External Notebook] against the design tokens in [PC-3]. Flag any hardcoded colors or unauthorized UI libraries."

### 5. Conflict Detection Matrix & Iron Laws
The engine maintains a zero-tolerance policy (Auto-Reject) for specific violations of the `AGENTS.md` Iron Laws.
- *Example Violation*: External research suggests using Tailwind `dark:` variants.
- *Action*: Auto-Reject immediately, as the Iron Law mandates CSS variables for light/dark mode.

## Step-by-Step Instructions

1. **Receive External Knowledge**: Accept the `external_research_result` and identify the relevant `backbone_notebook_id` (PC-1, PC-2, or PC-3).
2. **Pre-Query Backbone**: Execute `notebook_query` on the backbone notebook to establish the current baseline constraints for the relevant domain.
3. **Execute Cross-Query**: Run `cross_notebook_query` targeting BOTH the external research notebook and the backbone notebook using the appropriate Cross-Query Template.
4. **[ZERO-TRUST GATE] Calculate Score & Verdict**: You MUST use the programmatic evaluator script. Save your raw JSON scoring into a temporary file (e.g. `_iwish-output/adhoc-workspace/scratch/cross_query.json`) matching this format:
   ```json
   {
     "scores": { "tech_stack": 0.8, "architecture": 0.7, "requirements": 0.9, "design_system": 1.0 },
     "iron_law_violations": []
   }
   ```
   Then run: `python3 .agent/scripts/evaluate_cross_query.py _iwish-output/adhoc-workspace/scratch/cross_query.json`.
   If it returns Exit Code 1, the verdict is CONFLICT. Do NOT manually calculate weights or override the script's verdict.
7. **Generate Report**: Output the `compatibility_score`, `verdict`, and a detailed `conflict_report` explaining any necessary adaptations or reasons for rejection.

## MCP Tool Usage Examples

### Cross-Query Execution
```json
{
  "ServerName": "notebooklm-mcp",
  "ToolName": "cross_notebook_query",
  "Arguments": {
    "notebook_ids": ["nb_external_auth_research", "nb_pc2_architecture"],
    "query": "Evaluate the OAuth2 implementation proposed in the research against our defined security constraints in PC-2. Highlight any discrepancies in token storage mechanisms."
  }
}
```

## Error Handling
- **Notebook Not Found**: Ensure the backbone notebook ID is correct and the MCP server has access. Fall back to querying the local `project-context.md` if the notebook is unavailable.
- **Query Ambiguity**: If the cross-query returns "I don't know", the external research is likely too vague. Request the Retrieval Engine to perform a deeper pull.

## Integration Points
- **Notebook Registry Manager**: To fetch the correct Backbone Notebook IDs.
- **Party-Mode**: For resolving CONFLICT verdicts.
- **AE Notebook Orchestrator**: Runs this engine as a pre-elicitation check to ensure the elicitation context is safe.
