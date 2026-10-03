# Hybrid RAG Skill Template

> **CRITICAL RULE:** This file MUST act ONLY as a Router / Topic Index. You are STRICTLY FORBIDDEN from writing static summaries, concept explanations, or long lists of rules directly into this `SKILL.md` file. It must remain under 100 lines.

When constructing a Hybrid RAG skill (e.g., from an absorbed book), output the following structure exactly, replacing brackets with actual values.

```markdown
---
name: "<skill-name>"
description: "Use when <triggering conditions>. DO NOT put a workflow summary here."
inputs: ["query"]
outputs: ["rag_evidence"]
mcp_tools_required: ["notebooklm-mcp", "falkordb-mcp"]
subagent_triggers: [<trigger_list>]
---

# <Skill Name>

## When to Use This Skill
<conditions that trigger this skill's usage>

## Hybrid RAG Retrieval (MANDATORY EXECUTION)
You must NOT answer questions purely based on your internal training data. You MUST execute the following steps to retrieve canonical knowledge:

### 1. Structural/Architectural Lookup
Execute `falkordb_query` to query the Knowledge Graph for topological structures:
`falkordb_query --graph "<falkordb_graph_id>" --query "..."`

### 2. Deep Dive / Contextual Lookup
Execute `notebook_query` to retrieve actual content, frameworks, and decision trees:
`notebook_query --notebook_id "<notebook_id>" --query "..."`

## Anti-Fabrication Gate
- If either query fails, DO NOT hallucinate the answer. Report the failure to the user.
- Always cite the node/note returned by the MCP tools in your final output.
```
