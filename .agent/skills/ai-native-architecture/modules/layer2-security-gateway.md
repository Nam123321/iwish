# Module: Layer 2 — Security & Routing Gateway

> **DNA UUID**: `4CB4D005-9BD1-4561-8BF5-132E2438A68C`
> **Typology**: Process · Theory · Checklist
> **Layer Dependencies**: Load Layer 1 (UI sandboxing handoff) and Layer 3 (orchestration harness hooks) via the Cross-Layer Dependency Map before implementing.

---

## Purpose

Layer 2 is the **physical defense perimeter and logic gateway** — the last hard boundary before any user query reaches the core orchestrator (Layer 3) or data stores (Layer 4). Its responsibilities:

1. **Isolate code execution** — LLM-generated code runs inside stateful sandboxes (gVisor/Firecracker), never on the host OS. This eliminates Remote Code Execution (RCE) via prompt injection.
2. **Stack multi-layer guardrails** — A 3-stage defense pipeline (Regex → Semantic Embeddings → Llama Guard 3) filters prompt injections and PII before and after model invocations.
3. **Enforce MCP security policies** — Least privilege, JWT auth, parameterized queries, egress controls, and strict schema validation for every tool execution.
4. **Route requests at wire speed** — A three-tier semantic routing hierarchy (Regex → Vector Embeddings → LLM Planner) classifies intent in <10ms, directing simple queries to cheap SLMs and reserving flagship models for complex planning.
5. **Enforce financial discipline** — Real-time token-budget circuit breakers halt runaway agent loops before they cause cost explosions.

> If Layer 1 is the soft conversational membrane between human and agent, Layer 2 is the **hard deterministic cage** surrounding the probabilistic LLM world.

---

## Core Principles

### P1 — Defense in Depth (Stacked, Not Single-Point)
Enterprise AI security cannot rely on a single guardrail. Layer 2 stacks multiple independent defense mechanisms — each layer catches what the previous one misses. A regex filter catches known PII patterns; a semantic filter catches injection attempts the regex misses; a neural classifier (Llama Guard) catches novel attack vectors that evade both.

### P2 — Least Privilege Everywhere
Every component in the gateway operates with the minimum permissions required. MCP servers get read-only DB access. Sandbox containers have no outbound network. Tool parameters are validated by strict JSON schemas before execution. The principle applies to network, filesystem, database, and API access uniformly.

### P3 — Deterministic Boundaries Around Probabilistic Systems
LLMs are inherently probabilistic — their outputs cannot be trusted as safe by default. Layer 2 wraps every probabilistic output in deterministic validation gates: schema validation (Zod/Pydantic), regex sanitization, budget enforcement, and sandbox isolation. The gateway is the place where certainty is imposed on uncertainty.

### P4 — Cost as a First-Class Constraint
Token consumption is not an afterthought — it is a hard architectural constraint. Every LLM invocation passes through a token-budget interceptor that tracks cumulative cost in real-time. Budget limits are contractual (set per session/tenant) and enforced by circuit breakers that halt execution when exceeded.

### P5 — Isolation Before Execution
No LLM-generated code executes on the host. Period. All auto-generated code — Python scripts, shell commands, data transformations — runs inside sandboxed containers (gVisor/Firecracker) with restricted syscalls, no network egress, and resource-limited CPU/RAM via cgroups.

---

## Mental Models & Frameworks

### MF1 — Four Sandbox Isolation Strategies

```
+--------------------------------------------------------------------------+
|                          SANDBOX ISOLATION LAYERS                        |
+--------------------------------------------------------------------------+
                                     │
         +───────────────────────────+───────────────────────────+
         │                           │                           │
         ▼                           ▼                           ▼
+──────────────────+        +──────────────────+        +──────────────────+
|  WebAssembly     |        |   gVisor (runsc) |        | Firecracker VM   |
| (WASM Runtime)   |        | (Kernel Sentry)  |        | (MicroVM Hyperv) |
| - Startup <1ms   |        | - Startup ~10ms  |        | - Startup ~100ms |
| - No bash/pip    |        | - Full Python    |        | - Full kernel    |
+──────────────────+        +──────────────────+        +──────────────────+
```

