---
name: "offline-predictive-router"
description: "Use when you need to route a query or predict its complexity without invoking an LLM. Do not use if the query requires deep semantic understanding."
inputs: ["query"]
outputs: ["complexity_score", "route"]
mcp_tools_required: []
subagent_triggers: []
---

# Offline Predictive Router

## When to Use This Skill
- When triaging user queries before sending them to the LLM Gateway.
- When determining whether a query can be handled by a fast-path (e.g., regex, edge worker) or requires an SLM/LLM.
- To reduce latency and costs by avoiding unnecessary LLM calls for simple queries.

## Core Rules
1. **Never use an LLM** to evaluate complexity in this step. This skill relies on deterministic heuristics.
2. Default to a higher complexity (LLM route) if the score is ambiguous or close to a threshold.
3. Keep the heuristics lightweight (token count, basic regex) to ensure sub-10ms execution.

## Execution Guide (Tier 1)
To execute this skill, you MUST run the included Python runner:
`python3 ${IWISH_HOME}/generated-skills/offline-predictive-router/scripts/runner.py --query "<target_query>"`

## Red Flags — STOP and Reconsider
- 🚩 If you are trying to use an API (e.g., OpenAI) to determine complexity, STOP. That defeats the purpose of an offline predictive router.
- 🚩 If you are building a complex ML model for this, STOP. Keep it simple and deterministic.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just ask Gemini to rate the complexity." | The router must be offline and heuristic-based to save cost/latency. |

## Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| OPR-01 | Heuristic Complexity Prediction | Category A | Python runner `runner.py` with deterministic logic | Script JSON output |

*Enforcement Maturity:* 100% (1 Category A / 1 Total)
