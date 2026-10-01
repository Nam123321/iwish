# Module: Layer 4 — Data & Context Engine

> **Source DNA**: `layer4_data_and_context_llms_full-170A0512-BFB9-49A8-941B-E12019933258-dna.md`
> **Typology**: Theory · Process · Checklist

---

## Purpose

Layer 4 is the **non-parametric fuel supply** for the entire AI-Native stack. It structures, retrieves, compresses, and isolates enterprise knowledge so that stateless LLMs receive maximally relevant context within hard token-budget constraints. The governing axiom is:

> **"Search small for precision, read big for completeness."**

Core responsibilities:
1. **Ingestion (I)** — Parse complex documents (PDF tables, hierarchical headings) into Parent-Child chunk pairs enriched with Contextual Retrieval prefixes.
2. **Retrieval (R)** — Run Hybrid Search (Dense + Sparse), merge via Reciprocal Rank Fusion (RRF), and filter through Cross-Encoder Reranking to produce a narrow, high-signal context window.
3. **Compaction (C)** — Apply Dynamic Context Pruning (DyCP / KadaneDial) and LongLLMLingua to prevent Context Rot and Lost-in-the-Middle degradation.
4. **Poly-stores (M)** — Operate a Three-Tier Memory hierarchy (Active Index → Topic Files → Raw Transcripts) across SQLite FTS5, Vector DBs, and Neo4j GraphRAG.
5. **Multi-tenant Isolation** — Enforce Single Collection Payload Partitioning with mandatory `tenant_id` filters on every vector query.

### Context Composition Equation

$$C_{\text{active}} = f(S_{\text{sys}}, T_{\text{schema}}, M_{\text{episodic}}, H_{\text{recent}}, E_{\text{errors}})$$

Hard constraint: `Length(C_active) ≤ L_ctx` (model context window limit).

### RAG Probability Model

$$P(Y|X) = \sum_{D \in \mathcal{D}} P(Y|X, D) \cdot P(D|X)$$

Where `P(D|X)` is the retrieval distribution and `P(Y|X,D)` is the generation distribution conditioned on retrieved context.

---

## Core Principles

1. **Context > Model** — 40% of enterprise agent failures trace to poor metadata and context management, not model quality. The model is the static brain; context is the fuel.
2. **Precision-Completeness Duality** — Child chunks (~200 tokens) provide sharp embedding vectors for retrieval; Parent chunks (~1000 tokens) provide complete reasoning context for generation.
3. **Progressive Disclosure** — Treat memory as "hints." Load only Active Index into system prompt; surface Topic Files on-demand; reserve Raw Transcripts for explicit FTS5 search.
4. **Context Rot Prevention** — Even million-token windows suffer >30% quality degradation from Lost-in-the-Middle. Always prune and compress rather than blindly stuffing context.
5. **Tenant Isolation as Load-Bearing Constraint** — Never create per-tenant collections. Use Single Collection + payload filter `tenant_id` forced by JWT signature on every search.
6. **Over-fetch and Rerank** — Retrieve broadly (top_k=50), then rerank precisely (top_n=5) via Cross-Encoder to eliminate noise.
7. **Embedding Version Discipline** — Pin embedding model versions. Any model swap triggers mandatory full re-indexing pipeline.

---

## Mental Models & Frameworks

### 1. The Ingestion Triad (IBM Docling Pipeline)

```
[Raw PDF] → [IBM Docling / LlamaParse] → [Bounding Box Analysis]
                                                │
                                    (Mean-offset Thresholding)
                                                ↓
[Parent Chunk (UUID_parent)] ←── metadata ──→ [Child Chunks (UUID_child)]
 (Full surrounding context)                    (Contextual prefix prepended)
```

**Three phases:**
- **Phase 1 — Visual Metadata Extraction**: Scan font size, weight, bounding boxes.
- **Phase 2 — Hierarchical Heading Classification**: Mean-offset thresholding on font sizes → H1/H2/H3 detection.
- **Phase 3 — Relationship Tree**: State-machine classifier links body text to nearest parent heading.

