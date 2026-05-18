---
story_id: "STORY-PSA-1.2"
epic_id: "EPIC-PSA"
title: "Backward Sync Hybrid Trigger"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
phase: "forge"

---
# Story PSA-1.2: Backward Sync Hybrid Trigger

## 1. Objective
Triển khai cơ chế Hybrid Trigger (lấy cảm hứng và tiến hóa từ `to-prd`) để giải quyết bài toán Feature Drift bằng cách tự động đánh giá và kích hoạt luồng đồng bộ ngược về PRD và FeatureGraph, mà không làm gián đoạn vĩnh viễn developer velocity.

## 2. User Story
As a Product Manager / Architect,
I want the system to automatically detect implementation drift during planning and self-check using a hybrid scoring mechanism,
So that the documentation (PRD, Stories) is always updated to reflect reality without annoying developers.

## 3. Acceptance Criteria
- **AC1 (Two-Stage Scoring Engine):** Implement a Drift Scoring mechanism with two stages: Stage 1 (FeatureGraph Gate) detects if the fix/feature touches core DataEntities or Events. Nếu không tìm thấy, score tự động tăng 10 điểm để bắt buộc review. Nếu tìm thấy, tiếp tục sang Stage 2 (Point-Matrix) tính điểm drift dựa trên trọng số các yếu tố thay đổi (Data, API, Logic).
- **AC2 (User Override Layer):** Trình bày kết quả Drift Score tính được cho user. User có quyền (overwrite) thay đổi score này (ví dụ: điểm hệ thống tính là 5 nhưng user muốn tăng lên 8). Flow phía sau phải chạy theo điểm cuối cùng của user.
- **AC3 (Pause & Spawn Sub-routine - Option D):** Nếu final Drift Score > 7, kích hoạt pattern "Pause & Spawn" với Git Stash Context Isolation. Agent chạy `git stash` để bảo vệ code local. Sau đó hiển thị thông báo yêu cầu User mở **Session mới** để thực hiện quá trình đồng bộ (sync) ngược vào tài liệu PRD/FeatureGraph.
- **AC3.1 (Context Refresh):** Khi User quay lại session cũ và ra lệnh tiếp tục, Agent chạy `git stash pop`, yêu cầu giải quyết conflict (nếu có), và BẮT BUỘC dùng `view_file`/`git diff` đọc lại các file cốt lõi (schema, routes...) vừa bị thay đổi ở session kia để update LLM Context Window trước khi code tiếp.
- **AC4 (Socratic Drift Gate Integration):** Tích hợp Synthesis Report từ Socratic Review (mode `drift` từ PSA-1.1) làm đầu vào cho Stage 2 Point-Matrix scoring.

## 4. Edge Cases & Mitigations
- **Edge Case 1 (Dependency Deadlock / Out-of-Sync Context Window):** Việc cập nhật PRD/Schema ở session mới khiến file thay đổi trên ổ cứng nhưng LLM ở session cũ không biết. Nếu session cũ code tiếp sẽ gây lỗi hoặc ghi đè.
  - *Mitigation:* Phương án D (Git Stash) chặn việc ghi đè file. Bước **Context Refresh (AC3.1)** ép Agent đọc lại file sau khi resume để đồng bộ bộ nhớ, triệt tiêu hoàn toàn rủi ro này.

## 4. Dependencies
- **Depends on:** STORY-PSA-1.1 (Socratic Review Mode) — cung cấp Gate 3 `drift` mode làm trigger đầu vào.

## 5. Definition of Done
- Cập nhật định nghĩa công thức tính Drift Score (Two-Stage).
- Xây dựng workflow hỗ trợ User Override.
- Thiết kế cơ chế "Pause & Spawn" trong workflow engine.
- Tích hợp Synthesis Report từ `socratic-review` (mode `drift`) làm input cho scoring.

## 6. AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Two-Stage Scoring Engine | T1: Implement Two-Stage Scoring Logic in Drift Gate | ST1.1 (Stage 1), ST1.2 (Stage 2) | [x] |
| AC2 | User Override Layer | T2: Implement User Override Layer for Drift Score | — | [x] |
| AC3 | Pause & Spawn Sub-routine | T3: Implement Pause & Spawn Workflow Sub-routine | ST3.1 (State persistence), ST3.2 (Resume logic) | [x] |
| AC4 | Socratic Drift Gate Integration | T4: Integrate Socratic Synthesis with Stage 2 Scoring | — | [x] |

## 7. QA Simulator Guardian Audit
**7-row Hybrid Scorecard**
1. **Context Density:** 9/10 (Rõ ràng bối cảnh và lý do chọn giải pháp Hybrid).
2. **Narrative Alignment:** 9/10 (Thống nhất với mục tiêu chống Feature Drift).
3. **Constraint Explicitly:** 9/10 (Ràng buộc rõ ràng về điểm số > 7 và User Override).
4. **Edge Case Coverage:** 8/10 (Xử lý trường hợp user muốn override kết quả của máy).
5. **Data Architecture Parity:** 9/10 (Kết nối trực tiếp vào FeatureGraph).
6. **State Mutability Clarity:** 9/10 (Quản lý trạng thái Pause và Resume).
7. **UI/UX Cohesion:** 10/10 (N/A - Không có UI, nhưng luồng tương tác với developer rất tốt).
**TOTAL AVERAGE: 9.1/10**
