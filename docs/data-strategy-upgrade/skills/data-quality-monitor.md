---
name: "Data Quality Monitor"
description: "Monitors data quality across the system — detects null rates, outliers, schema drift, freshness staleness, and cross-entity consistency violations."
---

# Data Quality Monitor SKILL

## Purpose
Continuously audit data quality across Prisma models and API responses to ensure:
1. Critical fields have acceptable null/empty rates
2. Numeric values stay within expected ranges (no outliers)
3. Schema changes don't silently break consumers
4. Data freshness meets SLA requirements
5. Cross-entity references remain consistent

## When to Use
- During `/code-review` when new Prisma models or API endpoints are added
- During `/dev-story` when implementing data pipelines or batch jobs
- Proactively: audit existing entities for data quality issues
- After migrations: verify data integrity post-migration

## Validation Checks

### DQ1: Null Rate Thresholds
**Question:** Do critical fields have acceptable null/empty rates?

**How to audit:**
1. Identify all required fields per Prisma model (fields without `?` optional marker)
2. For each required field, check if application code can bypass validation
3. Flag patterns like: `create({ data: { field: null as any } })`

**Rules:**
| Field Category | Max Null Rate | Examples |
|---------------|--------------|---------|
| Identity (IDs, refs) | 0% | `tenantId`, `customerId` |
| Financial | 0% | `totalAmount`, `unitPrice` |
| Status/State | 0% | `orderStatus`, `ctkmStatus` |
| Display (names, titles) | <5% | `productName`, `description` |
| Optional metadata | <30% | `notes`, `tags` |

**Verdict:**
- ✅ PASS: All fields within thresholds
- ⚠️ WARN: Non-critical fields slightly above threshold
- ❌ FAIL: Critical field (financial/identity) has any nulls

### DQ2: Outlier Detection
**Question:** Are numeric values within expected business ranges?

**Rules:**
| Field Type | Expected Range | Flag |
|-----------|---------------|------|
| Price/Amount | > 0, < 10,000,000,000 (10B VND) | Negative or extreme values |
| Quantity | > 0, < 100,000 | Zero or unrealistic quantities |
| Percentage | 0-100 | Values outside range |
| Dates | Within ±5 years of current | Future dates or very old dates |

**Verdict:**
- ✅ PASS: All values within expected ranges
- ⚠️ WARN: Edge values found but plausible
- ❌ FAIL: Impossible values detected (negative prices, future order dates)

### DQ3: Schema Drift Detection
**Question:** Do Prisma schema changes break existing consumers?

**How to audit:**
1. Compare current Prisma schema with last known good state
2. Flag: removed fields still referenced in code
3. Flag: type changes (String→Int) without migration
4. Flag: new required fields without default values

**Verdict:**
- ✅ PASS: No breaking changes detected
- ⚠️ WARN: New optional fields added (consumers should be aware)
- ❌ FAIL: Breaking change (removed field, type change) without migration

### DQ4: Data Freshness
**Question:** Is data being updated at expected frequencies?

**Rules:**
| Entity | Expected Update Frequency | Staleness Alert |
|--------|--------------------------|-----------------|
| Order metrics | Every 5 minutes (BI cache) | > 15 minutes stale |
| Customer profile cache | On order events | > 24 hours since last order without update |
| CTKM status | On schedule trigger | Active CTKM past `endDate` still marked active |
| Product catalog | On admin edit | Cache >1 hour after edit |

**Verdict:**
- ✅ PASS: All data within freshness SLA
- ⚠️ WARN: Near-stale data detected
- ❌ FAIL: Stale data actively serving users/AI

### DQ5: Cross-Entity Consistency
**Question:** Do related entities maintain referential consistency?

**Checks:**
1. Every OrderItem references a valid Product
2. Every Order references a valid Customer
3. Every CTKM references valid Products in its rules
4. Every VoucherUsage references a valid Voucher
5. Soft-deleted parents don't have active children

**Verdict:**
- ✅ PASS: All references valid and consistent
- ⚠️ WARN: Soft-deleted references found but handled gracefully
- ❌ FAIL: Orphaned records or broken references detected

## Output Format

```markdown
# Data Quality Monitor Report
**Scope:** [entity/module name]
**Date:** [date]

## Summary
| Check | Verdict | Details |
|-------|---------|---------|
| DQ1: Null Rates | ✅/⚠️/❌ | [brief] |
| DQ2: Outliers | ✅/⚠️/❌ | [brief] |
| DQ3: Schema Drift | ✅/⚠️/❌ | [brief] |
| DQ4: Freshness | ✅/⚠️/❌ | [brief] |
| DQ5: Consistency | ✅/⚠️/❌ | [brief] |

## Critical Issues
[list any ❌ items with remediation]

## Warnings
[list any ⚠️ items with suggestions]
```
