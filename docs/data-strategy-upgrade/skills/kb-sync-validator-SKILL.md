---
name: "KB Sync Validator"
description: "Validates Knowledge Base synchronization coverage — detects sync gaps between Prisma entities and KB systems (Cognee, NotebookLM), monitors staleness, and ensures AI consumers have access to current data."
---

# KB Sync Validator SKILL

## Purpose
Ensures the Knowledge Base stays synchronized with source data. Detects gaps where business entities exist in the database but are NOT indexed in the KB, causing AI to operate without current knowledge.

## When to Use
- After KB pipeline changes (Cognee or NLM updates)
- During story creation for AI-related features
- During code review when Product/CTKM/Category data models change
- Periodically as a health check on KB completeness

## Agents That Use This Skill
- **Shinji** (Data Strategist) — primary user, for KB sync pipeline design
- **Songoku** (AI Engineer) — when reviewing AI prompt quality
- **Quinn** (QA) — during AI feature testing
- **Barry** (Dev) — when implementing KB-consumer integrations

## Architecture Reference: Option C (Hybrid)

```
Product Tab → Prisma DB → Product KB Sync → Cognee KG (unified query layer)
KB Upload (Story 7.5) → Cognee KG
NLM Upload (Story 7.4c) → NotebookLM → Content Assets → Cognee Index (metadata)
AI Consumers → Cognee Unified Search → contextual response
```

## Validation Checklist

### K1: Entity KB Coverage
Check if business entities are indexed in the appropriate KB system:

```
Entity Coverage Matrix:

| Entity | Should Index? | Cognee? | NLM? | Sync Trigger |
|--------|---------------|---------|------|-------------|
| Product | ✅ YES | ❌ GAP | ❌ | On CRUD |
| Product.description | ✅ YES | ❌ GAP | ❌ | On update |
| Product.storageConditions | ✅ YES | ❌ GAP | ❌ | On update |
| Category | ✅ YES | ❌ GAP | ❌ | On CRUD |
| Brand | ✅ YES | ❌ GAP | ❌ | On CRUD |
| CTKM (active) | ✅ YES | ❌ GAP | ❌ | On status change |
| KnowledgeDocument | ✅ YES | ✅ OK | ❌ | On upload |
| KbTrainingRule | ✅ YES | ✅ OK | ❌ | On save |
| KnowledgeSource | ❌ (NLM only) | ❌ | ✅ OK | On upload |
| ContentAsset | ⚠️ metadata | ❌ GAP | ✅ OK | On approve |
```

### K2: Consumer Module Integration
Check if AI consumer modules actually query the KB:

```
Consumer Integration Check:

| Consumer Module | Queries Cognee? | Uses ContentAsset? | Uses PromptAssembly? |
|-----------------|-----------------|--------------------|--------------------|
| chat-to-order | ❌ DISCONNECTED | ❌ | ❌ |
| social-content | ❌ DISCONNECTED | ❌ | ❌ |
| recommendations | ❌ DISCONNECTED | ❌ | ❌ |
| pdp-companion | ❌ DISCONNECTED | ❌ | ❌ |
| zalo-message | ❌ DISCONNECTED | ❌ | ❌ |
| roleplay-sandbox | ✅ Connected | ❌ | ✅ |
| webstore-chat | ⚠️ UI only | ❌ | ❌ |
```

### K3: Staleness Detection
For each indexed entity, check data freshness:

```
Staleness Rules:
  - Product data: Max 1 hour between DB change and KB update
  - CTKM data: Max 15 minutes (promotions are time-sensitive)
  - Training rules: Max 5 minutes (behavioral corrections are urgent)
  - Content assets: Max 24 hours (batch sync acceptable)

Check Method:
  1. Query latest `updatedAt` for entity in Prisma
  2. Query latest index timestamp in Cognee (if available)
  3. Delta > threshold → 🔴 STALE
  4. No index timestamp found → ❌ NOT INDEXED
```

### K4: Bidirectional Sync Check
Verify that data flows both ways when applicable:

```
Bidirectional Sync Rules (per KB Architecture Option C):
  
  Product Tab → KB:
    - Admin creates/updates product → auto-index into Cognee
    - Fields to index: name, description, storageConditions, shelfLifeDays,
      category, brand, baseUnit, variants[].sellingPrice
  
  KB → Product Tab:
    - If admin uploads product info document to KB (via Story 7.5)
    - AND document contains structured product data
    - THEN extracted product attributes SHOULD be offered as suggestions
      to update the Product record (not auto-update — human-in-the-loop)
  
  NLM → Cognee:
    - When ContentAsset is approved
    - Index metadata (title, tags, summary) into Cognee
    - So AI consumers can discover NLM-generated content via unified search
```

### K5: Tenant Isolation Verification
```
CHECK: KB queries are ALWAYS scoped by tenantId

  - Cognee search uses namespace: `tenant:{tenantId}`
  - NLM content is filtered by tenantId
  - Cross-tenant data leakage = 🔴 CRITICAL security issue
  
Verify:
  - CogneeService.search() includes tenantId parameter
  - ContentAssetService queries include tenantId WHERE clause
  - No global/unscoped KB queries exist
```

## Output Format

```markdown
# KB Sync Validation Report — [Context]

## Health Score: X/100

### Scoring
- Entity coverage: N/M indexed (×30 weight)
- Consumer integration: N/M connected (×30 weight)
- Staleness: N/M within threshold (×20 weight)
- Tenant isolation: pass/fail (×20 weight)

## 🔴 Critical Gaps
| # | Gap | Impact | Fix Priority |
|---|-----|--------|-------------|

## ⚠️ Warnings
| # | Issue | Impact | Fix Priority |
|---|-------|--------|-------------|

## ✅ Healthy
| # | Check | Status |
|---|-------|--------|

## Recommendations
1. [Prioritized list of fixes]
```

## Integration Points

- **`/create-kb-strategy`**: Runs K1-K5 to assess current state before designing sync pipeline
- **`/create-data-flow`**: Runs K1 to check if entities in the flow need KB indexing
- **`/songoku-ai-review`**: Runs K2 to verify consumer module KB integration
- **`/code-review`**: Runs K5 for any file that queries Cognee or ContentAsset