| Solution | Mechanism | Startup | Strengths | Trade-offs |
|:---------|:----------|:--------|:----------|:-----------|
| **WebAssembly (WASM)** | Compile to WASM bytecode, run in stateless VM | <1ms | Ultra-fast, minimal RAM, no filesystem/network by default | Cannot install pip packages, no bash, no stateful disk between ReAct steps |
| **gVisor (runsc)** ★ Recommended | User-space Sentry process intercepts and rewrites all Linux syscalls | ~10-20ms | Full Python support, bash, stateful disk, safe data sharing | 10-15% I/O overhead from Sentry, no native GPU without passthrough |
| **Firecracker MicroVMs** | KVM-based hypervisor launching minimal VMs | ~100-150ms | Absolute kernel-level isolation, hard resource limits (CPU/RAM/disk) | Slower cold start, higher resource overhead, complex K8s lifecycle |
| **eBPF + cgroups** | Kernel-space packet filters + resource limiters | Zero overhead | Native execution speed, precise network egress blocking | Does NOT isolate filesystem — agent can still delete disk if bash is allowed |

**Default recommendation**: Use **gVisor (runsc)** for most agentic gateways. Use Firecracker only for ultra-high-security financial/healthcare workloads. Use eBPF/cgroups as a *complement* to gVisor for network egress blocking, never as a standalone solution.

### MF2 — Stacked Guardrails Pipeline (3-Stage Defense)

```
                                 [ Incoming Prompt ]
                                          │
                                          ▼
                         +──────────────────────────────────+
                         |  Stage 1: Regex & PII Redaction  | ──> Filter phone, SSN, credit cards
                         +──────────────────────────────────+
                                          │
                                          ▼
                         +──────────────────────────────────+
                         |   Stage 2: LLM Guard (CPU Node)  | ──> Semantic similarity matching
                         +──────────────────────────────────+
                                          │
                                          ▼
                         +──────────────────────────────────+
                         |  Stage 3: Llama Guard 3 (GPU)    | ──> OWASP content classification
                         +──────────────────────────────────+
                                          │
                                          ▼
                                   [ Orchestrator ]
```

- **Stage 1 (Static Regex — CPU, <1ms)**: PII masking via regex at the API gateway edge. Catches phone numbers, SSNs, credit card numbers. Also detects known dangerous terminal commands (`rm -rf`, `drop table`, `sudo su`).
- **Stage 2 (Semantic Embeddings — CPU, <10ms)**: Local embedding model (`bge-micro`) encodes the prompt and compares cosine similarity against a bank of ~100 known prompt injection attack templates. If similarity ≥ 0.85 threshold → block immediately without calling the LLM.
- **Stage 3 (Llama Guard 3 — GPU, ~50ms)**: Runs Meta's Llama Guard 3 (8B, 4-bit quantized via vLLM) to classify both input prompts AND output responses against 13 OWASP harm categories (code exploitation, self-harm instructions, system sabotage, etc.).

### MF3 — Three-Tier Semantic Routing Hierarchy

```
+--------------------------------------------------------------------------+
|                       THREE-TIER ROUTING HIERARCHY                       |
+--------------------------------------------------------------------------+
  [User Query]
        │
        ├──> Tier 1: Regex Router (0ms) ────────────> [Static Action]
        │      (Miss)
        v
  [Qdrant / RedisVL]
        │
        ├──> Tier 2: Semantic Router (<10ms) ───────> [Expert Node / Tool]
        │      (Below Confidence Threshold)
        v
  [vLLM / Flagship LLM]
        │
        └──> Tier 3: LLM Logical Planner (150ms) ──> [Complex Multi-Agent]
```

