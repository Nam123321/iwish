# Module: Layer 1 — Generative UI & Prompt Interface

> **DNA UUID**: `16891744-3BD9-43C8-8C8A-C6F9037CBB80`
> **Typology**: Theory · Process · Checklist
> **Layer Dependencies**: Load Layer 2 (security boundary) and Layer 3 (orchestration harness) via the Cross-Layer Dependency Map before implementing.

---

## Purpose

Layer 1 is the **human-agent membrane** — the outermost surface where probabilistic LLM reasoning is translated into deterministic, interactive UI components the user can see and manipulate. Its job is threefold:

1. **Encode agent intent into structured UI** via the A2UI (Agent-to-User Interface) protocol, replacing static chatbox text with dynamic, schema-driven Generative UI components (charts, forms, dashboards).
2. **Maintain bidirectional state coherence** between the user's browser and the agent's working memory through the AG-UI real-time synchronization protocol.
3. **Enforce a hard security boundary** that prevents any LLM-generated payload from executing arbitrary code in the client (XSS/UI injection defense).

> Layer 1 transforms the agent from a *text generator* into a **structured UI generator** — the System Prompt must instruct the model to think as a schema compiler, not a free-text writer.

---

## Core Principles

### P1 — Stateless Streaming (Chunk Independence)
All Generative UI payloads stream from agent to client as independent, self-contained chunks over SSE/WebSocket. The client performs incremental hydration — no persistent backend connection state is required at the application layer. If the client disconnects mid-stream, it can resume from the last received chunk.

### P2 — Schema-First Rendering (Security by Construction)
The agent NEVER generates raw HTML/React code for direct client execution. Instead, it emits a **JSON Render Spec** — a structured payload that references pre-registered component types. The client maps these specs to its own pre-compiled, trusted component library. This eliminates the XSS attack surface entirely by removing code generation from the rendering path.

### P3 — UI Sandboxing (Defense in Depth)
Even when Schema-First is the primary strategy, a **Generative UI Sanity Check** interceptor must run at the `after_model` or `wrap_tool_call` lifecycle hook to strip any residual dangerous patterns. This is the *belt-and-suspenders* defense: the schema prevents code execution; the sanitizer catches edge cases.

### P4 — Agent-Driven Experience (ADX)
Layer 1 shifts the interaction paradigm from Human-Computer Interaction (HCI) — where the user clicks rigid buttons — to **Agent-Driven Experience (ADX) / Fluid Interfaces**, where the agent dynamically selects and renders the optimal UI component based on conversational context, user journey state, and business rules.

### P5 — Prompt as Encoder
At the cognitive level, Layer 1's System Prompt acts as a **codec** — it converts the agent's reasoning into valid UI schemas. The prompt must define output format constraints, tool-calling conventions, and tenant-scoping rules so tightly that the model's output always passes client-side schema validation on the first attempt.

---

## Mental Models & Frameworks

### MF1 — The Dual-Lens Architecture of Layer 1

Layer 1 exists at the intersection of two complementary worldviews:

```
+--------------------------------------------------------------------------+
|                        LAYER 1: HUMAN-AGENT INTERFACE                    |
+--------------------------------------------------------------------------+
                                     │
         +───────────────────────────+───────────────────────────+
         │                                                       │
         ▼                                                       ▼
+──────────────────────────────────+           +──────────────────────────────────+
|  UI/UX Lens (6-Layer Map)       |           | Prompt Lens (5-Layer Stack)      |
| - A2UI Protocol (Agent-to-User) |           | - System Instructions (Static)   |
| - Realtime State Sync (AG-UI)   |           | - Cognitive Boundaries (Dynamic) |
| - Dynamic Generative UI Render  |           | - Schema-driven Output Generation|
+──────────────────────────────────+           +──────────────────────────────────+
```

**Use the UI/UX lens** when designing component registries, streaming infrastructure, and state synchronization. **Use the Prompt lens** when crafting system instructions, output schemas, and model selection strategies.

### MF2 — Generative UI Streaming Flow (RSC via MCP)

```
+========================================================================+
|                        GENERATIVE UI STREAMING FLOW                    |
+========================================================================+
 [LLM Inference] ──> (JSON Render Spec) ──> [MCP Tool Client (Layer 3)]
                                                     │
                                            (Stdio/SSE Transport)
                                                     v
 [React Client Surface] <── (Hydrated RSC) <── [A2UI Server (Layer 1)]
+========================================================================+
```

