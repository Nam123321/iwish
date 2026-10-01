---
name: evaluate-epic
description: Detail an Epic before story creation using Party Mode, Unknowns, and zero-trust evidence.
---

> [!IMPORTANT]
> **[DOMAIN ROUTING GATE]** Hệ thống Watchmen (Category A) sẽ tự động kiểm duyệt Domain của bạn vào cuối lượt. Để tránh bị Block, bạn BẮT BUỘC phải chạy lệnh: `python3 .agent/scripts/domain-skill-router.py --context-file <file_đang_làm_việc>`. Nếu có skills trả về, BẮT BUỘC dùng `view_file` nạp toàn bộ.



# /evaluate-epic

Use this workflow whenever `/make-story` is requested for an Epic that does not have a valid evaluation passport.

<steps CRITICAL="TRUE">
1. **Resolve Target:** Identify `epic_id`, Feature Group folder, `epic.md`, PRD, `2.4. epics-and-stories.md`, and `2.5. feature-hierarchy.md` if present.
2. **Draft Snapshot:** Run:
   `python3 .agent/scripts/pipeline-integrity-runner.py --target "<epic_id>" --type epic --phase planning`
   Record the returned `context_digest` and `context_files`.
2.5. **Architecture Coherence Pre-Check (ADR↔Epic Tech Alignment):**
   - Run: `python3 .agent/scripts/architecture-coherence-checker.py --architecture "<architecture_path>" --epic-dir "<epic_dir>" --output-json "_iwish-output/adhoc-workspace/scratch/coherence-report-epic-<epic_id>.json"`
   - If TDR file exists (`tech-decision-registry.yaml`), use it as primary source. Otherwise fallback to body-scan of `architecture.md`.
   - **If `overall_status == FAIL` (CRITICAL/HIGH conflicts):** HALT epic evaluation. Present conflicts to user with options: (A) Update ADR to adopt new tech, (B) Refactor epic plan to use canonical tech, (C) Create phased migration plan. Epic CANNOT proceed to story creation until conflicts are resolved.
   - **If `overall_status == WARN`:** Log warnings and continue. Present unregistered technologies for user awareness.
   - **If `overall_status == PASS`:** Continue to Step 3.
3. **Triage & Party Mode Roster (Tiered):** First, calculate the Complexity Score (CS) using the 6-dimension scoring table for the Epic.
   - **Express Mode (CS ≤ 5):** Run a simplified 1-round Party Mode with PM and Architect. Skip full Unknowns Deep Dive (Step 4) and proceed directly to Step 5.
   - **Deep Mode (CS > 5):** Enforce full multi-agent roster. Orch-Agent MUST dynamically evaluate if domain specialists (e.g., ai-engineer-agent for RAG/LLM, data-strategist-agent for data pipelines) are required. Run full Party Mode with minimum 2 rounds of concrete pushback.
4. **Unknowns Full Review:** (Deep Mode Only) Run Unknowns at full depth for the Feature Group and Epic. Cover all four quadrants: `known_unknowns`, `unknown_unknowns`, `assumptions`, and `blind_spots`. Critical open findings block normal delivery.
5. **Synthesize Story Envelope:** Decide `story_creation_envelope.max_phase`:
   - `AUTHOR_ONLY` permits `/make-story` authoring only.
   - `INVESTIGATE` permits research/spike evidence work.
   - `IMPLEMENT` permits normal implementation.
   - `RELEASE` permits release only when downstream gates also pass.
   - `NONE` blocks story work.
6. **Write Passport:** Save `_iwish-output/epic-evaluations/Epic-<epic_id>/evaluation-passport.json` using schema `epic-evaluation-passport/v1`. Include immutable `evidence_receipts` with path and sha256 for every Party Mode, Unknowns, and approval artifact.
6.5. **Actionable Implementation Plan & Edge-Case Loop (MANDATORY):** 
   - Dựa trên kết quả Party Mode và Unknowns, Agent BẮT BUỘC phải sinh ra một file `evaluation-report.md` (bao gồm đánh giá tổng quan và Actionable Implementation Plan).
   - Implementation Plan NÀY CHỈ ĐƯỢC PHÉP mô tả việc cần thêm AC gì, bổ sung edge-cases nào vào các story hiện tại, hoặc tạo mới story nào để lấp lỗ hổng (cover gap). TUYỆT ĐỐI KHÔNG VIẾT CODE ở bước này.
   - Sau khi tạo xong Plan, Agent BẮT BUỘC phải gọi lệnh `/edge-case-loop @[đường_dẫn_file_evaluation-report.md]` (hoặc script ngầm tương đương) để kích hoạt Edge-Case Guardian quét kế hoạch.
   - Nếu Guardian phát hiện lỗi (`RISK_OPEN`), Agent phải tự động vá lỗi vào plan và quét lại cho đến khi Guardian cấp phép (Approved). Chỉ khi file nhận được mộc niêm phong của Guardian thì mới được phép chuyển sang Bước 7.
7. **User Approval:** **[ZERO-TRUST GATE]** Ask the user to approve the exact `context_digest`. You are STRICTLY FORBIDDEN from automatically setting `approval.approved=true` or hallucinating the `approved_by` field. You MUST STOP execution and wait for the user to explicitly reply "Approve" (or similar) in the chat. Only AFTER receiving the human user's reply can you set `approved=true` and set `approved_by` to the human user's name or `"User"`.
8. **Mechanical Validation:** Run:
   `python3 .agent/scripts/pipeline-integrity-runner.py --target "<epic_id>" --type epic --phase planning`
   If it fails, fix the evidence or rerun evaluation. If it passes, resume `/make-story`.
</steps>


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> Auto-triggered after epic evaluation.

### CONTEXT ENRICHMENT: Dynamic registry-driven epic evaluation (MANDATORY OVERRIDE: STANDARD)

1. Run: `python3 .agent/scripts/resolve-notebook-targets.py --context-type epic --context-id "<epic_id>" --output-json _iwish-output/adhoc-workspace/scratch/notebook-targets.json`
2. Load `ae-notebook-orchestrator` → Pre-Pull from ALL resolved notebooks (primary + dependency + backbone + research)
3. Cross-query results via `notebook-cross-query-engine` against relevant backbone notebooks from resolver output
4. Enrich OP-1 (Epic Context) with evaluation findings
5. If unknowns found: Load `notebook-request-engineer` → Push deep research request
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "<epic_id>" --type epic --phase discovery`. If it fails, HALT immediately and do not proceed.