- **Tier 1 (Rule-based Regex — 0ms)**: Hard-coded regex patterns trap greetings, system control commands, and repeated client requests. Zero latency, zero cost.
- **Tier 2 (Semantic Embeddings — <10ms)**: `semantic-router` library + local vector store (Qdrant/RedisVL) on Gateway CPU. Query is embedded by a small model, cosine matched against intent clusters. If score ≥ 0.82 confidence → route directly to the specialized Expert Node.
- **Tier 3 (LLM Logical Planner — ~150ms)**: Only invoked when the query is too complex for Tiers 1 & 2. The Gateway sends the request to a flagship LLM for multi-step plan decomposition and multi-agent orchestration.

**Economics**: Tier 1 & 2 handle ~70% of production traffic at near-zero token cost. Only ~30% of requests escalate to the expensive Tier 3.

### MF4 — FinOps Token-Budget Circuit Breaker

```
+--------------------------------------------------------------------------+
|                    TOKEN-BUDGET CONTRACT INTERCEPTOR                     |
+--------------------------------------------------------------------------+
   [LangGraph Step] ──> (Post-execution callback) ──> [Telemetry Collector]
                                                             │
                                                    (Consume token count)
                                                             ▼
   [State Graph Resume] <── (Allow if < Budget) <── [Budget Contract]
                                                             │
                                                    (Exceeded -> Trigger)
                                                             ▼
                                                    [Circuit Breaker]
                                                    (Raise Exception)
```

- **Handshake Contract**: When a session starts, the Gateway assigns a hard budget (e.g., 50,000 tokens or $2.00 USD per session per tenant).
- **Real-time Tracker Interceptor**: At each LangGraph step, an `after_model` lifecycle hook intercepts the LLM response headers, extracts actual token usage (prefill + completion), and adds to the running total.
- **Circuit Breaker Action**: When cumulative tokens exceed the budget, the interceptor raises `CircuitBreakerException` → halts all further state transitions → freezes the session → sends a critical alert to administrators.

### MF5 — Modelmaxxing Route (TCO vs Latency)

```
+--------------------------------------------------------------------------+
|                     ROUTE TO MODELMAXXING (TCO vs LATENCY)               |
+--------------------------------------------------------------------------+
  Phase 1: MVP (Fast launch)  ──> Phase 2: Scale (Optimize TCO) ──> Phase 3: Sovereign
  [Flagship API (Claude 3.5)]     [vLLM + LoRAX (Multi-LoRA)]     [Distilled SLM local]
  - Fast integration              - 4-5x cost savings              - 100% self-operated
  - Best DX                       - Per-tenant LoRA adapters       - Absolute data security
```

| Phase | Strategy | Trade-off |
|:------|:---------|:----------|
| **Phase 1 (MVP)** | 100% flagship API (Claude 3.5, GPT-4o) | Best DX, unstable latency, extreme vendor lock-in, data leak risk |
| **Phase 2 (Scale)** | Hybrid: SLMs for simple routes + Flagship for complex planning + LoRAX multi-tenant adapters | 4-5x cost reduction, P99 latency <1s, requires GPU infrastructure |
| **Phase 3 (Sovereign)** | 100% self-hosted on private cloud. Distill from Phase 2 execution traces (≥90 quality score) via SFT | Zero external dependency, EU AI Act compliance, full IP ownership |

---

## Decision Trees

### DT1 — Choosing a Sandbox Solution

```
Does the agent need to install pip packages or run bash commands?
├── NO → WebAssembly (WASM)
│         Fastest startup (<1ms), minimal attack surface
│
└── YES → Does the workload require absolute kernel-level isolation?
    ├── YES → Firecracker MicroVMs
    │         Slowest startup (~100ms), maximum security, hard resource limits
    │
    └── NO → gVisor (runsc) ★ DEFAULT
              Fast startup (~10ms), full Python/bash, stateful disk, 10-15% I/O overhead
              Add eBPF/cgroups on top for network egress blocking
```

### DT2 — When to Block a Request (Guardrails)

