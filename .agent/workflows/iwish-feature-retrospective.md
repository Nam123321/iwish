---
legacy_name: 'retrospective'
description: 'Run after epic completion to review overall success, extract lessons learned, and explore if new information emerged that might impact the next epic'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
0. **Pending Risk Pre-check:**
   - Run `python3 .agent/scripts/update-pending-retro-fixes.py --check`
   - If the script exits with error (1), it means there are still unresolved blocker risks pending from a previous retro loop.
   - HALT execution immediately and prompt the user: *"Hệ thống phát hiện vẫn còn lỗi/yêu cầu refactor chưa được giải quyết xong. Kích hoạt Retro lúc này sẽ tiếp tục bị block. Bạn có chắc chắn muốn ép chạy lại quy trình Retro không?"*. Only proceed if the user explicitly overrides.
0a. **Independent Assessment Loop Enforcement:**
   - If the Epic is already marked as `completed` or if Retro artifacts from a previous run already exist, you MUST NOT skip the workflow steps or merely read/summarize the old retro files.
   - You MUST execute the FULL flow (Steps 1 through 7) as a completely new, independent assessment loop. Overwrite or version the output files to reflect the current state of the Epic.
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/retro/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/retro/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
5a. **Epic Drift Evaluation:**
   - Run `python3 .agent/scripts/evaluate-epic-drift.py --epic <epic_id>` to check for Architecture Drift, Contract Drift, Test Coverage Drops, and Performance Drift.
   - **Architecture Coherence Cross-Check (Defense-in-Depth):** The drift evaluator internally delegates to `architecture-coherence-checker.py` which reads `tech-decision-registry.yaml` (TDR) as SSOT. If TDR is stale (older than `architecture.md`), the checker will warn. If TDR is missing, it falls back to body-scan of `architecture.md`.
   - If script exits with error (1), HALT execution and mark Epic as `BLOCKED_BY_RISK`.
5b. **Unknowns Analyst Sync & Remediation Classification:**
   - Invoke `Unknowns Analyst` subagent.
   - Request generation of sprint unknowns report based on ledger trends in JSON format.
   - The JSON output MUST include boolean flags `has_code_errors`, `has_scope_gaps`, and an array of `pending_fixes`.
   - **Each fix MUST include:**
     - `id`: Unique identifier (e.g., `FIX-73-01`)
     - `description`: What the risk/problem is
     - `remediation_type`: One of `code_bug` | `scope_gap` | `capability_gap` | `unclassified`
     - `classification_rationale`: A 1-2 sentence explanation of WHY the Analyst chose this type (Zero-Trust evidence)
     - `route`: The specific workflow to invoke — derived from `remediation_type`:
       - `code_bug` → `/fix-bug`
       - `scope_gap` → `/refactor-story` (must include `story_ids` array)
       - `capability_gap` → `/skill` (must include `proposed_skill` object with `name`, `description`, `is_new`)
       - `unclassified` → `null` (fallback to user triage)
     - `status`: Initially `"pending"`
   - **Free Propose Mode (for `capability_gap` only):** The Analyst is FREE to propose ANY skill or workflow name — it does NOT need to already exist. The `proposed_skill.is_new` flag indicates whether it references an existing skill or a new one.
   - Review analyst report and include in retro summary.
5b-gate. **Anti-Bias Validation (Zero-Trust):**
   - Before accepting the Analyst's classifications, the Orchestrator MUST perform these checks:
     1. **Rationale Cross-Validation:** For each fix, verify the `classification_rationale` is consistent with the `remediation_type`. Example violations:
        - Classified as `code_bug` but rationale says "missing acceptance criteria" → REJECT, reclassify as `scope_gap`.
        - Classified as `scope_gap` but rationale says "function returns null instead of array" → REJECT, reclassify as `code_bug`.
     2. **Distribution Anomaly Check:** If ALL fixes share the same `remediation_type`, flag as suspicious bias. The Orchestrator MUST present a warning to the user: *"Tất cả lỗi đều được phân loại cùng một loại ([type]). Có thể Agent đang bị bias. Bạn có muốn xem lại phân loại từng lỗi không?"*. If user confirms, proceed. If user requests re-evaluation, re-invoke Analyst with explicit instruction to reconsider.
     3. **Fallback for `unclassified`:** Present directly to user for manual triage: *"Analyst không thể phân loại rủi ro `[fix.id]`. Bạn muốn xử lý bằng: (1) /fix-bug, (2) /refactor-story, (3) /skill, (4) Bỏ qua (descope)?"*
   - After validation, write ALL fixes to `_iwish-output/adhoc-workspace/scratch/pending-retro-fixes.json` (the **Central Remediation Ledger**).
   - **Event-Driven Gate:** If ANY fix exists with status `pending`:
     - HALT immediately. DO NOT set epic to `completed`.
     - Route each fix to its remediation path (Steps 5c through 5e).
