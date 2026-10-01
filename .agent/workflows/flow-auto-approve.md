---
name: 'flow-auto-approve'
description: 'Automated Master Orchestrator for the Decomposed SDLC pipeline in Auto-Approve mode.'
---

# /flow-auto-approve

This is the Auto-Approve wrapper for the Decomposed SDLC pipeline.

## Workflow Guidelines

**CRITICAL INSTRUCTION:** The monolithic pipeline has been decomposed into 6 physical sub-stages to isolate Human Gates.

When `/flow-auto-approve` is invoked, you MUST execute the 6 stages sequentially, automatically triggering the next stage once the previous stage's Structured Handoff Evidence (`evidence.json`) is generated.

### Auto-Approve Specific Overrides:

1. **Batch Reconciliation & Finally Block**: When executing a batch of stories, run `bash .agent/scripts/reconcile-all.sh` ONLY ONCE at the end of the batch.
2. **Exit Code Auto-Remediation**:
   - Exit Code `1`: HALT and yield.
   - Exit Code `2`: Remediate via `/make-story`.
   - Exit Code `3`: Remediate via `/make-story` then `/make-ui-spec`.
   *(Max 3 auto-remediations per story)*
3. **Review Isolation (Zero-Trust):** The Orchestrator MUST block the `dev-agent` from writing to `_iwish-output/reviews/`. Review JSONs must strictly come from the Review Subagents and include verifiable Asymmetric Cryptographic Signatures.

### Non-Overridable Gates:
- **Design Gate (Stage 2B)**: MUST STOP for explicit User Approval of UI design (UI Stories only).
- **Implementation Plan Dual-Condition Gate (Stage 3A)**: MUST generate `{story_dir}/impl-plan.md`, execute `/plan-proven-safe` (4 pillars) to achieve `VERDICT: PROVEN_SAFE`, and **STOP for explicit User Approval**. Human approval CANNOT be skipped even in `--auto-approve`. Chữ ký điện tử chỉ được sinh qua `sign_human_gate` sau khi thỏa mãn cả 2 điều kiện (Plan Proven Safe + Human Approval).
- **Engine Selection Gate (Stage 3.5 - Zero-Trust Category A)**:
  ⚠️ BẮT BUỘC DỪNG (HARD STOP), TUYỆT ĐỐI CẤM BYPASS TRONG `--auto-approve`.
  - Orchestrator MUST invoke `ask_question` presenting the 4 options: `/pi-code-agent`, `/omp-orch-skill`, `/code`, `/tournament`.
  - Record the user choice to `_iwish-output/adhoc-workspace/scratch/engine-selection-{story_id}.json` with `{"gate": "engine-selection-gate", "story_id": "{story_id}", "selected_engine": "..."}`.
  - Sign the evidence via `watchmen-mcp:sign_human_gate` to generate `engine-selection-{story_id}.json.sig`.
  - The downstream dispatcher will refuse execution if `--engine-evidence` is missing or mismatched.
- **Code Execution Protocol (Stage 3B)**: MUST compile `impl-plan.md` into `impl-plan.json` via `scripts/compile-impl-plan-json.py` prior to code generation. Then dispatch the engine chosen and authorized in Stage 3.5; do not silently force OMP. For `/pi-code-agent`, dispatch with `--invocation-profile flow-auto-approve --caller-capability flow-auto-approve --caller-source .agent/workflows/flow-auto-approve.md --engine-evidence <path>` and retain the ledger gate before Stage 4.
- **Review Hard Gate (Stage 4)**: HALT if `pipeline-integrity-runner.py --phase review` exits with non-zero status.
- **Completion Human Gate (Stage 4B / Stage 5B)**:
  - **Non-UI Stories**: MUST HARD STOP at **Stage 4B**. Do NOT auto-complete story. Invoke `ask_question` with 3 options (`Option 1: Deep Evaluation & Loop`, `Option 2: Approve & Complete Story`, `Option 3: Audit Log & Hold`). Story status is updated to `completed` ONLY after explicit User approval.
  - **UI Stories**: Do NOT run Stage 4B. Proceed directly from Stage 4 to **Stage 5**, and MUST HARD STOP at **Stage 5B** for visual acceptance and live browser test sign-off via `ask_question`.

