---
name: "create-cache-strategy"
description: "Design CQRS Read Model — Redis/in-memory cache strategy for hot-read paths"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Cache Strategy (CQRS Read Model Design)

## Pre-requisites
- Cache Performance Guardian SKILL available at `{project-root}/.agent/skills/cache-performance-guardian/SKILL.md`
- Story file or feature description available
- Prisma schema accessible
- Redis infrastructure details (if known)

## Workflow Steps

### Step 1: Context Loading
1. Load the Cache Performance Guardian SKILL from `{project-root}/.agent/skills/cache-performance-guardian/SKILL.md`
2. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
3. Load the story file specified by the user (or ask for it)
4. Load the Prisma schema from `{project-root}/distro/prisma/schema.prisma`
5. If available, load existing data-flow-architecture for this feature

### Step 2: Hot-Read Path Identification
Scan the feature's API endpoints and UI pages to identify data that is:

| Criteria | Score | Example |
|----------|-------|---------|
| Read >10x per minute per tenant | +3 | Active CTKM list |
| Read on every user interaction | +3 | Customer profile |
| Data changes <1x per hour | +2 | Product catalog |
| Data changes >1x per minute | -2 | Real-time inventory |
| Used by AI prompt assembly | +3 | Context snapshots |
| Cross-tenant aggregation | +1 | Platform-wide metrics |

List ALL identified hot-read paths and their scores.

### Step 3: Cache Tier Classification
For each hot-read path, assign a cache tier:

| Tier | Technology | Latency | Use When |
|------|-----------|---------|----------|
| **L1: In-Memory** | Node.js Map/LRU | <1ms | Config, feature flags, small static lookups |
| **L2: Redis** | Redis Hash/String | <10ms | Session data, active CTKM, customer profiles, AI context |
| **L3: Database** | Prisma with indexes | <100ms | Full records, complex joins, audit trails |

### Step 4: Cache Key Design
For each L1/L2 cached item, design the key schema:

```
Pattern: {scope}:{tenantId}:{entity}:{identifier}:{variant}

Examples:
  tenant:abc123:active-ctkms              → SET of active CTKM IDs
  tenant:abc123:customer:cus456:profile   → HASH with pre-aggregated profile
  tenant:abc123:product:prod789:summary   → STRING with JSON summary for AI
  global:feature-flags                    → HASH with feature toggles
```

⚡ **Kira++ collaboration recommended** for key schema design.

### Step 5: TTL & Invalidation Matrix
For each cached item:

| Item | TTL | Invalidation Trigger | Strategy |
|------|-----|---------------------|----------|
| Active CTKMs | 5 min | CTKM status change | Event-driven invalidation + TTL fallback |
| Customer Profile | 15 min | Order placed / profile updated | Event-driven |
| Product Summary | 1 hour | Product CRUD | Event-driven |
| Feature Flags | 30 sec | Admin config change | Short TTL (polling) |

Invalidation strategy options:
- **Write-through:** Update cache on every write (consistent but slower writes)
- **Write-behind:** Async update (faster writes, brief inconsistency)
- **Event-driven:** BullMQ/pub-sub triggers cache update
- **TTL-only:** Let cache expire naturally (simplest, allows staleness)

### Step 6: Cache Warm-Up Strategy
Define how cache is populated on:
1. **Cold start** (server restart): Batch load critical items
2. **Cache miss** (runtime): Read-through pattern with DB fallback
3. **New tenant onboarding**: Pre-populate tenant-specific cache

### Step 7: Memory Budget
Estimate Redis memory consumption:

```
Per tenant:
  Active CTKMs:     ~50 items × 2KB    = ~100KB
  Customer profiles: ~500 items × 1KB  = ~500KB
  Product summaries: ~200 items × 3KB  = ~600KB
  Total per tenant:                    ≈ 1.2MB

At 100 tenants: ~120MB Redis
At 1000 tenants: ~1.2GB Redis
```

Flag ⚠️ if total exceeds infrastructure budget.

### Step 8: Mermaid Architecture Diagram
Create diagram showing:
- Write path (Prisma → DB)
- Read path (API → L1 → L2 → L3)
- Invalidation flows (Events → Cache)
- AI context assembly path

### Step 9: Validation
Run the Cache Performance Guardian SKILL (C1-C5) against the design:
- C1: Hot-path coverage
- C2: Cache tier appropriateness
- C3: TTL correctness
- C4: Invalidation safety
- C5: Memory budget within limits

### Step 10: Output
Save to `{output_folder}/data-specs/{feature-key}-cache-strategy.md` with:
- Hot-read path inventory
- Cache tier classification
- Key schema (⚡ Kira++ reviewed)
- TTL & invalidation matrix
- Memory budget estimate
- Architecture diagram
- Cache Performance Guardian validation results

Present to user for review.
