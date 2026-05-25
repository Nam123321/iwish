---
name: "Data Retention Validator"
description: "Validates data retention policies — soft-delete vs hard-delete, TTL for logs/events, archival compliance."
---

# Data Retention Validator SKILL

## Purpose
Audit data lifecycle management to ensure:
1. Soft-delete is used for recoverable business data
2. Hard-delete respects legal retention periods
3. Log/event data has appropriate TTL
4. Archived data is accessible when needed
5. GDPR/PDPA deletion requests are honored within SLA

## Validation Checks

### DR1: Soft-Delete Compliance
**Question:** Is business data using soft-delete (`deletedAt`) instead of hard-delete?

**Entities requiring soft-delete:** Order, Customer, Product, CTKM, Voucher, ContentAsset
**Verdict:** ✅ All business entities use soft-delete · ❌ Hard-delete on recoverable entity

### DR2: Legal Retention
**Question:** Does data retention comply with legal minimums?

| Data Type | Min Retention | Law |
|-----------|--------------|-----|
| Financial records | 7 years | Tax law (VN) |
| Invoices | 10 years | Accounting law |
| Customer consent records | Duration of processing + 3 years | PDPA |

**Verdict:** ✅ All retentions meet minimums · ❌ Data purged before legal minimum

### DR3: Log TTL
**Question:** Do logs and events have defined TTL?

**Rules:** Application logs ≤ 90 days, Audit logs ≥ 2 years, Session data ≤ 7 days, DLQ events ≤ 30 days
**Verdict:** ✅ All TTLs defined and appropriate · ❌ Logs growing unbounded

### DR4: Archive Accessibility
**Question:** Can archived data be restored when needed?

**Checks:** Archive format is readable, restoration process documented, restore tested within last quarter
**Verdict:** ✅ Archive restoration tested · ⚠️ Process documented but untested · ❌ No archive process

### DR5: Deletion Request SLA
**Question:** Can GDPR/PDPA deletion requests be fulfilled within 30 days?

**Checks:** Deletion endpoint exists, cascades to all related data, confirmation audit log created
**Verdict:** ✅ Automated deletion pipeline · ⚠️ Manual process exists · ❌ No deletion capability

## Output Format
Standard SKILL report with DR1-DR5 verdicts.
