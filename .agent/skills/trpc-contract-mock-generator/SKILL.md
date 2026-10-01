---
name: "trpc-contract-mock-generator"
description: "Use when asked to write or update frontend mock data for a tRPC backend, or when generating exact-match test contracts based on backend tRPC router definitions."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# trpc-contract-mock-generator

## When to Use This Skill
- When asked to write or update frontend mock data for a tRPC backend.
- When generating exact-match test contracts based on backend tRPC router definitions.
- When testing React components or hooks that consume tRPC endpoints.

## Core Rules
1. ALWAYS inspect the backend tRPC router definition first to determine exact input and output types.
2. Generate mock data that perfectly matches the inferred output types of the router, including edge cases and nullables.
3. Use `msw` (Mock Service Worker) or `trpc` mock utilities if the project uses them; otherwise, provide standard mock objects.
4. If schemas (e.g., Zod) are used for input validation, generate valid inputs that pass the schema constraints.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I'll just guess the mock data shape", STOP. You MUST read the backend router or Zod schemas to ensure exact type match.
- If you find yourself thinking "The frontend doesn't need to match exactly", STOP. tRPC relies on strict contract matching.

## Anti-Patterns
- ❌ NEVER generate mock data that violates the TypeScript signature of the tRPC router.
- ❌ NEVER hardcode mock contracts without verifying the current backend implementation first.

## Best Practices
- ✅ ALWAYS use Zod schemas (if available) as the primary source of truth for mock generation.
- ✅ ALWAYS provide clear comments on how to inject the mock into the frontend testing framework.
