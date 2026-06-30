---
description: 'Step FB-01: Triage — Executed by fix-bug-protocol.md'
---

# Step FB-01: Triage

## Objective
Execute the instructions defined in this step for the fix-bug-protocol.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `fix-bug-protocol.md`.

## Instructions

## SBRP Tier Decision (BẮT BUỘC — chạy trước khi fix)

> [!IMPORTANT]
> Agent PHẢI chạy Phase 1 (TRIAGE + FMEA Score) trước khi quyết định tier.
> **Không được** "cảm giác đơn giản" → skip SBRP. Score trước, quyết định sau.

1. Chạy Phase 1 (TRIAGE + FMEA Score)
2. Xác định tier dựa trên FMEA RPN:

| Tier | Điều kiện | Phases bắt buộc | Phases tùy chọn |
|------|-----------|------------------|-----------------|
| 🟢 **SBRP-Lite** | RPN < 15 AND first occurrence AND single-file fix | P1, P5, P7 (tracker only) | P2-P4, P6, P8 |
| 🟡 **SBRP-Standard** | RPN 15-59 OR recurring OR multi-file | P1-P5, P7 (tracker + ECG), P8 | P6 (full regression) |
| 🔴 **SBRP-Full** | RPN ≥ 60 OR 3rd recurrence OR data/pricing bug | **TẤT CẢ 8 phases bắt buộc** + peer review | Không cho phép skip |

3. Ghi tier vào SBRP report header: `> **SBRP Tier:** 🟢 Lite | 🟡 Standard | 🔴 Full`
4. Tuân thủ bắt buộc phases theo tier — KHÔNG được skip

---


## Phase 1: TRIAGE (Phân loại)

1. **Xác định bug:**
   - Mô tả chính xác: lỗi gì, ở đâu, khi nào xảy ra
   - Screenshot/video nếu có
   - Console error message (nguyên văn)

2. **Classification:**
   - Bug thuộc **Epic** nào? → ghi epic ID
   - Bug thuộc **Story** nào? → ghi story ID (tra cứu trong `_iwish-output/3. Development/1. Epic & Story/`)
   - Bug thuộc loại: `UI` | `Logic` | `Data` | `API` | `State` | `Integration` | `Performance` | `Security` | `SystemDesignBug` (ví dụ: quá tải CPU, nghẽn database, chậm kết nối, rò rỉ bộ nhớ, hoặc phản hồi chậm dưới tải cao)

3. **FMEA Score:**
   - **Severity (S):** 1=Cosmetic, 2=Minor, 3=Moderate, 4=Major, 5=Critical
   - **Probability (P):** 1=Rare, 2=Unlikely, 3=Occasional, 4=Likely, 5=Certain
   - **Detectability (D):** 1=Obvious, 2=Quick, 3=Delayed, 4=Hidden, 5=Silent
   - **RPN = S × P × D** → 🔴 ≥60 CRITICAL | 🟡 25-59 IMPORTANT | 🟢 <25 LOW

4. **Recurrence check (Type A/B classification):**
   - Kiểm tra `_iwish-output/bug-tracker.yaml` — bug này đã từng xuất hiện chưa?
   - Kiểm tra `_iwish-output/bug-reports/` — tìm SBRP report chứa bug trước đó
   - **Nếu lặp — phân loại:**
     - **Type A** (cùng root cause, fix trước không đủ sâu):
       → Thêm `fixAttempt` entry vào `bug-tracker.yaml` cho bug cũ
       → Thêm recurrence banner vào SBRP report cũ: `> ⚠️ Bug này đã lặp lại — xem SBRP Round {N}`
       → Ghi analysis chi tiết vào SBRP report **hiện tại** (với ref: `BUG-XXXX (recurrence, see Round {prev})`)
     - **Type B** (cùng triệu chứng, khác root cause):
       → Tạo bug ID mới
       → Liên kết qua `linkedBugs` field
   - Nếu lặp → auto-escalate Severity +1
   - Ghi `fixAttempt` count

---


## Phase 2: CONTEXT (Bối cảnh)

> **MANDATORY COGNITIVE LOADING:**
> 1. Load `.agent/skills/ag-kit-guides/context-compression.md` to optimize tokens.
> 2. Load `.agent/skills/ag-kit-guides/sbrp-coordinator-rules.md` to enable parallel reads.

// turbo-all

