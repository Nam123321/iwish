---
name: "Multi-Tenant Data Validator"
description: "Validates multi-tenant data isolation — ensures every query is tenant-scoped, no cross-tenant leakage, and cache keys are namespaced."
---

# Multi-Tenant Data Validator SKILL

## Purpose
Audit codebase and data architecture to guarantee:
1. Every Prisma query includes tenantId scope
2. No cross-tenant data leakage in API responses
3. API endpoints enforce tenant context from auth
4. Redis cache keys are namespaced by tenant
5. Cognee/KB searches are scoped by tenant

## When to Use
- During `/code-review` on any service that queries Prisma
- During `/dev-story` when implementing new endpoints
- Before releases: scan entire module for tenant isolation
- During `/create-cache-strategy`: verify cache key namespacing

## Validation Checks

### MT1: Prisma Query Tenant Scoping
**Question:** Does every Prisma query filter by tenantId?

**How to audit:**
1. Search for all `prisma.*.findMany`, `findFirst`, `findUnique`, `update`, `delete` calls
2. For each call, check if `where` clause includes `tenantId`
3. Exceptions: Superadmin queries explicitly marked with `// @tenant-bypass`

**Patterns to flag:**
```typescript
// ❌ FAIL: No tenant scope
const orders = await prisma.order.findMany({
  where: { status: 'ACTIVE' }
});

// ✅ PASS: Tenant scoped
const orders = await prisma.order.findMany({
  where: { tenantId, status: 'ACTIVE' }
});
```

**Verdict:**
- ✅ PASS: All queries scoped by tenantId (or explicitly bypassed)
- ⚠️ WARN: Global lookup tables (ProductCategory) without tenant scope (may be intentional)
- ❌ FAIL: Business data query missing tenantId filter

### MT2: No Cross-Tenant Joins
**Question:** Can a query accidentally return data from another tenant?

**How to audit:**
1. Check all `include` and `select` with nested relations
2. Verify that included relations belong to the same tenant
3. Flag any raw SQL queries that join across tenants

**Verdict:**
- ✅ PASS: All joins stay within tenant boundary
- ❌ FAIL: Nested include could return cross-tenant data

### MT3: API Endpoint Tenant Enforcement
**Question:** Do API endpoints extract tenantId from auth JWT, not from request body?

**How to audit:**
1. Check all controller methods for tenant context extraction
2. Verify tenantId comes from `@CurrentUser()` decorator or auth middleware
3. Flag any endpoint accepting tenantId as query param or body field

**Patterns to flag:**
```typescript
// ❌ FAIL: Tenant from request (spoofable)
@Post()
create(@Body() dto: { tenantId: string; ... }) {}

// ✅ PASS: Tenant from auth context
@Post()
create(@CurrentUser() user: AuthUser, @Body() dto: CreateDto) {
  const tenantId = user.tenantId;
}
```

**Verdict:**
- ✅ PASS: All endpoints use auth-derived tenantId
- ❌ FAIL: Endpoint accepts tenantId from client input

### MT4: Redis Cache Key Namespacing
**Question:** Are all Redis cache keys prefixed with tenantId?

**How to audit:**
1. Search for all Redis SET/GET/HSET/HGET operations
2. Verify key pattern follows `tenant:{tenantId}:...` convention
3. Flag any global keys that contain tenant-specific data

**Patterns to flag:**
```typescript
// ❌ FAIL: No tenant namespace
redis.set('active-ctkms', JSON.stringify(ctkms));

// ✅ PASS: Tenant namespaced
redis.set(`tenant:${tenantId}:active-ctkms`, JSON.stringify(ctkms));
```

**Verdict:**
- ✅ PASS: All tenant-specific keys properly namespaced
- ⚠️ WARN: Global keys exist but contain only non-sensitive config
- ❌ FAIL: Tenant data stored under global/shared key

### MT5: KB/Cognee Tenant Scoping
**Question:** Are Cognee semantic searches filtered by tenant?

**How to audit:**
1. Check all Cognee `search()` or `query()` calls
2. Verify tenant filter is applied to results
3. Flag any search that could return another tenant's product data

**Verdict:**
- ✅ PASS: All KB searches scoped by tenant metadata
- ❌ FAIL: KB search could leak cross-tenant knowledge

## Output Format

```markdown
# Multi-Tenant Data Validator Report
**Module:** [module name]
**Date:** [date]

## Summary
| Check | Verdict | Queries Scanned | Issues |
|-------|---------|----------------|--------|
| MT1: Prisma Scoping | ✅/❌ | [count] | [count] |
| MT2: Cross-Tenant Joins | ✅/❌ | [count] | [count] |
| MT3: API Enforcement | ✅/❌ | [count] | [count] |
| MT4: Redis Namespacing | ✅/❌ | [count] | [count] |
| MT5: KB Scoping | ✅/❌ | [count] | [count] |

## Critical Issues
[list each with file path, line number, and fix]

## Tenant Isolation Score: [X/5]
```
