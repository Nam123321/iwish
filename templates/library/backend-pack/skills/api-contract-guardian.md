---
name: API Contract Guardian
description: Ensures FE↔BE API route consistency by enforcing use of the shared api-routes.ts contract file. Used during Vegeta-story, code-review, and any API endpoint work.
---

# API Contract Guardian SKILL

## Purpose
Prevents FE↔BE API route mismatches by enforcing a **single source of truth** for all API endpoints: `@distro/shared/src/api-routes.ts`. This skill provides validation rules, anti-pattern detection, and audit commands.

## When to Use
- **During `Vegeta-story`**: When implementing any task that adds/modifies API endpoints
- **During `code-review`**: When reviewing code that touches controllers or api-client
- **During debugging**: When encountering 404 errors on API calls
- **During story creation**: When defining backend tasks with API endpoints

---

## 1. The Golden Rule

```
EVERY API endpoint MUST be defined in @distro/shared/src/api-routes.ts FIRST.
Both FE (api-client.ts) and BE (controllers) MUST use routes matching this file.
```

---

## 2. Controller Prefix Rules

| Rule | ✅ Correct | ❌ Wrong |
|------|-----------|---------|
| Controller prefix | `@Controller('products')` | `@Controller('api/v1/products')` |
| Global prefix | Handled by `setGlobalPrefix('api/v1')` | Duplicated in controller |
| Nested resources | `@Patch(':id/variants/:variantId')` | `@Patch('variants/:variantId')` |

### Why?
The NestJS app uses `app.setGlobalPrefix('api/v1')` in `main.ts`. Controllers that also include `api/v1/` create double-prefixed routes: `api/v1/api/v1/...`

---

## 3. Validation Checklist

Run this checklist for ANY task that touches API endpoints:

```
□ 1. Route defined in @distro/shared/src/api-routes.ts
□ 2. FE api-client.ts uses the same path pattern
□ 3. BE controller route matches the same path pattern
□ 4. No @Controller() includes 'api/v1/' prefix (double-prefix anti-pattern)
□ 5. Nested resource routes include parent ID in path (:parentId/child/:childId)
□ 6. HTTP method matches (GET/POST/PATCH/PUT/DELETE)
□ 7. Path parameters use consistent naming (:id, :variantId, :batchId, etc.)
□ 8. If new route added, api-routes.ts is updated AND exported from index.ts
□ 9. No raw `fetch('/api/v1/...')` in component code — must use `apiClient` or `API_BASE`
```

---

## 4. Quick Audit Commands

Agents can run these to detect mismatches:

### Check for double-prefix anti-pattern
```bash
grep -rn "Controller('api/v1" distro/apps/api/src/modules/
```
Expected: **0 results** (all should use plain prefix like 'products', 'orders', etc.)

### Count FE routes vs api-routes.ts entries
```bash
# FE api-client route count
grep -c "api\." distro/apps/admin/src/lib/api-client.ts

# Shared route count
grep -c "'/[a-z]" distro/packages/shared/src/api-routes.ts
```

### Find FE routes not using shared constants (future enforcement)
```bash
grep -n "'/api/v1/" distro/apps/admin/src/lib/api-client.ts | head -20
```

### Check for raw fetch bypass (relative API URLs in components)
```bash
grep -rn "fetch(\`/api/v1/" distro/apps/admin/src/
```
Expected: **0 results** (all API calls must use `apiClient` or `API_BASE` constant)

---

## 5. Anti-Patterns

### ❌ Anti-Pattern 1: Double Prefix
```typescript
// BAD — creates /api/v1/api/v1/cart
@Controller('api/v1/cart')

// GOOD — creates /api/v1/cart
@Controller('cart')
```

### ❌ Anti-Pattern 2: Missing Parent ID
```typescript
// BAD — FE sends /products/abc/variants/xyz but this only matches /products/variants/xyz
@Patch('variants/:variantId')

// GOOD — matches FE expectation
@Patch(':id/variants/:variantId')
```

### ❌ Anti-Pattern 3: Hardcoded URLs
```typescript
// BAD — hardcoded URL, may drift from BE
api.patch(`/api/v1/products/${id}/variants/${vid}`, data)

// BETTER — uses shared constant (future migration)
api.patch(buildUrl(PRODUCT_ROUTES.UPDATE_VARIANT, { id, variantId: vid }), data)
```

### ❌ Anti-Pattern 4: Raw Fetch Bypass (Port Mismatch)
```typescript
// BAD — relative URL hits Next.js Vegeta server (port 3000), NOT API server (port 3001)
// Also missing auth token (Bearer) since credentials: 'include' only works same-origin
fetch('/api/v1/products')
fetch(`/api/v1/products/${id}`)

// GOOD — uses apiClient which reads NEXT_PUBLIC_API_URL and injects Bearer token
apiClient.products.list()
apiClient.products.get(id)

// ACCEPTABLE — uses API_BASE for raw fetch (FormData uploads, streaming, etc.)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
fetch(`${API_BASE}/api/v1/products`)
```

---

## 6. File Locations

| Artifact | Path |
|----------|------|
| **Shared Routes (source of truth)** | `distro/packages/shared/src/api-routes.ts` |
| **Admin FE API Client** | `distro/apps/admin/src/lib/api-client.ts` |
| **Admin FE API Wrapper** | `distro/apps/admin/src/lib/api.ts` |
| **BE Controllers** | `distro/apps/api/src/modules/*/` |
| **Global Prefix** | `distro/apps/api/src/main.ts` (`setGlobalPrefix('api/v1')`) |

---

## 7. When Adding a New Endpoint

Follow this exact order:

1. **Define route** in `api-routes.ts` under the appropriate module section
2. **Export** from `index.ts` if adding a new route group
3. **Implement BE** controller method + service method
4. **Implement FE** api-client method using the same path pattern
5. **Verify** by running the quick audit commands above
