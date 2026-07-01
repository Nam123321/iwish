---
name: "growth-telemetry-architect"
description: "Use when analyzing PRDs to extract marketing events or generating telemetry tracking schemas (JSON/YAML) for platforms like PostHog or Amplitude."
inputs: ["PRD file path or text content", "Target platform (e.g., PostHog, Amplitude)"]
outputs: ["JSON or YAML tracking schema"]
mcp_tools_required: []
subagent_triggers: []
---

# Growth Telemetry Architect

## When to Use This Skill
- When analyzing a PRD to extract marketing, conversion, or North Star tracking events.
- When generating schemas for PostHog or Amplitude telemetry.
- When creating structured tracking plans (JSON/YAML).

## Core Rules
1. **Never Hallucinate:** If the PRD lacks explicit conversion events or North Star metrics, HALT and request clarification. Do not guess metrics.
2. **Structured Output:** Your final output MUST be a strict, valid JSON or YAML schema. Ensure no bleeding markdown blocks trailing the schema.
3. **Platform Casing:** Adhere to the target platform's casing rules (e.g., PostHog uses `snake_case`, Amplitude uses `Title Case`). Ask the user if the target platform is unspecified.
4. **Naming Conventions:** All event names MUST strictly follow the `[Object] [Action]` structure (e.g., `button_clicked`, `checkout_completed`).

## Red Flags — STOP and Reconsider
- ❌ Missing Metrics: Do not generate a schema if the PRD does not define what success looks like.
- ❌ Overly complex or nested JSON objects that don't match the target platform's event format structure.
- ❌ Exceeding token limits on massive PRDs. Pre-calculate size and ask the user to chunk the PRD if needed.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just assume standard e-commerce tracking events to be helpful." | Hallucinating metrics violates the integrity rule. Halt and ask the user. |
| "I will just output markdown because it's easier to read." | The downstream system requires structured JSON/YAML. Enforce the format. |
| "I'll use camelCase for all platforms." | You MUST adapt the casing strictly to the platform's conventions (e.g., snake_case for PostHog). |
