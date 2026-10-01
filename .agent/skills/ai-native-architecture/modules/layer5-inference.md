# Module: Layer 5 — AI Inference Engine & Graph

> **Sources**: Layer 3 — *Orchestration & Harness LLMs* · Layer 5 — *Multi-Agent Graph Engineering*
> **Scope**: StateGraph & Reducers, Checkpointing, HITL & Time-Travel, A2A & Saga, 6 Topological Patterns, Context Isolation, Transactional Safety, Model Selection, Top Gotchas

---

## Purpose

This module is the **densest operational reference** in the AI-Native Architecture skill. It merges the runtime orchestration layer (Layer 3 — Harness Core) with the multi-agent graph engineering layer (Layer 5 — Graph Engineering) into a single cohesive guide.

**Layer 3** transforms stateless LLM inference engines into safe, stateful, production-grade systems through the Harness Core middleware (`H = (E, T, C, S, L, V)`), persistent checkpointing, HITL gates, and Saga transactions.

**Layer 5** scales that foundation to multi-agent graphs by applying cognitive decomposition, six canonical topological patterns, cross-context isolation, and transactional safety for autonomous tool-calling at enterprise scale.

Together they answer one question: *How do you build a deterministic, crash-resilient, multi-tenant multi-agent system that can pause for human review, rollback distributed transactions, and self-heal — without ever losing state?*

---

## Core Principles

### From Layer 3 — Harness & Orchestration

| # | Principle | One-liner |
|---|-----------|-----------|
| P1 | **Runtime Paradigm Shift** | The LLM is a stateless brain; the Harness is the OS that makes it stateful and safe. |
| P2 | **Separation of Concerns (Tri-Layer)** | Cleanly divide *Framework* (static blueprint) → *Harness* (middleware) → *Runtime* (infra). |
| P3 | **Prompts → Finite State Machines** | Shift from prompt-tuning to persistent directed state machines with idempotent tool calls. |
| P4 | **Harness Primitives `H = (E, T, C, S, L, V)`** | Six mathematically isolated duties: Execution Loop, Tool Registry, Context Manager, State Store, Lifecycle Hooks, Evaluation Interface. |
| P5 | **Deterministic Control Boundaries** | Enterprise workflows must transition from free-form ReAct to Graph Engineering for rigid, deterministic control. |
| P6 | **Single Source of Truth** | Graph state is governed by a centralized Shared State Schema — every node reads/writes through it. |
| P7 | **Dual-Horizon Memory Isolation** | Short-term (Redis, in-memory) for low-latency chat vs. Long-term (PostgresSaver) for crash-resilient persistence. |
| P8 | **Hard Architectural Human Gating** | Sensitive operations require deterministic `interrupt()` gates — never full autonomy. |
| P9 | **Branching History Tree** | Execution history is immutable checkpoints; corrections use checkout + branch + replay (Time-Travel). |
| P10 | **Long-Running Transactional Integrity** | Saga compensating transactions replace ACID locks for multi-hour agent workflows. |
| P11 | **Idempotency by Default** | Every write tool must carry a distributed UUID Idempotency-Key. |

### From Layer 5 — Multi-Agent Graph

| # | Principle | One-liner |
|---|-----------|-----------|
| P12 | **Cognitive Decomposition** | Break complex tasks into a directed network of specialist nodes — each with minimal harness & toolset. |
| P13 | **Safe State Aggregation (Reducers)** | Parallel nodes must define Reducers per state attribute to prevent catastrophic race conditions. |
| P14 | **Bulk Synchronous Parallel (BSP)** | Graphs advance through discrete Super-steps: Local Compute → Barrier Sync → Routing. |
| P15 | **Context Isolation Boundary** | Each worker node is encapsulated in its own context — no raw history sharing across agents. |
| P16 | **State Projection** | When crossing edges, project only strongly-typed keys from `S_shared` — never dump raw context. |
| P17 | **Context Purging** | After subgraph completion, destroy all intermediate logs; return only distilled results to parent. |
| P18 | **KV-Cache ≥ 99% Hit Rate** | Keep model context windows clean through isolation + purging to maximize GPU cache efficiency. |
| P19 | **Circuit Breaking (FinOps)** | Every session has a hard token-budget contract with automatic circuit breaker. |
| P20 | **Trace Quality Gates** | Only harvest execution traces scoring ≥ 90 (LLM-as-judge) into long-term memory. |

