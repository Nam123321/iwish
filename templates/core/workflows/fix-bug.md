---
description: 'Structured Bug Resolution Process (SBRP) v2.0 — 8-phase tiered workflow for fixing bugs with RCA, impact analysis, edge-case + data-integrity checks, regression testing, scoring/tracking, and process governance.'
---

# /fix-bug — Structured Bug Resolution Process (SBRP) v2.0

> **Quy tắc vàng:** Fix đúng 1 lần > Fix nhanh 3 lần.
> Workflow này tích hợp Edge Case Guardian, Data Integrity Guardian, API Contract Guardian, **Songoku AI Guardian** (cho bugs liên quan AI/LLM), và **GitNexus Code Intelligence** (cho dependency/impact analysis).
> **v2.1:** Tiered approach, bug-reports cross-reference, recurrence classification, story spec decision flow, CGC-powered RCA & Impact.

---

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
   - Bug thuộc **Story** nào? → ghi story ID (tra cứu trong `_bmad-output/stories/`)
   - Bug thuộc loại: `UI` | `Logic` | `Data` | `API` | `State` | `Integration` | `Performance` | `Security`

3. **FMEA Score:**
   - **Severity (S):** 1=Cosmetic, 2=Minor, 3=Moderate, 4=Major, 5=Critical
   - **Probability (P):** 1=Rare, 2=Unlikely, 3=Occasional, 4=Likely, 5=Certain
   - **Detectability (D):** 1=Obvious, 2=Quick, 3=Delayed, 4=Hidden, 5=Silent
   - **RPN = S × P × D** → 🔴 ≥60 CRITICAL | 🟡 25-59 IMPORTANT | 🟢 <25 LOW

4. **Recurrence check (Type A/B classification):**
   - Kiểm tra `_bmad-output/bug-tracker.yaml` — bug này đã từng xuất hiện chưa?
   - Kiểm tra `_bmad-output/bug-reports/` — tìm SBRP report chứa bug trước đó
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

// turbo-all

5. **Đọc Story requirement:**
   - Mở story file: `_bmad-output/stories/[epic]/[story].md`
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
   - Check `_bmad-output/edge-case-knowledge/` cho edge case đã biết
   - **Check `_bmad-output/bug-reports/`** — đọc SBRP reports liên quan:
     → Tìm bug cùng file/component/feature
     → Đọc RCA và lessons learned từ bugs trước
     → Xác nhận fix trước đó còn hiệu lực không
   - **Check `_bmad-output/bug-tracker.yaml`** — lịch sử fixAttempts:
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

8b. **🐉 Songoku AI Context (nếu bug liên quan AI/LLM feature):**
    - Story có AI features không? (prompt templates, LLM calls, RAG pipeline, Cognee, embeddings)
    - Nếu CÓ → load AI context bổ sung:
      - Đọc prompt template version hiện tại: `src/modules/ai/prompts/{feature}/system.v*.md`
      - Đọc AI spec: `_bmad-output/ai-specs/{story-id}-ai-spec.md` (nếu có)
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

119. **QA Simulator Guardian Audit (Fat-Guardian Adversarial):**
    - Load SKILL: `@{project-root}/.agent/skills/qa-simulator-guardian.md`
    - Tien-Shinhan (hoặc Auditor Agent) phải kích hoạt Simulator để phân loại Code Fix (1 trong 13 Types) và chấm điểm.
    - Bắt buộc phải có **TOTAL AVERAGE Score ≥ 8.5/10** (dựa trên 6 Core Axes + UX Empathy).
    - **Delta Lock Loop:** Nếu trả về `[FIXABLE]` và Delta Score (`Current - Prev`) cải thiện `≥ 0.5`, workflow bắt buộc quăng ngược task lại Phase 5 bắt Vegeta fix tiếp.
    - Nếu trả về `[FIXABLE]` nhưng Delta `< 0.5` hoặc quá 3 vòng lặp: **HALT workflow**, không được phép gán cờ `RESOLVED`, trình báo thẳng cho End User.ếu bug liên quan data
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

