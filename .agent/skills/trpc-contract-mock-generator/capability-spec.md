# Capability Spec: trpc-contract-mock-generator

## Type: SKILL
## Status: Active
## Created: 2026-07-30

### Problem Statement
Frontend developers need exact-match mock data for testing components that consume backend tRPC routers. Manually keeping these mocks in sync with backend changes is error-prone. This skill automates the analysis of tRPC routers and the generation of type-safe mock contracts.

### Knowledge Sources
- Input Query: Analyzes backend tRPC routers and generates exact-match mock contracts for frontend testing.

### Core Concepts
1. tRPC router analysis and type inference
2. Exact-match mock data generation based on Zod/TypeScript schemas
3. Frontend mock injection (e.g., MSW or testing libraries)

### Anti-Patterns
- ❌ Guessing mock data shapes without reading the backend router.
- ❌ Providing mocks that fail TypeScript type checking against the tRPC client.

### Best Practices  
- ✅ Read backend tRPC schemas (like Zod) to generate valid inputs/outputs.
- ✅ Ensure 100% type safety and contract adherence for frontend mocks.

### Deliverables
- [x] File 1: `.agent/skills/trpc-contract-mock-generator/SKILL.md`