---

## Mental Models & Frameworks

### 1. The Tri-Layer Responsibility Division

```
┌──────────────────────────────────────────────────────┐
│  AGENT FRAMEWORK (Blueprint Layer)                   │
│  Defines: roles, goals, playbooks, tool schemas      │
│  Examples: CrewAI, Pydantic AI, Mastra               │
├──────────────────────────────────────────────────────┤
│  AGENT HARNESS (Middleware Layer)                     │
│  H = (E, T, C, S, L, V)                             │
│  Handles: execution loops, context compression,      │
│           short-term memory, HITL gates, PII masking │
│  Examples: Microsoft Agent Framework, DeepAgents     │
├──────────────────────────────────────────────────────┤
│  AGENT RUNTIME (Execution Substrate)                 │
│  Handles: persistent state machines, PostgresSaver,  │
│           queue management, code sandbox isolation   │
│  Examples: LangGraph Platform, Temporal, Inngest     │
└──────────────────────────────────────────────────────┘
```

### 2. Harness Core Primitives — `H = (E, T, C, S, L, V)`

| Primitive | Role |
|-----------|------|
| **E** — Execution Loop | Drives Thought-Action-Observation under `max_iterations` with exception handling. |
| **T** — Tool Registry | Validates inputs via JSON Schema; routes calls through MCP servers. |
| **C** — Context Manager | Prunes old tool outputs (compaction); keeps GPU KV-cache clean. |
| **S** — State Store | Persists session data to SQLite/PostgreSQL across long-running workflows. |
| **L** — Lifecycle Hooks | Intercepts before/after model calls for PII masking, authz, sandboxing. |
| **V** — Evaluation Interface | Records execution traces; compares against goldens for fine-tuning. |

### 3. Mathematical Specification of Multi-Agent Graph `G`

$$G = (N, E, S_{\text{shared}})$$

- **Nodes** `N = {n₁, n₂, …, nₖ}`: Independent specialist agents or deterministic functions. Each takes a local state slice and returns `Δs`.
- **Edges** `E = {(nᵢ, nⱼ, f_cond)}`: Normal (unconditional) or Conditional (router function evaluates `S_shared` to pick next node).
- **Shared State Schema** `S_shared`: Central memory — context, aggregated history, intermediate results.

### 4. StateGraph & Reducers

```python
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]   # Append reducer — accumulate, never overwrite
    current_task: str                          # Overwrite reducer (default)
    verification_passed: bool
```

**Reducer** = `f(v_current, v_new) → v_accumulated`. Prevents race conditions when parallel nodes write to shared state.

- *Conversations*: Use `operator.add` (append).
- *Todo lists*: Use dict-update by primary key (atomic overwrite per item).

### 5. Super-step & BSP Execution Model

1. **Local Compute**: Active nodes run inference in parallel on local harnesses.
2. **Barrier Synchronization**: Collect all `Δs`, run Reducers, update `S_shared`.
3. **Routing**: Conditional edges evaluate new `S_shared` to determine next active nodes.

### 6. Subgraphs & Context Isolation

- **Parent Graph**: Maintains high-level state (business attributes).
- **Subgraph**: Owns local low-level state; its entire lifecycle is one super-step to the parent.
- **Purge on Exit**: Destroy all intermediate logs/tool outputs; return only distilled summary.
- **Result**: KV-Cache hit rate ≥ 99%; token cost reduced by up to 50%.

### 7. Dual-Horizon Memory Model

| Horizon | Store | Lifetime | Purpose |
|---------|-------|----------|---------|
| Short-term | Redis (in-memory) | Active session | Low-latency chat responses |
| Long-term | PostgresSaver (Postgres/SQLite) | Days–weeks | Crash-resilient atomic recovery |

### 8. HITL — Interrupt & Resume Lifecycle

1. **Encounter Gate**: Node flagged for review triggers `interrupt()`.
2. **State Snapshot**: Serialize current Thread ID state to PostgreSQL.
3. **Halt & Release**: Exception pauses thread; frees CPU/GPU — zero compute while idle.
4. **Webhook**: Fire event payload to Generative UI for human review card.
5. **Resume**: Load checkpoint, append feedback, continue execution.