14b. **🐉 Songoku AI Impact Analysis (nếu `ai_related: true`):**
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

## Phase 5: FIX (Sửa lỗi)

15. **Fix theo spec, không shortcut:**
    - Code fix PHẢI tuân thủ Story AC
    - Code fix PHẢI tuân thủ DIG rules
    - **CRITICAL ANTI-HALLUCINATION**: Không đoán mò import paths. Bắt buộc dùng CodeGraphContext (find_symbol) hoặc FeatureGraph để xác minh đường dẫn trước khi import.
    - Code fix PHẢI handle edge cases từ Phase 4.11
    - Fix tại ROOT CAUSE (not surface symptom)

16. **Fix checklist:**
    ```
    □ Fix giải quyết root cause (not symptom)?
    □ Fix tuân thủ naming convention (DIG §1)?
    □ Fix handle null/undefined edge cases?
    □ Fix sử dụng Decimal cho money (DIG §4)?
    □ Fix không hardcode values?
    □ Fix không break existing tests?
    ```

---

## Phase 6: VERIFY (Kiểm tra)

16b. **COMPILER VALIDATION GATE (BẮT BUỘC):**
     - Chạy `pnpm build`, `nest build`, hoặc `tsc --noEmit`
     - Nếu compile lỗi (MODULE_NOT_FOUND, type error) → HALT, không được chuyển sang verify. Quay lại Phase 5 fix ngay lập tức.

17. **Test case cho chính bug:**
    - Tái tạo lỗi ban đầu → confirm đã fix
    - Test edge cases phát hiện ở Phase 4

17b. **🤖 Page-Agent Post-Fix Verification (nếu UI/State bug):**
     - Load SKILL: `@{project-root}/.agent/skills/page-agent-qa/SKILL.md`
     - Re-run reproduction steps từ Phase 2.8c:
       → Bug PHẢI KHÔNG còn reproduce
       → Nếu vẫn reproduce → fix chưa đủ
     - Test edge cases xung quanh fix bằng NL commands:
       → Boundary values, empty input, double-click, etc.
     - Verify related features không bị broken:
       → Navigate to related pages → check basic functionality
     - Ghi vào SBRP report:
       ```
       page_agent_verification: PASS/FAIL
       steps_verified: [NL commands used]
       edge_cases_tested: [list]
       related_features_checked: [list]
       ```

18. **Regression test:**
    - Test các feature liên quan (từ Phase 4.14)
    - Test cross-story scenarios
    - Browser visual verification (nếu UI bug):
      - Load SKILL: `@{project-root}/.agent/skills/browser-visual-verification/SKILL.md`

19. **Code review (adversarial):**
    - Tự review với mindset "tìm lỗi"
    - Check: fix có tạo bug mới không?
    - Check: fix có violate DIG/ECG rules không?

---

## Phase 7: DOCUMENT (Ghi nhận)

### 7a. SBRP Report File Rules

- Tìm file SBRP report hiện tại của session: `_bmad-output/bug-reports/YYYY-MM-sbrp-round{N}.md`
- **Nếu chưa có file cho session này** → tạo file mới, N = max(existing rounds) + 1
- **Nếu đã có file cho session này** → append bug mới vào file hiện tại
- **Nếu session fix > 10 bugs** → tách file mới với round N+1
- Header bắt buộc: Date, Tier, Session scope, Bug count summary
- Naming convention: `YYYY-MM-sbrp-round{N}.md`

### 7b. Update Documents

20. **Update Edge Case Knowledge Graph:**
    - Thêm node mới vào `_bmad-output/edge-case-knowledge/pillars/p[N]-*.md`
    - Format theo ECG SKILL §5 Node Format
    - Update `index.md`