### 2. Parent-Child Chunking Model

| Dimension | Child Chunk | Parent Chunk |
|-----------|------------|--------------|
| Size | ~200-300 tokens | ~1000-2000 tokens |
| Purpose | Sharp embedding vectors for precise similarity matching | Complete context for LLM reasoning |
| Storage | Separate collection/table, linked by `parent_id` | Separate collection/table |
| Overlap | 50% sliding window | 50% sliding window |
| At search time | Matched against query vector | Returned to LLM for reading |

### 3. Contextual Retrieval (Anthropic Pattern)

Problem: A chunk saying "Revenue increased 12%" is useless without knowing *which* company and *which* quarter.

Solution: At ingestion time, use a cheap SLM (Claude Haiku / Qwen-7B) to generate a 50-100 word contextual prefix for each child chunk. Prepend this prefix before computing embeddings. **Result: 67% reduction in retrieval errors.**

### 4. DyCP / KadaneDial Context Pruning

```
Raw conversation history → [Salience Scoring (Cosine + Age Decay)]
                                        │
                            [KadaneDial: Find max-sum contiguous subarray]
                                        │
                              (Two-Stage Compaction)
                                        ↓
[System Prompt] + [MCP Schemas] + [Static Compaction Summary] + [Recent Chat (Cache-Pinned)]
```

**Algorithm:**
1. **Salience Scoring**: System prompt & current query → `S_i = 1.0`. Intermediate messages → cosine similarity with current query × age decay factor.
2. **Max Subarray**: KadaneDial finds the contiguous conversation segment with highest total salience within the token budget.
3. **Two-Stage Compaction**: Everything outside the optimal segment → summarized by SLM into a single static summary block.

### 5. Three-Tier Memory Hierarchy

```
Tier 1: Active Index     → Always pinned in system prompt (~150 chars/topic)
           │
Tier 2: Topic Files      → SQLite, loaded on-demand via progressive disclosure
           │
Tier 3: Raw Transcripts  → FTS5 full-text search only when agent explicitly calls search
```

### 6. Hybrid Search + RRF + Cross-Encoder Pipeline

```
[User Query]
      │
      ├──→ [Dense Retrieval (Qdrant)]
      └──→ [Sparse Retrieval (BM25)]
                    │
         [Reciprocal Rank Fusion] (Merge Top 50)
                    │
         [Cross-Encoder Reranker] (Filter to Top 5)
                    │
         [Final context → LLM]
```

**RRF Formula:**

