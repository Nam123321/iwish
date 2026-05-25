---
name: "AI Cost Optimizer"
description: >
  LLM cost optimization skill for model selection, token budgeting, caching strategies,
  and production cost monitoring. Grounded in production patterns from Redis (semantic caching),
  Google Vertex AI, OpenAI cost optimization guides, and multi-provider SaaS cost management.
---

# AI Cost Optimizer

## Purpose

This skill provides frameworks for minimizing LLM costs while maintaining quality in production SaaS applications. Every AI feature must have a cost model before development begins.

## When to Use

- During `/songoku-ai-spec` — assign model tier and token budget
- During `/songoku-cost-audit` — review actual vs projected costs
- During `/songoku-ai-review` — validate model selection
- During `code-review` — check for cost anti-patterns

---

## Model Selection Framework

### Project Tier Map

| Tier | Provider | Input/1M tokens | Output/1M tokens | Best For | Latency |
|------|----------|-----------------|-------------------|----------|---------|
| **T1** | Gemini Flash-Lite | $0.10 | $0.40 | Classification, extraction, auto-fill, quick parsing | ~300ms |
| **T2** | Gemini 3 Pro | $2.00 | $12.00 | Complex NLP, Chat-to-Order, reasoning | ~800ms |
| **T3** | DeepSeek V3 | $0.14 | $0.28 | Complex analysis, CTKM optimization | ~1.2s |
| **T4** | Gemini 3 Pro Vision | Native | Multimodal | OCR (catalogs, invoices) | ~1s |
| **T5** | Google Cloud STT | Per-second | — | Voice input (Vietnamese) | ~500ms |
| **T6** | Prophet/Custom ML | Compute only | — | Forecasting, predictions | Async |
| **Future** | Qwen 72B (self-host) | ~$0.001-0.04 | — | Volume >30M tokens/day | Variable |

### Decision Tree

```
START → Is task classification/extraction/auto-fill?
  ├── YES → T1 (Flash-Lite) → Test accuracy
  │         ├── Accuracy ≥ target → DONE ✅
  │         └── Accuracy < target → Upgrade to T2 or T3
  │
  └── NO → Does task require reasoning/complex NLP?
            ├── YES → T2 (Gemini Pro) or T3 (DeepSeek V3)
            │         └── Cost-sensitive? → T3 (DeepSeek ~14x cheaper output)
            │
            └── NO → Does task involve images/documents?
                      ├── YES → T4 (Vision)
                      └── NO → Does task involve voice?
                                ├── YES → T5 (STT)
                                └── NO → Custom ML/T6
```

### Cost-Per-Query Calculator

```
Monthly Cost = (daily_queries × 30) × (avg_input_tokens × input_price + avg_output_tokens × output_price) / 1,000,000

Example: Chat-to-Order
- Daily queries: 500
- Avg input: 800 tokens (system prompt + order text)
- Avg output: 400 tokens (structured JSON)
- Model: T2 Gemini Pro
- Monthly: (500 × 30) × (800 × $2 + 400 × $12) / 1M
         = 15,000 × ($1,600 + $4,800) / 1M
         = 15,000 × $6,400 / 1,000,000
         = $96/month

With T1 Flash-Lite:
- Monthly: 15,000 × (800 × $0.10 + 400 × $0.40) / 1M = $3.60/month
```

---

## Token Optimization Strategies

