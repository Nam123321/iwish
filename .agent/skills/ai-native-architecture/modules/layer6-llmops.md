# Module: Layer 6 — LLMOps & Co-Evolution Pipeline

> **Source DNA**: `layer6_llmops_and_coevolution_llms_full-DB899295-7826-4F7D-B3F3-F6F35B6DA5E3-dna.md`
> **Typology**: Process · Theory · Checklist

---

## Purpose

Layer 6 is the **self-improvement engine** of the AI-Native stack. It transforms the system from a static model deployment into an autonomously co-evolving organism that learns from its own production successes. The governing axiom is:

> **"Static models ship PoCs; co-evolution ships production survivors."**

Core responsibilities:
1. **Trace Harvesting** — Asynchronously collect successful agent execution traces (quality score ≥ 90) from ClickHouse OLAP via Langfuse, filtering through three quality gates.
2. **ADP Normalization** — Standardize raw telemetry into Agent Data Protocol (ADP) JSON Schema: `Thought → Action → Observation` per step.
3. **Evol-Instruct Augmentation** — Amplify sparse seed datasets (often <100 traces/month) into thousands of training samples using a Teacher LLM across 5 complexity axes.
4. **Serverless GPU SFT** — Fine-tune lightweight LoRA adapters via Unsloth on Modal's Scale-to-Zero GPU infrastructure, achieving 2-5× speedup at 60-80% VRAM savings.
5. **Multi-LoRA Serving** — Serve thousands of tenant-specific adapters over a single frozen base model via vLLM + LoRAX with SGMV kernel batching.
6. **Automated Promotion Gates** — Run DeepEval regression tests (LLM-as-a-judge) measuring Faithfulness, Context Relevance, and Answer Relevance before any adapter reaches production.

### Co-Evolution Mathematical Model

For frozen base model $W_0$ and tenant $t$ with LoRA parameters $\theta_t = \{A_t, B_t\}$:

$$\theta_{t}^{(k+1)} = \theta_{t}^{(k)} + \eta \cdot \nabla \mathcal{L}\left( f(W_0, \theta_{t}^{(k)}; \mathcal{D}_{\text{ADP}, t}), y^* \right)$$

Where:
- $\mathcal{D}_{\text{ADP}, t}$ = ADP-normalized trace dataset for tenant $t$
- $\mathcal{L}$ = Cross-Entropy loss computed on **response tokens only** (Response-Only Loss)
- $\eta$ = learning rate for SFT

### Multi-LoRA Forward Pass

$$y = x \cdot W_0 + \frac{s}{r} \left( x \cdot A_t \cdot B_t \right)$$

Where $s$ = adapter scaling constant, $r$ = LoRA rank, $W_0$ = frozen base weights.

---

## Core Principles

1. **Offline SFT Over Online RL** — Online RL (GRPO/PPO) risks model collapse, has extreme P99 latency, and exceeds FinOps budgets. Offline SFT with asynchronous trace harvesting is the **2026 de-facto production standard**: zero model collapse risk, no real-time latency impact, runs on cheap commodity GPUs.
2. **Quality Over Quantity** — Only harvest traces with `task_completed == True` AND user satisfaction ≥ 4/5 stars AND LLM-as-a-judge score ≥ 90. Noisy labels cause SLMs to learn errors with high confidence.
3. **Schema Consistency is Non-Negotiable** — Schema drift (API name/parameter changes between versions mixed in training data) causes the worst performance collapse: measured 0.864 → 0.585 in experiments.
4. **Adapter Isolation Per Tenant** — Each tenant gets its own LoRA adapter trained on its domain-specific traces. Never mix traces across tenants.
5. **Scale to Zero** — No GPU runs permanently. Modal spins up, trains for ~1 hour, pushes ~50MB adapter to S3, and terminates. Zero idle costs.
6. **Never Deploy Without Testing** — Every adapter must pass DeepEval Promotion Gates (Faithfulness ≥ 0.85, Answer Relevancy ≥ 0.80) before production deployment.
7. **Pin the Judge** — Use a fixed version of the judge model (e.g., `gpt-4o-2024-11-20`) to prevent score drift across evaluation runs.

