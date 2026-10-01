---
name: "prisma-domain-boundary-linter"
description: "Use when analyzing Prisma multi-file schemas and TypeScript imports to enforce strict domain boundaries and prevent cross-context coupling."
inputs: []
outputs: []
mcp_tools_required: ["grep_search", "view_file"]
subagent_triggers: []
---

# Prisma Domain Boundary Linter

## When to Use This Skill
Use when validating PRs, running CI checks, or linting codebases that use multi-file Prisma schemas (`prisma/schema/*.prisma`) alongside bounded TypeScript domains. Trigger this skill if the user asks to "check domain boundaries," "lint Prisma contexts," or "validate isolation."

## Core Rules
1. **Schema Isolation:** A Prisma schema file in one domain (e.g., `schema/billing.prisma`) MUST NOT define foreign keys pointing to models in another domain (e.g., `User` in `schema/identity.prisma`) unless using loose scalar references and explicit application-level resolution.
2. **TypeScript Import Isolation:** TypeScript code in one bounded context (e.g., `src/modules/billing/`) MUST NOT import services, repositories, or entities from another bounded context except through explicit public API contracts or event buses.
3. **AST & Regex Checks:** Use AST parsing or grep to verify that imports matching `../other-domain/*` do not bypass the public module interfaces.
4. **Zero-Trust Coupling:** Assume any cross-domain relation is a violation unless explicitly whitelisted.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I can just allow one relation because it's easier than an API call", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "Prisma multi-file schema natively supports relations across files, so it's fine." | Native support does not mean it respects our bounded context rules. Cross-domain DB-level foreign keys create tight coupling. |

## Anti-Patterns
- ❌ NEVER allow `@relation` fields in Prisma that span across different domain `.prisma` files.
- ❌ NEVER permit direct internal imports from another module's `src/` directory.

## Best Practices
- ✅ ALWAYS enforce that cross-domain references in Prisma are stored as plain scalar IDs (e.g., `userId String`).
- ✅ ALWAYS ensure inter-domain communication in TypeScript goes through a defined interface.

## Boilerplate / Snippets
**Valid Cross-Domain Reference (Prisma):**
```prisma
// billing.prisma
model Invoice {
  id     String @id
  // Valid: Scalar reference instead of @relation
  userId String 
  amount Int
}
```

## Version Notes
- Requires Prisma 5.15+ for multi-file schema support (`previewFeatures = ["prismaSchemaFolder"]`).
