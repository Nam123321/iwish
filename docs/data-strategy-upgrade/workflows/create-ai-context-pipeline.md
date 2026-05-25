---
name: "create-ai-context-pipeline"
description: "Design the AI Context Assembly Pipeline — classify context sources, assign injection methods, define token budgets"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create AI Context Pipeline

## Pre-requisites
- Prompt Engineering Guardian SKILL available at `{project-root}/.agent/skills/prompt-engineering-guardian/SKILL.md`
- AI Cost Optimizer SKILL available at `{project-root}/.agent/skills/ai-cost-optimizer/SKILL.md`
- Cache strategy (if exists) from `{output_folder}/data-specs/*-cache-strategy.md`
- KB sync strategy (if exists) from `{output_folder}/data-specs/*-kb-sync-strategy.md`
- Story file or AI feature description

## Workflow Steps

### Step 1: Context Loading
1. Load the Prompt Engineering Guardian SKILL
2. Load the AI Cost Optimizer SKILL
3. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
4. Load the story/feature description
5. Load existing cache-strategy and kb-sync-strategy if available
6. Identify which AI Consumer module this pipeline serves

### Step 2: Context Source Inventory
List ALL data sources the AI feature needs access to:

| Source | Entity/Data | Example | Volatility |
|--------|------------|---------|-----------|
| Semantic KB | Product details | "Thuốc giảm đau X thành phần..." | Low (daily) |
| Semantic KB | Training rules | "Luôn gọi khách bằng anh/chị" | Low (weekly) |
| Semantic KB | Content assets | Approved marketing materials | Low (on-approve) |
| Live Data | Active CTKMs | "Mua 3 tặng 1 đến 31/3" | Medium (hourly) |
| Live Data | Customer profile | Order history, LTV, preferences | Medium (per-order) |
| Live Data | Inventory | Số lượng tồn kho hiện tại | High (per-minute) |
| Memory | Chat history | Previous messages in session | Per-message |
| Memory | User preferences | Learned interaction patterns | Per-session |
| Static | Persona config | Tone, vocabulary, guardrails | Rare (admin config) |

### Step 3: Injection Method Assignment
For each context source, assign the optimal injection method:

| Method | When to Use | Token Cost | Latency |
|--------|------------|------------|---------|
| **System Prompt** | Always-needed context (persona, guardrails, top products) | Fixed per call | 0ms (pre-loaded) |
| **RAG Retrieval** | Semantic search results (product KB, training rules) | Variable per query | 200-500ms |
| **Tool Calling** | On-demand structured data (check inventory, get order status) | Only when called | 100-300ms |
| **Redis Snapshot** | Pre-aggregated live data (active CTKMs, customer profile) | Fixed per snapshot | <10ms |
| **Memory Layer** | Conversation history (Mem0) | Variable per session | 50-100ms |

Decision matrix:
```
If AI ALWAYS needs this data → System Prompt or Redis Snapshot
If AI SOMETIMES needs this data → Tool Calling
If data is unstructured knowledge → RAG Retrieval (Cognee)
If data is recent conversation → Memory Layer (Mem0)
If data is exact structured query → Tool Calling (Prisma)
```

### Step 4: Token Budget Allocation
Define token limits per context source to stay within model limits:

```
Model: GPT-4o (128K context) or Gemini 2.0 Flash (1M context)
Target usage: ≤80% of context window

Budget allocation (GPT-4o example):
  System prompt (persona + guardrails):    ~800 tokens  (fixed)
  RAG results (top-K from Cognee):        ~2000 tokens  (variable, K=3-5)
  Redis snapshot (CTKM + profile):         ~500 tokens  (fixed per snapshot)
  Chat history (last N messages):         ~2000 tokens  (sliding window)
  Tool call results (on-demand):          ~1000 tokens  (per call)
  User query:                              ~200 tokens
  Reserved for response:                  ~2000 tokens
  ─────────────────────────────────────────────────────
  Total:                                  ~8500 tokens per interaction
```

Flag ⚠️ if total exceeds 80% of model context or cost exceeds budget.

### Step 5: Context Assembly Flow Diagram

Create a Mermaid diagram showing the full assembly pipeline:

```
[User Query] → PromptAssemblyService
  ├── 1. Load Persona (TenantConfig DB, cached L1)
  ├── 2. Fetch KB Context (Cognee semantic search)
  ├── 3. Fetch Live Snapshot (Redis)
  ├── 4. Load Memory (Mem0 recent messages)
  ├── 5. Register Tools (inventory check, order lookup...)
  └── [Assembled Prompt] → LLM Gateway → Response
```

### Step 6: Fallback & Degradation Strategy
For each context source, define behavior when unavailable:

| Source | Fallback | Degradation Impact |
|--------|----------|--------------------|
| Cognee down | Skip KB context, add disclaimer | AI answers without product knowledge |
| Redis down | Fall back to Prisma query (slower) | Higher latency, DB load increase |
| Mem0 down | Treat as new conversation | Loss of personalization |
| Tool call fails | Return "I'll check and get back" | Graceful degradation |

### Step 7: Cross-Reference with Songoku
Consult Songoku (AI Engineer) for:
- Model selection impact on token budget
- Prompt template optimization
- Cost estimation per 1000 interactions
- Security: ensure no PII leakage in cached context

### Step 8: Output
Save to `{output_folder}/data-specs/{feature-key}-ai-context-pipeline.md` with:
- Context source inventory
- Injection method assignments
- Token budget breakdown
- Assembly flow diagram (Mermaid)
- Fallback strategy
- Cost estimate per 1000 interactions
- Songoku review notes

Present to user for review.
