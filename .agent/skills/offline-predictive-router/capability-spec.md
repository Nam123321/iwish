# Capability Spec: offline-predictive-router

## Type: SKILL
## Status: Draft
## Created: 2026-08-07

### Problem Statement
Provides an offline predictive routing mechanism to predict query complexity without invoking LLMs. This is crucial for reducing token costs and API latency for simple, deterministic, or highly structured queries that can be handled by fast-path tools, edge workers, or basic regex without relying on an expensive LLM router.

### Knowledge Sources
- Source 1: User Request — "Provides an offline predictive routing mechanism to predict query complexity without invoking LLMs."
- Source 2: Architecture Spec — Hybrid 3-Layer Infrastructure requires edge routing and fast API triage without LLMs where possible.

### Core Concepts
1. **Heuristic Assessment**: Use keyword matching, query length, and pattern recognition to score query complexity.
2. **Offline NLP**: Utilize lightweight local tokenizers or basic heuristics without making network calls.
3. **Threshold Routing**: Assign a complexity score (e.g., 0-100) and define thresholds for routing to Edge (Fast Path), SLM (Medium), or LLM (Complex).

### Anti-Patterns
- ❌ Invoking an external API (like OpenAI) to classify the query.
- ❌ Using models that require large GPU resources (e.g., 7B parameter models) for this initial triage.

### Best Practices  
- ✅ Fail-safe routing: If the complexity is ambiguous, default to the more capable model (LLM).
- ✅ Caching: Cache the complexity score based on query hash to avoid re-computation.

### Deliverables
- [ ] File 1: `.agent/skills/offline-predictive-router/SKILL.md`
- [ ] File 2: `.agent/skills/offline-predictive-router/scripts/runner.py`
