---
name: 'party-mode'
description: 'Orchestrates group discussions between all installed I-Wish agents, enabling natural multi-agent conversations with Multi-Tiered Grilling.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **[DOMAIN ROUTING GATE]** Hệ thống Watchmen (Category A) sẽ tự động kiểm duyệt Domain của bạn vào cuối lượt. Để tránh bị Block, bạn BẮT BUỘC phải chạy lệnh: `python3 .agent/scripts/domain-skill-router.py --context-file <file_đang_làm_việc>`. Nếu có skills trả về, BẮT BUỘC dùng `view_file` nạp toàn bộ.



> [!IMPORTANT]
> **ANTI-SYCOPHANCY PREAMBLE (MANDATORY):**
> Before ANY agent interaction in party-mode, you MUST use `view_file` to load `/.agent/fragments/anti-sycophancy.md`. All participating agents MUST apply at least 2 Pushback Patterns per round. Banned Phrases are STRICTLY FORBIDDEN. When two agents agree, a third MUST play devil's advocate.

> [!IMPORTANT]
> **RELEASE READINESS PREAMBLE (CONDITIONAL):**
> When party-mode discussions involve deployment, release, or shipping topics, you MUST use `view_file` to load `/.agent/skills/canary/SKILL.md` and `/.agent/skills/land-and-deploy/SKILL.md`. Apply the Canary Deployment Protocol and Landing Protocol to structure release decisions.

> [!IMPORTANT]
> **INLINE GLOSSARY & ADR PREAMBLE (MANDATORY):**
> During Socratic Debate, if a new term is defined or a technical decision is reached, the **Orchestrator Agent (or designated Scribe)** MUST automatically extract and write these to `project-context.md` or `glossary.md` to prevent context loss. Other agents may propose definitions but only the Orchestrator executes the write action to avoid Race Conditions.

> [!IMPORTANT]
> **ARCHITECTURE COHERENCE PREAMBLE (CONDITIONAL):**
> When party-mode discussions involve technology choices, infrastructure decisions, library adoption, or any topic referencing specific technologies (databases, queues, frameworks, APIs), you MUST:
> 1. Load `/.agent/skills/architecture-coherence-checker/SKILL.md`.
> 2. Run: `python3 .agent/scripts/architecture-coherence-checker.py --architecture "<architecture_path>" --story-dir "<story_dir_if_applicable>" --output-json "_iwish-output/adhoc-workspace/scratch/coherence-party-mode.json"`
> 3. Share the coherence report with ALL debate participants BEFORE Tier 1 grilling begins.
> 4. Any agent proposing a technology marked `future` or `deprecated` in TDR MUST justify why deviation from active ADRs is necessary. The burden of proof is on the proposer.
> 5. If debate concludes with a technology change recommendation that conflicts with active ADRs, the `debate-transcript.md` MUST include an explicit `## ADR Amendment Proposal` section with rationale, impact scope, and migration path.

