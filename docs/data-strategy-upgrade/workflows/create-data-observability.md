---
name: "create-data-observability"
description: "Design data observability — logging, tracing, alerting for data pipelines, tracking failures, latency, throughput"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Data Observability Design

## Pre-requisites
- Data Quality Monitor SKILL at `{project-root}/.agent/skills/data-quality-monitor/SKILL.md`
- Existing event topology and data flow designs (if available)

## Workflow Steps

### Step 1: Context Loading
1. Load Data Quality Monitor SKILL
2. Load existing event topology, data flow maps, and BI pipeline designs
3. Load the story/feature description

### Step 2: Observability Scope
Define what data systems need monitoring:

| System | Type | Key Metrics |
|--------|------|------------|
| BullMQ Event Queues | Event processing | Throughput, latency, DLQ depth, error rate |
| Redis Cache | Cache layer | Hit rate, memory usage, eviction rate, latency |
| Cognee KB Sync | Knowledge pipeline | Sync frequency, failure rate, freshness |
| BI Aggregation Jobs | Batch processing | Duration, row count, freshness lag |
| Prisma DB Queries | Database | Slow queries (>500ms), connection pool usage |

### Step 3: Three Pillars Design

#### Metrics (Quantitative)
| Metric | Source | Alert Threshold | Dashboard |
|--------|--------|----------------|-----------|
| Event processing p95 latency | BullMQ | > 5s | ✅ |
| Cache hit rate | Redis INFO | < 80% | ✅ |
| DB slow query count | Prisma middleware | > 10/min | ✅ |
| KB sync freshness | Custom heartbeat | > 1hr stale | ✅ |

#### Logs (Qualitative)
| Log Event | Level | Fields | Retention |
|-----------|-------|--------|-----------|
| Event processed | INFO | `eventId, type, duration, tenantId` | 30 days |
| Event failed | ERROR | `eventId, type, error, stack, tenantId` | 90 days |
| Cache miss on hot-path | WARN | `key, tenantId, fallback_used` | 7 days |
| Slow query detected | WARN | `query, duration, params` | 30 days |

#### Traces (Causal)
Track end-to-end flow for critical operations:
- Order creation: API → Validation → Prisma → Event → Consumers (notification, BI, cache)
- AI Chat: Query → PromptAssembly → (Cognee + Redis + Mem0) → LLM → Response

### Step 4: Alerting Strategy
| Severity | Response Time | Channel | Example |
|----------|--------------|---------|---------|
| P0 Critical | Immediate | SMS + Slack | DB connection pool exhausted |
| P1 High | 15 min | Slack #alerts | DLQ depth > 50 |
| P2 Medium | 1 hour | Slack #monitoring | Cache hit rate < 70% |
| P3 Low | Next day | Email digest | Slow query count trending up |

### Step 5: Output
Save to `{output_folder}/data-specs/{scope}-data-observability.md`.
Present to user for review.
