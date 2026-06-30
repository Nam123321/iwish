---
description: 'Step FB-02: Analysis — Executed by fix-bug-protocol.md'
---

# Step FB-02: Analysis

## Objective
Execute the instructions defined in this step for the fix-bug-protocol.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `fix-bug-protocol.md`.

## Instructions

## Phase 3: ROOT CAUSE ANALYSIS (Five Whys + CGC Trace)

9. **Thực hiện Five Whys:**

   ```
   Why #1 (Surface): Lỗi biểu hiện là gì?
   → [Mô tả symptom]
   
   Why #2 (Code): Tại sao code gây ra lỗi này?
   → [Chỉ ra dòng code/file cụ thể]
   
   Why #3 (Design): Tại sao code được viết như vậy?
   → [Architecture/design decision gây ra issue]
   
   Why #4 (Process): Tại sao design review không bắt được?
   → [Process gap: thiếu test? thiếu review? thiếu spec?]
   
   Why #5 (Systemic): Tại sao process cho phép điều này xảy ra?
   → [Systemic issue: thiếu workflow? thiếu skill? thiếu guard?]
   ```

9c. **⚙️ System Design Root Cause Analysis (BẮT BUỘC cho `SystemDesignBug`):**
    - Nếu bug phân loại là `SystemDesignBug`, thực hiện phân tích kiến trúc chuyên sâu:
      - *Nghẽn cổ chai DB:* Có query nào chạy chậm do thiếu index hoặc quét toàn bộ bảng không? Có bị deadlock hay cạn connection pool không?
      - *Caching/CDN:* Dữ liệu lặp lại có bị cache miss liên tục không? Có hiện tượng cache stampede không?
      - *Rate Limiting / Idempotency:* Có thiếu giới hạn tốc độ hoặc khóa giao dịch trùng lặp không?
      - *Asynchronous / Queue:* Hàng đợi có bị nghẽn (backpressure) hoặc mất thông điệp không?
    - **Tối ưu hóa (AC3):** Nếu là bug logic hoặc UI đơn giản (không phải `SystemDesignBug`), BẮT BUỘC bỏ qua bước này để tối ưu hóa tokens.

9b. **🔍 CGC Call-Chain Trace (nếu CGC MCP server đang chạy):**
    - Dùng `find_call_chain` để trace từ buggy symbol (tìm root cause sâu hơn):
      ```
      find_call_chain("<BuggyFunction>", depth=3)
      ```
    - Dùng `find_callers` để trace upstream (ai gọi đến?):
      ```
      find_callers("<BuggyFunction>")
      ```
    - Kết quả giúp xác định Why #2 (Code) và Why #3 (Design) chính xác hơn.
    - Ghi nhận call chain vào SBRP report.

10. **Validate RCA:**
    - Root cause có giải thích TOÀN BỘ triệu chứng không?
    - Fix root cause có ngăn bug lặp lại không?
    - Nếu không → tiếp tục đào sâu

---


## Phase 4: IMPACT ANALYSIS (Phân tích tác động)

11. **Edge Case Guardian — 8-Pillar scan:**
    - Load SKILL: `@{project-root}/.agent/skills/edge-case-guardian/SKILL.md`
    - Scan feature bị ảnh hưởng qua các pillar liên quan:
      - P1 (Input Boundary) — nếu bug liên quan input
      - P2 (State Transition) — nếu bug liên quan state
      - P4 (Data Integrity) — nếu bug liên quan data
      - P5 (Integration) — nếu bug liên quan API
      - P8 (Business Rule) — nếu bug liên quan pricing/logic

12. **Data Integrity Guardian — Quick Check:**
    - Load SKILL: `@{project-root}/.agent/skills/data-integrity-guardian/SKILL.md`
    - Run §9 Validation Script:
      ```
      □ Schema có đúng naming convention không?
      □ Money fields dùng Decimal(12,2) chưa?
      □ Frontend type match response shape chưa?
      □ Nullable fields đánh dấu đúng chưa?
      □ API response format consistent chưa?
      ```

13. **API Contract Guardian check (nếu API-related):**
    - Load SKILL: `@{project-root}/.agent/skills/api-contract-guardian/SKILL.md`
    - Verify route definition in `api-routes.ts`
    - Check FE client matches BE controller

14. **Cross-file dependency check:**
    - Tìm tất cả files import/dùng code sẽ sửa
    - Liệt kê side effects tiềm ẩn
    - Xác nhận fix không break file khác

14c. **🔍 CGC Blast Radius Analysis (nếu CGC MCP server đang chạy):**
    - Chạy `find_callers` cho TẤT CẢ symbols sẽ thay đổi:
      ```
      find_callers("<SymbolToChange>")
      ```
    - Chạy `find_call_chain` để xem full downstream impact:
      ```
      find_call_chain("<SymbolToChange>", depth=3)
      ```
    - Nếu callers count > 5 → mandatory peer review.
    - Ghi blast radius vào SBRP report:
      ```
      cgc_blast_radius:
        symbols_changed: [list]
        callers_count: N
        risk_level: low|medium|high
      ```

14b. **🐉 ai-engineer-agent AI Impact Analysis (nếu `ai_related: true`):**
    - Load SKILL: `@{project-root}/.agent/skills/prompt-engineering-guardian/SKILL.md`
    - Load SKILL: `@{project-root}/.agent/skills/ai-cost-optimizer/SKILL.md`
    
    **AI-specific checks:**
    ```
    □ Prompt template regression: phiên bản hiện tại có bị thay đổi gây bug không?
    □ Model tier: bug do model tier quá thấp (accuracy issue) hay quá cao (cost issue)?
    □ Token budget: output bị cắt do max_tokens quá thấp?
    □ RAG pipeline: retrieval trả về context sai/không đủ?
    □ Injection vulnerability: user input bypass system prompt?
    □ PII leak: output chứa thông tin nhạy cảm?
    □ Hallucination: AI trả về thông tin không có trong context?
    □ Caching: semantic cache trả về kết quả cũ/sai?
    □ Tenant isolation: AI truy cập data tenant khác?
    □ Latency: timeout gây lỗi silent failure?
    ```
    
    **RCA bổ sung cho AI bugs:**
    - Why #AI-1: Prompt template có defensive instructions không?
    - Why #AI-2: Model tier có phù hợp với task complexity không?
    - Why #AI-3: Golden tests có cover scenario này không?
    - Why #AI-4: Monitoring có detect anomaly này không?

---

> [!IMPORTANT]
> **IRON LAW OF DEBUGGING (MANDATORY):**
> Before executing this fix phase, you MUST use `view_file` to load `/.agent/fragments/iron-law-debug.md`. You must enforce the 3-Strike Rule, Scope Lock, and never apply band-aid fixes.

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