$$RRF\_Score(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where `k = 60` (smoothing constant), `r_m(d)` = rank of document `d` in method `m`.

### 7. Multi-Tenant Vector DB: Single Collection Partitioning

```
┌─────────────────────────────────────────────┐
│  Single Qdrant Collection (per embedding)   │
│                                             │
│  doc_1 {tenant_id: "A", vector: [...]}      │
│  doc_2 {tenant_id: "B", vector: [...]}      │
│  doc_3 {tenant_id: "A", vector: [...]}      │
│                                             │
│  EVERY query MUST include:                  │
│  filter: {tenant_id == JWT.tenant_id}       │
└─────────────────────────────────────────────┘
```

---

## Decision Trees

### DT-1: Choosing a Chunking Strategy

```
Is the document structurally complex (tables, headings, multi-level)?
├─ YES → Use IBM Docling + Parent-Child Chunking
│         └─ Does the domain have ambiguous terminology?
│              ├─ YES → Add Contextual Retrieval prefixes (SLM at ingestion)
│              └─ NO  → Standard Parent-Child is sufficient
└─ NO (plain text / short docs)
   └─ Simple fixed-size chunking with 50% overlap
```

### DT-2: Selecting the Retrieval Pipeline

```
Does the corpus contain codes, IDs, abbreviations, or proper nouns?
├─ YES → Hybrid Search (Dense + BM25 Sparse) + RRF fusion
│         └─ Is precision critical (legal, medical, financial)?
│              ├─ YES → Add Cross-Encoder Reranker (Over-fetch 50, rerank to 5)
│              └─ NO  → RRF top-10 is sufficient
└─ NO (purely semantic / conversational)
   └─ Dense-only retrieval with top_k=10-20
```

### DT-3: Context Budget Exceeded?

```
Total context tokens > L_ctx budget?
├─ YES → Is it conversation history bloat?
│         ├─ YES → Apply DyCP/KadaneDial pruning
│         │         → Summarize low-salience segments via SLM
│         └─ NO (RAG document bloat)
│              → Apply LongLLMLingua perplexity-based compression
│              → Insert grounding constraint after question
│              → Target: 25% token consumption, +21.4% accuracy
└─ NO → Keep full context (maximize prompt cache hit rate)
```

### DT-4: Multi-Tenant Vector DB Design

```
Number of tenants?
├─ Small (<10) → Separate collections MAY be acceptable
└─ Large (10+) → MUST use Single Collection + Payload Partitioning
                  └─ Enforce tenant_id filter from JWT on every query
                  └─ Never trust client-supplied tenant_id
```

### DT-5: GraphRAG vs Vector RAG

```
What type of questions are being asked?
├─ Global summarization / macro-level trends
│   → Use GraphRAG (Neo4j Knowledge Graph)
│   → 50-70% better than Vector RAG for these queries
└─ Specific fact retrieval / point lookups
    → Use Vector RAG (Parent-Child + Hybrid Search)
```

---

## Anti-patterns

### AP-1: Embedding Version Drift
**Symptom**: Swap embedding model without re-indexing the vector DB. Cosine distances become meaningless; retrieval accuracy → ~0%.
**Fix**: Pin embedding model versions. Any model change triggers automated full re-indexing pipeline in CI/CD.

### AP-2: Contextual Inconsistency Hallucination
**Symptom**: Old documents contradict newer regulations in the same corpus. LLM merges both, producing wrong answers.
**Fix**: Attach temporal metadata to all documents. Apply recency-priority filters at retrieval time.

### AP-3: SQL Injection via Tool Parameters
**Symptom**: Agent generates raw SQL strings and sends them directly to the database through MCP tools.
**Fix**: Never accept raw SQL from LLM. Define strict Pydantic/Zod schemas for tool parameters. Use parameterized queries (psycopg2 placeholders).

### AP-4: Memory Poisoning
**Symptom**: Writing failed conversations, syntax errors, and intermediate hallucinations into long-term memory files.
**Fix**: Only harvest traces from ClickHouse/Langfuse where quality score ≥ 90 (LLM-as-a-judge). Never persist raw error traces.

### AP-5: Per-Tenant Collection Explosion
**Symptom**: Creating thousands of independent physical Qdrant/Milvus collections for each tenant. RAM consumption explodes from HNSW index and metadata overhead.
**Fix**: Single Collection per Embedding Model + `tenant_id` payload filter.

### AP-6: PII Filter Destroying Embeddings
**Symptom**: Aggressive PII scanner replaces domain keywords and IDs with `[REDACTED]` before embedding, destroying the vector space.
**Fix**: Apply selective PII masking only on actual personal data (SSN, phone). Run PII filter at `before_model` lifecycle hook AFTER retrieval, not before indexing.

### AP-7: SQL Schema Context Overflow
**Symptom**: Loading entire database schema (hundreds of tables) into system prompt for text-to-SQL agents.
**Fix**: Type annotations / metadata tags to expose only 5-10 relevant tables per query.

### AP-8: Infinite Recursion in Multi-Step RAG
**Symptom**: Agent enters retrieve-rethink-retrieve loop indefinitely, exploding token costs.
**Fix**: Hard recursion limit (`I_max ≤ 5`) at orchestrator level. FinOps circuit breaker kills the run.

### AP-9: PgBouncer search_path Leak
**Symptom**: Dynamic `search_path` changes for tenant isolation on PostgreSQL with PgBouncer in Transaction Pooling mode → data leaks across tenants.
**Fix**: Application-level isolation via PostgreSQL Row-Level Security (RLS). Never rely on session-level search_path with connection pooling.

### AP-10: Floating Embedding Model Drift
**Symptom**: Using commercial cloud embedding APIs that silently update model weights → cosine distances drift over time.
**Fix**: Self-host stable open-source embedding models (e.g., BGE-base-en-v1.5) or pin exact API version.

---

## Reusable Patterns

### RP-1: Parent-Child Ingestion Pipeline

```python
class ParentChildIngestionPipeline:
    def __init__(self, child_size=150, parent_size=800):
        self.child_size = child_size
        self.parent_size = parent_size

    def process_document(self, document_text, document_metadata):
        """
        Split document into Parent-Child pairs linked by UUID.
        - Parents: ~800 words, preserve full reasoning context
        - Children: ~150 words, sharp embedding vectors
        - 50% overlap on both levels to prevent boundary loss
        - Contextual prefix prepended to each child before embedding
        """
        nodes = []
        words = document_text.split()
        parent_idx = 0
        while parent_idx < len(words):
            parent_id = str(uuid.uuid4())
            parent_words = words[parent_idx : parent_idx + self.parent_size]
            # Store parent node
            nodes.append(ChunkNode(
                id=parent_id,
                content=" ".join(parent_words),
                metadata={**document_metadata, "type": "parent"}
            ))
            # Generate children within this parent's scope
            child_idx = 0
            while child_idx < len(parent_words):
                child_words = parent_words[child_idx : child_idx + self.child_size]
                # Contextual Retrieval: prepend SLM-generated prefix
                prefix = generate_contextual_prefix(document_text, " ".join(child_words))
                nodes.append(ChunkNode(
                    id=str(uuid.uuid4()),
                    parent_id=parent_id,
                    content=prefix + " ".join(child_words),
                    metadata={**document_metadata, "type": "child"}
                ))
                child_idx += self.child_size // 2  # 50% overlap
            parent_idx += self.parent_size // 2  # 50% overlap
        return nodes
```

### RP-2: Hybrid RRF Search

```python
class HybridRRFSearch:
    def __init__(self, rrf_k=60):
        self.rrf_k = rrf_k

    def compute_rrf(self, dense_results, sparse_results):
        """
        Merge Dense (vector) and Sparse (BM25) results via
        Reciprocal Rank Fusion. Returns sorted (doc_id, score) pairs.
        """
        rrf_scores = {}
        for rank, doc_id in enumerate(dense_results):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (self.rrf_k + rank + 1)
        for rank, doc_id in enumerate(sparse_results):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (self.rrf_k + rank + 1)
        return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
```

### RP-3: DyCP/KadaneDial Context Compactor

```python
class DyCPKadaneDialCompactor:
    def __init__(self, max_token_budget=1500):
        self.max_token_budget = max_token_budget

    def compact_context(self, messages, current_query, summarizer_func):
        """
        1. Score each message for salience (cosine similarity + age decay)
        2. Reverse-scan to protect recent high-salience messages
        3. Summarize remaining low-salience messages into static summary
        4. Reassemble: [System] + [Static Summary] + [Retained Recent]
        Preserves prompt cache locality by keeping system prefix stable.
        """
        # ... KadaneDial max-subarray logic ...
```

### RP-4: Contextual Retrieval Prompt Template

```text
Below is the source document:
<document>
{{ FULL_DOCUMENT }}
</document>
Write a short contextual description to place the following chunk
in its correct semantic position within the source document:
<chunk>
{{ CHUNK_CONTENT }}
</chunk>
```

### RP-5: Qdrant Tenant-Filtered Search

```python
# MANDATORY: Always inject tenant_id from JWT, never from user input
results = qdrant_client.search(
    collection_name="unified_embeddings",
    query_vector=query_embedding,
    query_filter=Filter(
        must=[FieldCondition(key="tenant_id", match=MatchValue(value=jwt_tenant_id))]
    ),
    limit=50  # Over-fetch for subsequent reranking
)
```

### RP-6: LongLLMLingua Grounding Constraint

After compressing prompt via perplexity-based pruning, insert this constraint immediately after the question to limit the search space and reduce hallucination:

```text
"We can find the answer to this question in the documents provided below."
```

Result: +21.4% answer accuracy at only 25% token consumption.

### RP-7: MCP Tool Schema (Parameterized Query)

```yaml
mcp_tool_schema:
  name: "secure_postgresql_query"
  input_schema:
    type: "object"
    properties:
      table_name:
        type: "string"
        maxLength: 64  # Prevent injection
      limit:
        type: "integer"
        minimum: 1
        maximum: 50
        default: 10
      filter_column:
        type: "string"
      filter_value:
        type: "string"  # Always parameterized, never raw SQL
    required: ["table_name"]
```

### RP-8: Corrective RAG (CRAG) Branching

```
Score retrieved documents:
├─ CORRECT (high relevance) → Pass through to LLM directly
├─ INCORRECT (low relevance) → Discard context, branch to web search (SerpAPI/Tavily)
└─ AMBIGUOUS (partial match) → Keep partial context + cross-reference with external search
```

### RP-9: Skill Schema Progressive Disclosure

```markdown
---
name: "financial_report_analyzer"
version: "1.0.0"
---
# Step 1: Scan frontmatter only (~100 tokens) at startup
# Step 2: If user intent matches → load full SKILL.md via tool call
# Step 3: Execute compression + Parent-Child retrieval
```

---

## Addendum: Core DNA Extracted from AI-Native Architecture Playbooks

### Layer 4 & Layer 6: Execution Sandbox & Data Memory Context
*   **Zero-Trust Containers**: Run LLM-generated code strictly inside gVisor containers (e.g., `runsc`) with disabled network interfaces.
*   **Dual Memory Architecture**:
    *   **Tier 1 (Hot)**: Active Index in RAM (SQLite/Redis) representing conversational sliding window.
    *   **Tier 2 (Cold)**: Topic Files in SSD (Qdrant) utilizing Parent-Child Chunking (200 tokens child, 1000 tokens parent).
*   **Time-Travel State Restoration**: Captures execution state checkpoints (Delta JSONs). Every sandbox execution can rollback deterministically if LLM hallucinates an API breaking change.


---

## Appended DNA Artifact

# LAYER 4: EXECUTION & SANDBOX DNA

## Strict Systemic Rules (Mandatory Guardrails)
- **Absolute Execution Boundary**: All agentic code generation and compilation MUST run in isolated sandboxes (e.g., Firecracker MicroVMs or gVisor). Docker sandboxes with mounted sockets (e.g., `/var/run/docker.sock`) are strictly prohibited due to CBSE (Configuration-Based Sandbox Escape) risks.
- **Stateless MCP v2 Compliance**: MCP implementations must be stateless over HTTP/SSE. JSON-RPC 2.0 messages MUST be self-contained and carry the `tenant_id`. Server state preservation assumptions are forbidden.
- **MRTR (Multi Round-Trip Requests)**: Sensitive actions must freeze the agent state, push an approval request to the HITL dashboard, and wait for a webhook callback before resuming.

## Domain References (JIT RAG Best Practices)
- **Lifecycle Hooks**: `before_tool_call` for regex/SpaCy input scanning; `after_tool_call` for output trimming (LLMLingua) to protect KV-cache from massive tool logs.
- **Async Webhook Callbacks**: For long-running SaaS tools (Jira, SAP), return 202 Accepted and suspend the workflow until the external system POSTs back.

> **PROJECT CONTEXT INJECTION CONSTRAINT**: Evaluate sandbox choices against the project's non-functional requirements (NFRs) for performance vs. security latency. Domain references regarding webhook delays must be calibrated to the specific User Journeys in the PRD. If the PRD is silent or ambiguous on a component, the agent MUST explicitly prompt the user for clarification (HITL). Defaulting to domain references on silence is forbidden.