5c. **Remediation Router (Multi-Path Dispatch):**
   - Process each `pending_fix` based on its `remediation_type`:

   **Path A: `code_bug` → `/fix-bug`**
   - Present to user: *"Phát hiện lỗi code `[fix.id]`: [fix.description]. Bạn có muốn kích hoạt `/fix-bug` để sửa không?"*
   - If approved, invoke `/fix-bug` with the bug description and relevant file context.
   - After `/fix-bug` completes, mark fix as `status: "resolved"` in the ledger.

   **Path B: `scope_gap` → `/refactor-story` & `/flow-auto-approve`**
   - Present to user: *"Phát hiện thiếu AC/scope cho story `[fix.story_ids]`: [fix.description]. Bạn có muốn kích hoạt `/refactor-story` để bổ sung AC và tự động code (auto-approve) không?"*
   - If approved, invoke `/refactor-story` for the specified `story_ids`.
   - **MANDATORY AUTO-EXECUTION:** Immediately after `/refactor-story` completes (which sets the story to `refactored` status), you MUST automatically invoke `/flow-auto-approve` on those `story_ids` to implement the new requirements without waiting for user instruction.
   - After `/flow-auto-approve` completes (including passing its internal QA), mark fix as `status: "resolved"` in the ledger.
   **Path C: `capability_gap` → `/skill` (Free Propose pipeline)**
   - Sub-route based on `proposed_skill.is_new`:
     - `is_new = false` (existing skill): Verify physical existence via `list_dir` on `.agent/workflows/` and `.agent/skills/`. If confirmed, proceed to execution.
     - `is_new = true` (new skill): Apply **Generalization Gate** (Step 5c-gen) → then **Skill Intake** (Step 5c-intake).
   - **Step 5c-gen. Generalization Gate (Anti-Localization — only for `is_new = true`):**
     1. **No Local Identifiers:** Skill name MUST NOT contain Epic IDs, Story IDs, or project-specific terms. If violated, rewrite to abstract equivalent.
     2. **Minimum 3 Use-Cases:** Orchestrator MUST list ≥ 3 distinct use-cases across different epics/domains. If < 3, generalize scope or merge into existing skill.
     3. **Abstract Language Check:** Description MUST use domain-agnostic language. (✅ *"Validates numeric scoring fields"* vs ❌ *"Fixes effectivenessScore for Epic 72"*).
   - **Step 5c-intake. Skill Intake Routing (only for `is_new = true`):**
     - Present to user: *"Retro đề xuất khả năng mới: `[name]` — [description]. Route qua `/skill` để đánh giá SOI?"*
     - If approved, invoke `/skill` headless: `{"query": "<description>", "cwi_hint": 100, "headless": true}`
     - `/skill` owns the lifecycle (SOI → create/enhance/refactor → Anti-Fabrication Policy).

   **Path D: `unclassified` → User Fallback**
   - Already handled in Step 5b-gate (manual triage). If user chose a route, process via Path A/B/C. If user chose "descope", mark as `status: "descoped"`.

5d. **Evidence Consistency Cross-Check (ECC Gate):**
   - Run `python3 .agent/scripts/ecc-gate.py --epic <epic_id>`.
   - **Enforcement (Inversion of Control):** The Retro Agent MUST NOT manually read evidence files or update statuses. The `ecc-gate.py` script parses `pipeline-evidence-data-flow.json` for every story, verifying valid JSON, `story_id` matches, `code_hash` matches (Stale Evidence check), and `SCS >= 93`. **[EC-P11-01] Immutable Script:** Agents are explicitly forbidden from modifying `ecc-gate.py` using `multi_replace_file_content` or `write_to_file`.
   - If the script exits with code 1, the Retro Agent MUST log a critical incident in the ledger, mark the Epic as `BLOCKED_BY_RISK`, generate a `pending_fix` (code_bug), and HALT execution. It is structurally forbidden from completing the Epic.
   - If the script exits with code 0, it means all stories are genuinely completed and verified.

5e. **Execute Remediation (Closed-Loop — ALL paths converge here):**
   - For `capability_gap` fixes (both existing and newly created skills):
     1. **Resolve:** Confirm physical path of the skill/workflow. Use `list_dir` to verify existence.
     2. **Execute:** Present to user: *"Skill `[name]` sẵn sàng. Kích hoạt để xử lý `[fix.id]`?"*. If approved, invoke the skill.
     3. **Mark resolved:** Update ledger `status: "resolved"`.
   - For `code_bug` and `scope_gap` fixes: Already marked resolved in Step 5c after their respective workflows complete.
5f. **Re-trigger Gate (Auto Closed-Loop):**
   - After ALL `pending_fixes` have been processed (resolved or descoped):
     - Run `python3 .agent/scripts/update-pending-retro-fixes.py --check`.
     - If exit code = 0 (no pending risks remain): Automatically re-trigger `/iwish-feature-retrospective` for the same epic to perform a clean validation pass. This second pass should find zero risks and proceed to Steps 6 and 7.
     - If exit code = 1 (risks still remain): Inform the user of remaining items and HALT. The loop will resume when the user completes the remaining fixes and manually (or via `/approve-qa` hook) re-triggers retro.
6. After completing the retrospective (if no risks found in Step 5b, or after a clean re-trigger pass in Step 5f), execute the /gen-dashboard workflow to update the user-guide-dashboard.html.
7. **Status Sync:** If all stories in the Epic are completed and no risks are pending, update the epic status to `completed` in `epic.md` and explicitly run `python3 .agent/scripts/rebuild_sprint_status.py` to synchronize the global tracker.
</steps>