### 9. Time-Travel Debugging & Replay

1. **History Extraction**: Query all checkpoints for a Thread ID.
2. **State Branching**: `update_state(thread_config, values, as_node=...)` to edit a past checkpoint.
3. **Replay**: Execute forward from edited checkpoint — forks a new branch, preserves audit trail.

### 10. A2A Protocol (Agent-to-Agent)

- **Handshake**: Agents negotiate available skills.
- **Handoff**: Package active state + trace into structured payload; transfer control deterministically.
- **Context Scoping**: Share only a minimal scoped view — prevent sensitive data leakage.
- **Transport**: JSON-RPC messages (`session_id`, `sender_id`, `recipient_id`, XML-typed `payload`) via API Broker.

### 11. Saga Coordination Pattern

```
Forward:   n₁ (Book Flight) → n₂ (Book Hotel) → n₃ (Pay Bill)
                                                    ↓ (failure)
Rollback:  c₂ (Cancel Hotel) ← c₁ (Cancel Flight)
```

- Every forward step carries a UUID **Idempotency-Key**.
- **Write-Ahead Log (WAL)**: Record `PENDING` → execute → record `COMPLETED`.
- On failure: trigger compensating nodes in reverse order to restore consistency.

### 12. Three Orchestration Schools

| Dimension | LangGraph | AutoGen / AG2 | CrewAI |
|-----------|-----------|---------------|--------|
| **Philosophy** | Persistent FSM / Graph | Conversational Actors | Role-Based Teams |
| **Determinism** | Absolute (code-defined edges) | Medium (free-form chat) | Low (LLM-driven) |
| **Persistence** | Postgres, SQLite, Redis | Memory / context files | SQLite, Pydantic |
| **Token Efficiency** | Excellent (50%↓ via Subgraphs) | Poor (context bloat) | Poor (role-prompt overhead) |
| **PoC Speed** | Slow (schema + boilerplate) | Fast (few days) | Very fast (hours) |
| **HITL** | Deep (`interrupt()`) | Limited | `@human_feedback` decorator |
| **Best For** | Production / enterprise | Open debates, sandboxed code | Rapid prototyping |

---

## Decision Trees

### A. Responsibility Routing — Where Does This Task Belong?

```
Is the task…
├─ Defining static persona, goals, tool schemas?
│  └─▸ AGENT FRAMEWORK
├─ Handling physical infra, OS-level security?
│  └─▸ AGENT RUNTIME (checkpoints, queues, sandbox)
└─ Bridging logic with runtime (middleware)?
   └─▸ AGENT HARNESS
       ├─ Execution loop / step limits?  → E
       ├─ Tool validation / MCP routing? → T
       ├─ Context pruning / KV-cache?    → C
       ├─ Session state / persistence?   → S
       ├─ Security hooks / PII masking?  → L
       └─ Tracing / evaluation?          → V
```

### B. Topology Selection — Which Graph Pattern?

```
Step 1: Does the flow need dynamic branching based on context?
├─ No (fixed, linear) ────────────────▸ Sequential Pipeline
└─ Yes → Step 2:
   Need parallel processing of independent data sources?
   ├─ Yes ─────────────────────────────▸ Concurrent Fan-out / Fan-in
   └─ No → Step 3:
      Open-ended task needing dynamic planning & delegation?
      ├─ Yes ──────────────────────────▸ Hierarchical (Supervisor-Worker)
      └─ No → Step 4:
         Peer agents with specialized domains that self-route?
         ├─ Yes ───────────────────────▸ Handoff-Led Swarm
         └─ No → Step 5:
            Requires adversarial review / high-quality output?
            ├─ Yes ────────────────────▸ Group Chat (Maker-Checker)
            └─ No (react to events) ──▸ Event-Driven
```

### C. State & Isolation Strategy

```
Designing a multi-agent flow?
├─ Execution path highly dynamic / unpredictable?
│  └─▸ Conversational frameworks (AutoGen/AG2)
└─ Structured, sensitive enterprise process?
   └─▸ Graph Engineering (StateGraph)
       ├─ Multiple agents/tools run in parallel?
       │  └─▸ Define State Reducers (operator.add)
       └─ System expanding (dozens of nodes)?
          ├─ No → Single Shared State Schema
          └─ Yes → Context poisoning / high token cost?
             └─▸ Segment into SUBGRAPHS
                 ├─ Local State Schemas
                 └─ Super-step Boundaries
```

