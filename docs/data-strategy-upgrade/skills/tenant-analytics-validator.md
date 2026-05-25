---
name: "Tenant Analytics Validator"
description: "Validates tenant-scoped analytics — ensures KPI calculations are tenant-isolated, platform metrics don't leak, and aggregations are correct."
---

# Tenant Analytics Validator SKILL

## Purpose
Audit BI/analytics implementations to ensure:
1. Tenant-scoped KPIs only count that tenant's data
2. Platform-wide metrics (MRR, churn) are super-admin-only
3. Aggregation queries respect tenant boundaries
4. Dashboard filter state cannot expose cross-tenant data
5. Export/report outputs are scoped correctly

## Validation Checks

### TA1: Tenant KPI Isolation
**Question:** Do KPI calculations filter by tenantId?

**Critical KPIs:** Revenue, order count, customer count, conversion rate, average order value
**How to audit:** Check aggregation queries for tenantId in WHERE clause.
**Verdict:** ✅ All tenant KPIs filtered · ❌ KPI aggregates across tenants

### TA2: Platform Metric Access Control
**Question:** Are platform-wide metrics restricted to super-admin role?

**Platform metrics:** Total MRR, tenant count, platform GMV, churn rate
**How to audit:** Check API endpoint guard for SuperAdmin role.
**Verdict:** ✅ Access controlled · ❌ Any tenant admin can see platform metrics

### TA3: Aggregation Boundary
**Question:** Do GROUP BY queries maintain tenant isolation?

**How to audit:** Check for `GROUP BY` without `WHERE tenantId =` preceding it.
**Verdict:** ✅ All aggregations scoped · ❌ Cross-tenant aggregation possible

### TA4: Dashboard Filter Safety
**Question:** Can a user manipulate dashboard filters to see other tenants' data?

**How to audit:** Check if tenantId comes from auth (server-side) not from filter params (client-side).
**Verdict:** ✅ TenantId server-enforced · ❌ TenantId from client filter

### TA5: Export Scoping
**Question:** Do CSV/PDF exports contain only the requesting tenant's data?

**How to audit:** Check export API endpoint for tenant scope enforcement.
**Verdict:** ✅ Exports scoped · ❌ Export could include cross-tenant rows

## Output Format
Standard SKILL report with TA1-TA5 verdicts and Tenant Analytics Score [X/5].
