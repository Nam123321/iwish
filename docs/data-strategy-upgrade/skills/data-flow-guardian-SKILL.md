---
name: "Data Flow Guardian"
description: "Validates data flow completeness — ensures every data producer has a consumer, every entity change has a sync strategy, and no orphan data patterns exist."
---

# Data Flow Guardian SKILL

## Purpose
Automated validation skill that catches data architecture gaps BEFORE they become production problems. Ensures no "orphan data" patterns (data produced but never consumed) and no missing sync strategies.

## When to Use
- After creating a `data-flow-architecture.md` (via Shinji's `/create-data-flow`)
- During code review when new services or modules are added
- During story creation when data-related ACs are defined
- Before sprint planning to validate cross-story data dependencies

## Agents That Use This Skill
- **Shinji** (Data Strategist) — primary user, for validating flow designs
- **Kira++** (Data Architect) — for cross-referencing schema changes against flows
- **Quinn** (QA) — during code review, to check data completeness
- **Barry** (Dev) — during `/dev-story`, to validate implementation matches flow design

## Validation Checklist

### V1: Producer/Consumer Completeness
For every entity in the feature scope:

```
CHECK: Does every data PRODUCER have at least 1 CONSUMER?

How to check:
1. List all services that CREATE or UPDATE entities (producers)
2. List all services that READ or SUBSCRIBE to those entities (consumers)
3. Flag any producer without a consumer as 🔴 ORPHAN DATA

Example:
  ✅ ProductService.create() → consumed by CogneeService.index(), CtkmEvaluationService.evaluate()
  ❌ KbTrainingService.saveCorrection() → NOT consumed by any AI consumer module → 🔴 ORPHAN
```

### V2: Sync Strategy Defined
For every cross-module data dependency:

```
CHECK: Does every entity change have an explicit sync strategy?

Acceptable sync strategies:
  - EVENT_DRIVEN: Entity change emits event → subscriber processes
  - QUERY_ON_DEMAND: Consumer queries producer's API when needed
  - CDC: Change Data Capture via DB triggers/middleware
  - BATCH_SYNC: Scheduled job syncs data periodically
  - CACHE_THROUGH: Write-through cache keeps data synchronized

Unacceptable:
  - ❌ "We'll sync it later"
  - ❌ No strategy defined
  - ❌ "Manual import"
```

### V3: KB Sync Coverage
For entities that AI should know about:

```
CHECK: Is this entity indexed in the Knowledge Base?

Entities that SHOULD be KB-indexed:
  - Product (name, description, storageConditions, specs)
  - Category (name, hierarchy)
  - Brand (name)
  - CTKM (promotion rules, conditions)
  - KbTrainingRule (behavioral corrections)
  - ContentAsset (approved content from NLM)

Check:
  - Is there a sync pipeline from Prisma → Cognee for this entity?
  - What is the staleness threshold? (should be < 24h)
  - Is there a trigger on CRUD to update KB?
```

### V4: Event Payload Consistency
For every event in the system:

```
CHECK: Does every event have a defined payload schema?

Required event fields:
  - eventType: string (e.g., "product.updated")
  - tenantId: string (multi-tenant isolation)
  - entityId: string (affected entity)
  - timestamp: ISO8601
  - payload: typed object (not any/unknown)
  - source: string (producing service name)
```

### V5: Data Flow Diagram Exists
```
CHECK: Is there a Mermaid or visual diagram showing data flow?

Required for:
  - Any feature with 3+ entities
  - Any cross-module data dependency
  - Any KB/AI integration
  - Any event-driven feature
```

## Output Format

When running this SKILL, produce a report in this format:

```markdown
# Data Flow Validation Report — [Feature/Story Name]

## Summary
- Total entities checked: N
- Producers found: N
- Consumers found: N
- 🔴 Orphan data patterns: N
- ⚠️ Missing sync strategies: N
- ❌ KB sync gaps: N

## Detailed Findings

### 🔴 Critical (Must Fix Before Dev)
| # | Entity | Issue | Recommendation |
|---|--------|-------|----------------|
| 1 | Product | No KB sync pipeline | Add Cognee index on CRUD |

### ⚠️ Warning (Should Fix)
| # | Entity | Issue | Recommendation |
|---|--------|-------|----------------|

### ✅ Passing
| # | Check | Status |
|---|-------|--------|
| V1 | Producer/Consumer completeness | ✅ |
```

## Integration Points

- **`/create-data-flow`**: Auto-runs V1-V5 after flow design is complete
- **`/code-review`**: Checks V1 and V3 for any file that creates new services
- **`/dev-story`**: Checks V2 when implementing data-related tasks
- **`/create-data-spec`**: Kira++ loads this SKILL to cross-validate schema against flows