### D. Persistence Selection

```
What are the persistence requirements?
├─ Low-latency active session responses?
│  └─▸ SHORT-TERM: Redis / in-memory buffer
└─ Must survive crashes or long idle periods?
   └─▸ LONG-TERM: Checkpointers
       ├─ Single-tenant / local dev?
       │  └─▸ MemorySaver or SqliteSaver
       └─ Multi-tenant SaaS?
          └─▸ PostgresSaver + Row-Level Security (RLS)
              └─ PgBouncer? Session Pooling with RLS
                 (NEVER use dynamic SET search_path with Transaction Pooling)
```

### E. HITL vs. Autonomous Execution

```
Is the node executing a sensitive/high-risk transaction?
├─ Yes: Exceeds safety limits (e.g., > $10k)?
│  └─▸ Trigger interrupt()
│      1. Serialize state snapshot to PostgreSQL
│      2. Freeze runtime, release CPU/GPU
│      3. Fire webhook → Generative UI
│      4. Lock checkpoint with document hash
└─ No: Did the agent fail or user wants to change past decision?
   └─▸ Execute Time-Travel
       1. Fetch checkpoint history tree
       2. update_state() on target historical node
       3. Replay from edited checkpoint (fork new branch)
```

### F. Transaction Safety — ACID vs. Saga

```
Task involves modifying external state (SaaS APIs / DB writes)?
├─ Short-lived, single DB? ──────▸ Traditional ACID locks
└─ Long-horizon, multi-API/tool? ──▸ NEVER use ACID locks
   └─▸ SAGA COORDINATION PATTERN
       1. Assign UUID Idempotency-Key per forward step
       2. Write-Ahead Log: PENDING → execute → COMPLETED
       3. All steps succeed? → Transaction complete
       4. Step fails? → Trigger compensating nodes in reverse
```

### G. Model Selection by Project Phase

```
┌─────────────────────┬────────────────────────┬──────────────────────────────┐
│ Phase 1: MVP        │ Phase 2: Growth        │ Phase 3: Scale               │
│ < 1K tasks/day      │ 1K–10K tasks/day       │ > 10K tasks/day              │
├─────────────────────┼────────────────────────┼──────────────────────────────┤
│ 100% Flagship APIs  │ Hybrid Architecture    │ Sovereign SLMs               │
│ GPT-4o, Claude 3.5  │ Flagship = Master      │ Qwen3-8B, Gemma-9B          │
│ Validate idea fast  │ SLM = repetitive tasks │ Fine-tune LoRA per tenant    │
│ Accept high cost    │ ↓ 40–60% cost          │ vLLM + LoRAX shared GPU     │
│                     │                        │ ↓ 95% cost                   │
└─────────────────────┴────────────────────────┴──────────────────────────────┘

Task routing at Growth phase:
├─ Hard tasks (planning, synthesis, coding) → Flagship API
└─ Repetitive tasks (extraction, classification) → Self-hosted SLM
```

---

## 6 Topological Patterns — Deep Reference

### 1. Sequential Pipeline

```
[ Node A ] ──▸ [ Node B ] ──▸ [ Node C ]
```

- **Mechanism**: One-way deterministic flow; output of `n₁` → input of `n₂`.
- **Pros**: Extremely safe, minimal latency, easy to test.
- **Cons**: No dynamic branching or self-correction if intermediate step degrades.
- **Use cases**: OCR → metadata tagging → document sync pipelines.

### 2. Concurrent Fan-out / Fan-in (Parallelization)

```
              ┌──▸ [ Specialist A ] ──┐
[ Decomposer ]├──▸ [ Specialist B ] ──┼──▸ [ Synthesizer ]
              └──▸ [ Specialist C ] ──┘
```

- **Mechanism**: Decompose question into sub-questions; specialists search in parallel; synthesizer merges via shared state.
- **Pros**: Up to 70% latency reduction; deep KV-cache optimization.
- **Cons**: Token cost spikes at fan-in if output lengths are uncontrolled.
- **Use cases**: Multi-source RAG, contract clause cross-referencing.

### 3. Hierarchical (Supervisor-Worker / Orchestrator-Workers)