**Step-by-step pipeline:**
1. **Tool Call** — LLM activates a registered render tool (e.g., `render_financial_dashboard`).
2. **Schema Validation** — Harness validates input parameters via Pydantic/Zod at Layer 3.
3. **RSC Assembly** — A2UI server receives structured params, loads the matching React Server Component, compiles to RSC binary payload.
4. **SSE Streaming** — RSC payload streams to the frontend via Server-Sent Events or WebSocket.
5. **Hydration** — Client reconstructs the component tree and activates interactive state in-place, no full-page reload.

### MF3 — MCP Role Split for UI

MCP provides two interface primitives at Layer 1:
- **Resources (Read-Only UI Templates)**: URI-addressed static templates (e.g., `mcp://ui/templates/invoice-form`) that the agent reads for cognitive context before deciding which UI to generate.
- **Tools (Active UI Mutators)**: Stateful executable functions (e.g., `mcp://ui/actions/update-charts`) that the agent calls with a JSON payload to mutate the client's display state.

### MF4 — AG-UI State Synchronization Protocol

```
 [User Action on Widget] ──> Delta State Event ──> [Backend StateGraph]
                                                          │
                                                   PostgresSaver
                                                    (checkpoint)
                                                          │
 [Browser Reload] ──> Restore from checkpoint ──> [Full UI + Agent State]
```

- **State Reducers**: Every client-side UI change is encoded as a Delta event and sent to the backend.
- **PostgresSaver**: Deltas feed into LangGraph's `StateGraph`, which writes a session checkpoint via `PostgresSaver`. Browser reload restores both UI and agent reasoning state from the last checkpoint.
- **Thread Scoping**: UI state is partitioned by `thread_id`, enforced via PostgreSQL Row-Level Security (RLS) to prevent cross-tenant data leakage.
- **Conflict Resolution Lock**: When agent and user simultaneously modify the same UI object, the harness applies a deterministic lock — **human input always takes priority** over intermediate agent reasoning steps.

### MF5 — DevUI Debugger Dashboard

```
+========================================================================+
|                         DEVUI DEBUGGER DASHBOARD                       |
+========================================================================+
 [Trajectory Tree]      │ [Context Windows Monitor] │ [Token Economics]
 ├─ Node: Router        │  System Prompt: 99% hit   │  Prefill: 15,200 t
 ├─ Node: RAG_Fetch     │  Active Tool: 120 tokens  │  Gen: 150 t
 └─ Node: UI_Renderer   │  Compaction summary: 500  │  Cost: $0.34 USD
+========================================================================+
```

Three mandatory panes:
1. **Trajectory Graph View** — Visual trace of agent movement through LangGraph nodes/edges. Each node is click-drillable to show input params, tool results, and safety scores.
2. **Context Window Monitor** — Real-time token allocation breakdown inside the model's context. Color-coded to show Prompt Caching hit rates on GPU hardware.
3. **MCP Inspector** — JSON-RPC packet capture between client and MCP server, showing protocol errors and per-tool execution failures.

Integration: All telemetry exports as OpenTelemetry spans → Langfuse data lake → DevUI reads Langfuse API for P95/P99 latency charts and cumulative cost per session.

### MF6 — Modelmaxxing: 3-Phase Model Selection

```
                                  [ User Request ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
         (Complex / MVP tasks)                        (Repetitive / Scale-out)
        [Flagship APIs (GPT-4o/Claude)]             [SLMs (Qwen/Gemma) + LoRAX]
         - Perfect schema compliance                 - 90% cost reduction
         - Zero-shot structured output               - Dynamic per-tenant adapters
```

| Phase | Strategy | Model Tier | Rationale |
|:------|:---------|:-----------|:----------|
| **Phase 1 — MVP** | 100% commercial API | GPT-4o, Claude 3.5 Sonnet | Schema compliance is the load-bearing constraint; flagship models produce valid JSON without extra guardrails |
| **Phase 2 — Optimization** | Self-hosted mid-range | Qwen-2.5-32B, Llama-3-70B on private GPU | Data sovereignty, 50-70% cost reduction at medium load |
| **Phase 3 — Scale-out** | SLMs + LoRAX multi-tenant | Qwen-3.5-8B, Gemma-4-9B via vLLM + LoRAX | Frozen base model $W_0$ in VRAM; dynamic per-tenant LoRA adapters (~50MB each) loaded from S3 |

---

## Decision Trees

### DT1 — Choosing a Rendering Strategy

```
Is the deployment target a high-security domain (Finance, Healthcare, Banking)?
├── YES → Use Custom JSON Schema-driven Rendering
│         (Agent outputs JSON specs only; client maps to pre-compiled components)
│         Result: Maximum security, zero XSS surface, cross-platform compatible
│
└── NO → Is time-to-market the top priority?
    ├── YES → Use CopilotKit / Vercel AI SDK
    │         (Abstracted Generative UI on Node.js/React)
    │         Result: Fastest PoC, native RSC streaming, locked to React/Next.js
    │
    └── NO → Is the architecture SOA / microservices-first?
        ├── YES → Use Mastra / Node-native A2UI
        │         Result: High perf TypeScript, multi-agent routing, no frontend lock-in
        │
        └── NO → Default to Custom JSON Schema-driven Rendering
```

