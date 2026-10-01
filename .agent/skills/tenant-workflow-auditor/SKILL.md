---
name: "tenant-workflow-auditor"
description: "Use when you need to perform data-driven historical audits of existing tenant workflows to verify expected node coverage for Zero-IT templates."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# tenant-workflow-auditor

## When to Use This Skill
Use when verifying that tenant workflow executions cover the required nodes as defined by Zero-IT templates.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1 | Audit node coverage | Category B | Self-reported judgment | view_file tool calls or historical execution logs |
| GATE-2 | Compare against Zero-IT baseline | Category B | Logical comparison | Tool output logs |

## Core Rules
1. Extract and aggregate node coverage statistics systematically from historical execution records.
2. Compare empirical coverage against the expected Zero-IT baseline.
3. Do not perform static code analysis; rely on historical execution data.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I'll just assume this standard IT template applies", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just check the code definition instead of historical data" | "Must rely on empirical execution data rather than static definitions." |

## Boilerplate / Snippets
```python
# Pseudo-code for node coverage check
def audit_coverage(historical_data, expected_nodes):
    actual_nodes = extract_nodes(historical_data)
    missing = set(expected_nodes) - set(actual_nodes)
    return missing
```