---

## Mental Models & Frameworks

### 1. The Co-Evolution Loop (Full Pipeline)

```
[Production Agent Runtime]
         │
         ▼
[ClickHouse OLAP Trace Store] ← Langfuse async telemetry (OpenTelemetry)
         │
         ▼
[Cron Harvester Sidecar] ─── 3 Quality Gates ──→ Filter
         │                    1. task_completed == True
         │                    2. user_satisfaction ≥ 4/5
         │                    3. LLM-judge score ≥ 90
         ▼
[ADP Normalization Pipeline]
         │
         ├─→ Parse span.thought    → adp_step.thought
         ├─→ Parse span.tool_call  → adp_step.action
         └─→ Parse span.tool_stdout → adp_step.observation
         │
         ▼
[Evol-Instruct Engine] ─── 5 Complexity Axes ──→ Amplify to 1000+ samples
         │
         ▼
[Modal Serverless GPU] ─── Unsloth SFT ──→ LoRA adapter (~50MB)
         │
         ▼
[AWS S3 Adapter Registry]
         │
         ▼
[DeepEval Promotion Gate] ─── RAG Triad metrics ──→ Pass/Fail
         │
         ▼ (on pass)
[vLLM + LoRAX Serving Cluster] ─── SGMV batching ──→ Production
```

### 2. Agent Data Protocol (ADP) Schema

```
ADP Trajectory:
├── tenant_id: string
├── session_id: string  
├── task_goal: string
├── completion_status: boolean
├── quality_score: float
└── steps: [
      {
        step_number: int,
        thought: string,      ← LLM's internal reasoning
        action: string,       ← Tool name called
        action_input: object,  ← Tool parameters
        observation: string    ← Raw environment response
      }
    ]
```

**Key benefit**: ADP reduces integration complexity from $\mathcal{O}(D \times A)$ to $\mathcal{O}(D + A)$ when swapping frameworks (LangGraph, AutoGen, CrewAI) or base models.

### 3. Evol-Instruct 5-Axis Complexity Model

| Axis | Transformation | Example |
|------|---------------|---------|
| **Constraint Injection** | Add operational requirements | "Limit results to 5 rows" |
| **In-Depth Logic** | Replace lookup with multi-hop reasoning | "Compare and find contradictions" |
| **Contextualization** | Generic → domain-specific scenario | "Check system" → "Debug SyntaxError line 4 in auth.py" |
| **Input Complication** | Inject noise, irrelevant data, contradictory docs | Mixed signal-to-noise context |
| **Task Fractionation** | Single task → interdependent chain | Force planning before execution |

**Evolution Gate** filters:
- Static: Reject samples with cosine similarity ≥ 0.95 to existing dataset
- Dynamic: Execute generated code in sandbox; reject if compiler/linter errors

### 4. Serverless GPU Architecture (Modal + Unsloth)

```
[Harvest threshold reached]
         │
         ▼
[Modal API call] → Spin up container
         │
         ├── Image: nvidia/cuda:12.1.1-devel-ubuntu22.04
         ├── GPU: L40S (commodity, 1/10 cost of H100)
         ├── Libraries: Unsloth + Transformers + PEFT
         ├── Model cache: Shared Volume (/cache)
         └── Timeout: 3600s (hard FinOps limit)
         │
         ▼
[Unsloth SFT Training]
         ├── Base: Qwen2.5-8B-Instruct (frozen)
         ├── LoRA rank: 16
         ├── Target modules: q/k/v/o_proj, gate/up/down_proj  
         ├── 4-bit quantization (load_in_4bit=True)
         ├── Sample Packing enabled (no padding waste)
         ├── Optimizer: AdamW 8-bit
         └── Steps: ~60 (fast convergence)
         │
         ▼
[Export LoRA adapter (~50MB)] → Push to AWS S3
         │
         ▼
[Container auto-terminates] → Cost = $0 idle
```

