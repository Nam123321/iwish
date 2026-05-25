# Step 1: Schema Validation

## MANDATORY EXECUTION RULES:

- 📖 Load the FULL SKILL file and Prisma schema first
- 🔍 Check EVERY model systematically — do not skip any
- ⚠️ Report issues with severity levels: 🔴 CRITICAL, ⚠️ WARNING, ℹ️ INFO

## YOUR TASK:

Validate the entire Prisma schema and cross-check against frontend types.

## VALIDATION CHECKLIST:

### 1. Standard Columns Check (SKILL Section 2)

For EVERY model in schema.prisma, verify:

| Check | Rule | Severity if Missing |
|-------|------|-------------------|
| `id` | `String @id @default(cuid())` | 🔴 CRITICAL |
| `createdAt` | `DateTime @default(now()) @map("created_at")` | ⚠️ WARNING (skip junction tables) |
| `updatedAt` | `DateTime @updatedAt @map("updated_at")` | ⚠️ WARNING (skip junction tables) |
| `deletedAt` | `DateTime? @map("deleted_at")` | ℹ️ INFO (skip audit logs) |
| `tenantId` | `String @map("tenant_id")` | 🔴 CRITICAL (skip system tables) |

### 2. Naming Convention Check (SKILL Section 1)

For EVERY column:
- camelCase in model field? ✅/❌
- snake_case in `@map`? ✅/❌
- FK follows `{relation}Id` pattern? ✅/❌

### 3. Visibility Toggle Check

For entities that appear in admin listing/toggle UI:
- Has `isActive Boolean @default(true) @map("is_active")`? ✅/❌

### 4. Index Coverage Check

For EVERY model with `tenantId`:
- Has `@@index([tenantId])` ✅/❌
- Has tenant-scoped unique constraints where needed ✅/❌

### 5. Financial Fields Check (SKILL Section 4)

For EVERY Decimal field:
- Uses `@db.Decimal(X, 2)` — NOT Float? ✅/❌

### 6. Frontend Type Alignment

Load admin `api.ts` and webstore `api.ts`, cross-check:
- Every backend response field has frontend counterpart? ✅/❌
- Decimal mapped to `number`? ✅/❌
- Nullable fields correctly marked? ✅/❌

## OUTPUT:

Generate validation report:

"🗄️ **Schema Validation Report**

| Severity | Count |
|----------|:-----:|
| 🔴 CRITICAL | {count} |
| ⚠️ WARNING | {count} |
| ℹ️ INFO | {count} |
| ✅ PASS | {count} |

**Issues Found:**

{Table listing each issue with: Model | Column | Issue | Severity | Suggested Fix}

**Recommendation:** {Fix critical issues now / Schema is clean}

[F] Generate fix script (Prisma schema additions)
[DA] Dismiss"

## SUCCESS METRICS:

✅ Every model checked against all rules
✅ Every issue has severity + suggested fix
✅ Report is actionable
