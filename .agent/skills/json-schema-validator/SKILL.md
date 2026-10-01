---
name: "json-schema-validator"
description: "Use when validating JSON syntax and schemas with deterministic parsing."
inputs: ["json_string", "schema_definition"]
outputs: ["validation_result", "few_shot_corrections"]
mcp_tools_required: []
subagent_triggers: []
---

# json-schema-validator

## When to Use This Skill
Use this skill when you need to validate JSON strings or schema definitions against deterministic syntax rules, and to apply few-shot corrections when generating JSON.

## Core Rules
1. Never trust raw LLM output for JSON structure without running it through deterministic validation.
2. Provide explicit few-shot examples when auto-correcting schema errors.

## Execution Guide
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
`python3 .agent/skills/json-schema-validator/scripts/runner.py --target <target>`

## Red Flags — STOP and Reconsider
- If you find yourself thinking "The LLM usually gets JSON right, I don't need to run a deterministic parser", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The LLM usually gets JSON right..." | JSON validation must be deterministic; syntax errors break downstream parsers. |

## Industry Standards & Best Practices
- Parse JSON deterministically before using it.
- Correct schema errors using few-shot guidance.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1  | Deterministic syntax check | Category A | Python JSON parser | Script exit code and stdout |