```
Does the prompt contain known PII patterns (phone, SSN, credit card)?
├── YES → Stage 1: Redact PII, continue processing with masked input
│
Does the prompt match a known injection template (cosine ≥ 0.85)?
├── YES → Stage 2: BLOCK immediately, return security error
│
Does the content classify as harmful under OWASP categories?
├── YES → Stage 3: BLOCK, log to security audit trail
│
└── ALL CLEAR → Forward to Orchestrator (Layer 3)
```

### DT3 — Routing Tier Escalation

```
Does the query match a Tier 1 regex pattern (greetings, system commands)?
├── YES → Route to static action handler (0ms, 0 tokens)
│
└── NO → Embed query, cosine match against intent clusters
    ├── Score ≥ 0.82 → Route to Expert Node via Tier 2 (<10ms)
    │
    └── Score < 0.82 → Escalate to LLM Planner via Tier 3 (~150ms)
```

### DT4 — Token Budget Enforcement

```
Has the session exceeded its token budget contract?
├── YES → Raise CircuitBreakerException
│         - Halt all state transitions
│         - Freeze the session
│         - Send critical alert to admin
│
└── NO → Allow the LangGraph step to proceed
          - Log token consumption to FinOps dashboard
```

---

## Anti-patterns

### ❌ AP1 — Executing LLM-Generated Code on the Host OS
**What**: Running `subprocess.run()` or `exec()` with LLM-generated Python/bash directly on the gateway server.
**Why it's dangerous**: A single successful prompt injection can execute `rm -rf /`, exfiltrate secrets via `curl`, or install a reverse shell. This is the #1 most critical vulnerability in agentic systems.
**Fix**: All LLM-generated code MUST execute inside a gVisor/Firecracker sandbox with no outbound network, restricted syscalls, and hard CPU/RAM limits via cgroups.

### ❌ AP2 — Single-Layer Security (No Stacking)
**What**: Relying on a single guardrail (e.g., only regex, or only Llama Guard) to catch all threats.
**Why it's dangerous**: Regex cannot catch semantically disguised injections ("please ignore previous instructions and..."). Llama Guard alone adds 50ms latency to every request, including harmless ones. Each layer has blind spots that the others cover.
**Fix**: Deploy the full 3-stage stacked pipeline: Regex (fast/cheap) → Semantic Embeddings (medium/cheap) → Llama Guard (slow/accurate). Each stage short-circuits early if it detects a threat.