### 5. Multi-LoRA Serving Model (vLLM + LoRAX)

```
┌──────────────────────────────────────────────────────────┐
│           vLLM + LoRAX HIGH-THROUGHPUT ENGINE             │
│                                                          │
│  [Frozen Base Model W₀]  ← Pinned in VRAM (single copy) │
│                                                          │
│  [Tenant A: A_a, B_a]  [Tenant B: A_b, B_b]  ← Dynamic │
│        from S3               from S3                     │
│                                                          │
│  [SGMV Kernel] ← Batches matrix multiplications across   │
│                   multiple adapters in single GPU pass    │
│                                                          │
│  Result: P95 latency stable under high multi-tenant load │
└──────────────────────────────────────────────────────────┘
```

### 6. DeepEval Promotion Gate (RAG Triad)

```
[New LoRA Adapter] → [Golden Dataset (20-50 test cases)]
         │
         ▼
[DeepEval LLM-as-a-Judge]
         │
         ├── Context Relevance: Is RAG context actually relevant?
         ├── Faithfulness:      Are all claims grounded in context?
         └── Answer Relevance:  Does answer match user's goal?
         │
         ▼
[All scores ≥ thresholds?]
├─ YES → Auto-merge PR → Webhook → Load adapter to vLLM
└─ NO  → Block PR → Alert team → Review and iterate
```

---

## Decision Trees

### DT-1: When to Trigger Co-Evolution

```
Has the tenant accumulated sufficient quality traces?
├─ YES (≥ 100 traces with score ≥ 90)
│   └─ Has the API schema changed since last training?
│        ├─ YES → Purge old-schema traces → Re-harvest → Train
│        └─ NO  → Run Evol-Instruct amplification → Train
└─ NO (<100 quality traces)
    └─ Is the tenant on a paid tier?
         ├─ YES → Use Evol-Instruct to amplify available traces
         │         (but flag as "low-data adapter" in monitoring)
         └─ NO  → Keep using base model, no adapter
```

### DT-2: RL vs Offline SFT

```
Is real-time policy adaptation required during the session?
├─ YES → Consider GRPO/PPO (but accept: extreme P99 latency,
│         model collapse risk, FinOps cost explosion)
│         └─ Can you afford dedicated H100 GPUs?
│              ├─ YES → Proceed with extreme caution + monitoring
│              └─ NO  → Fall back to Offline SFT
└─ NO  → Offline SFT (recommended default)
          → Async harvest → Evol-Instruct → Modal SFT → Deploy
```

### DT-3: GPU Selection for SFT

```
Model size?
├─ ≤ 8B params (Qwen2.5-8B, Llama-3-8B)
│   └─ Use L40S with 4-bit quantization via Unsloth
│       (1/10 cost of H100, fits in 24GB VRAM)
├─ 8B-30B params
│   └─ Use A100-40GB or A100-80GB
└─ > 30B params
    └─ Use H100 (only if FinOps approved)
    └─ Consider: do you really need a model this large?
```

### DT-4: Adapter Promotion Decision

```
DeepEval scores for new adapter:
├─ Faithfulness ≥ 0.85 AND Answer Relevancy ≥ 0.80
│   └─ PROMOTE: Auto-merge PR → push to S3 → webhook to vLLM
├─ Faithfulness ≥ 0.85 BUT Answer Relevancy < 0.80
│   └─ REVIEW: Likely training data quality issue → inspect Evol-Instruct output
├─ Faithfulness < 0.85
│   └─ REJECT: Adapter is hallucinating → inspect trace quality → re-harvest
└─ Any metric undefined / errored
    └─ BLOCK: Infrastructure issue → check DeepEval + judge model connectivity
```

### DT-5: CUDA Graph Compile Latency

