---
story_id: "STORY-SIM-1.3"
epic_id: "EPIC-SIM-01"
title: "Tích hợp QA Simulator ảo hóa (Pre-code) vào quy trình Define (PRD & Story)"
status: "READY_FOR_VEGETA"
assignee: "Vegeta"
phase: "forge"

---
# Story 1.3: Tích hợp QA Simulator ảo hóa (Pre-code) vào quy trình Define (PRD & Story)

## 1. Mục tiêu (Objective)
Triển khai chiến lược **Shift-Left Testing** (Giám sát chất lượng từ sớm). Chúng ta sẽ bơm **Fat-Guardian Simulator** (`qa-simulator-guardian.md`) vào ngay giai đoạn định hình yêu cầu (Define Phase). Mục tiêu là biến tài liệu PRD và User Story thành các bản thiết kế không có lổ hổng logic, ép buộc tư duy Thấu cảm Người dùng (UX Empathy) và 8-Pillars *trước* khi lập trình viên viết bất kỳ dòng code nào.

---

## 2. Target Users & Personas
- **Bulma / Master-Roshi (Product Manager / Architect):** Khi chạy lệnh `@[/create-prd]` hoặc `@[/create-story]`, Đặc vụ bắt buộc phải kích hoạt Simulator để tự chấm điểm tài liệu vừa mới soạn thảo.
- **Vegeta / Tien-Shinhan (Developer / Tester):** Được hưởng lợi trực tiếp từ những tài liệu Spec trọn vẹn, không mâu thuẫn, có bao gồm đầy đủ chỉ dẫn về Edge Cases và Real-User Empathy.

---

## 3. Scope & Phạm vi Triển khai
1. **Sửa đổi Workflow `/create-prd`:** Cắm chốt kiểm duyệt "Mental QA Run" ở bước cuối trước khi đóng dấu hoàn tất PRD.
2. **Sửa đổi Workflows nhánh Story (`/create-story` & `/create-epics-and-stories`):** Cắm chốt kiểm duyệt ở bước cuối trước khi xuất file markdown của Epic hoặc Story.
3. **Cơ chế Báo cáo:** Biên bản Scorecard (7-trục) phải được in trực tiếp vào đuôi của file PRD hoặc Story nhằm làm bằng chứng Audit.

---

## 4. Acceptance Criteria (Tiêu chí hoàn thành BẮT BUỘC)

### AC1: Pre-Code Gating cho `/create-prd`
- **GIVEN** The Product Manager Agent (Bulma/Master-Roshi) finishes writing the PRD using the `/create-prd` workflow.
- **WHEN** The workflow reaches the finalization phase.
- **THEN** The agent MUST invoke the Fat-Guardian QA Simulator.
- **AND** Classify the artifact as **Type 10: Technical / API / System Architecture Spec** (or equivalent Requirement Document).
- **AND** The generated PRD MUST NOT be finalized unless the `TOTAL AVERAGE Score ≥ 8.5/10`. If it fails, the workflow must loop back to fix the logical gaps (Delta loop protection applies).

### AC2: Pre-Code Gating cho `/create-story`
- **GIVEN** The Agent executes the `/create-story` or `/create-epics-and-stories` workflow.
- **WHEN** Drafting the Markdown file for the new Epic or Story.
- **THEN** The agent MUST invoke the Fat-Guardian QA Simulator.
- **AND** The artifact must be evaluated for **UX Empathy** (Are the user personas properly empathized?) and **Edge Case Guardrails** (Are bounds properly specified in the Acceptance Criteria?).
- **AND** Minimum passing score applied.

### AC3: In-file Scorecard Imprint
- **GIVEN** A valid PRD or Story has passed the Simulator Audit.
- **WHEN** Saving the Markdown output to disk (`_iwish-output/stories/...`).
- **THEN** The document MUST include a markdown section at the bottom (e.g., `## QA Audit Scorecard`) containing the 6-Core Axes and UX Empathy scores produced by the simulation.

### AC4: Bảo Toàn Tốc Độ Phản Hồi (Token Optimization)
- **GIVEN** Simulator checks PRDs and Stories.
- **WHEN** Triggering the invocation.
- **THEN** Do NOT hardcode the Simulator skill into Bulma/Master-Roshi's `agent.yaml` identity. Instead, instruct them via the workflow (`create-prd.md` / `create-story.md`) to dynamically load `qa-simulator-guardian.md` ON-DEMAND to conserve context space.

---

## 5. Technical Constraints & Design Considerations
- **Phân loại Simulator Output:** Đối với Text Document, trọng số đánh giá của Simulator sẽ nghiêng nặng về tính Rõ ràng, Tính Toàn vẹn Logic, và Cạnh Biên (Boundary Constraints).
- **Delta Lock:** Tương tự Fix-bug, cấm lặp lại vi chỉnh PRD/Story quá 3 lần nếu điểm Delta không cải thiện `≥ 0.5`.

---

## 6. Definition of Done (DoD)
- [ ] Mở file `.agent/workflows/iwish-bmm-create-prd.md` và chêm Step gọi QA Guardian vào cuối.
- [ ] Mở file `.agent/workflows/iwish-bmm-create-story.md` và `.agent/workflows/iwish-bmm-create-epics-and-stories.md` chêm Step QA Guardian vào cuối.
- [ ] Xác nhận không có Hardcode thừa vào persona của Bulma hay Master-Roshi.
- [ ] Đánh dấu trạng thái Story 1.3 `DONE` trong `sprint-status.yaml`.
