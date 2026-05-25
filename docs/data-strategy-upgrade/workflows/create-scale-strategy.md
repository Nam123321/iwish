---
name: "create-scale-strategy"
description: "Design data scaling strategy — partitioning, read replicas, connection pooling, horizontal triggers"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Scale Strategy

## Pre-requisites
- Cache Performance Guardian SKILL at `{project-root}/.agent/skills/cache-performance-guardian/SKILL.md`
- Multi-Tenant Data Validator SKILL at `{project-root}/.agent/skills/multi-tenant-data-validator/SKILL.md`
- Current Prisma schema and infrastructure details

## Workflow Steps

### Step 1: Context Loading
1. Load validation SKILLs
2. Load Prisma schema
3. Load current infrastructure specs (DB size, connection limits, Redis memory)

### Step 2: Current Scale Assessment
| Metric | Current | 6-Month Target | 12-Month Target |
|--------|---------|----------------|-----------------|
| Tenants | X | Y | Z |
| Orders/day | X | Y | Z |
| DB size | X GB | Y GB | Z GB |
| Concurrent users | X | Y | Z |
| API requests/sec | X | Y | Z |

### Step 3: Bottleneck Analysis
Identify scaling bottlenecks:

| Component | Bottleneck | Trigger Point | Impact |
|-----------|-----------|---------------|--------|
| PostgreSQL connections | Connection pool exhaustion | >100 concurrent | API timeouts |
| Redis memory | OOM killer | >4GB | Cache eviction cascade |
| BullMQ throughput | Queue backlog | >1000 pending jobs | Event processing delay |
| Prisma query latency | Table scan on large tables | >1M rows | Slow API responses |

### Step 4: Scaling Strategy Per Component

#### Database
| Strategy | When | Implementation |
|----------|------|---------------|
| **Connection Pooling** (PgBouncer) | Now | Pool size = CPU cores × 2 + spindle count |
| **Read Replicas** | >500 concurrent reads/sec | Prisma `$replica()` for read operations |
| **Table Partitioning** | >10M rows in Order/AuditLog | Partition by `createdAt` (monthly) |
| **Column Indexing** | Query p95 > 200ms | Composite indexes on frequent WHERE clauses |

#### Redis
| Strategy | When | Implementation |
|----------|------|---------------|
| **Eviction Policy** | Memory >70% capacity | `allkeys-lru` for cache, `noeviction` for queues |
| **Cluster Mode** | >16GB or >100K ops/sec | Redis Cluster with hash slots |
| **Separate Instances** | Cache vs Queue contention | Dedicated Redis for cache, separate for BullMQ |

#### Application
| Strategy | When | Implementation |
|----------|------|---------------|
| **Horizontal Scaling** | CPU >70% sustained | Auto-scale pods (K8s HPA) |
| **Worker Scaling** | BullMQ backlog >500 | Scale BullMQ workers independently |
| **CDN for Static** | Global users | CloudFlare/Vercel Edge for static assets |

### Step 5: Migration Path
Define zero-downtime migration steps for each scaling action.

### Step 6: Output
Save to `{output_folder}/data-specs/{scope}-scale-strategy.md`.
⚡ **Kira++ collaboration recommended** for schema partitioning and indexing decisions.
Present to user for review.
