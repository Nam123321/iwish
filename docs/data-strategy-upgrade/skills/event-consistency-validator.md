---
name: "Event Consistency Validator"
description: "Validates event payload consistency — detects events lost/duplicated, schema mismatches, and delivery guarantee violations."
---

# Event Consistency Validator SKILL

## Purpose
Audit event-driven architecture to ensure:
1. Event schemas match between producer and consumer
2. No orphaned events (produced but never consumed)
3. No phantom consumers (consuming non-existent events)
4. Idempotency is enforced for at-least-once delivery
5. Event ordering guarantees are maintained where required

## Validation Checks

### EC1: Schema Consistency
**Question:** Do producer and consumer agree on event payload schema?

**How to audit:** Compare TypeScript interface at producer emit point with consumer handler parameter type.
**Verdict:** ✅ Schemas match · ❌ Schema mismatch (field missing/type changed)

### EC2: Orphaned Events
**Question:** Are there events produced that no consumer handles?

**How to audit:** Scan for all `queue.add()` / `emit()` calls. Cross-reference with `@OnEvent()` / `@Process()` handlers.
**Verdict:** ✅ All events have ≥1 consumer · ⚠️ Event has consumer but it's disabled · ❌ Event produced with zero consumers

### EC3: Phantom Consumers
**Question:** Are there consumers listening for events that are never produced?

**How to audit:** Scan for all `@OnEvent('name')` / `@Process('name')` handlers. Verify producer exists.
**Verdict:** ✅ All consumers have matching producers · ❌ Consumer for non-existent event

### EC4: Idempotency
**Question:** Can at-least-once delivery cause duplicate processing?

**Checks:** Consumer checks `eventId` before processing, uses DB unique constraint or Redis SETNX for dedup.
**Verdict:** ✅ Idempotency enforced · ⚠️ Idempotency exists but not tested · ❌ No idempotency guard

### EC5: Ordering Guarantees
**Question:** Are events that require ordering processed in order?

**Checks:** Events needing FIFO use `tenantId` as partition key, single-consumer queues for ordered processing.
**Verdict:** ✅ Ordering enforced where needed · ❌ Concurrent consumers on order-sensitive queue

## Output Format
Standard SKILL report with EC1-EC5 verdicts.
