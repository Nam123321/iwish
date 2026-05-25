# Step 1: Seed Data Audit

## MANDATORY EXECUTION RULES:

- 📖 Load ALL seed files completely
- 🔍 Cross-reference EVERY FK value against parent records in other seed files
- 💰 Validate ALL pricing values against SKILL financial rules
- ✅ Report PASS/FAIL per rule

## YOUR TASK:

Audit all seed data for business rule compliance.

## AUDIT PROTOCOL:

### 1. FK Resolution Check

For every foreign key value in seed data:
- Does `tenantId` match an existing Tenant seed?
- Does `brandId` match an existing Brand seed?
- Does `categoryId` match an existing Category seed?
- Does `productId` match an existing Product seed?
- Does `manufacturerId` match an existing Manufacturer seed?
- Does `comboId` match an existing Combo seed?

**Verdict:** PASS ✅ or FAIL ❌ with specific orphan reference

### 2. Financial Logic Check (SKILL Section 4)

| Rule | Check |
|------|-------|
| Combo pricing | `comboPrice < SUM(item.price × item.quantity)` |
| Cost vs Sell | `costPrice ≤ price` for all variants |
| Pricing rules | `marginValue > 0` for margin-based rules |
| Decimal precision | All prices use at most 2 decimal places |

**Verdict:** PASS ✅ or FAIL ❌ with specific violation

### 3. Enum Validation

For every enum field in seed data:
- Does the value exist in the corresponding Prisma enum definition?
- Case-sensitive exact match required

### 4. Required Fields Check

For every seed record:
- Are all non-nullable fields populated?
- Are default-valued fields reasonable?
- Are Strings non-empty where semantically required?

### 5. Uniqueness Check

For every `@@unique` constraint in schema:
- No duplicate combinations in seed data?
- Slugs unique within tenant scope?

### 6. Data Quality Check (SKILL Section 5)

| Rule | Check |
|------|-------|
| Product names | Real-sounding (not "Test Product 1") |
| Prices | Market-realistic for category |
| Dates | Within reasonable range |
| Images | Valid URLs (not empty strings) |
| Quantities | > 0 |

## OUTPUT:

Generate audit report:

"🗄️ **Seed Data Audit Report**

| Category | PASS | FAIL | WARN |
|----------|:----:|:----:|:----:|
| FK Resolution | {n} | {n} | - |
| Financial Logic | {n} | {n} | {n} |
| Enum Validation | {n} | {n} | - |
| Required Fields | {n} | {n} | - |
| Uniqueness | {n} | {n} | - |
| Data Quality | {n} | - | {n} |

**FAIL Items (must fix):**
{List with: File | Line | Issue | Fix}

**WARN Items (should fix):**
{List with: File | Line | Issue | Suggestion}

[F] Auto-generate fix suggestions
[DA] Dismiss"