```
       ┌──── [ Supervisor ] ◀────────┐
       │ (delegate)    │ (delegate)   │ (report)
       ▼               ▼              │
[ Specialist A ]  [ Specialist B ] ───┘
```

- **Mechanism**: Central Supervisor plans, delegates dynamically, reviews results.
- **Pros**: Very flexible; handles open-ended tasks without rigid edge definitions.
- **Cons**: **Single Point of Cognitive Failure** — if Supervisor hallucinates, entire system derails.
- **Use cases**: Deep research agents, spec-driven code generation.

### 4. Handoff-Led Swarm (Routing)

```
[ Router Agent ] ─(handoff)─▸ [ Billing Agent ] ─(handoff)─▸ [ DB Agent ]
```

- **Mechanism**: Decentralized routing via context handoff signals between peer agents.
- **Pros**: Eliminates central coordinator overhead.
- **Cons**: Long handoff chains cause context drift; mutual ping-pong loops.
- **Use cases**: Multi-tier customer support, technical triage.

### 5. Group Chat (Evaluator-Optimizer / Maker-Checker)

```
[ Maker Agent ] ◀──(feedback/refine)──▸ [ Checker Agent ]
```

- **Mechanism**: Coder writes → Tester runs in sandbox → Critic evaluates safety → loop until all verifiers pass.
- **Pros**: Output quality extremely high; hallucination reduced 3×.
- **Cons**: High latency, massive token cost without hard circuit breakers.
- **Use cases**: Autonomous code generation, financial audit, security test generation.

### 6. Event-Driven (Multi-Agent Collaboration)

```
[ Kafka Event ] ──▸ [ Event Listener ] ──▸ [ Stateless Action Node ]
```

- **Mechanism**: Async triggers spawn ultra-thin stateless processing flows.
- **Pros**: Near-zero idle cost; optimal server utilization.
- **Cons**: Very hard to debug; cannot build deep reasoning chains.
- **Use cases**: CI/CD automation, real-time security alerting, document ingestion pipelines.

---

## Anti-patterns (Deduplicated from Both Layers)

### Architecture & State Management

| # | Anti-pattern | Why It Kills |
|---|-------------|--------------|
| A1 | **Giant System Prompt (Kitchen Sink)** | Cramming all logic + tool schemas into one massive prompt → context bloat, infinite loops, total state loss on restart. |
| A2 | **Stateless Operations (No Checkpointing)** | RAM-only state → complete loss on crash/restart. Long-running workflows destroyed. |
| A3 | **Naive State Overwriting (No Reducers)** | Parallel writes without reducers → race conditions wipe previous messages/data. |
| A4 | **Global State Monolith (Context Poisoning)** | All nodes share one huge state → worker chatter exposed to supervisor; KV-cache thrash; token explosion. |
| A5 | **Untyped Shared State** | Using plain `dict` instead of Pydantic → structural drift across super-steps. |

### Execution & Control Flow

| # | Anti-pattern | Why It Kills |
|---|-------------|--------------|
| A6 | **Free-form ReAct for Strict Business Workflows** | Agents self-navigate regulated paths without graph-enforced boundaries → unpredictable drift. |
| A7 | **Unconstrained Agent Self-Correction** | Relying on NLP prompts to escape infinite loops instead of hard `max_iterations` limits. |
| A8 | **Infinite Dialogue Loops (No Circuit Breaker)** | ReAct cycles between error-generating tool and reviewing agent → $10K+ token burns in hours. |
| A9 | **Boilerplate Overkill on Simple Tasks** | Defaulting to full StateGraph for trivial single-agent tasks where a script would suffice. |
| A10 | **Unstructured Swarms / Token Explosion** | Too many free-chatting subagents without subgraph isolation → exponential context window bloat. |

### Security & Multi-Tenancy

| # | Anti-pattern | Why It Kills |
|---|-------------|--------------|
| A11 | **Logical-Only Tenant Isolation** | Application-level tenant checks without DB-enforced RLS → cross-tenant data leakage. |
| A12 | **Dynamic `SET search_path` under PgBouncer** | Transaction Pooling scrambles session variables across connections → cross-tenant corruption. |
| A13 | **Unprotected Model Inputs (No PII Masking)** | Raw corporate data sent to external models without Lifecycle Hook sanitization. |
| A14 | **Bare-metal Code Execution (No Sandbox)** | Agent-generated code runs directly on host OS → system-level exploit risk. |

