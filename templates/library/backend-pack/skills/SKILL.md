---
name: Data Integrity Guardian
description: Comprehensive data integrity validation skill for Prisma + Supabase + Frontend type alignment. Used by the Data Piccolo (Kira) agent and available to all BMAD agents.
---

# Data Integrity Guardian SKILL

## Purpose
Provides a structured set of validation rules, naming conventions, and cross-checking procedures to ensure data integrity across the full stack: **Prisma Schema ↔ NestJS Backend ↔ React Frontend ↔ Supabase DB ↔ Seed Data**.

## When to Use
- Before implementing any story that touches database tables
- During code review when schema changes are present
- When debugging data-related issues (missing columns, type mismatches, FK violations)
- When creating seed data for development/testing

---

## 1. Prisma Schema Naming Conventions

### Tables
- Model name: **PascalCase singular** (e.g., `Brand`, `ComboItem`, `ProductVariant`)
- DB table name via `@@map`: **snake_case plural** (e.g., `brands`, `combo_items`, `product_variants`)

### Columns
- Model field: **camelCase** (e.g., `isActive`, `createdAt`, `manufacturerId`)
- DB column via `@map`: **snake_case** (e.g., `is_active`, `created_at`, `manufacturer_id`)

### Indexes
- Format: `idx_{table}_{column}` (e.g., `idx_brands_tenant_id`)
- Unique: `uq_{table}_{columns}` (e.g., `uq_brand_tenant_slug`)

### Foreign Keys
- Field name: `{relation}Id` in camelCase (e.g., `tenantId`, `brandId`, `comboId`)
- DB name via `@map`: `{relation}_id` in snake_case

---

## 2. Required Standard Columns

Every table MUST have these columns unless explicitly exempted:

| Column | Type | Purpose | Exemptions |
|--------|------|---------|------------|
| `id` | `String @id @default(cuid())` | Primary key | Never |
| `createdAt` | `DateTime @default(now()) @map("created_at")` | Audit trail | Junction tables |
| `updatedAt` | `DateTime @updatedAt @map("updated_at")` | Audit trail | Junction tables |
| `deletedAt` | `DateTime? @map("deleted_at")` | Soft-delete | Junction tables, audit logs |
| `tenantId` | `String @map("tenant_id")` | Multi-tenant isolation | System-level tables (Tenant itself) |

### Feature-Specific Required Columns

| When feature needs... | Column required |
|----------------------|----------------|
| Visibility toggle | `isActive Boolean @default(true) @map("is_active")` |
| URL-friendly identifier | `slug String @db.VarChar(255)` + unique constraint |
| Display ordering | `sortOrder Int @default(0) @map("sort_order")` |
| Pricing | `Decimal @db.Decimal(12,2)` — NEVER use Float for money |

---

## 3. Multi-Tenant Data Isolation Rules

```
CRITICAL: Every query MUST filter by tenantId
```

- All `findMany`, `findFirst`, `findUnique` queries: include `{ where: { tenantId } }`
- All `create` operations: include `tenantId` in `data`
- All indexes: include `tenantId` as first column for partition-like performance
- Tenant FK: `@@index([tenantId], map: "idx_{table}_tenant_id")`

---

## 4. Pricing & Financial Data Rules

| Rule | Standard |
|------|----------|
| Currency fields | `Decimal @db.Decimal(12,2)` |
| Frontend display | Always format with `Intl.NumberFormat` or equivalent |
| Combo pricing | `comboPrice` MUST be < sum of `item.price × item.quantity` (otherwise no savings) |
| Promotion pricing | `promotionPrice` MUST be < `originalPrice` |
| Cost price | `costPrice` MUST be ≤ `sellPrice` (business margin rule) |
| Tax calculation | Applied on top of price, never modify base price |
| Discount stacking | Configurable per tenant — document in business rules |

---

## 5. Seed Data Quality Standards

### Business Logic Validation
- All FK references MUST resolve to existing parent records
- Pricing values MUST follow financial rules above
- Enum values MUST match Prisma enum definitions exactly
- Quantities MUST be > 0
- Slugs MUST be unique within tenant scope

### Realistic Data Requirements
- Product names: Use real-sounding Vietnamese/English names
- Prices: Use realistic market prices for the product category
- Dates: Use dates within the last 30 days for created records
- Images: Use valid URLs or placeholder services (not empty strings)

### Cross-Story Seed Data
- If Story N+1 needs data created by Story N, Story N's seed MUST include that data
- Document seed dependencies in the story's data spec
- Seed data should be idempotent (re-runnable without duplicates)

---

## 6. Frontend ↔ Backend Type Alignment

### The Golden Rule
```
Frontend TypeScript interfaces MUST mirror backend response shapes exactly.
If the backend returns `originalTotal: Decimal`, the frontend type must be `originalTotal: number`.
```

### Validation Checklist
- [ ] Every backend response field has a corresponding frontend type field
- [ ] Decimal fields are converted to `number` at the frontend boundary
- [ ] DateTime fields are handled as `string` (ISO) or `Date` consistently
- [ ] Nullable fields (`?` in Prisma) are `| null` in frontend types
- [ ] Nested relations match the `include` clause shape
- [ ] API response wrappers are consistent (`{ data: T[] }` vs raw `T[]`)

