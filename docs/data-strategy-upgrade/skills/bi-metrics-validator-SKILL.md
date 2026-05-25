---
name: "BI Metrics Validator"
description: "Validates BI metric definitions — ensures calculation accuracy, aggregation logic correctness, time-series consistency, and tenant isolation for all dashboard/reporting metrics."
---

# BI Metrics Validator SKILL

## Purpose
Validates that BI metrics and dashboard data are correctly defined, accurately calculated, and properly scoped. Catches common BI bugs: wrong aggregation, timezone issues, missing tenant filters, double-counting, and stale cache.

## When to Use
- After designing a BI pipeline (via Shinji's `[BP]` or `/create-bi-pipeline`)
- During code review for dashboard/report endpoints
- When implementing Story 10.3 (Business Dashboards), 10.4 (SaaS Dashboard), 10b-S10, 10b-S15
- Periodically to audit existing dashboard accuracy

## Agents That Use This Skill
- **Shinji** (Data Strategist) — for BI pipeline design validation
- **Quinn** (QA) — for dashboard testing
- **Barry** (Dev) — when implementing metric calculations
- **Kira++** (Data Architect) — when designing materialized views

## Validation Checklist

### B1: Metric Definition Completeness
Every metric MUST have:

```
| Field | Required | Example |
|-------|----------|---------|
| name | ✅ | Monthly Recurring Revenue (MRR) |
| businessDefinition | ✅ | Sum of all active subscription monthly values |
| formula | ✅ | SUM(plans.priceMonthly) WHERE tenant.status = 'active' |
| sourceEntities | ✅ | SubscriptionPlan, Tenant |
| aggregationType | ✅ | SUM / COUNT / AVG / MEDIAN / P95 |
| timeGranularity | ✅ | daily / monthly / yearly |
| tenantScope | ✅ | per-tenant or platform-wide |
| unit | ✅ | VND / count / percentage |
| refreshStrategy | ✅ | real-time / 5min cache / hourly batch / daily batch |
```

### B2: Aggregation Logic Correctness
```
Common pitfalls to check:

❌ Double-counting:
   - Orders with multiple items counted once per item → wrong revenue total
   - FIX: Aggregate at order level, not order-item level

❌ Wrong time bucketing:
   - Monthly MRR calculated from daily snapshots misses mid-month changes
   - FIX: Use end-of-period snapshot or event-sourced calculation

❌ Currency mixing:
   - Summing VND and USD values without conversion
   - FIX: Normalize to base currency before aggregation

❌ Deleted record inclusion:
   - SUM includes soft-deleted records (deletedAt IS NOT NULL)
   - FIX: Always filter WHERE deletedAt IS NULL

❌ Status-unaware counting:
   - COUNT(*) includes cancelled/draft/expired records
   - FIX: Filter by business-meaningful statuses only
```

### B3: Time-Series Consistency
```
CHECK: Timezone handling

  - All timestamps stored in UTC in database
  - Display converted to tenant timezone (Asia/Ho_Chi_Minh default)
  - Aggregation buckets use tenant timezone for "daily" metrics
  - Month boundaries respect tenant timezone

CHECK: Period transitions

  - Monthly metrics cover full calendar months
  - No gaps between periods (end of Jan → start of Feb)
  - No overlapping periods
  - YTD calculations handle year transitions correctly
```

### B4: Tenant Isolation
```
CHECK: Every metric query includes tenantId filter

  Platform-wide metrics (SaaS admin only):
    - MRR, ARR, Churn Rate, LTV — aggregate across tenants
    - MUST require platform-admin role check
    - MUST NOT be accessible to tenant-admin

  Tenant-scoped metrics (tenant admin):
    - Revenue, Orders, Top Products — per-tenant only
    - MUST include WHERE tenantId = :tenantId
    - MUST NOT leak cross-tenant data
```

### B5: Performance & Cache
```
CHECK: Dashboard query performance

  - Queries returning aggregate data should complete < 2 seconds
  - Complex aggregations should use materialized views or pre-computed tables
  - Redis cache TTL matches refreshStrategy in metric definition
  - Cache invalidation happens on data changes (not just TTL expiry)

CHECK: Large dataset handling

  - Date range queries have upper bound (max 1 year default)
  - Pagination for detail drilldowns (max 100 rows per page)
  - Export endpoints use streaming (not load-all-in-memory)
```

## Output Format

```markdown
# BI Metrics Validation Report — [Dashboard/Feature Name]

## Summary
- Metrics validated: N
- 🔴 Calculation errors: N
- ⚠️ Missing definitions: N
- ✅ Passing: N

## Metric Review

### [Metric Name]
- Definition: ✅/❌
- Aggregation: ✅/❌ [detail if wrong]
- Time-series: ✅/❌
- Tenant scope: ✅/❌
- Performance: ✅/❌

## Recommendations
[Prioritized fixes]
```

## Integration Points

- **`/create-bi-pipeline`**: Auto-runs B1-B5 after pipeline design
- **`/code-review`**: Runs B2 and B4 for dashboard endpoint changes
- **`/dev-story`**: Runs B1 when implementing metric calculation tasks