```
First request to a new adapter shows P99 > 10s?
├─ YES → CUDA Graph is compiling on first call
│         └─ Implement Pre-warmup Sidecar:
│              → On adapter upload, send synthetic request
│              → Force CUDA Graph compilation before live traffic
└─ NO  → Normal operation, no action needed
```

---

## Anti-patterns

### AP-1: Training on Noisy Labels
**Symptom**: Training directly on raw execution traces containing tool call errors, hallucinated parameters, or failed sessions from previous model versions.
**Consequence**: SLM learns the exact errors and reproduces them with high confidence in subsequent runs.
**Fix**: Only harvest traces passing all three quality gates: `task_completed == True`, user satisfaction ≥ 4/5, LLM-judge score ≥ 90.

### AP-2: Schema Drift in Training Data
**Symptom**: API function names or parameter structures changed between versions, but training data contains a mix of old and new schemas.
**Consequence**: **Worst performance collapse measured**: scores drop from 0.864 → 0.585. Model generates hybrid parameters that match neither old nor new API.
**Fix**: Run schema consistency checker across entire training dataset before feeding to Unsloth. Purge all traces referencing deprecated schemas.

### AP-3: Low Data Without Augmentation
**Symptom**: Attempting SFT with fewer than 100 training samples on complex multi-step tool-calling tasks.
**Consequence**: Model completely fails to converge. Cannot learn tool chaining, error recovery, or clarification behaviors.
**Fix**: Use Evol-Instruct to amplify seed dataset to 1000+ samples minimum. Apply all 5 complexity axes.

### AP-4: Cross-Tenant Trace Mixing
**Symptom**: Collecting training data from multiple tenant agents without domain separation.
**Consequence**: Model generates hybrid parameters — mixing tool schemas, domain terms, and business logic across tenants.
**Fix**: Isolate trace harvesting pipelines per agent/tenant. Never train a single adapter on mixed-tenant data.

### AP-5: Deploying Without Promotion Gates
**Symptom**: Pushing freshly trained adapter directly to vLLM production without regression testing.
**Consequence**: Silent performance degradation. Hallucination rates increase without any alert.
**Fix**: Mandatory DeepEval Promotion Gate in CI/CD. Block PR merge if Faithfulness < 0.85 or Answer Relevancy < 0.80.

### AP-6: PgBouncer search_path for Tenant Isolation
**Symptom**: Using dynamic `search_path` SQL statements for tenant isolation with PgBouncer in Transaction Pooling mode.
**Consequence**: Severe cross-tenant data leakage. LangGraph checkpoint writes go to wrong tenant schemas.
**Fix**: Remove all dynamic search_path usage. Enforce application-level isolation via PostgreSQL Row-Level Security (RLS).

### AP-7: CUDA Graph Cold-Start Latency
**Symptom**: vLLM loads a LoRA adapter dynamically on first request, triggering CUDA Graph recompilation → P99 > 10 seconds.
**Consequence**: First user request per adapter experiences unacceptable latency.
**Fix**: Deploy pre-warmup sidecar that automatically sends synthetic inference requests to pre-compile CUDA Graphs for newly uploaded adapters.

### AP-8: Per-Tenant Qdrant Collections
**Symptom**: Creating separate physical vector collections for each tenant as customer count grows to thousands.
**Consequence**: RAM exhaustion from HNSW index and metadata overhead. Global index structure breaks.
**Fix**: Single Collection per Embedding Model + Payload-based `tenant_id` filtering.

### AP-9: Brute-Force Context Summarization
**Symptom**: Using static line-count summarization or expensive LLM calls for every conversation turn.
**Consequence**: Critical business context lost. Cumulative token costs explode.
**Fix**: Deploy DyCP/KadaneDial at `before_model` lifecycle hook. Summarize only low-salience segments. Preserve high-salience recent messages and system prompt.

