---
name: absorb-stage-3-evaluation
description: Stage 3 of the Repo Absorption Protocol (Evaluation & Debate). Covers Socratic Debate, Classification Funnel, and Human Approval.
---

# 🌀 `/absorb-stage-3-evaluation` (Stage 3: Evaluation & Debate)

## 📌 OVERVIEW
This stage evaluates the DNA extracted in Stage 2 against I-Wish's existing architecture. It employs adversarial AI debate (Party-Mode) to stress-test integration decisions, applies the Classification Funnel, and halts for mandatory Human approval.

---

## 🛠️ THE PIPELINE

### Phase 5: COMPARE & CONTRAST ⚖️ (Agent: architect-agent)
- **Action:** Gap Analysis, Classification Funnel, and Comparison Matrix.
- **Pre-requisites:**
  - Invoke `/unknowns` to micro-scan for blind spots.
  - Load the **Community Audit Report** from `03-community/community-report.md`.
  - **[Fix P2 - State Recovery]:** Verify and save `${IWISH_HOME}/absorbed-repos/{repo-name}/state.json` with `{"stage": 3, "status": "evaluating"}` to allow resumption upon failure.
- **Steps:**
  1. **Synthesize Operational DNA:** Deeply analyze Section 10 of Repo DNA to extract Orchestration Model, Prompt Loading, and State Management.
  2. **Adversarial Stress-Test:** Identify at least 3 architectural risks or "bloat" patterns that should NOT be absorbed. Document at least 3 Pushback Questions.
  3. **Deep Dive Debate (Party-Mode):** Invoke `/party-mode` Socratic Debate evaluating the core modules against I-Wish. Apply the Anti-Sycophancy Preamble.
  4. **I-Wish Classification Funnel Audit:** Group features and classify them across the Shape Axis and Role Axis based on Scope, Execution Context, and Reusability.
  5. **Safety Isolation Check:** Automatically classify any installer/config scripts targeting external directories as `SKIP`.
  6. **Generate Comparison Report (`{repo-name}-comparison.md`):** MUST contain:
     - **Bảng So sánh & Phễu Phân loại (7 Columns):** Nhóm Tính năng, Phân loại (Shape/Role), Ưu điểm, Nhược điểm, Khoảng cách (Gap), Phương án (TIER_1 / TIER_2 / TIER_3 / SKIP), Tiêu chí Phễu.
     - **Phân tích Cơ chế Vận hành.**
     - **Granular Zoom-in Audit Table.**
- **Gate:** MUST physically generate the debate transcript file at `${IWISH_HOME}/gap-analysis/{repo-name}-debate-transcript.md`. The `comparison.md` must link to it. MUST run script `python3 .agent/scripts/run-unknowns-scanner.py --phase absorb-eval --context comparison.md`.

### Phase 5.5: ADOPTION REVIEW PACK 🧭 (Agent: orch-agent / capability-agent)
- **Action:** Build a human-readable Adoption Review Pack before integration.
- **Steps:**
  1. Produce both `.md` and `.html` integration guides at `${project-root}/docs/open-modules/{repo-name}-integration-guide`.
  2. The pack MUST include: shape + role, constraints, edge cases, Orch routing hints, and explicit review questions.

---

## 🛑 HUMAN CHECKPOINT 1: THE UNDERSTANDING GATE
Present the `gap-analysis.md`, the 7-column `comparison.md`, and the `Adoption Review Pack` to the User.

- **CRITICAL HALT:** You MUST explicitly end your turn and wait for the user to type `[Approve All]`, `[Edit specific]`, `[Reject All]`, or `[Abort]`. 
- **DO NOT** auto-generate or proceed to Stage 4 until this exact string is received from the user.
- Track Selection: User MUST confirm if the absorption targets `SYSTEM_SKILL` or `USER_SPACE`.

## 🚫 ZERO-TRUST PHYSICAL GATE
To prove completion of Stage 3 (post-approval) and transition to Stage 4, you MUST run:
```bash
python3 .agent/scripts/pipeline-integrity-runner.py --target "party-mode" --type workflow --phase post-debate
```
**If the script returns an error, you MUST NOT proceed to Stage 4.**

> **Next Step:** If the gate passes AND Human approves, invoke `/absorb-stage-4-integration` passing the `{repo-name}` and the approved Tier mapping.