5. **Đọc Story requirement:**
   - Mở story file: `_iwish-output/3. Development/1. Epic & Story/[feature_group]/[epic]/[story].md`
   - Đọc Acceptance Criteria liên quan đến bug
   - Xác nhận: bug vi phạm AC nào?

6. **Đọc Data Architecture spec:**
   - Mở data-arch file liên quan (nếu bug liên quan data/API)
   - Kiểm tra Prisma schema cho entity bị ảnh hưởng
   - Kiểm tra API contract (`api-routes.ts`) cho endpoint bị ảnh hưởng

7. **Đọc UI Spec (nếu UI bug):**
   - Mở UI spec file cho story
   - Xác nhận: UI hiện tại khác spec ở đâu?

8. **Cross-reference (bao gồm bug history):**
   - Liệt kê các story/feature liên quan (cùng dùng component/service bị bug)
   - Check Knowledge Items cho bug tương tự
   - Check `_iwish-output/edge-case-knowledge/` cho edge case đã biết
   - **Check `_iwish-output/bug-reports/`** — đọc SBRP reports liên quan:
     → Tìm bug cùng file/component/feature
     → Đọc RCA và lessons learned từ bugs trước
     → Xác nhận fix trước đó còn hiệu lực không
   - **Check `_iwish-output/bug-tracker.yaml`** — lịch sử fixAttempts:
     → Bug trước có `linkedBugs` nào liên quan không?
     → `lessonsLearned` từ bugs cũ áp dụng được không?

8d. **🔍 CodeGraphContext Query (MANDATORY INTELLIGENCE CHECK):**
    - Bắt buộc kiểm tra toolset xem có `find_callers` không. Nếu có:
    - Chạy `find_callers` + `find_callees` cho symbol/class/function bị bug:
      ```
      find_callers("<BuggySymbolName>")
      find_callees("<BuggySymbolName>")
      ```
    - Ghi nhận: incoming callers, outgoing calls liên quan.
    - Dùng kết quả để mở rộng danh sách cross-reference ở bước 8.

8e. **🧠 FeatureGraph Cross-Feature Check (MANDATORY INTELLIGENCE CHECK):**
    - Bắt buộc kiểm tra toolset xem có `feature_impact` không. Nếu có:
    - Xác định bug thuộc FR nào (từ story file hoặc AC reference).
    - Gọi `feature_impact(fr_id, depth=2)` để tìm các tính năng liên đới.
    - Gọi `cross_feature(bugged_fr, related_fr)` nếu nghi ngờ 2 FR chia sẻ entity.
    - Ghi nhận kết quả vào SBRP report:
      ```
      featuregraph_context:
        bugged_fr: FR8
        impacted_frs: [FR9, FR12, FR29]
        shared_entities: [PricingStrategy, PriceLevel]
        cross_portal_risk: [admin, webstore, sales-app]
      ```
    - **Nếu impacted_frs > 3:** Tự động ghi `⚠️ HIGH CROSS-FEATURE RISK` vào report header.
    - **Nếu confidence < 0.8 trên relationship:** Hỏi Master xác nhận trước khi kết luận RCA.

8b. **🐉 ai-engineer-agent AI Context (nếu bug liên quan AI/LLM feature):**
    - Story có AI features không? (prompt templates, LLM calls, RAG pipeline, Cognee, embeddings)
    - Nếu CÓ → load AI context bổ sung:
      - Đọc prompt template version hiện tại: `src/modules/ai/prompts/{feature}/system.v*.md`
      - Đọc AI spec: `_iwish-output/ai-specs/{story-id}-ai-spec.md` (nếu có)
      - Check model tier assignment trong code
      - Check token budget vs actual usage (nếu có monitoring)
      - Ghi nhận: `ai_related: true` vào SBRP report

8c. **🤖 Page-Agent Bug Reproduction (nếu UI/State/Integration bug):**
    - Load SKILL: `@{project-root}/.agent/skills/page-agent-qa/SKILL.md`
    - Nếu bug report có reproduction steps:
      → Translate steps thành Page-Agent NL commands (tiếng Việt)
      → Auto-replay steps → verify bug reproduces
      → Capture DOM state + console errors tại thời điểm bug
    - Ghi kết quả vào SBRP report:
      ```
      page_agent_reproduction: true/false
      reproduction_steps: [NL commands used]
      dom_state_at_bug: [key DOM elements]
      ```

---

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
