---
name: "Cache Performance Guardian"
description: "Validates cache strategy completeness — ensures hot-read paths are cached, TTLs are appropriate, invalidation is safe, and memory budget is within limits."
---

# Cache Performance Guardian SKILL

## Purpose
Audit a cache strategy design or existing codebase to ensure:
1. All hot-read data paths are cached appropriately
2. Cache tiers (L1/L2/L3) are correctly assigned
3. TTL and invalidation logic prevents stale data in production
4. Redis memory usage stays within infrastructure budget
5. Multi-tenant cache isolation is enforced

## When to Use
- After running `/create-cache-strategy` workflow (validate the output)
- During `/code-review` when API endpoints perform DB queries
- During `/dev-story` when implementing services that read frequently-accessed data
- Proactively: scan existing codebase for uncached hot-paths

## Validation Checks

### C1: Hot-Path Coverage
**Question:** Is every frequently-read data path cached?

**How to audit:**
1. List all API endpoints in the feature/module
2. For each endpoint, count estimated reads per minute per tenant
3. Flag any endpoint with >10 reads/min that queries Prisma directly without cache

**Verdict:**
- ✅ PASS: All hot-paths (>10 reads/min) have L1 or L2 cache
- ⚠️ WARN: 1-2 hot-paths missing cache but low severity
- ❌ FAIL: Critical hot-path (AI context, dashboard, chat) queries DB directly

### C2: Cache Tier Appropriateness
**Question:** Is each cached item in the right tier?

**Rules:**
| Data characteristic | Correct Tier | Wrong Tier (Flag) |
|--------------------|--------------|--------------------|
| Static config (<1KB, changes rarely) | L1 in-memory | L2 Redis (wasteful) |
| Per-tenant dynamic data (<10KB) | L2 Redis | L1 in-memory (memory leak) |
| Large dataset (>100KB) | L3 DB with index | L2 Redis (memory hog) |
| AI prompt context snapshot | L2 Redis | L3 DB (too slow for LLM) |

**Verdict:**
- ✅ PASS: All items in appropriate tier
- ⚠️ WARN: 1-2 items could be optimized
- ❌ FAIL: Critical misplacement (e.g., large dataset in L1)

### C3: TTL Appropriateness
**Question:** Are TTL values safe for the data's volatility?

**Rules:**
| Data volatility | Max safe TTL |
|----------------|-------------|
| Changes every minute (inventory, live status) | 30 sec |
| Changes every hour (CTKM status, prices) | 5 min |
| Changes daily (product descriptions) | 1 hour |
| Rarely changes (config, feature flags) | 30 min |
| AI context snapshot | Match freshness SLA |

**Verdict:**
- ✅ PASS: All TTLs ≤ safe maximum for their volatility
- ⚠️ WARN: TTL slightly aggressive but acceptable
- ❌ FAIL: TTL too long → risk of serving stale data to users/AI

### C4: Invalidation Safety
**Question:** Can stale cache cause incorrect business logic?

**Critical scenarios to check:**
1. CTKM cache stale → customer applies expired promotion → revenue loss
2. Product price cache stale → wrong price displayed → trust loss
3. Permission cache stale → user sees unauthorized data → security risk
4. AI context cache stale → hallucination with outdated info → UX damage

**For each scenario:**
- Is there an event-driven invalidation trigger?
- Is there a TTL fallback?
- What is the maximum staleness window?

**Verdict:**
- ✅ PASS: All critical paths have event-driven invalidation + TTL fallback
- ⚠️ WARN: Non-critical paths rely on TTL only
- ❌ FAIL: Critical path has no invalidation mechanism

### C5: Memory Budget
**Question:** Will Redis memory stay within infrastructure limits at scale?

**Calculation template:**
```
Per tenant: [item_count × avg_size_bytes] summed across all cached items
Total: per_tenant × projected_tenant_count
Redis available: [infrastructure_limit]
Usage ratio: total / available
```

**Verdict:**
- ✅ PASS: Usage ratio <60% at projected scale
- ⚠️ WARN: Usage ratio 60-80%
- ❌ FAIL: Usage ratio >80% → need eviction policy or tier optimization

## Output Format

```markdown
# Cache Performance Guardian Report
**Feature:** [feature name]
**Date:** [date]

## Summary
| Check | Verdict | Details |
|-------|---------|---------|
| C1: Hot-Path Coverage | ✅/⚠️/❌ | [brief] |
| C2: Tier Appropriateness | ✅/⚠️/❌ | [brief] |
| C3: TTL Safety | ✅/⚠️/❌ | [brief] |
| C4: Invalidation Safety | ✅/⚠️/❌ | [brief] |
| C5: Memory Budget | ✅/⚠️/❌ | [brief] |

## Critical Issues
[list any ❌ items with remediation]

## Warnings
[list any ⚠️ items with suggestions]

## Passing
[brief confirmation of ✅ items]
```
