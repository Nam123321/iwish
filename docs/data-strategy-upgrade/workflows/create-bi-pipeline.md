---
name: "create-bi-pipeline"
description: "Design BI/analytics pipeline — metrics, aggregation strategy, dashboard data model, reporting infrastructure"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create BI Pipeline Design

## Pre-requisites
- BI Metrics Validator SKILL available at `{project-root}/.agent/skills/bi-metrics-validator/SKILL.md`
- Story/feature scope with dashboard or reporting requirements
- Prisma schema accessible

## Workflow Steps

### Step 1: Context Loading
1. Load the BI Metrics Validator SKILL from `{project-root}/.agent/skills/bi-metrics-validator/SKILL.md`
2. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
3. Load the story file or feature description
4. Load the Prisma schema from `{project-root}/distro/prisma/schema.prisma`

### Step 2: Metric Inventory
List ALL metrics the dashboard/report needs:

| Metric | Business Definition | Priority |
|--------|-------------------|----------|
| Revenue | Sum of order totalAmount (completed) | P0 |
| MRR | Sum of active subscription monthly values | P0 |

For each metric, fill the B1 completeness template from the SKILL.

### Step 3: Source Entity Mapping
For each metric, map to source Prisma models:

```
Metric → Source Entities → Required Fields → Joins → Filters
Revenue → Order → totalAmount → none → WHERE status='completed' AND deletedAt IS NULL
```

### Step 4: Aggregation Strategy

For each metric, define:
- **Real-time** (< 5 sec): Direct DB query with cache
- **Near-real-time** (< 5 min): Redis-cached computed value
- **Batch** (hourly/daily): Pre-computed materialized view or summary table
- **On-demand** (export): Streaming query with pagination

Decision matrix:
```
If dashboard metric + changes frequently → Near-real-time (Redis cache)
If dashboard metric + changes rarely → Batch (materialized view)  
If export/report → On-demand (streaming)
If SaaS platform metric → Batch daily + Redis cache
```

### Step 5: Data Pipeline Architecture

Design the pipeline using Mermaid:
```
[Source Tables] → [Aggregation Layer] → [Cache Layer] → [API Layer] → [Dashboard UI]
```

Include:
- Cron schedules for batch jobs
- Redis cache keys and TTLs
- API endpoint paths
- Error handling and fallback

### Step 6: Schema Requirements
Identify if new models are needed:

- Summary/snapshot tables (e.g., `DailyRevenueSummary`)
- Materialized views
- New indexes on existing tables for aggregation performance
- Flag "⚡ Kira++ collaboration recommended" for schema design

### Step 7: Validation
Run the BI Metrics Validator SKILL (B1-B5) against the design:
- All metrics have complete definitions
- Aggregation logic is correct
- Time-series handling is consistent
- Tenant isolation is enforced
- Performance targets are achievable

### Step 8: Output
Save to `{output_folder}/data-specs/{feature-key}-bi-pipeline.md` with:
- Metric inventory (complete definitions)
- Source entity mapping
- Aggregation strategy per metric
- Pipeline architecture (Mermaid diagram)
- Schema change requirements
- Redis cache strategy
- Implementation priority

Present to user for review.
