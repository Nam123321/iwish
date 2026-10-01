---
name: "prisma-raw-query-linter"
description: "Use when scanning the codebase for Prisma executeRawUnsafe or queryRawUnsafe calls to statically detect and prevent unsafe string interpolation, mitigating SQL injection risks."
inputs: []
outputs: []
mcp_tools_required: ["grep_search", "view_file"]
subagent_triggers: []
---

# prisma-raw-query-linter

## When to Use This Skill
Use this skill when checking for SQL injection risks in the codebase, particularly around Prisma's `executeRawUnsafe` or `queryRawUnsafe` methods. It is useful during security audits or when user code changes involve raw SQL queries.

## Core Rules
1. Scan the codebase using `grep_search` for `executeRawUnsafe` and `queryRawUnsafe`.
2. Review the context of each call by viewing the file.
3. Check if variables are interpolated directly into the SQL string using template literals (e.g., `SELECT * FROM User WHERE id = ${id}`).
4. If unsafe interpolation is found, flag it as a SQL injection risk.
5. Recommend replacing unsafe interpolation with parameterized queries using `executeRaw` or `queryRaw` with the Prisma `sql` template tag, or passing parameters separately.

## Anti-Patterns
- ❌ NEVER use string interpolation (`${variable}`) directly inside `executeRawUnsafe` or `queryRawUnsafe` queries.
- ❌ NEVER trust user input to be sanitized outside of the parameterized query mechanism.

## Best Practices
- ✅ ALWAYS use `executeRaw` or `queryRaw` with the `sql` template tag for safe parameterization.
- ✅ ALWAYS restrict the use of raw queries to cases where Prisma Client's query API cannot accomplish the task.

## Boilerplate / Snippets

**Safe usage with parameterization:**
```typescript
import { Prisma } from '@prisma/client'

// Safe: parameterized query
const result = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM User WHERE email = ${email}`
)
```

**Unsafe usage (Anti-pattern):**
```typescript
// Unsafe: SQL injection risk
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM User WHERE email = '${email}'`
)
```
