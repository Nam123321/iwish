---
name: "generate-synthetic-data"
description: "Use when you need to generate realistic synthetic data (JSON, CSV, SQL) for testing, seeding databases, or mocking APIs."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# generate-synthetic-data

## When to Use This Skill
- When creating seed data for a database.
- When generating mock responses for an API.
- When creating test fixtures for unit or integration tests.
- When realistic placeholder data (names, emails, dates) is required for UI development.

## Core Rules
1. ALWAYS ensure the generated data structurally matches the requested schema or reference provided.
2. ALWAYS use realistic, context-appropriate values (e.g., valid email formats, sensible date ranges).
3. NEVER generate sensitive, real-world Personally Identifiable Information (PII) or secrets.
4. When generating bulk data, default to 5-10 records unless otherwise specified.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I'll just put 'test1', 'test2' for all fields", STOP. This is a Silent Bypass rationalization. Use realistic fake data.
- If you find yourself thinking "I'll output Python code to generate the data instead of the data itself", STOP. The user usually wants the actual data unless they asked for a generator script.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just put generic dummy strings." | Realistic data helps catch UI overflow and validation issues. |
| "I'll generate a script instead of data." | If the prompt asks for data, output the data directly. |

## Anti-Patterns
- ❌ NEVER use real people's names combined with real identifiers.
- ❌ NEVER output repetitive data where variation is expected (e.g., same date for all rows).

## Best Practices
- ✅ ALWAYS match the field types (integer, string, boolean, date) exactly.
- ✅ ALWAYS use diverse edge cases in the data (e.g., long names, special characters).