### Transactions & Collaboration

| # | Anti-pattern | Why It Kills |
|---|-------------|--------------|
| A15 | **ACID Locks for Long-Running Agent Sessions** | Locking DB resources for hours/days → system-wide paralysis. |
| A16 | **Non-Idempotent Write Tools** | No UUID key → network retry creates duplicate invoices/charges. |
| A17 | **One-Way Transactions (No Compensation)** | No rollback nodes → partial execution leaves inconsistent state (flight booked, hotel failed). |
| A18 | **Naked Handoff (Context Bleeding)** | Full conversation history passed to sub-agent during handoff → sensitive data exposure. |
| A19 | **Autonomous Financial Operations (No HITL Gate)** | Agents auto-approve payments/deployments without human checkpoints. |

### Memory & Quality

| # | Anti-pattern | Why It Kills |
|---|-------------|--------------|
| A20 | **Lost in the Middle (Context Stuffing)** | Raw tool logs dumped into context → LLM loses focus on important middle content. |
| A21 | **Embedding Version Drift** | New embedding model at gateway but no re-indexing of vector DB → retrieval accuracy drops to ~0%. |
| A22 | **Memory Poisoning (Trace Contamination)** | Harvesting failed/hallucinated traces into long-term memory → agent learns incorrect reasoning. |
| A23 | **Flagship Overuse / Premature Optimization** | Using expensive models for simple extraction at scale (or self-hosting SLMs too early at PoC stage). |

---

## Reusable Patterns

### Infrastructure Patterns

| Pattern | When To Use | Implementation |
|---------|-------------|----------------|
| **StateGraph + Reducers** | Any multi-step business workflow needing determinism. | Define `Annotated[list, operator.add]` for accumulators; overwrite for atomic fields. |
| **PostgresSaver Checkpointing** | Production systems requiring crash resilience. | Serialize full state snapshot at every super-step boundary to PostgreSQL. |
| **Row-Level Security (RLS)** | Multi-tenant SaaS checkpoint isolation. | `ALTER TABLE ENABLE ROW LEVEL SECURITY`; policy filters by `tenant_id` session variable. |
| **Subgraph Encapsulation** | Complex sub-tasks generating excessive intermediate data. | Local state schema → purge on completion → return only summary to parent. |
| **Token-Budget Circuit Breaker** | Preventing runaway token costs. | Hard `max_iterations ≤ 10` + USD-based budget cap → auto-halt session. |

### Execution Patterns

| Pattern | When To Use | Implementation |
|---------|-------------|----------------|
| **HITL Interrupt & Resume** | Sensitive transactions (financial, deployment, DB writes). | `interrupt()` → snapshot → freeze → webhook → resume on approval. |
| **Time-Travel Debugging** | Post-failure correction without re-running entire workflow. | Fetch checkpoint tree → `update_state()` → replay from edited node. |
| **Dynamic Tool Scoping** | Large SaaS with many tools. | Semantic Router filters to ≤ 5 relevant tools per node; 95% context reduction. |
| **Progressive Disclosure** | Loading skill files / configuration. | Load metadata first; inject full body only when intent matches. |
| **Coder-Tester-Verifier Loop** | Autonomous code generation with quality gates. | Coder → Sandbox (gVisor) → Critic/Verifier; loop until 100% tests pass. |

### Transactional Patterns

| Pattern | When To Use | Implementation |
|---------|-------------|----------------|
| **Saga Compensation** | Long-running multi-API write sequences. | Forward nodes `n₁→n₂→n₃`; each paired with compensating node `c₁, c₂, c₃` for reverse rollback. |
| **Idempotency Lock + WAL** | Any tool that writes external state. | UUID in HTTP header + WAL record (`PENDING` → `COMPLETED`) in PostgreSQL. |
| **A2A Protocol** | Cross-platform agent collaboration (Go + Python + TS). | JSON-RPC via API Broker; Handshake → Handoff → Context Scoping. |
| **Ensemble Verification** | Financial forecasting / numerical accuracy. | 2/3 majority consensus among independent specialist agents. |

### Model Selection Patterns