### AP-10: Judge Model Version Drift
**Symptom**: Using floating model versions for DeepEval judge (e.g., `gpt-4o` without date pin).
**Consequence**: Evaluation scores drift silently between runs. Adapter that passed last week may fail today with identical outputs.
**Fix**: Always pin judge model version: `gpt-4o-2024-11-20`. Update only deliberately with re-baseline.

---

## Reusable Patterns

### RP-1: Trace Harvester with ADP Normalization

```python
class TraceHarvesterADP:
    def __init__(self, score_threshold: float = 90.0):
        self.score_threshold = score_threshold

    def harvest_and_parse(self, raw_clickhouse_rows):
        """
        Filter ClickHouse traces through 3 quality gates,
        normalize to ADP schema (Thought-Action-Observation).
        """
        adp_dataset = []
        for row in raw_clickhouse_rows:
            # Gate 1: Task completion
            if not row.get("task_completed", False):
                continue
            # Gate 2+3: Quality score (combines user satisfaction + LLM-judge)
            if row.get("quality_score", 0.0) < self.score_threshold:
                continue
            
            trajectory = ADPTrajectory(
                tenant_id=row["tenant_id"],
                session_id=row["session_id"],
                task_goal=row["goal_prompt"],
                completion_status=True,
                quality_score=row["quality_score"]
            )
            for idx, step in enumerate(row.get("raw_spans", [])):
                trajectory.steps.append(ADPStep(
                    step_number=idx + 1,
                    thought=step.get("thought", ""),
                    action=step.get("tool_name", "pure_text_response"),
                    action_input=step.get("tool_arguments", {}),
                    observation=step.get("observation_stdout", "")
                ))
            adp_dataset.append(trajectory)
        return adp_dataset
```

### RP-2: Modal Serverless SFT Configuration

```python
# Key configuration for Modal + Unsloth LoRA training
@app.function(
    image=unsloth_image,         # nvidia/cuda:12.1.1-devel + Unsloth
    gpu="L40S",                   # Commodity GPU (1/10 H100 cost)
    volumes={"/cache": volume},   # Shared model cache
    timeout=3600,                 # Hard FinOps 1-hour limit
    secrets=[modal.Secret.from_name("aws-s3-secrets")]
)
def run_sft_training_job(tenant_id: str, adp_data_path: str):
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="Qwen/Qwen2.5-8B-Instruct",
        max_seq_length=4096,
        load_in_4bit=True,        # 4-bit quantization for VRAM savings
        cache_dir="/cache/models"
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,                      # LoRA rank optimized for tool-calling
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        use_gradient_checkpointing="unsloth"
    )
    trainer = SFTTrainer(
        model=model, tokenizer=tokenizer,
        train_dataset=dataset,
        packing=True,              # Sample Packing (no padding waste)
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            max_steps=60,
            learning_rate=2e-4,
            optim="adamw_8bit"
        )
    )
    trainer.train()
    # Export ~50MB adapter → S3 → Container auto-terminates
```

### RP-3: DeepEval Promotion Gate (Pytest)

```python
# Pin judge model version to prevent score drift
MODEL_JUDGE = "gpt-4o-2024-11-20"

faithfulness_metric = FaithfulnessMetric(threshold=0.85, model=MODEL_JUDGE, include_reason=True)
relevancy_metric = AnswerRelevancyMetric(threshold=0.80, model=MODEL_JUDGE, include_reason=True)

@pytest.mark.parametrize("test_case", get_golden_test_cases())
def test_adapter_promotion_gate(test_case: LLMTestCase):
    """
    Block adapter promotion unless ALL metrics pass:
    - Faithfulness ≥ 0.85 (no hallucination)
    - Answer Relevancy ≥ 0.80 (matches user intent)
    Golden dataset: 20-50 core boundary test cases per tenant.
    """
    assert_test(test_case, [faithfulness_metric, relevancy_metric])
```

### RP-4: GitHub Actions CI/CD Gate

