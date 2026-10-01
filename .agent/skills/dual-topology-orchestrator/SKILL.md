---
name: "dual-topology-orchestrator"
description: "Use when designing, implementing, or reviewing systems that require both durable workflows (XState/LangGraph) and high-throughput ephemeral data processing (BullMQ)."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# Dual Topology Orchestrator

## When to Use This Skill
Use this skill when architecting or implementing a background processing system that mixes durable, stateful workflows (such as multi-step sagas, user onboarding, billing) with high-throughput, ephemeral data processing tasks (such as event ingestion, image processing, metrics aggregation). This skill implements boundary patterns using XState / LangGraph and BullMQ (Active) for durable workflows, with Inngest planned as a Pilot for Phase Gated Evolution, and BullMQ (for high-throughput ephemeral data plane execution).

## Core Rules
1. **Separation of Concerns:** MUST NOT use BullMQ for long-running workflows with sleep/wait states or complex retries spanning days without an external state manager. MUST use XState or LangGraph with BullMQ (Active) for these durable workflows, keeping Inngest in mind as a future Pilot.
2. **Throughput Routing:** MUST NOT use LangGraph for high-frequency, fire-and-forget background jobs. MUST use BullMQ for high-throughput ephemeral tasks.
3. **Topology Boundary:** Durable workflows MAY enqueue jobs into BullMQ for high-throughput processing steps, and BullMQ jobs MAY trigger State Machine transitions upon completion of a batch, but they MUST NOT share state directly.
4. **Idempotency:** Both State Machine steps and BullMQ jobs MUST be designed idempotently to handle retries safely without causing unintended side effects.

## Anti-Patterns
- Using LangGraph/XState to process millions of small, stateless events per hour (Cost/Throughput anti-pattern).
- Using pure BullMQ for multi-day sagas requiring sleep states and complex step-level retries without external Postgres checkpointing (Reliability anti-pattern).
- Sharing the same Redis instance for BullMQ's ephemeral queue data and persistent application state without proper memory limit configuration.

## Best Practices
- **LangGraph/XState:** Use Postgres checkpointing for triggering business workflows. Utilize state machines to wrap distinct logical operations for automatic retries and state transitions.
- **BullMQ:** Use `Queue` for enqueueing and `Worker` for processing. Configure Redis eviction policies appropriately (e.g., `allkeys-lru` or `volatile-lru`).
- **Monitoring:** Implement separate observability strategies via OpenTelemetry to track states across both runtimes.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-DTO-01 | Verify state machine initialization exists in durable workflow files | Category A | `grep_search` or AST parsing for `createMachine` / `StateGraph` | Tool call output |
| GATE-DTO-02 | Verify BullMQ worker initialization exists in ephemeral worker files | Category A | `grep_search` or AST parsing for `new Worker` | Tool call output |
| GATE-DTO-03 | Assess appropriateness of routing decision (State Machine vs Queue) | Category B | Agent reasoning | Chat transcript |

*Enforcement Maturity:* 66% (2/3 Category A)

