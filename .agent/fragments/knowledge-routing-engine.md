---
name: knowledge-routing-engine
description: Decision logic for routing knowledge to the correct storage system (Graph vs Notebook vs Both vs Local)
---

# Knowledge Routing Engine

> **Loaded by**: All agents before any research request, knowledge capture, or data routing decision.
> **Purpose**: Prevents incorrect storage routing — ensures each knowledge artifact goes to the optimal destination.

## Decision Table

| Scenario | Primary Store | Secondary Store | Rationale |
|----------|--------------|-----------------|-----------|
| **Code structure** (imports, call graphs) | CodeGraph | — | Graph excels at structural queries |
| **Feature impact** (cross-feature deps) | FeatureGraph | — | Graph excels at impact analysis |
| **Agent instincts** (learned patterns) | MemoryGraph (instincts.jsonl) | — | Local, fast, session-aware |
| **External research** (papers, docs, URLs) | NotebookLM | — | RAG + multi-source grounding |
| **Architecture decisions** (ADRs, patterns) | NotebookLM (PC-2, RL-4) | FeatureGraph | Both benefit: NLM for deep context, FG for impact |
| **Domain knowledge** (regulations, standards) | NotebookLM (RL-2) | — | Large corpus, needs grounding |
| **Market/Business intelligence** | NotebookLM (RL-1a, RL-1b) | — | External data, needs synthesis |
| **Bug patterns** (recurring fixes) | MemoryGraph | NotebookLM (ephemeral → promote) | Start local, promote if pattern ≥ 2 |
| **Review findings** (code quality patterns) | NotebookLM (OP-2) | MemoryGraph | Both: NLM for cross-project, MG for session |
| **Party-Mode decisions** | NotebookLM (OP-3) | — | Decision log needs grounded citations |
| **AI Engineering Patterns & Scratch Code** | ai-engineering-knowledge-consultant | NotebookLM (PC-2, RL-4) | Dual-Oracle: 523 scratch lessons grounding + NLM synthesis |
| **Simple file content** (<1.5M tokens total) | Local (view_file) | — | No overhead needed |
| **Sprint tracking** | Local (sprint-status.yaml) | — | Structured YAML, not prose |

## UKP Enforcement Rule (Knowledge-First)
> **MANDATORY**: For any research task, agents MUST use the Unified Knowledge Pipeline (UKP) first.
> 1. Use `/nlm-check` (Quick Check) for initial lookups.
> 2. Use `ae-notebook-orchestrator` for deep research.
> 3. NEVER fallback to generic `search_web` unless UKP explicitly returns a "Gap Detected" receipt.

## Break-Even Rule

> **Use NotebookLM** only when:
> 1. Total source material > **1.5M tokens** (exceeds local context), OR
> 2. Need **multi-modal** analysis (PDF + images + text), OR
> 3. Need **cross-project** knowledge (inherited General notebooks), OR
> 4. Need **grounded citations** (verifiable sources, not hallucinations), OR
> 5. Topic requires **multi-dimensional synthesis** (≥ 4 research dimensions)
>
> **Use Local** when:
> 1. Source material < 1.5M tokens AND single-dimension query
> 2. Simple file reads or code structure analysis
> 3. Sprint/status tracking (structured data)

## Graph vs Notebook Decision

```
IF query.type == "code_structure" → CodeGraph
IF query.type == "feature_impact" → FeatureGraph  
IF query.type == "learned_pattern" → MemoryGraph
IF query.source_count > 1.5M_tokens → NotebookLM
IF query.needs_grounding → NotebookLM
IF query.is_cross_project → NotebookLM
IF query.type == "architecture" → NotebookLM + FeatureGraph (HYBRID)
ELSE → Local (view_file, grep_search)
```

## Agent Loading Instructions

1. When receiving a research request or knowledge capture task, **FIRST** consult this fragment.
2. Determine the correct routing destination using the Decision Table above.
3. If routing to NotebookLM:
   - **MUST** first load `notebook-registry-manager` skill to lookup target notebook
   - **MUST** respect the Backbone Rule (cross-query with PC-1/PC-2/PC-3)
   - **MUST** pass through `notebook-quality-gate` for Push requests
4. If routing to Graph:
   - Use appropriate graph query commands
5. If HYBRID routing:
   - Route to BOTH destinations
   - Reconcile any conflicts between Graph and Notebook responses
