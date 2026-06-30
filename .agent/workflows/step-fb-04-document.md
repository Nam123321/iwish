---
description: 'Step FB-04: Document — Executed by fix-bug-protocol.md'
---

# Step FB-04: Document

## Objective
Execute the instructions defined in this step for the fix-bug-protocol.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `fix-bug-protocol.md`.

## Instructions

## Phase 7: DOCUMENT (Ghi nhận)

### 7a. SBRP Report File Rules

- Tìm file SBRP report hiện tại của session: `_iwish-output/bug-reports/YYYY-MM-sbrp-round{N}.md`
- **Nếu chưa có file cho session này** → tạo file mới, N = max(existing rounds) + 1. File mới BẮT BUỘC phải bắt đầu bằng khối OKF YAML frontmatter:
  ```yaml
  ---
  type: I-Wish Bug Report
  title: "SBRP Bug Report Round {N}"
  description: "Bug report log for session round {N}"
  resource: "file://{project-root}/_iwish-output/bug-reports/YYYY-MM-sbrp-round{N}.md"
  tags: ["bug-report", "development"]
  timestamp: "[ISO-8601]"
  links_to: []
  ---
  ```
- **Nếu đã có file cho session này** → append bug mới vào file hiện tại và cập nhật danh sách `links_to` trong frontmatter (để liên kết với story hoặc file bị ảnh hưởng).
- **Nếu session fix > 10 bugs** → tách file mới với round N+1
- Header bắt buộc: Khối OKF YAML Frontmatter ở đầu file, Date, Tier, Session scope, Bug count summary
- Naming convention: `YYYY-MM-sbrp-round{N}.md`

### 7b. Lesson Extraction & Auto-Immune Knowledge

20. **Tự động phân tích Lesson từ RCA:**
    - Tổng hợp RCA (Five Whys) và Code Graph context từ các phase trước.
    - Tạo `lesson_learned` summary cho bug. Trả lời: "Agent / Human cần làm gì khác đi để KHÔNG xảy ra lỗi này?".
    
21. **Cập nhật Hệ miễn dịch (Auto-Immune Update):**
    - **MANDATORY HOTSPOT CHECK**: Bắt buộc chạy `node scripts/hotspot-calculator.js '<file_path>'` cho các file quan trọng vừa được sửa.
    - Nếu `hotspot_score >= 30` hoặc `bug_count >= 3`, HOẶC bug là **Type A (Lặp lại)** hoặc **RPN ≥ 60**, BẮT BUỘC:
      - Thêm lesson vào `project-context.md` (vùng `### Watchouts / Immune System`) hoặc tạo một Knowledge Item mới.
      - **Auto-Immune Trigger**: Kích hoạt tự động quá trình tạo Draft Skill (Lesson Extraction) chứa các directive giúp tránh lỗi tương tự.
      - **capability-agent Capability Trigger**: Đưa Draft Skill này vào workflow `/enhance-skill` để thực hiện Dual-Run (Inhouse vs Darwinian) đánh giá trước khi promote thành Official Skill.

21b. **Auto-Immune RCA Injection (MANDATORY):**
     - Kích hoạt Knowledge Graph Injection để ghi nhớ lỗi và RCA vào Feature Graph.
     - Sử dụng CLI sau để inject RCA node, đảm bảo liên kết nó tới story hoặc epic liên quan qua metadata tags:
       ```bash
       iwish inject-node --file "<sbrp_report_file_path>" --metadata '{"summary": "<lesson_learned>", "tags": ["rca", "bug-fix", "<feature_id>"], "layer": "story", "complexity": "auto-immune"}' || echo "- [BUG-RCA] <lesson_learned>" >> "_iwish-output/edge-case-knowledge/epics/Epic-<epic_id>-rca-fallback.md"
       ```
     - Cú pháp `|| echo ...` là fallback bắt buộc. Nếu Knowledge Graph (FalkorDB) offline, lỗi sẽ không làm crash workflow mà tự động ghi log thủ công vào thư mục edge-case-knowledge tương ứng của Epic.

### 7c. Update Documents

22. **Update Edge Case Knowledge Graph:**
    - Thêm node mới vào `_iwish-output/edge-case-knowledge/pillars/p[N]-*.md`
    - Format theo ECG SKILL §5 Node Format
    - Update `index.md`

23. **Update bug tracker:**
    - Cập nhật `_iwish-output/bug-tracker.yaml` (xem template bên dưới)
    - Ghi: epic, story, bug ID, RPN, fix attempt count, status, lessonsLearned

24. **Update story spec (Decision Flow):**

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