21. **Update bug tracker:**
    - Cập nhật `_bmad-output/bug-tracker.yaml` (xem template bên dưới)
    - Ghi: epic, story, bug ID, RPN, fix attempt count, status

22. **Update story spec (Decision Flow):**

    Quyết định dựa trên phân loại:

    | Trường hợp | Hành động | Ví dụ |
    |-------------|-----------|-------|
    | **Spec thiếu AC** cho edge case quan trọng | ✅ Thêm AC mới vào story | "AC: Empty state KHÔNG được che overlay" |
    | **AC mơ hồ**, dễ hiểu sai | ⚠️ Annotate — thêm note, không đổi AC | `<!-- BUG-XXXX: clarification -->` |
    | **Spec đúng, code sai** | ❌ KHÔNG update spec | Cart persist: spec nói localStorage, code thiếu |
    | **Implementation detail** | ❌ KHÔNG update spec | antd static vs App.useApp() |

    Ghi quyết định vào SBRP report:
    ```
    spec_update: true/false
    reason: "[lý do quyết định]"
    spec_file: "[path nếu có update]"
    ```

23. **Recurring bug cross-linking (nếu Type A recurrence):**
    - Thêm banner vào SBRP report cũ: `> ⚠️ Bug này đã lặp lại — xem SBRP Round {N}`
    - Cập nhật `fixAttempts` array trong `bug-tracker.yaml`
    - Cập nhật `isRecurring: true` nếu chưa set

23b. **🔍 Intelligence Graph Refresh (MANDATORY INTELLIGENCE CHECK):**
     - Bắt buộc kiểm tra toolset. Nếu có `add_feature_relationship`:
       - Thêm relationship nếu phát hiện dependency ngầm chưa được ghi nhận.
     - Nếu có `add_code_to_graph` (CodeGraph):
       - Refresh CodeGraph với các files đã thay đổi trong quá trình fix:
         ```
         add_code_to_graph("<fixed_file_path>")
         ```
       - Áp dụng cho TỪNG file trong danh sách files đã sửa.
       - Đảm bảo code graph phản ánh trạng thái mới sau fix.

---

## Phase 8: SCORING & MEASUREMENT (Đo lường)

24. **Cập nhật Bug Scorecard** trong `_bmad-output/bug-tracker.yaml`:

    ```yaml
    # Mỗi bug entry:
    - id: BUG-XXXX
      epic: epic-[N]
      story: story-[N.M]
      title: "Mô tả ngắn"
      type: UI|Logic|Data|API|State|Integration
      rpn: { s: 4, p: 3, d: 3, total: 36 }
      priority: CRITICAL|IMPORTANT|LOW
      sbrpTier: Lite|Standard|Full          # [MỚI] v2.0
      recurrenceType: null|TypeA|TypeB      # [MỚI] v2.0
      fixAttempts:
        - attempt: 1
          date: 2026-03-10
          rootCause: "Surface-level: Next.js dev mode quirk"
          result: FAILED  # bug lặp lại
          filesChanged: [variant-modal.tsx]
        - attempt: 2
          date: 2026-03-12
          rootCause: "Deep: wrong API URL, missing error handling"
          result: RESOLVED
          filesChanged: [variant-modal.tsx]
      totalAttempts: 2
      isRecurring: true
      status: RESOLVED|OPEN|DEFERRED
      linkedBugs: [BUG-0002]  # bugs có cùng root cause
      specUpdated: false                     # [MỚI] v2.0
      specUpdateReason: ""                   # [MỚI] v2.0
    ```

25. **Dashboard Metrics (aggregate từ bug-tracker.yaml):**

    | Metric | Đo gì | Trigger action |
    |--------|--------|----------------|
    | **Bug/Story ratio** | Số bug / story | ≥3 bugs/story → flag for restructuring |
    | **Fix Success Rate** | 1st-attempt fix / total fixes | <70% → review RCA process |
    | **Recurrence Rate** | Recurring bugs / total bugs | >30% → systemic process issue |
    | **Mean Fix Attempts** | Avg attempts per bug | >1.5 → review fix quality |
    | **Hot Story Score** | Story bugs × avg attempts | Top 3 → schedule restructuring session |
    | **Hot Epic Score** | Sum of Hot Story Scores | Highest → schedule arch review |
    | **Tier Distribution** | % Lite / Standard / Full | >50% Full → process/design issue |

