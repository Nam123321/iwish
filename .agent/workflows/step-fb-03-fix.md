---
description: 'Step FB-03: Fix — Executed by fix-bug-protocol.md'
---

# Step FB-03: Fix

## Objective
Execute the instructions defined in this step for the fix-bug-protocol.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `fix-bug-protocol.md`.

## Instructions

## Phase 5: FIX (Sửa lỗi)

> **SOCRATIC REVIEW DRIFT GATE (CONDITIONAL)**
> Before finalizing the implementation plan for the fix, check the scope of the changes. The Socratic Drift Review (`socratic-review` mode: `drift`) MUST ONLY be invoked if the fix introduces changes to data models, external APIs, or architectural constraints (as defined in FeatureGraph). For trivial or mechanical fixes (e.g., typos, CSS tweaks, simple UI logic), skip this gate to prevent developer fatigue.
> If triggered, use the Progressive Socratic Loop to clarify if the PRD/Story needs a backward sync.
> **Two-Stage Scoring Engine & Pause & Spawn (Option D):** When calculating Drift, use Stage 1 (FeatureGraph Gate) and Stage 2 (Point-Matrix), present the score and you MUST explicitly STOP execution (e.g., using `request_feedback` flag) to allow User Override. If the final Score > 7, you MUST update the story-specific or session artifact `task.md` with `[PAUSED - WAITING FOR DRIFT SYNC]`, run `git stash -u`, PAUSE the fix workflow, and instruct the User to open a NEW CHAT SESSION to sync the documentation.
> **Context Refresh (Resume):** Upon returning, first read the story-specific or session artifact `task.md` to recover your SBRP phase state. Then run `git stash pop`, resolve conflicts, and CRITICALLY use `git diff --name-only stash@{0}^!` or `git status` to deterministically identify and `view_file` the updated files, ensuring the LLM Context Window is synchronized before proceeding.

15. **Fix theo spec, không shortcut:**
    - **GOLDEN RULE (Never Delegate Understanding):** Coordinator/Orchestrator must write explicit, line-specific prompt instructions for worker agents. Do not delegate understanding.
    - **SEQUENTIAL WRITES:** If fixing multiple files, apply edits sequentially one-by-one.
    - Code fix PHẢI tuân thủ Story AC
    - Code fix PHẢI tuân thủ DIG rules
    - **CRITICAL ANTI-HALLUCINATION**: Không đoán mò import paths. Bắt buộc dùng CodeGraphContext (find_symbol) hoặc FeatureGraph để xác minh đường dẫn trước khi import.
    - **ZOOM-OUT CHECKPOINT**: Nếu agent đang sửa cùng 1 file liên tục ≥3 lần mà lỗi vẫn chưa resolved, PHẢI kích hoạt Zoom-Out Heuristic (`@{project-root}/.agent/skills/pivot-guardian/SKILL.md` §4) để map module neighborhood (callers + dependencies) trước khi tiếp tục. Đây là tín hiệu tunnel vision — có thể root cause nằm ở module khác.
    - Code fix PHẢI handle edge cases từ Phase 4.11
    - Fix tại ROOT CAUSE (not surface symptom)
    - **FIX SCOPE CLASSIFICATION (Surgical vs Clean Up)**:
      - 🔴 **SBRP-Full (RPN ≥ 60) HOẶC Blast Radius lớn (Callers > 5):** Bắt buộc **Surgical Changes**. Thay đổi phải ở mức tối thiểu, tuyệt đối không refactor hoặc dọn dẹp các dòng code không liên quan để tránh Regression.
      - 🟢/🟡 **SBRP-Lite / Standard:** Ưu tiên **Clean Up** (Boy Scout Rule). Khuyến khích dọn dẹp code thối, thêm type safety xung quanh khu vực fix.
      - **Simplicity First**: Luôn chọn giải pháp đơn giản nhất, không over-engineering.

