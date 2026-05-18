---
story_id: "STORY-PSA-3.2"
epic_id: "EPIC-PSA"
title: "Deletion Test Implementation & Dynamic Test Runner Sandbox"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
phase: "forge"

---
# Story PSA-3.2: Deletion Test Implementation & Dynamic Test Runner Sandbox

## 1. Objective
Hiện thực hóa triết lý "Deletion Test" của Matt Pocock thành một cơ chế tự động (Hard Gate) sử dụng Sandbox cách ly. Hệ thống sẽ áp dụng "Chiến lược Test Runner Đa Tầng" (Multi-Tier Strategy) với khả năng nhận diện ngữ cảnh động (Dynamic Detection) để hỗ trợ các công nghệ đa dạng (Web, Mobile, Logic) mà không làm lãng phí token hay gây rủi ro phá hủy source code của người dùng.

## 2. Tracer Bullet
**Vertical Slice:** Từ việc **[1] Agent phát hiện cấu trúc cần Deletion Test (Trigger)** -> **[2] Yêu cầu User Xác nhận & Cấu hình Test Runner (Pre-flight Checklist)** -> **[3] Thực thi sandbox cách ly (iwish-deletion-test.sh)** -> **[4] Trả về báo cáo Architectural Depth**.

## 3. User Story
As a Developer Agent (Vegeta),
I want to execute Deletion Tests safely in an isolated sandbox with dynamically detected test runners,
So that I can empirically prove architectural depth and prevent shallow module proliferation without risking the working tree or assuming a hardcoded framework.

## 4. Acceptance Criteria
- **AC1 (Triggers & Workflows):** Đặc vụ CHỈ đề xuất Deletion Test cho 4 trường hợp: New Architectural Abstraction, Shallow Module Suspicions, High-Severity Bugs (P0/P1 - Inverse Deletion Test), và Manual Opt-in. (Cập nhật workflows `iwish-bmm-dev-story.md` và `fix-bug.md`).
- **AC2 (Pre-flight Checklist):** Kích hoạt Hard Gate bắt buộc với các tiêu chí: `TEST RUNNER SETUP` (Agent detect và User verify), `TEST COVERAGE`, `BOUNDARY ISOLATION`, và `USER APPROVAL`.
- **AC3 (Sandbox Engine):** Script `.agent/scripts/iwish-deletion-test.sh` khởi tạo thư mục tạm `_iwish-sandbox`, xử lý xóa/comment code, chạy lệnh test phù hợp (Vitest/Playwright/Maestro) và tự động dọn dẹp.
- **AC4 (Guardrails):** Cập nhật `anti-sycophancy.md` và cấu hình linter để ngăn chặn "Magic Numbers" và "Context Leaks" lúc commit.

## 5. Context Inheritance
- **Parent Story:** EPIC-PSA
- **Shared Models:** Workflows hiện hành (`iwish-bmm-dev-story.md`, `fix-bug.md`).
- **Assumed State:** I-Wish runtime và các file kỹ năng (anti-sycophancy, qa-simulator-guardian) đã tồn tại.
- **Output Contract:** Script `iwish-deletion-test.sh` sẽ trả về `exit code 0` nếu Deletion Test fail (Pass Gate) và `exit code 1` nếu Deletion Test pass (Fail Gate - module quá cạn).

## 6. AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1   | Update Workflow Triggers | T1: Update Workflows | ST1.1: Modify Dev Story<br>ST1.2: Modify Fix Bug | [x] |
| AC2   | Implement Pre-flight Checklist | T1: Update Workflows | ST1.3: Add Checklist & Approvals | [x] |
| AC3   | Create Sandbox Script | T2: Sandbox Engine | ST2.1: Dynamic detection logic<br>ST2.2: Isolated test execution | [x] |
| AC4   | Update Guardrails (Linter & Anti-syco) | T3: Security Guardrails | ST3.1: Anti-sycophancy update<br>ST3.2: Linter configs | [x] |

## 7. QA Simulator Guardian Scorecard
| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | Cung cấp luồng logic Sandbox hoàn chỉnh không ảnh hưởng code thực tế. |
| Data Integrity & State | 10 | Cách ly hoàn toàn state trong thư mục `_iwish-sandbox/`. |
| Security & Validation | 9 | Pre-flight checklist hoạt động như cổng bảo mật chống việc tự động thực thi tùy tiện. |
| Performance & Scalability | 8 | Tốn chi phí I/O khi rsync thư mục, nhưng chấp nhận được cho mục đích test cục bộ. |
| Error Handling & Recovery | 9 | Có cơ chế dọn dẹp (cleanup) sandbox kể cả khi test runner crash. |
| Architectural Depth & Leverage | 10 | Trực tiếp đánh giá và ép buộc Deep Modules. Đòn bẩy kiến trúc cực kỳ cao. |
| UX Empathy | 9 | Sử dụng Dynamic Detection giúp giảm thiểu việc tra hỏi User về config, tăng tính thân thiện. |

**TOTAL AVERAGE:** 9.14/10
**Architectural DNA Check:**
- [x] Tracer Bullet?
- [x] Deletion Testable?
- [x] Interface vs Implementation?