### ❌ AP3 — Unparameterized SQL in MCP Tools
**What**: Building SQL queries in MCP tool handlers by concatenating user/LLM-provided strings directly into query text.
**Why it's dangerous**: Classic SQL injection — the LLM can be tricked into generating `'; DROP TABLE users; --` as a parameter value.
**Fix**: All MCP tool SQL MUST use parameterized placeholders (`$1`, `%s`). Validate all parameters with Pydantic/Zod schemas before they reach any query builder.

### ❌ AP4 — No Token Budget Enforcement (Infinite Loop Risk)
**What**: Deploying agents without a token-budget circuit breaker, allowing infinite retry loops.
**Why it's dangerous**: A malfunctioning agent Worker can enter an infinite retry loop (e.g., repeatedly failing tool calls and retrying), consuming hundreds of thousands of tokens per session. In a multi-tenant system, a single runaway session can cost hundreds of dollars before anyone notices.
**Fix**: Enforce token-budget contracts per session with hard circuit breakers. Set `$I_{max} = 10$ ` recursive step limit at Layer 3, and FinOps budget cap at Layer 2.

### ❌ AP5 — Cross-Tenant Data Leakage via Shared Vector Store
**What**: Storing all tenants' embeddings in a single vector collection without payload filtering.
**Why it's dangerous**: Tenant A's semantic search returns Tenant B's confidential documents because there is no `tenant_id` filter on the vector query.
**Fix**: Use Single Collection with mandatory `tenant_id` payload filter on every query (Qdrant). Enforce PostgreSQL RLS on all relational data. Never trust the LLM to add the filter — hardcode it in the query layer.

### ❌ AP6 — 100% Dependency on External API with No Fallback
**What**: Routing all semantic classification through a commercial LLM API with no local fallback.
**Why it's dangerous**: When the external API goes down (rate limit, outage, network failure), the entire gateway stops processing requests.
**Fix**: Tier 1 (Regex) and Tier 2 (local Numpy cosine) run entirely on the gateway CPU. They serve as the emergency fallback when Tier 3 (external LLM API) is unavailable. Design for graceful degradation — reduced capability, not total outage.

### ❌ AP7 — Swapping Embedding Models Without Re-indexing
**What**: Upgrading the Gateway's embedding model but keeping the old vector index.
**Why it's dangerous**: Different embedding models produce incompatible vector spaces. Cosine similarity scores between old-model vectors and new-model query vectors are meaningless, causing routing accuracy to collapse silently.
**Fix**: Automate re-indexing in the CI/CD pipeline. Include embedding baseline unit tests that validate routing accuracy before deploying any model or prompt change.

---

## Reusable Patterns

### ✅ RP1 — Stateful Sandboxing (gVisor/runsc)
**When**: Any time the agent generates code (Python, bash, SQL) that needs to be executed.
**How**: Wrap execution in a gVisor (`runsc`) container that:
1. Intercepts and simulates all Linux syscalls via user-space Sentry.
2. Blocks network egress (no `socket`, no `curl`, no outbound HTTP).
3. Blocks dangerous libraries (`os`, `sys`, `subprocess`, `socket`, `importlib`).
4. Enforces hard CPU/RAM limits via cgroups.
5. Optionally restricts to read-only filesystem in quarantined mode.

### ✅ RP2 — Stacked Guardrails (3-Stage Defense Pipeline)
**When**: Every incoming prompt AND every outgoing LLM response must pass through this pipeline.
**How**:
1. **Stage 1 (Regex, <1ms)**: PII redaction (phone, SSN, credit card patterns) + dangerous command detection (`rm -rf`, `drop table`, `sudo su`).
2. **Stage 2 (Semantic Embedding, <10ms)**: Embed prompt with `bge-micro`, cosine compare against ~100 known injection templates. Block if similarity ≥ 0.85.
3. **Stage 3 (Llama Guard 3, ~50ms)**: Neural classification against 13 OWASP harm categories. Run 4-bit quantized on GPU via vLLM.

### ✅ RP3 — MCP Security Policies (10-Point Checklist)
**When**: Deploying any MCP server that connects to databases, filesystems, or external APIs.
**Checklist**:
1. ☐ Stdio transport for local servers — no raw TCP ports exposed
2. ☐ JWT authentication on all SSE transport connections
3. ☐ Read-only DB permissions (`SELECT` only) — no `INSERT`/`UPDATE`/`DELETE`/`DROP`
4. ☐ Parameterized queries only — no string concatenation for SQL
5. ☐ Hard `LIMIT` on query results (50-100 rows max) — prevent DoS/context explosion
6. ☐ Zod/Pydantic schema validation on all tool parameters
7. ☐ Chrooted workspace directory for file-access tools — block `../` traversal
8. ☐ Network egress control — MCP servers with internal data get zero internet access
9. ☐ Progressive disclosure — expose only tool metadata at init, not full usage docs
10. ☐ Build-to-delete — tools are stateless and independently replaceable

### ✅ RP4 — Three-Tier Semantic Routing
**When**: Classifying user intent at the gateway before routing to the appropriate model or agent.
**How**:
- **Tier 1**: Regex patterns for greetings, system commands, and known repeated queries (0ms, 0 tokens).
- **Tier 2**: `semantic-router` + Qdrant/RedisVL on CPU. Embed query, cosine match against intent clusters. Route to Expert Node if score ≥ 0.82 (<10ms).
- **Tier 3**: Forward to flagship LLM for complex multi-step planning (~150ms). Only ~30% of production traffic should reach this tier.

### ✅ RP5 — FinOps Token-Budget Circuit Breakers
**When**: Every multi-tenant production deployment where agents run autonomously.
**How**:
1. At session init, assign a hard token budget contract (e.g., 50,000 tokens / $2.00 USD per session).
2. At each LangGraph step, an `after_model` interceptor reads token usage from LLM response headers.
3. Accumulate consumed tokens in a running counter.
4. If counter exceeds budget → raise `CircuitBreakerException` → halt all state transitions → freeze session → alert admin.
5. Complement with `$I_{max} = 10$` recursive step limit at Layer 3 to catch infinite loops before they burn through the budget.

### ✅ RP6 — Integrated Gateway Pipeline
**When**: Wiring all Layer 2 components together into a single request processing flow.
**How** (execution order):
1. **PII Masking** → Regex sanitization of sensitive data
2. **Injection Detection** → Semantic similarity check against known attack bank
3. **Semantic Routing** → Classify intent, select model tier (Modelmaxxing)
4. **Token Budget Check** → Verify budget headroom before LLM invocation
5. **LLM Invocation** → Call selected model
6. **Output Guardrails** → Run Llama Guard on LLM response
7. **Sandbox Execution** → If response contains code, execute in gVisor container
8. **Return to Layer 1** → Safe response delivered to the UI layer

---

## Addendum: Core DNA Extracted from AI-Native Architecture Playbooks

### Layer 2: API Gateway & Security
*   **Dynamic Adapter Routing**: Extracts `tenant_id` from JWT and dynamically routes headers (`X-LoRA-Adapter`) to tenant-specific LoRA weights.
*   **PII DLP Masking Pipeline**:
    *   **Tier 1**: Heuristic RegEx engine for fixed numbers (VISA, phone, emails).
    *   **Tier 2**: SpaCy `vi_core_news_lg` NER model for unstructured names (PER/ORG).
    *   Sensitive values are masked to placeholders before LLM ingestion.
*   **Semantic Caching**: Embeds queries locally on CPU (e.g., Qwen3-Embedding-0.6B) and caches on Redis/Qdrant using Cosine Similarity (threshold > 0.88).


---

## Appended DNA Artifact

# LAYER 2: CLIENT GATEWAY SECURITY DNA

## Strict Systemic Rules (Mandatory Guardrails)
- **Tenant Context Extraction & Routing**: The gateway MUST intercept JWT tokens, extract `tenant_id`, and enforce it for both Cache Partitioning and Dynamic Adapter Routing (LoRA).
- **Dual-Layer PII DLP Pipeline**: All unstructured prompts MUST pass through a 2-layer Vietnamese DLP pipeline (Heuristics RegEx for numbers/cards, SpaCy `vi_core_news_lg` for unstructured names/orgs) BEFORE hitting any external LLM.
- **Data Masking**: Sensitive values must be replaced with unified placeholders (e.g., `[CLIENT_NAME]`).
- **Semantic Injection Scrubbing**: The gateway MUST enforce deterministic scrubbing of all incoming JIT RAG payloads for prompt injection or system override manipulation. LLMs cannot reliably police their own prompt tags; therefore, the gateway or a deterministic parser MUST strip adversarial instructions attempting to bypass `<system_overrides>` before passing the payload to the orchestrator.

## Domain References (JIT RAG Best Practices)
- **Semantic Caching**: Embed queries locally (Qwen-0.6B) and serve cache hits if Cosine Similarity >= 0.88.
- **Token Governance**: Enforce Token-level Rate Limiting (TPM) instead of request-level limits.
- **BFSI / Healthcare Use Cases**: Masking 16-digit cards; HIPAA-compliant patient history anonymization.
- **DevOps**: Token padding to mitigate packet-length side-channel attacks.

> **PROJECT CONTEXT INJECTION CONSTRAINT**: When applying DLP rules, align the masking intensity with the PRD's compliance tier and targeted user persona (e.g. B2C vs B2B Enterprise). If the PRD is silent or ambiguous on a component, the agent MUST explicitly prompt the user for clarification (HITL). Defaulting to domain references on silence is forbidden.