| Pattern | When To Use | Implementation |
|---------|-------------|----------------|
| **100% Flagship APIs** | PoC / MVP phase (< 1K tasks/day). | GPT-4o / Claude 3.5 via API; accept high cost for speed-to-market. |
| **Hybrid Model Routing** | Growth phase (1K–10K tasks/day). | Cost-Aware Router: hard tasks → Flagship; repetitive tasks → self-hosted SLM (Qwen-8B, Gemma-9B). |
| **Multi-LoRA Serving** | Scale phase (> 10K tasks/day, multi-tenant). | Freeze base weights `W₀` in VRAM; load tenant-specific LoRA adapters (~50MB) dynamically from S3 via vLLM + LoRAX. |

---

## Top Gotchas — Merged & Deduplicated (Layer 3 + Layer 5)

| # | Gotcha | Root Cause | Solution | Key Learning |
|---|--------|------------|----------|--------------|
| 1 | **Infinite Retry Loops** | Tool node crashes; model retries unstructured | Hard `max_iterations ≤ 10` + FinOps Circuit Breaker | Never let the model decide retry count |
| 2 | **Cross-Tenant Context Leakage** | Shared checkpoint table without tenant partitioning | PostgreSQL RLS enforced by `tenant_id` session variable | Tenant boundaries must be at DB level, not app logic |
| 3 | **Prompt Cache Invalidation** | Dynamic params (timestamps) in system prompt | Pin static system prompt + tool schemas first; dynamic history last | Strict static/dynamic separation protects GPU prompt caching |
| 4 | **PgBouncer + `search_path` Collision** | Dynamic schema branching under Transaction Pooling | Eliminate dynamic `search_path`; use RLS with JWT-derived `tenant_id` | PgBouncer Transaction Pooling scrambles session variables |
| 5 | **Swarm Cost Explosion** | Too many free-chatting subagents | Package workers as Subgraphs; optimize single agent first | Always exhaust single-agent capacity before going multi-agent |
| 6 | **State Loss on Crash** | In-memory-only graph state (no checkpointer) | PostgresSaver auto-snapshots at every super-step boundary | Infrastructure-level persistence is non-negotiable |
| 7 | **Embedding Version Drift** | New embedding model without re-indexing old vectors | Automated nDCG regression tests in CI/CD | Always re-index when changing embedding models |
| 8 | **Resource Exhaustion** | Supervisor spawns unlimited parallel workers | Semaphore / Connection Pool hard-limits on concurrent agents | Cap parallel execution with infrastructure-level controls |
| 9 | **Lost in the Middle** | Raw tool logs stuffed into context | DyCP (KadaneDial) dynamic context compression before LLM | Compress and filter intermediate context proactively |
| 10 | **PII Leakage to External APIs** | Agent sends raw customer data to web search tools | PII Masking at Lifecycle Hooks (`$L$`) via Regex/CPU filter | Sanitize at middleware boundary, not in application logic |
| 11 | **Off-by-One Code Editing** | Line-number-based edits after file size changes | Search-and-Replace block editing using unique text anchors | Never edit by raw line numbers — use content anchors |
| 12 | **Memory Poisoning** | Harvesting failed traces into long-term memory | Quality gate: only traces with LLM-as-judge score ≥ 90 | Bad traces teach bad reasoning — filter ruthlessly |
| 13 | **Non-Idempotent Writes** | Write tools lack UUID keys → duplicates on retry | Idempotency Lock (UUID in header) + WAL (PENDING→COMPLETED) | Network failures are inevitable; idempotency is mandatory |
| 14 | **Half-Baked Autonomy (No Saga)** | No compensating nodes for multi-step write chains | Saga Pattern: every forward node paired with compensation node | Partial execution without rollback = financial & data loss |
| 15 | **Flagship Overuse at Scale** | Expensive models for trivial extraction tasks | Hybrid routing: Flagship for hard tasks, SLM for repetitive | Model selection must evolve with project maturity |

---

## 5 Golden Rules for Graph Construction

1. **Tool Scoping ≤ 5**: Keep each node's tool catalog under 5; use Semantic Router for dynamic scoping.
2. **KV-Cache Protection via Subgraphs**: Encapsulate long ReAct chains; purge intermediate context; return summaries only.
3. **Idempotent Write Tools**: UUID Idempotency-Key + Write-Ahead Log for every external write action.
4. **Persistent Checkpointing**: PostgresSaver + PostgreSQL RLS for multi-tenant crash resilience.
5. **CI/CD Quality Gates**: Pytest + DeepEval in CI/CD; only merge when LLM-as-judge evaluation ≥ 90 baseline.