```yaml
name: "LLMOps Co-Evolution Promotion Gate"
on:
  pull_request:
    branches: ["main"]
    paths: ["adapters/**", "prompts/**", "tests/pytest_promoter.py"]

jobs:
  verify-and-promote:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: |
          pip install poetry && poetry install
      - env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          CONFIDENT_API_KEY: ${{ secrets.CONFIDENT_API_KEY }}
        run: poetry run deepeval test run tests/pytest_promoter.py --parallel
```

### RP-5: Co-Evolution Shared State Schema

```python
class CoEvolutionSharedState(BaseModel):
    tenant_id: str      # Unique tenant identifier
    session_id: str     # Current session
    goal_prompt: str    # Original business request
    quality_score: float = 0.0
    raw_spans: List[Dict[str, Any]] = []
    task_completed: bool = False
```

### RP-6: Evol-Instruct Prompt Template (Per Axis)

```text
# Constraint Injection axis:
Given this seed instruction: {{ SEED }}
Add 2-3 new operational constraints that make the task harder
but remain realistic for the {{ DOMAIN }} domain.

# Task Fractionation axis:
Given this seed instruction: {{ SEED }}
Break it into a chain of 3-5 interdependent sub-tasks where
each sub-task depends on the output of the previous one.
Force the agent to plan before executing.
```

### RP-7: Pre-Warmup Sidecar for CUDA Graph

```python
# On adapter upload webhook:
async def pre_warmup_adapter(tenant_id: str, adapter_path: str):
    """
    Send synthetic inference request to force CUDA Graph compilation
    BEFORE live traffic reaches the adapter. Eliminates cold-start P99 spike.
    """
    synthetic_request = {
        "model": f"base-model+{tenant_id}",
        "messages": [{"role": "user", "content": "warmup"}],
        "max_tokens": 1
    }
    await vllm_client.post("/v1/chat/completions", json=synthetic_request)
```

### RP-8: Tenant-Specific Adapter Lifecycle

```
[Tenant onboards]
    → Base model only (no adapter)
    → Traces accumulate in ClickHouse
         │
[100+ quality traces reached]
    → Trigger Evol-Instruct amplification
    → Modal SFT → LoRA adapter v1 → S3
    → DeepEval gate → Deploy to vLLM
         │
[Ongoing production]
    → Continuous trace harvesting (cron)
    → Monthly re-training cycle
    → Adapter v2, v3... with version tracking
    → Old adapters archived, not deleted
```


---

## Appended DNA Artifact

# LAYER 6: DATA & MEMORY DNA

## Strict Systemic Rules (Mandatory Guardrails)
- **PostgreSQL Row-Level Security (RLS)**: All multi-tenant tables MUST enforce RLS at the database engine level. The API gateway must intercept the JWT and run `SET LOCAL app.current_tenant_id` within every transaction.
- **Qdrant Partitioning Key**: Vector databases MUST use a strict logical isolation payload field (`Partitioning Key`) to prevent cross-tenant data leakage.
- **Write-Audit-Publish (WAP)**: All inbound data ingestion must hit a staging branch, run automated schema and PII detection rules (Audit), and only merge to production upon 100% success.

## Domain References (JIT RAG Best Practices)
- **dbt Medallion Pipelines**: Bronze (Raw), Silver (PII-masked), Gold (Flattened).
- **One Big Table (OBT)**: Flatten schemas for Text-to-SQL agents to eliminate JOIN hallucinations, raising accuracy significantly.
- **Redis Semantic Cache**: Store session states and token budget counters for <5ms medium-term memory access.

> **PROJECT CONTEXT INJECTION CONSTRAINT**: When designing database partitions or WAP rules, the agent must refer to the Target Customer scale (e.g., B2B vs B2C) from the PRD to determine if logical partitioning (Qdrant) or hard physical segregation (Milvus) is appropriate. If the PRD is silent or ambiguous on a component, the agent MUST explicitly prompt the user for clarification (HITL). Defaulting to domain references on silence is forbidden.
