---
description: 'Use when a bug is reported to perform root cause analysis, impact analysis, and regression testing before fixing.'
---

# /fix-bug — Structured Bug Resolution Process (SBRP) v2.0

> **Quy tắc vàng:** Fix đúng 1 lần > Fix nhanh 3 lần.
> Workflow này tích hợp Edge Case Guardian, Data Integrity Guardian, API Contract Guardian, **ai-engineer-agent AI Guardian** (cho bugs liên quan AI/LLM), và **GitNexus Code Intelligence** (cho dependency/impact analysis).
> **v2.1:** Tiered approach, bug-reports cross-reference, recurrence classification, story spec decision flow, CGC-powered RCA & Impact.
> ⚠️ **CRITICAL — TERMINAL SAFETY:** Trước khi chạy bất kỳ command nào trong terminal để debug, BẮT BUỘC load `@{project-root}/.agent/fragments/terminal-safety.md` và tuân thủ 5 rules phòng vệ.
> **GRAPH BACKEND POLICY:** Before graph-backed RCA, impact, FeatureGraph, or refresh steps, load `.agent/fragments/graph-backend-selection-policy.md`. If CodebaseGraph or FeatureGraph is unavailable, stale, partial, or unsupported, log the affected surface and treat graph evidence as unavailable, not proof of no dependency/no impact.

---

**[CRITICAL COMPLIANCE REQUIREMENT]**
To resolve bugs systematically without causing regressions, you MUST read and rigidly obey the 8-Phase SBRP rules defined in: [Bug Resolution Protocol](file://{project-root}/.agent/workflows/references/fix-bug-protocol.md).
Do NOT attempt to fix the bug or write code until you have executed Phase 1 to Phase 4 of the protocol!
