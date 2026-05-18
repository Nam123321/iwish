# Story SP-2: Escalation Protocol — Chuẩn Hóa Giao Tiếp Liên Agent

## Story ID: SP-2
## Epic: SP-ABSORB (Superpowers Absorption)
## Status: Todo
## Priority: P0 (Critical — Cross-cutting concern)
## Estimated Effort: Small

---

## User Story

> **As a** I-Wish Agent orchestrator,
> **I want** all agents to communicate their task completion status using standardized escalation flags and strict retry limits,
> **So that** ambiguous reports like "có vẻ ổn" are replaced by structured statuses, and agents are prevented from blindly attempting failed fixes without reading documentation.

---

## Background & Rationale

**Source:** Superpowers Subagent-Driven Development escalation states.

LLM agents frequently fall into "tunnel vision" when debugging — repeatedly applying the same failed fixes, ignoring documentation, and burning through tokens. The Escalation Protocol acts as a hard circuit breaker. 
By defining 4 strict status codes (`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`), we eliminate ambiguity. Furthermore, by enforcing a strict 3-retry limit on build/logic errors and mandating context-reading before escalation, we force the agent to step back, read the docs, and package the problem clearly for human or senior-agent intervention.

---

## Acceptance Criteria

### AC-1: Escalation Triggers & Retry Limits (Ngưỡng Kích Hoạt)
- [ ] Mọi agent phải tuân thủ giới hạn retry (thử sai) nghiêm ngặt:
  - Lỗi Build/Compile: Tối đa **3 lần** retry.
  - Lỗi Logic/Test Fail: Tối đa **3 lần** retry.
- [ ] **Bắt buộc đọc tài liệu:** Trước khi thực hiện retry hoặc trước khi chuyển trạng thái sang `BLOCKED`/`NEEDS_CONTEXT`, Agent BẮT BUỘC phải dùng công cụ tìm kiếm (`grep_search`, `view_file`...) để đọc code/docs liên quan. Không được đoán mò.

### AC-2: Standardized Escalation Flags (Trạng Thái Báo Cáo)
- [ ] Protocol định nghĩa chính xác 4 cờ trạng thái báo cáo (không dùng ngôn ngữ tự do):
  - `DONE`: Task completed, full evidence provided (theo quy chuẩn SP-1).
  - `DONE_WITH_CONCERNS`: Task completed but agent has reservations (kèm danh sách concerns).
  - `BLOCKED`: Agent cannot proceed.
  - `NEEDS_CONTEXT`: Agent needs more information to proceed.

### AC-3: Escalation Payload (Báo Cáo Bế Tắc)
- [ ] Khi gặp cờ `BLOCKED` hoặc `NEEDS_CONTEXT`, Agent phải tạo một file báo cáo (ví dụ `escalation-report.md`) lưu vào scratch/artifacts.
- [ ] Báo cáo (Escalation Payload) phải bao gồm đầy đủ 4 phần:
  1. **Lỗi hiện tại:** (Kèm Error Logs rõ ràng).
  2. **Các cách đã thử:** (Giải thích ngắn gọn tại sao thất bại).
  3. **Các file/tài liệu đã đọc:** (Liệt kê rõ các file path để chứng minh đã thu thập đủ context, tránh lười đọc).
  4. **Câu hỏi / Đề xuất:** (Gợi ý hướng xử lý tiếp theo hoặc xin chỉ thị cụ thể).
- [ ] Agent gửi tin nhắn tóm tắt lên chat kèm cờ trạng thái và link tới file `escalation-report.md`.

### AC-4: Core Prompt & Workflow Integration
- [ ] Protocol được tích hợp bằng cách **nâng cấp skill `pivot-guardian`** (Single Source of Truth) thay vì tạo fragment mới để tránh chồng chéo.
- [ ] Dọn dẹp fragment cũ `.agent/fragments/iron-law-debug.md` (chuyển thành con trỏ tới pivot-guardian).
- [ ] Cập nhật danh sách "Banned Phrases": "có vẻ ổn", "đã xử lý", "looks good", "should work".

---

## Technical Tasks

1. **Task 1: Upgrade Pivot Guardian Skill**
   - Chỉnh sửa `.agent/skills/pivot-guardian/SKILL.md`.
   - Đổi luật 2-Strike thành 3-Retry Escalation. Định nghĩa 4 status flags, và bắt buộc đọc docs.
   - Định nghĩa mẫu Escalation Payload (4 phần) và Banned Phrases.

2. **Task 2: Update Iron Law Debug Fragment**
   - Xóa logic trùng lặp trong `.agent/fragments/iron-law-debug.md`.
   - Cập nhật thành pointer hướng dẫn Agent tuân thủ `pivot-guardian`.

---

## AC-Task Traceability Matrix

| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC-1 | Giới hạn 3 lần retry & Bắt buộc đọc docs | T1: Upgrade Pivot Guardian | - | [x] |
| AC-2 | Định nghĩa 4 status flags | T1: Upgrade Pivot Guardian | - | [x] |
| AC-3 | Tạo Escalation Payload (4 phần) | T1: Upgrade Pivot Guardian | - | [x] |
| AC-4 | Tích hợp vào Workflow & Core Prompts | T2: Update Iron Law Debug | - | [x] |

---

## Plan Tune Heuristic (Complexity Score)

- **AC Volume:** 4 ACs (+0)
- **Data Model Spread:** 0 models (+0)
- **UI Surface:** 0 components (+0)
- **Cross-Domain:** 0 (+0)
- **Flow Complexity:** Basic state machine for Agent status (+2)
- **Test Burden:** 0 (+0)
- **Total CS:** **2** (✅ OK - Proceed normally)

---

## Dependencies
- Phụ thuộc: STORY-SP-1 (Evidence Block format for DONE flag).
- Cần sửa: Các file Workflow.

---

## 🛡️ QA Simulator Guardian Audit

**Fat-Guardian 7-Row Hybrid Scorecard:**

| Axis | Score | Justification |
|---|---|---|
| **State/Data Integrity** | 10/10 | Giúp bảo vệ codebase khỏi sự can thiệp mù quáng của Agent khi rơi vào vòng lặp lỗi. |
| **Concurrency/Race** | 10/10 | N/A cho luồng tĩnh. |
| **Permissions/Auth** | 10/10 | N/A. |
| **Edge Cases** | 9/10 | Giải quyết edge case lớn nhất: Agent cố lấp liếm lỗi hoặc báo cáo chung chung. Việc bắt buộc liệt kê tài liệu đã đọc ngăn chặn thói quen "fake knowledge". |
| **Idempotency** | 10/10 | Format báo cáo quy chuẩn dễ dàng xử lý lặp lại. |
| **Performance** | 10/10 | Ngưỡng 3 lần retry tiết kiệm một lượng lớn chi phí token từ việc Agent lặp vô tận, đồng thời Fragment nhẹ không gây bloat. |
| **UX Empathy** | 10/10 | User nhận được báo cáo rõ ràng thay vì một đống log lỗi hỗn độn, dễ dàng debug và hỗ trợ Agent hơn. Chuyển giao ngữ cảnh gọn gàng. |
| **TOTAL AVERAGE** | **9.85 / 10** | **PASS** (Requires >= 8.5) |
