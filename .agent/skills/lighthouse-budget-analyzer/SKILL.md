---
name: "lighthouse-budget-analyzer"
description: "Analyzes Lighthouse CI JSON reports and enforces defined Core Web Vitals thresholds."
inputs: ["lighthouse-report.json", "budget.json"]
outputs: ["analysis-report.md", "pass/fail boolean"]
mcp_tools_required: []
subagent_triggers: []
---

# Lighthouse Budget Analyzer

## When to Use This Skill
Use this skill when processing Lighthouse CI JSON outputs, analyzing Core Web Vitals (LCP, INP, CLS), enforcing performance budgets, or determining if a recent frontend change violates performance thresholds. DO NOT put a workflow summary here.

## Core Rules
1. **JSON Only:** You MUST parse the raw JSON data from Lighthouse, rather than relying on human-readable HTML reports.
2. **Strict Thresholds:** Do NOT allow regressions in LCP or INP beyond 5% of the baseline budget. If the metrics exceed the budget, you MUST fail the gate.
3. **Actionable Output:** Your analysis MUST highlight the specific DOM elements or scripts causing the largest performance impact.

## Red Flags — STOP and Reconsider
- If you find yourself thinking "A 10% LCP regression is fine because it's a dev environment," STOP. Budgets must be strictly enforced regardless of the environment unless explicitly overridden.
- If you find yourself thinking "I'll just check the score out of 100," STOP. Lighthouse scores are volatile; you MUST use the raw metric values in milliseconds/seconds.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "The CI runner was probably slow, so I'll ignore this INP failure." | "Hardware variance is real, but budgets account for this. You MUST enforce the failure and ask for a re-run if variance is suspected." |

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-LBA-01 | JSON Parsing | A (Deterministic) | Tool failure if JSON is invalid | JSON parse output |
| GATE-LBA-02 | Budget Comparison | A (Deterministic) | Mathematical comparison (e.g. LCP < 2500ms) | Output numbers |
| GATE-LBA-03 | Cause Identification | B (Trust-Based) | Agent identifies slow nodes | Tool reasoning output |
