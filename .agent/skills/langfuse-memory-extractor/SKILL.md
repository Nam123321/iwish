---
name: "langfuse-memory-extractor"
description: "Trigger when you need to fetch trace logs or session data from Langfuse API to extract structured memory facts or conversation history."
inputs: ["session_id", "user_id"]
outputs: ["memory_facts.json"]
mcp_tools_required: []
subagent_triggers: []
---

# langfuse-memory-extractor

## When to Use This Skill
Use this skill when you need to parse interaction traces from the Langfuse observability platform. This is required when extracting cross-session memory facts without risking data store corruption.

## Core Rules
1. **Never write directly to MemoryGraph from raw traces**: You MUST parse traces into strict JSON schemas first.
2. **Schema Validation**: Validate extracted facts against the defined knowledge-fact JSON schema before downstream processing.
3. **API Keys**: Ensure `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are read from secure environment variables, never hardcoded.

## Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-LFE-01 | JSON Schema Validation | Category A | Schema parser script exit code | Validation output JSON |
| GATE-LFE-02 | Memory Relevance Check | Category B | LLM evaluates if trace fact is relevant | `send_message` justification |

<agent-activation>
agent: "qa-agent"
</agent-activation>

## Boilerplate / Snippets
```python
# Extract traces using Langfuse SDK
from langfuse import Langfuse
import json

langfuse = Langfuse()
traces = langfuse.get_traces(user_id="user_123")

# Extract and validate using JSON schema
# (Assuming schema validation step here)
```