15b. **Architecture Guardian (God File Prevention):**
     - Đảm bảo file đang được sửa hoặc tạo mới không vượt quá **ngưỡng 300-500 dòng** (ngoại trừ auto-generated code).
     - **Workflow Continuity:** Nếu trong quá trình fix, số dòng code tạm thời vượt ngưỡng này, bạn được phép hoàn thành việc sửa lỗi để đảm bảo bug thực sự được giải quyết và code chạy đúng (Make it work).
     - Tuy nhiên, **trước khi kết thúc Phase 5** (và chuyển sang Phase 6), bạn BẮT BUỘC phải gọi quy trình `/refactor` để bóc tách file lớn đó thành các module nhỏ hơn. Không bao giờ để lại một "God File" sau khi fix bug.

16. **Fix checklist:**
    ```
    □ Fix giải quyết root cause (not symptom)?
    □ Fix tuân thủ naming convention (DIG §1)?
    □ Fix handle null/undefined edge cases?
    □ Fix sử dụng Decimal cho money (DIG §4)?
    □ Fix không hardcode values?
    □ Fix không break existing tests?
    □ Fix Scope: Được phân loại đúng (Surgical cho rủi ro cao, Clean up cho rủi ro thấp)?
    □ Fix follows SIMPLICITY FIRST (không over-engineering)?
    ```

16c. **DATA-SPEC SYNC CHECK via FeatureGraph (ADR-002):**
     - Bắt buộc kiểm tra toolset xem có `add_data_entity` MCP tool không. Nếu KHÔNG → skip bước này.
     - Nếu CÓ → kiểm tra:
       ```
       □ Fix có thay đổi Prisma schema không?
         → Query: MATCH (s:Story {id: $storyId})-[:USES_ENTITY]->(de:DataEntity) RETURN de
         → So sánh Prisma changes vs DataEntity nodes
         → Nếu LỆCH → call add_data_entity() to update
       □ Fix có thêm event/emit mới không?
         → Nếu CÓ → call add_event() to register
       □ Fix có thay đổi seed data không?
         → Nếu CÓ → call add_seed_data() to update
       ```
     - **Enforcement theo SBRP Tier:**
       - 🔴 SBRP-Full (RPN ≥ 60): FeatureGraph update = **MANDATORY** — không approve nếu chưa update
       - 🟡 SBRP-Standard: FeatureGraph update = **RECOMMENDED** — ghi nhận vào report nếu skip
       - 🟢 SBRP-Lite: FeatureGraph update = **OPTIONAL** — chỉ update nếu schema thay đổi
     - Ghi vào SBRP report: `featuregraph_updated: true/false`

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

18b. **INVERSE DELETION TEST GATE (🔴 SBRP-Full Only):**
     - Dành cho bug High-Priority (RPN ≥ 60). Bắt buộc chạy Inverse Deletion Test để chứng minh fix hợp lệ.
     - Dùng `bash .agent/scripts/iwish-deletion-test.sh <target-fix>` hoặc comment out đoạn code vừa fix.
     - Chạy regression test suite. Test BẮT BUỘC phải FAIL (chứng tỏ test suite bắt được lỗi và fix có tác dụng).
     - Restore fix, test suite phải PASS.

19. **Code review & QA Simulator Guardian Audit (Fat-Guardian Adversarial):**
    - Load SKILL: `@{project-root}/.agent/skills/qa-simulator-guardian.md`
    - qa-agent (hoặc Auditor Agent) phải kích hoạt Simulator để phân loại Code Fix (1 trong 13 Types) và chấm điểm.
    - Bắt buộc phải có **TOTAL AVERAGE Score ≥ 8.5/10** (trên 6 Core Axes + UX Empathy).
    - **Delta Lock Loop Protection:** Check `fixAttempts` trong `_iwish-output/bug-tracker.yaml`.
      - Nếu trả về `[FIXABLE]` và Delta Score cải thiện `>= 0.5`, bẻ khóa workflow trở lại Phase 5 bắt dev-agent fix tiếp.
      - Nếu số vòng lặp `fixAttempts` đã vượt quá 3, HOẶC Delta tăng không đủ `< 0.5` → **HALT workflow**, không được gán cờ `RESOLVED`, báo cáo thất bại cho User!

---

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