### Common Pitfalls
| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Prisma Decimal → frontend | Shows as `{ d: [...], e: n, s: 1 }` | `Number(value)` conversion |
| Missing `isActive` in schema | Frontend toggle saves but doesn't persist | Add column to Prisma schema |
| `Content-Type` on DELETE | 400 Bad Request from Fastify | Don't send body/content-type for DELETE |
| Response format inconsistency | `res.data?.data` vs `res` guessing | Standardize API response wrapper |

---

## 7. Cache & Performance Strategy

### Indexing Rules
- Every `tenantId` column: `@@index([tenantId])`
- Every `slug` used in lookups: `@@unique([tenantId, slug])`
- Frequently filtered columns: Add composite index with `tenantId`
- Boolean filters (e.g., `isActive`): `@@index([tenantId, isActive])`

### Cache Patterns
| Data Type | Cache Strategy | TTL |
|-----------|---------------|-----|
| Product catalog | Cache-aside with Redis | 5 min |
| Pricing rules | Write-through | On change |
| User session | Session cache | 24h |
| AI embeddings | Persistent vector store | Until retrained |
| Static config | App-level cache | On restart |

---

## 8. AI/ML Data Requirements

### Embedding Storage
- Use `pgvector` extension in Supabase for vector storage
- Schema: `embedding Float[] @db.Array(Float)` or dedicated vector column
- Index: HNSW or IVFFlat depending on dataset size

### AI Data Pipeline Schema
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ai_descriptions` | AI-generated product descriptions | `productId`, `description`, `model`, `generatedAt`, `isApproved` |
| `ai_suggestions` | AI recommendations/suggestions | `userId`, `type`, `payload`, `score`, `createdAt` |
| `ai_feedback` | User feedback on AI outputs | `aiOutputId`, `rating`, `comment`, `userId` |
| `embeddings` | Vector embeddings for products | `entityType`, `entityId`, `embedding`, `model`, `updatedAt` |

---

## 9. Validation Script (Quick Check)

When in doubt, run this mental checklist for any schema change:

```
□ Does every table have id, createdAt, updatedAt, tenantId?
□ Does every visibility-toggled entity have isActive?
□ Are all column names @mapped to snake_case?
□ Are all money fields Decimal(12,2)?
□ Is there an index on tenantId?
□ Does the frontend type match the response shape?
□ Does the seed data follow business rules?
□ Is the API response format consistent with other endpoints?
□ Are DELETE requests sent without Content-Type header?
□ Are nullable fields marked with ? in both schema and frontend type?
```

---

## 10. JSON Schema Contracts (v1.1)

Các cột `Json` trong Prisma PHẢI có TypeScript interface tương ứng và validated on API boundary:

| Column | Model | Interface Required | Validation Point |
|--------|-------|-------------------|-----------------|
| `options` | `ProductVariant` | `Record<string, { value: string; imageUrl?: string }>` | API input (create/update) |
| `stepData` | `WizardSession` | `Record<string, any>` | API save endpoint |
| `fieldOverrides` | `TenantConfig` | `Record<string, FieldOverride>` | API update |
| `rules` | `Collection` | `CollectionRuleSet` | Collection create/update |
| `chatHistory` | `WizardSession` | `ChatMessage[]` | Wizard save |

### URL Sanitization Rule
Any `imageUrl` or `url` field within JSON:
- MUST start with `https://` or `http://`
- MUST NOT contain `<script>`, `javascript:`, or `data:text/html`
- Frontend MUST sanitize before rendering: `new URL(val).protocol === 'https:'`

---

## 11. Edge Case & Error Handling Data Rules (v1.1)

| Edge Case | Expected Behavior | Layer |
|-----------|------------------|-------|
| `options` = `null` | Treat as single-SKU (no variant picker) | Frontend |
| `options` = `{}` | Same as null — no attribute display | Frontend |
| `price` = `0` | Display "Liên hệ" instead of ₫0 | Frontend |
| `imageUrl` invalid/broken | Fallback to product default image | Frontend |
| `imageUrl` contains script tag | REJECT — block rendering | Frontend + Backend |
| Variant count = 0 but product exists | Show product without variant picker | Frontend |
| FK reference to deleted parent | Return null relation, don't crash | Backend |
| `Decimal` returned as string | Auto-convert via `Number()` at API boundary | Backend DTO |
| Empty array `[]` for relations | Return empty array, not null | Backend |
| `tenantId` mismatch in nested query | Return 403 Forbidden | Backend Guard |

---

## 12. Required Test Data Matrix (v1.1)

Every data spec MUST include test data covering these scenarios:

### Variant/Product Test Matrix

| Scenario | Variants | Options Format | Stock | Price |
|----------|:--------:|:--------------:|:-----:|:-----:|
| Single SKU | 1 | `null` | In-stock | Normal |
| Few variants (Layout A) | 3-6 | Full with imageUrl | Mixed in/out | Normal |
| Many variants (Layout B) | 7-15 | Full | Mixed | Normal |
| Stress test | 20-50 | Sparse (some null) | All in-stock | Normal |
| Edge: no variants | 0 | N/A | N/A | N/A |
| Edge: price = 0 | 1+ | Full | In-stock | 0 |
| Edge: all out-of-stock | 3+ | Full | All out | Normal |
| Edge: Unicode names | 2+ | Vietnamese chars | In-stock | Normal |

### Financial Test Matrix

| Scenario | Expected |
|----------|----------|
| Combo price < sum parts | Show positive savings ✅ |
| Combo price = sum parts | Show 0 savings (no badge) |
| Combo price > sum parts | BUG — should never happen |
| Cost > sell price | WARNING — negative margin |
| Price with many decimals | Round to 2 decimal places |

