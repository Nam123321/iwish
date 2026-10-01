---
steps:
  - id: step-fb-01-triage
    description: "Triage and Context (Phases 1-2)"
  - id: step-fb-02-analysis
    description: "Root Cause and Impact Analysis (Phases 3-4)"
  - id: step-fb-03-fix
    description: "Fix & Uỷ quyền Code Review (Phases 5-6)"
  - id: step-fb-04-document
    description: "Uỷ quyền Manual Test, Ghi nhận & Đồng bộ (Phases 7-8)"

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

> [!IMPORTANT]
> **WORKSPACE HYGIENE CLEANUP (MANDATORY GATE):**
> Before marking the bug as resolved or ending the workflow, you MUST:
> 1. Delete or move all scratch scripts (e.g. `test*.js`, `fix*.py`, `*.log`) created in the workspace root during this session.
> 2. Ensure NO temporary files are saved in structural folders like `_iwish-output/3. Development`. Use `_iwish-output/adhoc-workspace/scratch/` for all temporary debug files.
> 3. Verify cleanup by running: `python3 _iwish-output/adhoc-workspace/scratch/clean_workspace.py` (if available) or manually deleting the files.

> [!IMPORTANT]
> **EVIDENTIAL LEARNING GATE:**
> After fixing the bug (Phase 8), you MUST capture the learned lesson for the organization by running:
> `python3 .agent/scripts/capture-lesson.py --phase BUG_FIX --severity MEDIUM --domain <DOMAIN> --root-cause <TYPE> --rule "<MANDATORY_RULE>" --context "<CONTEXT>"`


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered at Step 2 (Analysis) when pattern is unfamiliar.

### PUSH (conditional): Ephemeral notebook for bug research

1. If bug pattern is unfamiliar (no match in instincts.jsonl or CodeGraph):
   a. Load `notebook-lifecycle-manager` → Create ephemeral notebook `Ephemeral: {bug_description}`
   b. Load `notebook-request-engineer` → Push bug context (Template: Situational Research)
   c. Load `notebook-retrieval-engine` → Pull solutions
2. After fix: Load `knowledge-collector` → Check auto-promote (pattern ≥ 2?)
3. If not promoted: Delete ephemeral notebook
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
