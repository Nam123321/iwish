# Capability Spec: user-onboarding-generator-skill

## Type: SKILL
## Status: Draft
## Created: 2026-07-01

### Problem Statement
Need to dynamically generate personalized onboarding documentation and workflows based on a user's role, project type, and preferences, avoiding hallucination and handling edge cases safely.

### Knowledge Sources
- Source 1: `_iwish-output/stories/story-24.5.md`

### Core Concepts
1. **Context Parsing**: Parse valid JSON input context containing user role and project type.
2. **Dynamic Prompting**: Utilize a dynamic LLM prompt template to structure the output.
3. **Structured Output**: Output must be structured markdown or JSON conforming to a schema.
4. **Resilience**: Fallback to default values and log warnings for missing/invalid fields.
5. **Sanitization**: Sanitize inputs and truncate excessive lengths to prevent prompt injection.
6. **Validation**: Validate LLM output against Zod schema, triggering retries on failure.
7. **Grounding**: Strictly ground generation to context to prevent data leakage or hallucination.
8. **Role Resolution**: Resolve conflicting roles to the most restrictive valid profile.

### Anti-Patterns
- ❌ Trusting LLM output without Zod schema validation.
- ❌ Allowing excessively long strings that could contain prompt injections.
- ❌ Granting permissive access when roles conflict.

### Best Practices
- ✅ Enforce strict system boundaries to mitigate prompt injection.
- ✅ Resolve multiple roles to the lowest privilege.

### Red Flags — STOP and Reconsider
- If the LLM generates JSON that fails Zod validation, STOP. Trigger targeted retry or fallback.
- If conflicting roles are detected, STOP and resolve to the most restrictive profile before generation.

### FMEA Identified Risks (For Script Try/Catch Blocks)
- **Type 1 (Script Bug):** Zod parsing failure resulting in crash instead of graceful retry.
- **Type 2 (App Bug):** Prompt injection successfully manipulating the LLM instructions.
