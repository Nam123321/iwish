---
name: "create-event-topology"
description: "Design event-driven architecture — event catalog, payload schemas, transport, DLQ, and monitoring"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create Event Topology

## Pre-requisites
- Event Consistency Validator SKILL (if available) at `{project-root}/.agent/skills/event-consistency-validator/SKILL.md`
- Data Flow Guardian SKILL at `{project-root}/.agent/skills/data-flow-guardian/SKILL.md`
- Story file or feature description
- Prisma schema accessible

## Workflow Steps

### Step 1: Context Loading
1. Load available validation SKILLs
2. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
3. Load the story/feature description
4. Load existing data-flow architecture if available

### Step 2: Event Catalog
List ALL domain events the feature produces or consumes:

| Event Name | Producer | Payload Summary | Transport |
|------------|----------|----------------|-----------|
| `order.created` | OrderService | `{orderId, tenantId, customerId, totalAmount}` | BullMQ |
| `ctkm.status_changed` | CTKMScheduler | `{ctkmId, tenantId, oldStatus, newStatus}` | BullMQ |
| `content.approved` | ContentService | `{contentId, tenantId, platform}` | BullMQ |

For each event include: name (domain.action format), producer module, key payload fields, transport mechanism.

### Step 3: Consumer Mapping
For each event, list ALL consumers and their purpose:

| Event | Consumer | Action | Criticality |
|-------|----------|--------|-------------|
| `order.created` | NotificationService | Send confirmation SMS/Zalo | High |
| `order.created` | BIAggregator | Update revenue metrics | Medium |
| `order.created` | CacheInvalidator | Refresh customer profile cache | High |
| `order.created` | KBSyncWorker | Update customer purchase history in Cognee | Low |

Criticality levels: **High** (business logic depends on it), **Medium** (analytics/reporting), **Low** (nice-to-have enrichment).

### Step 4: Payload Schema Design
For each event, define the full TypeScript interface:

```typescript
interface OrderCreatedEvent {
  eventId: string;        // UUID, idempotency key
  timestamp: string;      // ISO 8601
  tenantId: string;       // Multi-tenant scope
  version: number;        // Schema version (start at 1)
  payload: {
    orderId: string;
    customerId: string;
    totalAmount: number;
    items: Array<{ productId: string; quantity: number; }>;
  };
}
```

**Rules:**
- Every event MUST have: `eventId`, `timestamp`, `tenantId`, `version`
- Payload should be self-contained (no need for consumer to query DB for basic info)
- Avoid embedding large objects (>10KB) — use IDs with lazy-load instead

### Step 5: Transport & Delivery Guarantees
For each event, define:

| Property | Options | Decision |
|----------|---------|----------|
| Transport | BullMQ / Redis Pub-Sub / Webhook | BullMQ (persistent, retryable) |
| Delivery | At-least-once / At-most-once / Exactly-once | At-least-once (with idempotency) |
| Ordering | FIFO per tenant / Unordered | FIFO per tenant (use tenantId as queue partition) |
| Retry | Max retries, backoff | 3 retries, exponential backoff (1s, 5s, 30s) |

### Step 6: Dead Letter Queue (DLQ) Strategy
Define handling for failed events:
1. **DLQ destination:** Separate BullMQ queue (`{event-name}.dlq`)
2. **Alert mechanism:** Slack/email notification after event enters DLQ
3. **Manual replay:** Admin endpoint to replay DLQ events
4. **Retention:** DLQ events retained for 7 days before purge

### Step 7: Monitoring & Observability
Define metrics to track:

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| Event processing latency | BullMQ metrics | > 5s avg |
| DLQ depth | DLQ queue length | > 10 events |
| Consumer error rate | Application logs | > 1% in 5 min window |
| Event throughput | BullMQ metrics | < 50% of expected |

### Step 8: Mermaid Event Flow Diagram
Create event flow visualization:
```
[Producer] --event--> [BullMQ Queue] --consume--> [Consumer A]
                                     --consume--> [Consumer B]
                         |
                    [DLQ] -- alert --> [Admin Dashboard]
```

### Step 9: Output
Save to `{output_folder}/data-specs/{feature-key}-event-topology.md` with:
- Event catalog (complete list)
- Consumer mapping matrix
- Payload schemas (TypeScript interfaces)
- Transport & delivery guarantees
- DLQ strategy
- Monitoring dashboard metrics
- Event flow diagram (Mermaid)

Present to user for review.