### Execution
1. Execute `/flow-stage-1-spec --auto-approve`.
2. Wait for `spec-stage-evidence.json`.
3. **UI Story Classification**:
   - Run: `pnpm tsx scripts/detect-ui-story.ts --story-id <story_id> --epic-id <epic_id>`
   - If `has_ui: true`: Execute the **UI Pipeline** (Stages 2A -> 2B -> 3A -> 3.5 -> 3B -> 4 -> 5).
   - If `has_ui: false`: Execute the **Non-UI Pipeline** (Stages 3A -> 3.5 -> 3B -> 4 -> 4B Completion Gate).

#### Path A: For UI Stories:
4. Execute `/flow-stage-2a-design-gen --auto-approve`.
5. Wait for `design-gen-evidence.json`. Then execute `/flow-stage-2b-design-approve`.
   ⚠️ KHÔNG GẮN CỜ `--auto-approve`. Agent chạy Interactive Mode, STOP chờ User duyệt UI.
6. Wait for `design-stage-evidence.json`. Then execute `/flow-stage-3a-plan-safe`.
   ⚠️ KHÔNG GẮN CỜ `--auto-approve`. Agent chạy Interactive Mode, STOP chờ User duyệt Plan.
7. Wait for `plan-approved-evidence.json`.
   **Stage 3.5 (Engine Selection Gate)**:
   ⚠️ HARD STOP: Gọi `ask_question` chọn Engine (4 options). Ký số qua `watchmen-mcp:sign_human_gate` tạo `engine-selection-{story_id}.json.sig`.
8. Execute `/flow-stage-3b-code --auto-approve` sử dụng engine đã được phê duyệt ở Stage 3.5.
9. Wait for `code-stage-evidence.json`. Then execute `/flow-stage-4-review --auto-approve`.
10. Wait for `review-stage-evidence.json`. Skip Stage 4B. Proceed directly to `/flow-stage-5-manual-test`.
    ⚠️ KHÔNG GẮN CỜ `--auto-approve` tại Stage 5B. Agent chạy Interactive Mode, STOP chờ User nghiệm thu UI Acceptance Package (Visual Fidelity & Live Browser Test).

#### Path B: For Non-UI Stories (Backend / DevOps / Headless):
4. Execute `/flow-stage-3a-plan-safe`.
   ⚠️ KHÔNG GẮN CỜ `--auto-approve`. Agent chạy Interactive Mode, STOP chờ User duyệt Plan.
5. Wait for `plan-approved-evidence.json`.
   **Stage 3.5 (Engine Selection Gate)**:
   ⚠️ HARD STOP: Gọi `ask_question` chọn Engine (4 options). Ký số qua `watchmen-mcp:sign_human_gate` tạo `engine-selection-{story_id}.json.sig`.
6. Execute `/flow-stage-3b-code --auto-approve` sử dụng engine đã được phê duyệt ở Stage 3.5.
7. Wait for `code-stage-evidence.json`. Then execute `/flow-stage-4-review --auto-approve`.
8. Execute `pipeline-integrity-runner.py --phase delivery`.
9. **Stage 4B Dual-Condition Completion Gate (Human Gate)**:
   ⚠️ BẮT BUỘC DỪNG (HARD STOP), KHÔNG AUTO-APPROVE.
   - Invoke `ask_question` with 3 options (`Option 1: Deep Evaluation & Loop`, `Option 2: Approve & Complete Story`, `Option 3: Audit Log & Hold`).
   - Only upon User choosing Option 2: Update `status: completed` in `story.md` and `sprint-status.yaml`, then run `validate-story-completion.py`.
