---
name: "Context Budget Validator"
description: "Validates AI context window usage — detects over-budget prompts, redundant context, token waste, and missing fallbacks."
---

# Context Budget Validator SKILL

## Purpose
Audit AI prompt assembly to ensure:
1. Total prompt stays within model context window limits
2. Each context source has a defined token ceiling
3. No redundant or duplicate context is injected
4. Cost per query stays within business budget
5. Graceful fallback exists when context exceeds limits

## When to Use
- After running `/create-ai-context-pipeline` workflow (validate the output)
- During `/code-review` when PromptAssemblyService is modified
- During `/songoku-cost-audit` for cost optimization
- Before release: verify all AI features stay within budget

## Validation Checks

### CB1: Total Prompt Within Model Limits
**Question:** Does the assembled prompt stay under 80% of the model's context window?

**Model limits:**
| Model | Context Window | 80% Budget |
|-------|---------------|------------|
| GPT-4o | 128K tokens | 102K tokens |
| GPT-4o-mini | 128K tokens | 102K tokens |
| Gemini 2.0 Flash | 1M tokens | 800K tokens |
| Gemini 2.0 Pro | 2M tokens | 1.6M tokens |

**How to audit:**
1. Calculate max possible prompt size (all sources at maximum)
2. Compare against model budget
3. Flag if worst-case exceeds 80%

**Verdict:**
- ✅ PASS: Worst-case prompt < 80% model limit
- ⚠️ WARN: Worst-case 80-95% (risk of truncation)
- ❌ FAIL: Worst-case exceeds model limit

### CB2: Per-Source Token Ceilings
**Question:** Does each context source have a defined maximum token count?

**Required ceilings:**
| Source | Must Have Ceiling | Typical Range |
|--------|------------------|---------------|
| System prompt | ✅ | 300-1000 tokens |
| RAG results | ✅ (Top-K limit) | 500-3000 tokens |
| Redis snapshots | ✅ (JSON size limit) | 200-800 tokens |
| Chat history | ✅ (sliding window) | 500-4000 tokens |
| Tool descriptions | ✅ | 200-1000 tokens |
| User query | Soft limit | 100-500 tokens |

**Verdict:**
- ✅ PASS: All sources have defined ceilings in code/config
- ⚠️ WARN: 1-2 sources missing ceiling but unlikely to exceed
- ❌ FAIL: Critical source (RAG, chat history) has no ceiling

### CB3: Redundant Context Detection
**Question:** Is the same information injected multiple times?

**Common redundancies to flag:**
1. Product info in BOTH system prompt AND RAG results
2. Customer name in BOTH profile snapshot AND chat history
3. CTKM rules repeated across multiple context sources
4. Tool descriptions duplicated in system prompt

**Verdict:**
- ✅ PASS: No redundant context detected
- ⚠️ WARN: Minor overlap (acceptable for context reinforcement)
- ❌ FAIL: Significant duplication wasting >500 tokens

### CB4: Cost Per Query Within Budget
**Question:** Does each AI interaction stay within the cost budget?

**Calculation:**
```
Input tokens × input_price + Output tokens × output_price = cost_per_query

Budget thresholds:
  Chat interaction: < $0.05 per turn
  Content generation: < $0.20 per generation
  Batch analysis: < $1.00 per batch run
```

**Verdict:**
- ✅ PASS: Cost per query within budget
- ⚠️ WARN: Near budget threshold (75-100%)
- ❌ FAIL: Exceeds budget, needs optimization (reduce Top-K, compress snapshots, use cheaper model)

### CB5: Fallback When Context Exceeds Limit
**Question:** What happens when context is too large?

**Required fallback chain:**
1. Truncate oldest chat history first (least impactful)
2. Reduce RAG Top-K (from 5 → 3 → 1)
3. Compress Redis snapshots (summary instead of full)
4. Switch to cheaper/larger model (GPT-4o → Gemini Flash)
5. Return graceful error with partial response

**Verdict:**
- ✅ PASS: Documented fallback chain exists in code
- ⚠️ WARN: Fallback exists but untested
- ❌ FAIL: No fallback — prompt just fails silently

## Output Format

```markdown
# Context Budget Validator Report
**AI Feature:** [feature name]
**Model:** [model used]
**Date:** [date]

## Summary
| Check | Verdict | Details |
|-------|---------|---------|
| CB1: Total Budget | ✅/⚠️/❌ | [tokens used / budget] |
| CB2: Per-Source Ceilings | ✅/⚠️/❌ | [sources with/without ceilings] |
| CB3: Redundancy | ✅/⚠️/❌ | [wasted tokens estimate] |
| CB4: Cost Budget | ✅/⚠️/❌ | [$X.XX per query vs $Y.YY budget] |
| CB5: Fallback | ✅/⚠️/❌ | [fallback chain status] |

## Token Breakdown
| Source | Max Tokens | % of Budget |
|--------|-----------|-------------|
| System prompt | X | Y% |
| RAG results | X | Y% |
...

## Cost Estimate
- Per query: $X.XX
- Per 1000 queries: $X.XX
- Monthly estimate (at N queries/day): $X.XX
```
