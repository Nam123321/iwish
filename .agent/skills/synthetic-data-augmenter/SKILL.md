---
name: "synthetic-data-augmenter"
description: "Use when you need to generate synthetic data using an LLM to augment edge-case intents and improve data representation."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# synthetic-data-augmenter

## When to Use This Skill
Use this skill when you need to generate synthetic data, specifically focusing on edge cases, rare intents, or to augment training datasets for improved representation.

## Core Rules
1. **Schema Adherence**: Synthetic data MUST strictly adhere to the provided JSON schema or data format.
2. **Edge-Case Focus**: The generated data MUST prioritize edge cases, anomalies, and rare intents rather than standard happy-path scenarios.
3. **Validation**: All generated synthetic data MUST be validated against a schema validator script before being output or saved.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I'll just generate standard data to save time", STOP. This skill is meant for edge-case representation.
- If you find yourself thinking "The LLM's output format is close enough", STOP. Strict schema adherence is mandatory.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| I'll skip the schema validation if it looks right. | Validation is a Category A requirement and cannot be skipped. |
| Edge cases are hard to think of, I'll use common ones. | The primary purpose of this skill is to augment rare edge cases. |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-01 | JSON Schema Validation | Category A | `scripts/schema-validator.py` exit code | Script output/exit code |
| GATE-02 | Edge-Case Density Check | Category B | LLM self-evaluation of edge-case density | Review output |

Enforcement Maturity: 50% (1/2 Category A)