> [!IMPORTANT]
> **PARTY-MODE CORE WORKFLOW (MULTI-TIERED GRILLING):**
> 
> **1. Khởi tạo (Initialization):**
> - Xác định chủ đề/vấn đề cần thảo luận.
> - Chỉ định các Agent chuyên trách tham gia dựa trên bối cảnh. Người điều phối (`Orch-Agent` hoặc `QA-Agent`) có trách nhiệm triệu tập dựa trên Domain Triage Matrix. BẮT BUỘC triệu tập `ceo-agent` nếu liên quan strategy/business, và `eng-manager-agent` nếu liên quan tech feasibility/execution.
> 
> **1b. Context Enrichment Gate (CENS Pre-Debate):**
> - Before agents start debating, run the CENS gate:
>   `python3 .agent/scripts/calculate-cens.py --context-type debate --context-file <debate_topic_file_or_summary> --output-json _iwish-output/adhoc-workspace/scratch/cens-score.json`
> - If CENS ≥ 5.6: Activate `ae-notebook-orchestrator` Pre-Pull BEFORE agents debate.
>   Load `.agent/fragments/nlm-context-enrichment-gate.md` and execute the appropriate mode.
>   This prevents echo chamber: agents debate with EXTERNAL evidence, not just training data.
> - If CENS < 5.6: Proceed with standard Party-Mode (agents use internal knowledge).
> - If Party-Mode reaches deadlock AND ae-notebook-orchestrator was NOT activated in 1b:
>   Force-activate regardless of CENS score (existing Triangulation hook in Section 📘 below).
> 
> **2. Tier 1: AI-AI Grilling (Socratic Interrogation):**
> - `Orch-Agent` không để các Agent tự do tranh luận mà đóng vai trò **Người Thẩm vấn (Interrogator)**, sử dụng Cây Quyết định (Decision Tree).
> - Truy vấn gắt gao từng Agent (e.g., "Nếu Architect chọn Option A, làm sao Dev xử lý rủi ro tràn RAM?").
> - **4 Guardrails (BẮT BUỘC):**
>   1. **Goal Anchor:** Trước mỗi câu hỏi, Orch-Agent phải xác nhận câu hỏi phục vụ trực tiếp cho mục tiêu gốc.
>   2. **Depth Limiter:** Giới hạn cứng **tối đa 3 câu hỏi liên tiếp** cho mỗi nhánh. Nếu quá 3 câu chưa chốt, buộc phải vote (Tier 1) hoặc leo thang (Tier 2).
>   3. **Rolling Summary:** Cứ sau mỗi 3 câu, in ra bảng tóm tắt: `Locked Decisions` và `Pending Deadlocks`.
>   4. **Pragmatic Exit Criteria:** Thoát vòng lặp khi đã đủ dữ liệu vật lý/logic để viết file `ADR.md` hoặc sinh code.
>   5. **Distributed Write Rule (MANDATORY):** Khác với cơ chế mặc định, khi triệu tập Subagent tham gia thảo luận hoặc cần xuất file, `Orch-Agent` BẮT BUỘC phải đảm bảo các Subagent này được cấp quyền ghi file (set `enable_write_tools: true`). Mỗi Subagent sẽ tự chịu trách nhiệm phân tích và trực tiếp sử dụng công cụ `write_to_file` để lưu kết quả của mình xuống ổ cứng (ví dụ file JSON, transcript). Trong prompt, `Orch-Agent` PHẢI cung cấp rõ đường dẫn file đích và chỉ thị Subagent tự thực hiện việc lưu file.
> - Nếu một Agent nhượng bộ trước logic/sự thật, hoặc một giải pháp thứ ba vượt trội được tìm ra: Chốt phương án, KHÔNG CẦN leo thang lên User.
> 
> **3. Tier 2: User Grilling (Business/Subjective Deadlock Escalation):**
> - `Orch-Agent` CHỈ ĐƯỢC PHÉP gọi công cụ `ask_question` (modal UI) đưa quyết định cho User nếu vi phạm 1 trong 3 điều kiện:
>   - Đụng độ **Business Rule** (Ngân sách, Product Scope, User Experience).
>   - Rơi vào **Deadlock Kỹ thuật** (Trade-offs loại trừ lẫn nhau, độ rủi ro ngang nhau sau 3 vòng thẩm vấn).
>   - Chạm tới **MACRO Risk** (có confidence < 0.5) trong `unknowns-ledger.yaml`.
> - Khi leo thang, phải trình bày rõ Trade-offs gốc của 2 phe, KHÔNG ĐƯỢC sinh ra phương án lai (Hybrid) thỏa hiệp.
> 
> **4. Kết thúc (Exit Criteria & Validation):**
> - Xuất kết quả thảo luận dưới dạng file `debate-transcript.md` (Ghi rõ cây quyết định: nhánh nào AI tự giải quyết, nhánh nào leo thang User).
> - Dừng lại (STOP) và chờ Người dùng phê duyệt trước khi chuyển sang bước thực thi. **[ZERO-TRUST GATE]** Tuyệt đối KHÔNG ĐƯỢC tự động cập nhật ngầm AC (Acceptance Criteria) vào các Story khi chưa có sự xác nhận bằng văn bản (Approve) từ User cho file transcript.

## 🚫 ZERO-TRUST GATES (MANDATORY)
Workflow sẽ bị đánh FAIL và Hủy bỏ nếu vi phạm các rào cản vật lý sau:
1. **Physical Evidence:** File `debate-transcript.md` phải tồn tại vật lý lưu vết Cây Quyết định.
2. **Domain Triage Mapping:** Nếu kích hoạt Tier 2 (hỏi User), Agent phải trích dẫn ID của Business Rule hoặc MACRO Risk. Không có trích dẫn = Cấm hỏi.
3. **Automated Validation:** Script `python3 .agent/scripts/validate-plan-party-mode.py` sẽ tự động quét. Nếu phát hiện Banned Phrases ("I agree", "Good compromise") hoặc vi phạm Depth Limiter (hỏi quá 3 câu không có Rolling Summary), quy trình sẽ bị Abort.
4. **Triangulation Before Escalation:** Nếu kích hoạt Tier 2 (hỏi User) do Deadlock, Agent BẮT BUỘC phải có file physical evidence `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json` trích xuất từ NotebookLM. Nhảy cóc (Bypass) sang Tier 2 mà thiếu file evidence này sẽ bị đánh FAIL.
5. **Infrastructure Drift Gate:** Nếu `debate-transcript.md` có chứa các từ khóa liên quan đến kiến trúc/bảo mật, Script `python3 .agent/scripts/validate-infra-guardian-hook.py` sẽ tự động quét. Nếu thiếu file `infra-drift-evidence.json` (do Agent quên chạy `/infra-guardian`), quy trình sẽ bị đánh FAIL và yêu cầu chạy lại Guardian.
6. **Architecture Coherence Gate:** Nếu `debate-transcript.md` có chứa kết luận kỹ thuật (Locked Decisions) đề cập đến công nghệ cụ thể, Agent BẮT BUỘC phải có file `_iwish-output/adhoc-workspace/scratch/coherence-party-mode.json` từ `architecture-coherence-checker`. Nếu file không tồn tại hoặc `overall_status == FAIL`, quy trình sẽ bị đánh FAIL. Agents KHÔNG ĐƯỢC chốt quyết định kỹ thuật mà chưa verify ADR coherence.


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> Auto-triggered on Party-Mode deadlock.

### TRIANGULATION: Mandatory Dual-Source Triangulation

1. If debate reaches deadlock (2+ rounds without consensus):
   a. Load `notebook-retrieval-engine` → Pull evidence from relevant notebooks
   b. Compare NotebookLM evidence vs agent internal reasoning
   c. Calculate Evidence Delta: <20% → agree, 20-50% → merge, >50% → CRITICAL GAP
2. If MACRO risk < 0.5 is involved: Triangulation is MANDATORY
3. Enrich OP-3 (Ops-Decisions-Log) with debate transcript and resolution
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