---

## Addendum: Core DNA Extracted from AI-Native Architecture Playbooks

### Layer 3: Agentic Orchestration (Controller)
*   **Retrieval-Orchestration Breakpoint (ORB)**: Calculate `ORB = (Complexity * 0.4) + (ToolFrequency * 0.3) - (DataCohesion * 0.3)`.
    *   `ORB < 4`: Use LlamaIndex Workflows (RAG-centric, low overhead).
    *   `ORB > 9`: Use LangGraph (Finite State Machine, high resilience, HITL).
    *   `4 <= ORB <= 9`: Hybrid Sovereign Stack. Ingest with LlamaIndex, orchestrate state with LangGraph.
*   **Typed State Management**: Enforce state payload verification at the token-level using Pydantic v2 `BaseModels`.
*   **Semantic Routing**: Bypass LLM calls for intent matching (<10ms) using Semantic Routers (e.g., Aurelio AI).
*   **Context Window Optimization**: Trigger LLM-based summarization when context fills >70%. Serialize older history to a memory block to maintain reasoning headroom.

### Layer 5: AI Inference Engine & Serving
*   **Compute Bifurcation**: Strategically balance Logic Accuracy vs. FinOps Cost.
    *   **Front LLMs** (GPT-4o, Claude 3.5 Sonnet): High-complexity agent reasoning, planning, and code synthesis.
    *   **SLM Nodes** (Qwen-2.5-7B, Gemma-2-9B): Self-hosted on local GPUs for high-volume, structured, repetitive workflows under 100ms.
*   **Multi-LoRA Serving Architecture**:
    *   **Base Model Cache**: Base model (e.g., Qwen-7B) remains static and permanently pinned in VRAM.
    *   **LoRA Adapters**: Tenant-specific fine-tuned weights (~50MB) stored persistently in S3.
    *   **Dynamic Loading**: vLLM/LoRAX checks local cache via `tenant_id`. Cache misses pull asynchronously from S3 (<200ms).
    *   **SGMV Kernel**: Uses Segmented Group Matrix-Vector Multiplication (Punica) to batch requests meant for *different* adapters into a single GPU pass, avoiding sequential bottlenecks.


---

## Appended DNA Artifact

# LAYER 5: AI INFERENCE ENGINE DNA

## Strict Systemic Rules (Mandatory Guardrails)
- **Stateless Inference Solely**: Layer 5 must function solely as a stateless token-processing engine. State management and orchestration logic are explicitly forbidden here and must reside in Layer 3.
- **Fail-Closed JIT RAG Breaker**: If NotebookLM or the reference database fails, times out, or returns an empty/low-relevance result (e.g. empty array `[]`) during JIT query, the agent MUST "fail closed" and notify the user. Falling back to generic base-model hallucination is forbidden.
- **Infinite Loop Circuit Breaker**: Set a hard `max_retries` limit (e.g., 3) for apply-review loops when domain references are rejected by the Zero-Trust Gate. Upon exhausting `max_retries`, the agent MUST trigger a terminal `interrupt()` to Layer 3 for human intervention.

## Domain References (JIT RAG Best Practices)
- **Multi-LoRA Serving**: Pin a static Base Model in VRAM and dynamically swap lightweight tenant-specific LoRA adapters (~50MB) via AWS S3 using SGMV kernels (e.g., Punica, vLLM).
- **Engine Selection**: Use vLLM for SaaS multi-tenant scale; use SGLang (Radix Attention) for structured JSON outputs and rapid caching.
- **Hardware Tuning**: AWQ for VRAM-constrained production serving; PagedAttention for fragmented batch processing.

> **PROJECT CONTEXT INJECTION CONSTRAINT**: The choice between Front LLMs (Cloud APIs) and local SLM nodes must be dictated by the project's financial budget, latency requirements, and data sovereignty rules outlined in the PRD. If the PRD is silent or ambiguous on a component, the agent MUST explicitly prompt the user for clarification (HITL). Defaulting to domain references on silence is forbidden.
