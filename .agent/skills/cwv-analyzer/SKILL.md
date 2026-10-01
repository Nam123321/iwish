---
name: "cwv-analyzer"
description: "Use when you need to analyze Core Web Vitals (CWV) from Lighthouse or Chrome UX Report (CrUX) data, identify performance regressions, or trend metrics across deployments."
inputs:
  - "Lighthouse JSON/HTML reports"
  - "Chrome UX Report (CrUX) data"
  - "Target URLs or deployment metrics"
outputs:
  - "CWV performance trend analysis"
  - "Regression identification"
mcp_tools_required: ["chrome-devtools-mcp"]
subagent_triggers: []
---

# cwv-analyzer

## When to Use This Skill
- Use when analyzing Core Web Vitals (LCP, CLS, INP, FID, TTFB).
- Use when you need to compare performance metrics across different deployments or timeframes.
- Use when parsing raw Lighthouse JSON or CrUX API responses to extract CWV trends.

## Core Rules
1. **Metric Focus:** Always extract and evaluate the primary CWVs (LCP, CLS, INP) before secondary metrics (FCP, TTFB).
2. **Threshold Adherence:** Evaluate metrics against official Google CWV thresholds (e.g., LCP < 2.5s is Good, > 4.0s is Poor).
3. **Data Source Distinction:** Clearly distinguish between Lab data (Lighthouse) and Field data (CrUX) in your analysis.

## Red Flags — STOP and Reconsider
- ❌ Do not evaluate older, deprecated metrics (like FID) without also evaluating the modern equivalent (INP) if available.
- ❌ Do not compare Lab data directly to Field data as a 1:1 match; they measure different user contexts.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just summarize the Lighthouse score." | You MUST extract the specific CWV metrics (LCP, CLS, INP) in ms/seconds and compare to thresholds. |

## Anti-Patterns
- ❌ NEVER blend Lighthouse (lab) scores and CrUX (field) data without labeling the source.
- ❌ NEVER report metrics without their units (ms, s) and their threshold classification (Good, Needs Improvement, Poor).

## Best Practices
- ✅ ALWAYS present CWV data in a structured table for cross-deployment comparison.
- ✅ ALWAYS highlight regressions (e.g., LCP increased by 500ms).

## Version Notes
- 1.0.0: Initial implementation for CWV trending.