### DT2 — When to Escalate Model Tier (Modelmaxxing)

```
Is the task a simple greeting, FAQ, or repeated tool call?
├── YES → Route to SLM (Qwen-8B / Gemma-9B) — minimize token cost
│
└── NO → Does the task require multi-step planning or novel schema generation?
    ├── YES → Route to Flagship API (GPT-4o / Claude 3.5)
    │
    └── NO → Route to mid-range self-hosted model (Qwen-32B / Llama-70B)
```

### DT3 — State Sync Conflict Resolution

```
Agent and user both modify the same UI widget simultaneously?
├── Human input detected → Human action ALWAYS wins (priority override)
│   Agent's intermediate reasoning step is discarded for this widget
│
└── Only agent is writing → Agent update applied normally via Delta reducer
```

---

## Anti-patterns

### ❌ AP1 — Free-Text UI Generation
**What**: Allowing the LLM to generate raw HTML, React JSX, or JavaScript code that is directly injected into the client DOM.
**Why it's dangerous**: Opens a catastrophic XSS attack surface. Attackers can embed prompt injection payloads in RAG documents that instruct the model to generate `<script>` tags stealing JWT tokens from `localStorage`.
**Fix**: Enforce Schema-First Rendering (P2). The agent outputs JSON Render Specs; the client maps specs to pre-compiled trusted components.

### ❌ AP2 — Skipping the Sanity Check Interceptor
**What**: Deploying Generative UI without the `after_model` / `wrap_tool_call` sanitization hook.
**Why it's dangerous**: Even with Schema-First rendering, edge cases exist where the model embeds `javascript:` URIs or `onload=` handlers inside JSON string values.
**Fix**: Always deploy the Static Regex Sanitizer + CSP enforcement as a belt-and-suspenders layer. Block `<script>`, `<iframe>`, `javascript:`, `eval()`, and inline event handlers (`onload=`, `onerror=`, etc.).

### ❌ AP3 — Shared State Without Thread Scoping
**What**: Using a single global state store for AG-UI synchronization across all tenants without `thread_id` partitioning.
**Why it's dangerous**: Causes cross-tenant data leakage in multi-tenant SaaS — Tenant A can see Tenant B's financial dashboard data.
**Fix**: Bind every AG-UI state delta to a `thread_id` linked to PostgreSQL Row-Level Security (RLS). Enforce `tenant_id` filtering in every database query.

### ❌ AP4 — Deploying Without DevUI
**What**: Pushing to production without a DevUI debugger, relying only on raw CLI logs.
**Why it's dangerous**: Long-running autonomous agents produce complex execution trajectories that are impossible to debug from text logs alone. Hidden prompt drift, context window overflow, and cost explosions go undetected.
**Fix**: Implement the three-pane DevUI (Trajectory Graph + Context Monitor + MCP Inspector) integrated with OpenTelemetry → Langfuse tracing.

### ❌ AP5 — Using Flagship APIs at Scale Without Modelmaxxing
**What**: Running GPT-4o or Claude for every single request in a multi-tenant production system, including greetings and simple tool calls.
**Why it's dangerous**: Token costs explode exponentially. A single tenant running 1000 sessions/day at ~800 tokens/session on GPT-4o costs ~$40/day per tenant vs. ~$2/day on a self-hosted SLM.
**Fix**: Implement the 3-Phase Modelmaxxing strategy. Route simple tasks to SLMs; reserve flagship for complex planning.

---

## Reusable Patterns

### ✅ RP1 — Generative UI Streaming via MCP
**When**: You need to render dynamic, agent-driven UI components (charts, forms, dashboards) in real-time without full-page reloads.
**How**: Combine MCP tool calling with React Server Components (RSC). Agent calls a registered MCP tool → Harness validates params (Pydantic/Zod) → A2UI server assembles RSC → streams via SSE → client hydrates in-place.
**Key files**: `a2ui_server.py` (FastAPI SSE endpoint), `mcp_ui_server.py` (FastMCP tool registry with Pydantic schemas).

### ✅ RP2 — AG-UI State Synchronization
**When**: User actions on agent-generated widgets must be reflected in the agent's working memory, and the full UI+agent state must survive browser reloads.
**How**: Encode all client-side UI changes as Delta state events → feed into LangGraph's `StateGraph` → persist via `PostgresSaver` checkpoints → scope by `thread_id` with RLS.
**Conflict rule**: Human input always overrides agent intermediate state.