25. **Recurring bug cross-linking (nếu Type A recurrence):**
    - Thêm banner vào SBRP report cũ: `> ⚠️ Bug này đã lặp lại — xem SBRP Round {N}`
    - Cập nhật `fixAttempts` array trong `bug-tracker.yaml`
    - Cập nhật `isRecurring: true` nếu chưa set

25b. **🔍 Intelligence Graph Refresh (MANDATORY INTELLIGENCE CHECK):**
     - Bắt buộc kiểm tra toolset. Nếu có `add_feature_relationship`:
       - Thêm relationship nếu phát hiện dependency ngầm chưa được ghi nhận.
     - **TIER 1 HYBRID GRAPH UPDATE:** (Dành cho CodeGraphContext)
       - Với TỪNG file đã thay đổi (hoặc tạo mới) trong quá trình fix, bạn BẮT BUỘC phải dùng "não" của mình để đánh giá ngữ nghĩa và cập nhật trực tiếp vào đồ thị bằng lệnh CLI:
         ```bash
         iwish inject-node --file "<fixed_file_path>" --metadata '{"summary": "Mô tả ngắn gọn về file", "tags": ["tag1", "tag2"], "layer": "business", "complexity": "low"}'
         ```
       - Layers hợp lệ: `presentation`, `business`, `data`, `infrastructure`, `config`, `unknown`
       - Việc này giúp cập nhật Code Graph tức thời (Real-time) và kết nối chéo trong FalkorDB mà không cần kích hoạt luồng background LLM đắt đỏ (Cost = 0).
       - Đảm bảo code graph phản ánh trạng thái mới sau fix ngay lập tức.

25c. **🔄 Auto-Decant & Spec Sync Engine (MANDATORY INTEGRATION):**
     - Load `.agent/skills/ag-kit-guides/context-compression-decant.md`.
     - Extract the Context Delta Block at the end of the session.
     - If the fix resolved a new edge case (`resolved_edge_cases`) not in the story's Acceptance Criteria (AC), **automatically update** `_iwish-output/3. Development/1. Epic & Story/[feature_group]/[epic]/[story].md` by appending the new AC with a `[EDGE-CASE] [BUG-XXXX]` label.
     - Automatically update progress counts and defect ratios in `_iwish-output/epics.md`.
     - Check Why #4 (Process) and Why #5 (Systemic) from RCA. If systemic issues are repeated (e.g. >= 2 similar checkpoints), trigger an immune system update by creating or enhancing skills/workflows.

---


## Phase 8: SCORING & MEASUREMENT (Đo lường)

26. **Cập nhật Bug Scorecard** trong `_iwish-output/bug-tracker.yaml`:

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

27. **Dashboard Metrics (aggregate từ bug-tracker.yaml):**

    | Metric | Đo gì | Trigger action |
    |--------|--------|----------------|
    | **Bug/Story ratio** | Số bug / story | ≥3 bugs/story → flag for restructuring |
    | **Fix Success Rate** | 1st-attempt fix / total fixes | <70% → review RCA process |
    | **Recurrence Rate** | Recurring bugs / total bugs | >30% → systemic process issue |
    | **Mean Fix Attempts** | Avg attempts per bug | >1.5 → review fix quality |
    | **Hot Story Score** | Story bugs × avg attempts | Top 3 → schedule restructuring session |
    | **Hot Epic Score** | Sum of Hot Story Scores | Highest → schedule arch review |
    | **Tier Distribution** | % Lite / Standard / Full | >50% Full → process/design issue |

28. **Restructuring Trigger Rules:**
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

29. **Monthly Report generation:**
    - Run `/fix-bug --report` to generate summary from `bug-tracker.yaml`
    - Output: `_iwish-output/bug-reports/[YYYY-MM]-bug-report.md`
    - Include: heat map per epic, hot stories, tier distribution, restructuring recommendations

30. **Generate Operation Report & Health Dashboard (HSEA-4.6):**
    - Execute `node scripts/operation-report-gen.js` to aggregate the latest sprint, codebase, and defect metrics.
    - **AGENT INSTRUCTION**: After running the report generator, explicitly notify the user in the chat that the Operation Report has been updated, and provide the absolute file URI to `_iwish-output/operation-report/index.html`.

31. **Post-Mortem Draft Patch Generation (MANDATORY):**
    - Bắt buộc sinh ra file Draft Patch (ví dụ: một Linter Rule mới hoặc SDK Patch) dựa trên RCA.
    - Lưu file patch vào thư mục `scratch/` với định dạng tên `draft-patch-<uuid>.py` (hoặc định dạng tương ứng).
    - File này sẽ được test sau trong Dual-Run Lab bằng luồng `/enhance-skill`.

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

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
