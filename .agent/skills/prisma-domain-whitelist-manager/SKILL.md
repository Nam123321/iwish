---
name: "prisma-domain-whitelist-manager"
description: "Use when evaluating Prisma schema domain boundaries, validating cross-domain relations, or when you need to whitelist an intended cross-domain relation without breaking the Prisma AST."
inputs: []
outputs: []
mcp_tools_required: ["view_file", "grep_search"]
subagent_triggers: []
---

# Prisma Domain Whitelist Manager

## When to Use This Skill
- You are adding or validating a relation between two different domains in Prisma.
- You need to suppress a cross-domain linting error or boundary violation.
- The schema linter is failing due to unauthorized domain coupling.

## Core Rules
1. **Never Modify Prisma Attributes for Boundaries:** The Prisma parser strictly rejects unknown attributes like `@@ignoreBoundary`. Do not inject custom attributes into `schema.prisma`.
2. **Use Triple-Slash Comments:** For inline model or field-level boundary waivers, use Prisma's documentation comments:
   ```prisma
   /// @ignoreBoundary
   model UserProfile {
     // ...
   }
   ```
3. **Use Centralized JSON Whitelist:** For global policies, maintain a `prisma/domain-whitelist.json` file structured as an array of allowed domain pairings.
   ```json
   {
     "allowedCrossDomainRelations": [
       {"fromDomain": "Auth", "toDomain": "User"}
     ]
   }
   ```
4. **AST Safety First:** Always prefer the JSON whitelist when the relation spans multiple bounded contexts and you do not want to pollute the schema file.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "I'll just add @@ignoreBoundary because the AST linter will read it", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The custom linter requires an attribute, so I'll add `@@ignoreBoundary`." | Prisma's official parser will crash and fail the CI build. Use `/// @ignoreBoundary` instead. |
| "I'll just ignore the relation since it's just a PoC." | Unmanaged cross-domain relations create tight coupling. Always whitelist them intentionally via JSON or doc comments. |

## Anti-Patterns
- ❌ NEVER use custom attributes like `@@ignoreBoundary` or `@whitelist`.
- ❌ NEVER put `// @ignoreBoundary` (double slash) because it won't be parsed into the AST's doc nodes by Prisma tooling.

## Best Practices
- ✅ ALWAYS use triple-slash comments (`///`) when annotating models or fields, so the AST parser (`@mrleebo/prisma-ast` or similar) can access the metadata.
- ✅ ALWAYS check `prisma/domain-whitelist.json` before flagging a cross-domain relation as an error.

## Version Notes
- Prisma >= 5.0 enforces strict validation of AST nodes.
