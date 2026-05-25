# Step 2: Data Requirements Analysis

## MANDATORY EXECUTION RULES:

- 📖 Read the ENTIRE story file — every AC, task, and Vegeta note
- 🔍 Cross-reference EVERY data need against the loaded Prisma schema
- ⚠️ Flag any gap between what the story needs and what the schema provides
- 📋 Apply ALL rules from the Data Integrity Guardian SKILL

## YOUR TASK:

Analyze the story requirements and identify ALL data layer needs.

## ANALYSIS PROTOCOL:

### 1. Schema Change Analysis

For each AC and task in the story, check:

| Question | If YES → Action |
|----------|----------------|
| Does it need a new table? | Document model definition |
| Does it need new columns on existing tables? | Document with Prisma syntax |
| Does it need new relationships (FK)? | Document with cardinality |
| Does it need new indexes? | Document with naming convention |
| Does it need new enums? | Document enum values |
| Does it modify existing column types? | Flag as BREAKING CHANGE |

### 2. DTO & API Analysis

For each backend endpoint the story touches:

| Question | If YES → Action |
|----------|----------------|
| Does the response shape change? | Document new DTO fields |
| Does it need computed fields? | Document calculation logic |
| Does the request body change? | Document validation rules |
| Does it change HTTP method/status? | Document API contract change |

### 3. Frontend Type Analysis

Compare existing frontend types in:
- `apps/webstore/src/lib/api.ts`
- `apps/admin/src/lib/api.ts`

With the new backend response shapes. Flag any:
- Missing fields in frontend interfaces
- Type mismatches (Decimal→number, DateTime→string)
- Response wrapper inconsistencies

### 4. Seed Data Analysis

Determine:
- What test data does this story need to function?
- Does existing seed data cover these needs?
- Are there cross-story seed dependencies?
- Apply SKILL Section 12 (Test Data Matrix)

### 5. Schema Gap Detection

Apply SKILL Section 2 (Required Standard Columns):
- Check if touched tables have: `id, createdAt, updatedAt, deletedAt, tenantId`
- Check if entities with visibility toggle have: `isActive`
- Check naming conventions (SKILL Section 1)

### 6. Breaking Change Detection

Flag with 🔴 severity:
- Cart store key changes (e.g., `productId → variantId`)
- Response format changes
- Enum value additions that affect existing data
- Column renames or type changes

## OUTPUT:

Present analysis summary to user:

"🗄️ Kira's Analysis for {story_name}:

**Schema Changes:** {count} ({new_tables} new tables, {new_columns} new columns)
**DTO Changes:** {count} endpoints affected
**Frontend Type Changes:** {count} interfaces need update
**Seed Data Needs:** {count} scenarios required
**Schema Gaps Found:** {count} ({critical_count} CRITICAL)
**Breaking Changes:** {count}

[C] Continue to generate data spec document
[R] Revise — I have more context to add"

## NEXT STEP:

After user selects [C], load `./step-03-generate.md`.
