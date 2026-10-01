---
name: 'code-review-internal'
description: 'Use when the user requests a code review or when validating an implemented story to find security, performance, or coverage issues.'
disable-model-invocation: true
---

# 🛡️ Parallel Cognitive Code Review Front-Door

> [!IMPORTANT]
> To execute this workflow, the Orchestrator MUST spawn TWO PARALLEL sub-agents to distribute cognitive load and avoid hallucination.
> You MUST read and rigidly obey the rules defined in:
> [3-Layer Code Review Protocol](file:///.agent/workflows/references/code-review-protocol.md)

## Quick Execution Steps:

### 0. SSOT Sync Guard (Pre-Review Checkpoint)
- **[DATA LOSS PREVENTION]** Before ANY review actions, the agent MUST run:
  `python3 .agent/scripts/ssot-sync-guard.py --auto-commit`
- This commits all uncommitted SSOT files (ui-spec, data-spec, impl-plan, task, etc.) to the nested `_iwish-output/` repo BEFORE the review loop begins.
- If the script exits with code 2 (nested repo not initialized), HALT and notify the user.


### 0.5 AC-to-Task Matrix Regeneration (Pre-Review Normalization)
- **[MATRIX INTEGRITY]** Before the Traceability Enforcement Gate (Step 0.7), the agent MUST regenerate the AC-to-Task mapping from source-of-truth annotations:
  1. Run: `python3 .agent/scripts/auto-traceability-linker.py --story <path/to/story.md>`
  2. Run: `python3 .agent/scripts/ac-to-task-mapper.py --story <path/to/story.md>`
- This ensures `task-traceability.json` is freshly generated from `@cover` annotations.
- **[EDGE-CASE AUTO-FIX]**: 97% of legacy stories lack `@cover AC#` annotations. If `ac-to-task-mapper.py` emits `[AUTO-MAP-FAILED]`, do NOT halt the review pipeline. Instead, the Orchestrator MUST:
  - Spawn a Dev-Agent subagent.
  - Instruct the Dev-Agent to read the `Tasks` and `Acceptance Criteria` sections, infer the mappings, and rewrite the `Tasks` list in `story.md` to strictly include `@cover AC#` tags.
  - Re-run `ac-to-task-mapper.py`.
- If `ac-to-task-mapper.py` exits with code 1 for severe parsing errors (not just mapping failure), HALT and report to the user.

### 0.7 Traceability Enforcement Gate (Zero-Trust)
- Run: `python3 .agent/scripts/validate-story-tags.py --story <ID>`
- Run: `python3 .agent/scripts/auto-traceability-linker.py --story <path>`
- Run: `python3 .agent/scripts/validate-story-completion.py --story <path>`
- **Rule**: If ANY of these scripts exit with code 1, the gate FAILS. You MUST halt the review process and report the specific failures to the user. Do not proceed to Agent A.

### 1. Extract Changes (The Fixed Point)
- **Pre-Review Purge:** The Orchestrator MUST execute `rm -f _iwish-output/reviews/raw-layer*.json` and `rm -f _iwish-output/reviews/*.sig` to clear any spoofed review files left by the dev-agent.
- Determine the Git Diff (e.g., `git diff main...HEAD`).
- **[Empty Diff Bypass]:** If the diff is empty, the agent MUST check if the target story directory inside `_iwish-output/` contains physical files (e.g. `impl-plan.md`, `preview.html`). If SSOT files exist, DO NOT HALT. Only HALT if BOTH the code diff is empty AND the SSOT story directory is empty/missing.

### 1.2 Mock Data Consistency Gate (Zero-Trust Category A)
- **[DETERMINISTIC CHECK]** Run: `git diff main...HEAD --name-only | grep -E 'schema.prisma|api-routes.ts'`
- **Rule**: If the command outputs ANY file, it means the structural data contract was modified. The Orchestrator MUST then check if the Mock Data Factory was updated:
  `git diff main...HEAD --name-only | grep 'packages/shared/src/factories'`
- **Fail Closed**: If the schema was modified BUT the `factories` directory was NOT modified, the Orchestrator MUST immediately HALT the review (Exit Code 1) and output a RED FLAG prompting the user: *"Data Schema modified but Mock Data Factories are stale. You MUST run `/generate-data-factory` before this code can be reviewed."*

### 1.3 AI-ML Evidence Verification Gate (Zero-Trust Category A)
- **[DETERMINISTIC CHECK]** Run: `python3 .agent/scripts/validate-aiml-gate-entry.py --story-dir "<path/to/story_dir>" --story-id "<story_id>"`
- **Fail Closed**: If the story contains `domain: AI-ML` and lacks valid recent AI-ML Tri-Source Evidence, HALT immediately. Story cannot be reviewed without validated architecture evidence.


### 1.5 Tiered Review Calculation
- Run `python3 .agent/scripts/review-tier-calculator.py <story_id>` to determine the review tier.
- The review will be classified as STANDARD or DEEP. The QUICK tier has been 
  permanently removed. All stories receive at minimum a STANDARD review with 
  full 3-layer checks including Over-Engineering Scan.

### 2. Parallel Sub-Agent Invocation
The Orchestrator MUST spawn these two agents simultaneously using `invoke_subagent`.

> [!IMPORTANT]
> **ANTIGRAVITY 2.0 DYNAMIC ROUTING & FALLBACK (MANDATORY)**
> 1. **Dynamic Model Resolution:** Khi hoạt động trên Antigravity 2.0, Orchestrator KHÔNG ĐƯỢC hardcode hay để mặc định `inherit`. Phải lấy cấu hình Model động thông qua script:
>    `python3 .agent/scripts/pi-code-agent/resolve_model_binding.py --platform antigravity --role reviewer --output _iwish-output/adhoc-workspace/scratch/resolve-reviewer-$RANDOM.json`
>    `python3 .agent/scripts/pi-code-agent/resolve_model_binding.py --platform antigravity --role security --output _iwish-output/adhoc-workspace/scratch/resolve-security-$RANDOM.json`
>    Trích xuất `requested_model` từ file JSON và gán vào trường `Model` khi gọi `invoke_subagent`.
> 2. **Fallback Mechanism:** Nếu script resolution gặp lỗi HOẶC việc gọi `invoke_subagent` bị từ chối/crash (do Rate Limit 429 hoặc hạ tầng), Orchestrator BẮT BUỘC phải fallback hạ cấp xuống `"Model": "inherit"`, gọi lại tool và phát cảnh báo `> [!WARNING]` cho User trong chat. Tuyệt đối không đánh REJECT quy trình.

> [!WARNING]
> **ANTI-HALLUCINATION HANDSHAKE & SELF-HEALING RETRY LOOP**
> Sub-agents are NOT allowed to return narrative text. They MUST write their findings to a physical JSON file in `_iwish-output/reviews/`. 
> The Orchestrator will parse these JSON files. **Nếu file không tồn tại hoặc sai định dạng JSON (Execution Failure), Orchestrator KHÔNG ĐƯỢC đánh REJECT review.**
> Thay vào đó, Orchestrator BẮT BUỘC phải chạy vòng lặp **Fast-Track Self-Healing**: Tự động gọi lại (`invoke_subagent`) sub-agent đó với lời nhắc nhở nghiêm khắc về định dạng. Tối đa thử lại 3 lần. Nếu sau 3 lần vẫn thất bại, HALT toàn bộ tiến trình và báo cáo System Error cho User. Không được đánh giá Code Review là REJECTED.

**Agent A: Standards & Architecture Guardian (`review-agent`)**
- **Input Context:** `[.agents/rules/testing-strategy.yaml](file:///.agents/rules/testing-strategy.yaml)`, Git Diff, `CODE_STANDARDS.md`, `Smell Baseline` rules, `{story_dir}/impl-plan.md` [IMPL-PLAN], and SBRP Report (if `source=fix-bug`).
- **Blindfold:** Do NOT provide `story.md` or PRD. BUT provide `impl-plan.md` (contains File Manifest + Technical Approach for cross-referencing actual code output vs planned output).
- **Task:** Execute **Layer 1** (Syntax & Smell Matrix) and **Layer 2** (Adversarial Security) + **[NEW] Layer 2.5** (Impl-Plan Deviation Check):
  - Cross-reference File Manifest vs actual files in Git Diff
  - If actual files ≠ planned files → flag IMPL_PLAN_DEVIATION
  - If code has `return {}` but impl-plan describes real logic → flag SKELETON_CODE
  - **[NEW FIX-BUG RULE]**: Nếu `source=fix-bug`, Agent A BẮT BUỘC tuân thủ Blast Radius từ SBRP. Nghiêm cấm các thay đổi "Clean Up" nếu Bug thuộc Tier là SBRP-Full (chỉ cho phép Surgical Changes).
  - **[OMP ACCELERATION OPTION]**: Agent A có thể kích hoạt OMP Review Engine (`python3 scripts/adapters/omp-orch-executor.py --mode review --plan-file "<story_dir>/impl-plan.json"`) để tự động huy động subagents `reviewer` và `security-reviewer` (DeepSeek) quét chuyên sâu lỗ hổng AST qua `ast_grep` và ranh giới `<cross-boundary>` trước khi sinh file báo cáo.
- **Handshake Output:** Must write findings to `_iwish-output/reviews/raw-layer1-2.json`.

**Agent B: Spec Guardian (`qa-agent` or `review-agent`)**
- **Input Context:** `[.agents/rules/testing-strategy.yaml](file:///.agents/rules/testing-strategy.yaml)`, Git Diff, `story.md`, `ui-spec.md`, `data-spec.md`, `{story_dir}/impl-plan.md` [IMPL-PLAN], `traceability.json` (and `.sig`), and SBRP Report (if `source=fix-bug`).
- **Blindfold:** Do NOT provide code standards or smell guidelines.
- **Task:** Execute **Layer 1.5** (Spec Compliance, AC Traceability via `traceability.json`, SCS Calculation). BẮT BUỘC đọc `traceability.json` để kiểm tra độ phủ của code thay vì tìm bảng trong `story.md`.
  - **[NEW FIX-BUG RULE]**: Nếu `source=fix-bug`, Agent B BẮT BUỘC đọc `SBRP Report` để đối chiếu xem bản vá có giải quyết ĐÚNG Root Cause (RCA) hay không, thay vì chỉ so sánh với Story AC ban đầu.
- **Handshake Output:** Must write findings to `_iwish-output/reviews/raw-layer1.5.json`.

### 3. Aggregation & Cross-Story Gate (Master Orchestrator)
- **Invocation Verification:** The Orchestrator MUST confirm that the review subagents were genuinely spawned via `invoke_subagent` and that they returned valid Asymmetric Cryptographic Signatures for their review JSONs.
- Read the physical JSON files from Agent A and Agent B. If any JSON is missing/invalid, ABORT.
- Execute mechanical checks (`tsc --noEmit`, `npx ts-node .agent/skills/codebase-drift-auditor/scripts/audit-all.ts`, `node scripts/anti-cheat-linter.js`, `prisma validate`).
- Execute **Layer 3** (Cross-Story Gate & Unknowns Micro-Scan).

### 4. Final Disposition & Native Auto-Fix Loop
- Render the Hybrid Scorecard, set Trust Score, and determine review status (`APPROVED` or `REJECTED`).
- **[NEW] Auto-Fix Transparency:** The Orchestrator MUST explicitly state in the final review report how many loops of `/review` and Auto-Fix were executed to achieve the current state (e.g., "Achieved APPROVED after 2 Auto-Fix rounds").
- If `REJECTED`, the Orchestrator MUST explicitly categorize the root cause of the rejection (e.g., Execution Error, Architectural Drift, MACRO Risk).

**[NEW] Stage 4b: Cryptographic Seal & Human Option Gate (When APPROVED)**
If `APPROVED`, the Orchestrator MUST execute the following End-to-End Status Integrity checks:

1. **Human Checkpoint (Terminal Option Gate):** Even if `--auto-approve` is active, the Orchestrator MUST HALT automation and present the user with an `ask_question` modal containing 3 options:
   - `Option 1`: **Deep Evaluation & Loop (`/party-mode` + `/review`)**
   - `Option 2`: **Approve completion** (Agent proceeds to update SSOT status).
   - `Option 3`: **Audit Trace Log (Manual)** (Run a diagnostic script to verify IDE trace log provenance).

2. **Autonomous Internal Containment for Option 1 (Strict Anti-Spam Rule):**
   When the user selects `Option 1`, the Orchestrator enters an **Autonomous Internal Remediation Loop**:
   - **Single-Pass Evaluation:** Triệu tập hội đồng `/party-mode` nạp skill `runtime-realism-guardian` để thẩm định toàn diện codebase, test path fidelity, rủi ro và tuân thủ qua **7 Trục Kiểm Định Cốt Lõi** trong MỘT LẦN DUY NHẤT.
   - **Autonomous Batch Remediation:** Dev-Agent tự động sửa đồng loạt các vi phạm được phát hiện và chạy lại test suite.
   - **PROHIBITION ON PREMATURE PROMPTING:** The Orchestrator is **STRICTLY FORBIDDEN** from calling `ask_question` or prompting the user after individual micro-fixes. The internal loop runs fully autonomously in the background (max 5 internal iterations).
   - **Differential Deadlock Detector (EC-01):** Nếu phát hiện lỗi của vòng $N$ lặp lại đúng lỗi của vòng $N-2$, Orchestrator kích hoạt ngắt mạch khẩn cấp và leo thang báo cáo trade-off lên người dùng.
   - **Subagent Context Isolation (EC-02):** Mỗi vòng lặp party-mode/review phải được chạy trong subagent biệt lập (`invoke_subagent`), chỉ trả về JSON tóm tắt để bảo vệ context window của Orchestrator.
   - **Atomic State Checkpoint (EC-03):** Save environment and Git state snapshot to `_iwish-output/adhoc-workspace/scratch/state-checkpoint-{story_id}.json` prior to initiating Option 1 remediation loops to ensure atomic recovery or rollback on crash.

3. **Late-Stage Cryptographic Seal Generation:**
   The Orchestrator MUST NOT generate `raw-layer-<story_id>.sig` prematurely after micro-fixes. The Watchmen signature MUST ONLY be generated via `call_mcp_tool("watchmen-mcp", "sign_pipeline_gate", ...)` **AFTER** the internal review loop achieves unanimous consensus of **10/10 - Zero Defects Found** across all 7 dimensions. Once sealed, the Orchestrator displays the final completion prompt **EXACTLY ONCE**.

**Native Auto-Fix Loop (Zero-Trust Gate)**
If `REJECTED`, the Orchestrator MUST determine if the fix can be automated without human intervention by running the deterministic System Evaluator:
1. Orchestrator executes: `python3 .agent/scripts/auto-fix-gate-evaluator.py --file <aggregated_review_json> --iteration <current_loop_count>` (where `<current_loop_count>` starts at 1 and increments each auto-fix attempt, max 3).
2. If the script outputs `DECISION: AUTO_FIX` (exit code 0):
   - **Anti-Barrier Directive:** "If the Dynamic Measure Gates pass, this task is classified as trivially simple and deterministic. The Orchestrator MUST bypass planning_mode and immediately invoke the correct implementation workflow without asking for user permission."
   - **Dynamic Context Routing:** 
     - Nếu `source == fix-bug`: Orchestrator tự động gọi `/fix-bug --phase=5 --auto-approve` để Dev-agent sửa lại bản vá dựa trên lỗi review.
     - Nếu không: Orchestrator tự động gọi `/code` (dev-agent).
   - Sau khi hoàn thành sửa code, Orchestrator tự động vòng lại lệnh `/review`.
3. If the script outputs `DECISION: HALT` (exit code 1):
   - The Orchestrator halts the Auto-Fix Loop and presents standard resolution options to the user:
     - Option A: Tiến hành `/code` lại
     - Option B: Đưa vào backlog
     - Option C: `/party-mode` (Socratic Debate)
     - Option D: `/pi-code-agent` (Bounded fix with contract loop)
- Inject node into FeatureGraph.

> [!IMPORTANT]
> **UNKNOWNS MICRO-SCAN (REVIEW PHASE — MANDATORY):**
> After step 3, the Orchestrator MUST:
> 1. Run: `python3 .agent/scripts/run-unknowns-scanner.py --story-id {id} --phase review --context {story_file} --story-dir <story_dir>`
> 2. The script automatically executes the curated tool set (`debiasing-check`, `drift-detector`, `merge-quiz`) and generates `<story_dir>/unknowns-gate-{id}-review.json`.
> 3. **Bridge Logic (Conditional):** If any finding has `macro_impact: true`:
>    - Execute Bridge logic from `step-u-04-bridge.md`: calculate `Δ = -severity × relevance_weight` on linked MACRO assumptions.
>    - Update confidence scores in `_iwish-output/unknowns/macro-risks.yaml`.
>    - If any MACRO assumption's confidence drops below 0.5 → HALT and escalate to user with evidence.
> 4. Extract findings from the generated JSON and append them to `_iwish-output/unknowns/unknowns-ledger.yaml`.
> 5. **[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/pipeline-integrity-runner.py --target <story_id> --type story --phase review`


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered on REJECT with ≥ 3 findings.

### PUSH + PULL: Situational research for review resolution

1. If review REJECT with ≥ 3 findings:
   a. Load `notebook-request-engineer` → Push situational research (Template: Situational Research)
   b. Load `notebook-retrieval-engine` → Pull with Triangulation mode
2. After review completion: Load `knowledge-collector` → Enrich OP-2 (Ops-Review-Patterns)
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target project --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