### ✅ RP3 — Generative UI Sanity Check (UI Sandboxing)
**When**: Any time an LLM-generated payload is about to be rendered or interpreted by the client.
**How**: Deploy a security interceptor at `after_model` or `wrap_tool_call` lifecycle hooks:
1. **Static Regex Sanitizer** — Strip `<script>`, `<iframe>`, `javascript:`, inline event handlers (`onload=`, `onerror=`).
2. **Content Security Policy (CSP)** — Enforce strict CSP headers: block `eval()`, block inline scripts, restrict `connect-src` to known origins.

### ✅ RP4 — DevUI Debugger with OTel + Langfuse
**When**: Moving any agent system to production.
**How**: Export all LangGraph node execution data as OpenTelemetry spans → push async to Langfuse → build DevUI dashboard with three panes (Trajectory Graph, Context Window Monitor, MCP Inspector) reading from Langfuse API.

### ✅ RP5 — Modelmaxxing for Layer 1 (3-Phase Rollout)
**When**: Planning model infrastructure for a multi-tenant SaaS product across its lifecycle.
**How**:
- **Phase 1 (MVP)**: Use flagship commercial APIs (GPT-4o, Claude 3.5 Sonnet) for maximum schema compliance.
- **Phase 2 (Optimization)**: Migrate to self-hosted mid-range models (Qwen-32B, Llama-70B) on private GPU for data sovereignty and 50-70% cost savings.
- **Phase 3 (Scale-out)**: Deploy SLMs (Qwen-8B, Gemma-9B) with vLLM + LoRAX multi-tenant adapter serving. Frozen base weights in VRAM; ~50MB LoRA adapters per tenant loaded dynamically from S3.

### ✅ RP6 — XML-Tagged System Prompt for UI Controller
**When**: Configuring the Layer 1 system prompt for a multi-tenant UI controller agent.
**How**: Use XML delimiter tags (`<system_prompt>`, `<operational_constraints>`, `<generative_ui_schemas>`) to isolate instruction boundaries. Hard-code:
1. Mandatory tool calling for data/chart tasks (no raw text output).
2. Strict JSON Schema compliance — no extra fields.
3. No embedded scripts/iframes/raw HTML in data fields.
4. `tenant_id` must be attached to every UI resource request.

---

## Addendum: Core DNA Extracted from AI-Native Architecture Playbooks

### Layer 1: Client & UI Layer (Interaction & Durability)
*   **Generative Dynamic UI**: Shift from static conversational UI to generative dynamic UI based on JSON Schema (Draft 2020-12). Uses React-JSONSchema-Form (RJSF) to validate inputs locally and eliminate LLM parsing errors.
*   **Human-In-The-Loop (HITL) Orchestration**: Paused transactions trigger `interrupt()` state saved via `PostgresSaver`. UI receives an SSE event notification (`requires_approval`), and user actions resume the workflow seamlessly.
*   **Execution Durability**: Separation between cognitive decision making and durable execution. Uses Temporal/Inngest to track execution state via Event Sourcing and Deterministic Replay, surviving physical host crashes.


---

## Appended DNA Artifact

# LAYER 1: CLIENT & UI DURABILITY DNA

## Strict Systemic Rules (Mandatory Guardrails)
- **Generative Dynamic UI**: Transition from plain text Chat UI to dynamic UI generation (e.g. React-JSONSchema-Form) based on JSON Schema Draft 2020-12 to guarantee 100% structured input validation at the client side.
- **Execution Durability Separation**: Layer 1 must handle physical execution durability (Temporal/Inngest) using Event Sourcing and Deterministic Replay, decoupled from cognitive decision-making (LangGraph). In-memory `while` loops for critical transactions are strictly prohibited.
- **HITL Checkpointing**: Any long-running or sensitive task must pause via interrupts (PostgresSaver) and push an SSE event requiring human approval via webhook callback before resuming.

## Domain References (JIT RAG Best Practices)
- **BFSI**: Dynamic loan application forms; Idempotent transaction wrappers preventing double-payments on timeouts.
- **Healthcare**: Clinical review dashboards for SLM outputs; large checkbox intake forms for triage.
- **Legal**: Interactive compliance checklists translating markdown to dynamic tables.
- **HR**: Candidate resume redact systems ensuring privacy compliance.

> **PROJECT CONTEXT INJECTION CONSTRAINT**: When retrieving these domain best practices, the Agent MUST balance them against the target customer and PRD constraints. Domain references are purely illustrative and must not override explicit project scope or user persona definitions. If the PRD is silent or ambiguous on a component, the agent MUST explicitly prompt the user for clarification (HITL). Defaulting to domain references on silence is forbidden.
