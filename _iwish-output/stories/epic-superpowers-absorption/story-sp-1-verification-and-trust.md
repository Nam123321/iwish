# Story SP-1: Verification & Trust — Hardening Pivot Guardian & Code Review

## Story ID: SP-1
## Epic: SP-ABSORB (Superpowers Absorption)
## Status: Done
## Priority: P0 (Critical — Foundation for all other stories)
## Estimated Effort: Medium

---

## User Story

> **As a** I-Wish Agent orchestrator,
> **I want** Pivot Guardian to reject any task-completion claim without empirical evidence, and `/code-review` to distrust implementer self-reports,
> **So that** hallucinated "code looks good" responses are eliminated and review quality matches production-grade standards.

---

## Background & Rationale

**Source:** Superpowers `verification-before-completion` + `spec-reviewer` patterns.

LLM agents have a documented tendency toward "performative completion" — claiming work is done without actually verifying. The Superpowers framework addresses this with two complementary constraints:

1. **Verification Before Completion:** Agent MUST cite terminal output, build logs, or test results before marking any task as done.
2. **Don't Trust The Report:** Code reviewers MUST independently verify via Git Diff rather than reading the implementer's summary.

I-Wish's current Pivot Guardian enforces the PIV loop but doesn't explicitly require *empirical evidence*. The `/code-review` workflow is adversarial via Anti-Sycophancy but doesn't contain a "distrust the report" directive.

---

## Acceptance Criteria

### AC-1: Pivot Guardian — Context-Aware Evidence Gate
- [x] Pivot Guardian SKILL.md contains a new section: "Empirical Evidence Requirement".
- [x] Evidence requirements MUST be dynamically based on Task Classification:
  - **Non-code/Docs/Planning:** Require `Evidence: N/A (Documentation/Planning)` or markdown diff. Do not block asking for terminal logs.
  - **Backend (BE):** Require test results (pass/fail) or terminal log (curl, API response, build success).
  - **Frontend (FE):** Require a strict 3-layer proof:
    1. **Compile Evidence:** Terminal log showing build success with no console errors.
    2. **Render Evidence:** Output from `chrome-devtools-mcp` (screenshot/DOM snapshot) proving the UI actually rendered.
    3. **Compliance Evidence:** Explicit comparison against the UI Spec & Stitch Design System (invoking `stitch-design-taste`).
- [x] If required evidence is missing, Pivot Guardian MUST respond: *"Evidence chưa đủ. Vui lòng cung cấp đúng định dạng Evidence Block theo loại Task."*
- [x] Red Flags list added: "Đã fix xong", "Code looks good", "Tôi đã kiểm tra bằng tay".

### AC-2: Code Review — "Don't Trust The Report" Directive
- [x] `/code-review` workflow contains explicit directive: *"KHÔNG đọc Summary của implementer. Đối chiếu trực tiếp Git Diff."*
- [x] Reviewer MUST actively search for:
  - Code "extra" (over-engineering) beyond spec
  - Missing requirements from the story/spec
  - Undocumented side effects
- [x] Reviewer output format includes: `Trust Score: Low/Medium/High` based on diff-vs-spec alignment.

### AC-3: Structured Evidence Block Format
- [x] Before final DONE status, agent MUST output a structured evidence block.
- [x] The Evidence Block template must accommodate the BE/FE/Docs split:
  ```markdown
  ## ✅ Evidence Block (Type: [FE/BE/Docs])
  - **Compile/Test Logs:** [Terminal log snippet or N/A]
  - **Visual/Render Proof:** [chrome-devtools-mcp output / snapshot or N/A]
  - **Spec/Design Compliance:** [Validation against UI Spec/Stitch or N/A]
  - **Scope Drift:** [None detected / details]
  ```

---

## Technical Tasks

1. **Edit** `.agent/skills/pivot-guardian/SKILL.md`
   - Add "Empirical Evidence Requirement" section after existing PIV loop.
   - Detail the Context-Aware Evidence Gate logic (FE vs BE vs Docs).
   - Add Red Flags table for completion-claim rationalizations.
   - Add the new context-aware Evidence Block template.

2. **Edit** `.agent/workflows/iwish-bmm-code-review.md`
   - Add "Don't Trust The Report" directive at top of review checklist.
   - Add "Over-Engineering Scan" step: actively search for code beyond spec.
   - Add Trust Score output format.

3. **Validate Pivot Guardian**
   - Run a mock FE task to ensure Pivot Guardian demands `chrome-devtools-mcp` output and Stitch compliance.
   - Run a mock Docs task to ensure it passes without terminal logs.

---

## AC-Task Traceability Matrix
- **AC-1** -> Maps to **Task 1** (Pivot Guardian SKILL updates).
- **AC-2** -> Maps to **Task 2** (Code Review workflow updates).
- **AC-3** -> Maps to **Task 1** (Evidence Block template in Pivot Guardian).

---

## Dependencies
- Pivot Guardian: `.agent/skills/pivot-guardian/SKILL.md`
- Code Review workflow: `.agent/workflows/iwish-bmm-code-review.md`

## Notes
- This story is the FOUNDATION. Stories SP-2 through SP-5 build on the trust infrastructure established here.
- The use of `chrome-devtools-mcp` for FE verification mirrors the robustness of the `fix-bug` workflow and guarantees visual fidelity.

---

## 🛡️ QA Simulator Guardian Audit
**Fat-Guardian 7-Row Hybrid Scorecard:**
| Axis | Score | Justification |
|---|---|---|
| **State/Data Integrity** | 10/10 | Pure prompt/workflow logic changes; no database impact. |
| **Concurrency/Race** | 10/10 | N/A for static prompt files. |
| **Permissions/Auth** | 10/10 | N/A. |
| **Edge Cases** | 9/10 | Context-aware gate explicitly prevents the infinite-block edge case for non-code tasks. |
| **Idempotency** | 10/10 | Workflow instructions can be run repeatedly without side effects. |
| **Performance** | 9/10 | Evidence Block is kept lightweight; requiring devtools only for FE tasks optimizes token usage. |
| **UX Empathy** | 9.5/10 | Protects the end-user from "lazy" AI hallucinations while ensuring the AI has clear escape hatches for non-code work. |
| **TOTAL AVERAGE** | **9.64 / 10** | **PASS** (Requires >= 8.5) |