26. **Restructuring Trigger Rules:**
    ```
    IF bug_count_per_story >= 3 THEN
      → Flag story for REFACTORING SESSION
    
    IF avg_fix_attempts >= 2.0 AND same_file_changed >= 3_times THEN
      → Flag file for ARCHITECTURAL REVIEW
    
    IF recurring_rate_per_epic >= 40% THEN
      → Schedule EPIC-LEVEL RESTRUCTURING
    
    IF rpn_critical_count >= 3 in same_story THEN
      → ESCALATE to Master Agent for design review
    ```

27. **Monthly Report generation:**
    - Run `/fix-bug --report` to generate summary from `bug-tracker.yaml`
    - Output: `_bmad-output/bug-reports/[YYYY-MM]-bug-report.md`
    - Include: heat map per epic, hot stories, tier distribution, restructuring recommendations

---

## Phase 9: Log Instinct (MANDATORY — Whis Capability Enhancement)

> [!IMPORTANT]
> Sau khi hoàn tất fix bug (bất kể Tier nào), Agent **BẮT BUỘC** phải ghi nhận bài học vào Machine Memory.
> Đây là cơ chế tự học tự động của hệ thống BMAD Capability Management.

28. **Ghi Instinct vào Machine Memory:**
    - Mở file `.agent/memory/instincts.jsonl`
    - Append **MỘT dòng** JSONL nén (KHÔNG viết Markdown, KHÔNG viết prose):
    ```jsonl
    {"ts":"YYYY-MM-DD","src":"fix-bug","ctx":"<tech-tags>","bad":"<root-cause-pattern>","good":"<correct-pattern>","sev":<1-5>,"file":"<file-path>","ref":"<story-or-bug-id>"}
    ```
    - **Ví dụ:**
    ```jsonl
    {"ts":"2026-04-07","src":"fix-bug","ctx":"nestjs,prisma,guard","bad":"findMany() without take limit","good":"findMany({take:50})","sev":5,"file":"order.service.ts","ref":"BUG-042"}
    ```

29. **Index vào FeatureGraph (nếu FalkorDB khả dụng):**
    ```cypher
    GRAPH.QUERY featuregraph "CREATE (:Instinct {id:'inst_<timestamp>', ctx:'<ctx>', bad:'<bad>', good:'<good>', sev:<sev>, ts:'<ts>', src:'fix-bug', resolved:false})"
    ```
    - Nếu biết Feature liên quan, tạo edge: `(:Instinct)-[:AFFECTS]->(:FR {id:'<fr_id>'})`

---

## Quick Reference: When to Escalate

| Condition | Action |
|-----------|--------|
| RPN ≥ 60 | Immediate fix (SBRP-Full), block other work |
| Bug lặp ≥ 3 lần | Mandatory restructuring session |
| Fix changes ≥ 5 files | Mandatory impact analysis + code review |
| Bug spans ≥ 3 stories | Escalate to Master Agent |
| Data corruption risk | Mandatory Kira (Data Architect) review |

## Quick Reference: SBRP Tier at a Glance

```
RPN < 15 AND first-time AND single-file?
  → 🟢 SBRP-Lite (P1 → P5 → P7 tracker)

RPN 15-59 OR recurring OR multi-file?
  → 🟡 SBRP-Standard (P1-P5 → P7 tracker+ECG → P8)

RPN ≥ 60 OR 3rd recurrence OR data/pricing?
  → 🔴 SBRP-Full (ALL 8 phases, no skip)
```