### Strategy 1: Prompt Compression
- Remove redundant instructions
- Use shorthand where meaning preserved
- Minimize system prompt size (it's sent with every query)
- **Target**: System prompt < 500 tokens for T1, < 1500 tokens for T2/T3

### Strategy 2: Context Pruning
- Never send full documents — extract relevant sections only
- For RAG: limit to top-k chunks (k=3-5 optimal for most tasks)
- Summarize long context before sending to LLM
- **Rule**: If context > 2000 tokens, must justify why

### Strategy 3: Output Constraints
- Always set `max_tokens` in API call
- Include output length guidance in prompt
- Request structured output (JSON) instead of prose
- **Table**: Output budget by task type

| Task Type | Recommended max_tokens |
|-----------|----------------------|
| Classification | 50 |
| Extraction (structured) | 200 |
| Summarization | 300 |
| Chat response | 500 |
| Complex analysis | 1000 |
| Code generation | 2000 |

### Strategy 4: Semantic Caching

```
Query → Embedding → Similar in cache? 
  ├── YES (similarity > 0.95) → Return cached response
  └── NO → LLM call → Cache response with embedding

Cache Configuration:
- Store: Redis + embedding vector
- TTL: 1 hour default, configurable per feature
- Similarity threshold: 0.95 (tune per use case)
- Cache key: tenant_id + feature + query_embedding
- Estimated hit rate: 30-60% for product suggestions, 10-20% for chat
```

### Strategy 5: Batch Processing
- Group non-urgent requests (analytics, reports)
- Process in batch during off-peak hours
- Use DeepSeek or batch APIs for cost savings
- **Rule**: Any feature tolerating >5s latency → evaluate batch

### Strategy 6: Model Cascade
```
Try T1 first → Check confidence score
  ├── Confidence ≥ 0.85 → Return T1 result
  └── Confidence < 0.85 → Retry with T2
                           └── Cost: T1 + T2 (still cheaper than always T2)
                           
Expected savings: 40-70% if 60%+ queries handled by T1
```

---

## Cost Monitoring Dashboard

### Metrics to Track

| Metric | Formula | Alert Threshold |
|--------|---------|-----------------|
| Cost per query | total_cost / total_queries | > $0.05 per query |
| Cost per tenant per month | sum(tenant_queries × cost_per_query) | > $50/tenant |
| Cache hit rate | cached_responses / total_queries | < 20% |
| Token waste ratio | actual_output_tokens / max_tokens | < 30% (means max too high) |
| Model escalation rate | t2_queries / t1_queries | > 40% (check T1 prompts) |
| Daily cost run rate | today_cost × 30 | > monthly budget × 1.2 |

### Alert Rules
```
🔴 CRITICAL: Daily cost > $100 (run rate $3K/month)
🟡 WARNING: Any single query cost > $0.50
🟡 WARNING: Cache hit rate drops below 15%
🟡 WARNING: Model escalation rate exceeds 50%
🔵 INFO: New model tier usage detected
```

---

## Cost Audit Checklist

When running `/songoku-cost-audit`, check each feature:

```
□ 1. Model tier assignment documented and justified
□ 2. Token budget (input + output) estimated
□ 3. Monthly cost projection calculated
□ 4. Caching strategy defined (if applicable)
□ 5. max_tokens set in API call
□ 6. Rate limiting configured per tenant
□ 7. Batch processing considered for non-real-time features
□ 8. Model cascade evaluated (can cheaper tier work?)
□ 9. Context pruning applied (no unnecessary data in prompt)
□ 10. Cost monitoring/alerting configured
```

### Feature Cost Template

```markdown
## AI Feature Cost Model: {Feature Name}

| Parameter | Value |
|-----------|-------|
| Model Tier | T1/T2/T3/T4/T5 |
| Avg Input Tokens | {number} |
| Avg Output Tokens | {number} |
| max_tokens Setting | {number} |
| Est. Daily Queries | {number} |
| Est. Monthly Cost | ${number} |
| Caching | Yes/No (estimated hit rate: xx%) |
| Batch Eligible | Yes/No |
| Latency Requirement | <{X}s |
| Accuracy Target | >{X}% |
| Cascade Strategy | {description or N/A} |
```

---

## Anti-Patterns (Common Cost Wastes)

| Anti-Pattern | Impact | Fix |
|-------------|--------|-----|
| Using T2 for simple extraction | 20x cost increase | Downgrade to T1, test accuracy |
| No max_tokens set | Output consumes budget | Set appropriate limit |
| Sending full document as context | 5-10x token waste | Extract relevant chunks |
| No caching for repeated patterns | 30-60% wasted cost | Implement semantic cache |
| Logging full prompts | Storage costs + PII risk | Log metadata only, mask PII |
| System prompt > 2000 tokens | High per-query baseline | Compress, use retrieval |
| No cost alerting | Surprise bills | Configure alerts |
| Output format not specified | Verbose LLM responses | Request JSON/structured |
