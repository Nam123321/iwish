---
story_id: "STORY-SIM-1.2"
epic_id: "EPIC-SIM-01"
title: "Tích hợp Kỹ năng Fat-Guardian Simulator vào Hệ sinh thái I-Wish"
status: "READY_FOR_VEGETA"
assignee: "Vegeta"
phase: "forge"

---
# Story 1.2: Tích hợp Kỹ năng Fat-Guardian Simulator vào Hệ sinh thái I-Wish

## 1. Mục tiêu (Objective)
Đưa Kỹ năng QA Simulator (phiên bản **Fat-Guardian** nâng cấp: `qa-simulator-guardian.md`) đi vào hoạt động thực tiễn. Kỹ năng này sẽ đóng vai trò là "Cổng gác tử thần" (Final Death Gate) do Đặc vụ Audit **Tien-Shinhan** cai quản. Phải cắm cứng cổng gác này vào vòng lặp cuối cùng của hai Workflow cốt lõi: `/fix-bug.md` và `/code-review.md`.

---

## 2. Target Users & Personas
- **Tien-Shinhan (Audit Expert):** Sử dụng Kỹ năng này để mô phỏng "Mental Run" thay vì chỉ dựa vào Linting Tools tĩnh.
- **Vegeta/Songoku (Developers):** Chịu trách nhiệm thực thi sửa lỗi vòng lặp nếu Tien-Shinhan phát hiện Delta Score chênh lệch, hoặc điểm số `< 8.5/10`.

---

## 3. Scope & Phạm vi Triển khai
1. **Host AI Setup:** Cấu hình hồ sơ của Agent Tien-Shinhan (trong `agents/Tien-Shinhan/agent.md` hoặc setup nội bộ I-Wish) để BẮT BUỘC Load file `dragonball_distribution/templates/core/skills/qa-simulator-guardian.md`.
2. **Workflow `/fix-bug.md`:** Cắm cổng gác vào Phase `Verify`.
3. **Workflow `/code-review.md`:** Cắm cổng gác vào Phase `Final Check`.

---

## 4. Acceptance Criteria (Tiêu chí hoàn thành BẮT BUỘC)

### AC1: Cấu hình Agent Tien-Shinhan kết nối Fat-Guardian
- **GIVEN** User invokes the Tien-Shinhan agent for an audit.
- **WHEN** Tien-Shinhan processes the code or feature.
- **THEN** Tien-Shinhan MUST natively trigger the newly updated Fat-Guardian (`qa-simulator-guardian.md`).
- **AND** The output from Tien-Shinhan MUST display the explicit `13-Types Classification` and generate the `6-Core Axes Scorecard` without attempting to reference the deprecated `SKL_Simulator_v1`.

### AC2: Sửa đổi Workflow `/fix-bug`
- **GIVEN** A developer finishes a bug resolution attempt using `/fix-bug`.
- **WHEN** The workflow advances to **Phase 6: Verify**.
- **THEN** The instruction MUST strictly enforce invoking Tien-Shinhan and the QA Simulator.
- **AND** If the output is "FIXABLE" and Delta Lock (`< 0.5`) is NOT triggered, the workflow MUST loop back to Vegeta for another fix.
- **AND** The bug CANNOT be marked "RESOLVED" unless the `TOTAL AVERAGE` score is `≥ 8.5/10`.

### AC3: Sửa đổi Workflow `/code-review`
- **GIVEN** The user triggers the `/code-review` workflow to validate a new feature.
- **WHEN** Standard Static Linting (ESLint, Prettier, CodeGraph) passes.
- **THEN** The workflow MUST invoke the QA Simulator Guardian to run the 8-Pillar and REAL-USER internal mental simulation.
- **AND** The review document output MUST embed the 7-row Simulator Scorecard directly into its summary.

### AC4: Hướng dẫn Cross-Routing (Delegation Fallback)
- **GIVEN** Tien-Shinhan runs the `STEP 0: I-Wish CONTEXT & SUB-ROUTING` evaluation of the Fat-Guardian.
- **WHEN** The identified "Domain" type falls outside Tien-Shinhan's strict Logic/Code abilities (e.g., Marketing Emails, Pitch Deck).
- **THEN** Tien-Shinhan MUST successfully halt the verification flow and print exactly: *"⚠️ DELEGATION RECOMMENDED: Forwarding to [Appropriate Agent (e.g. Master-Roshi / Bulma)] for specialized UX/Creative Simulation."*

---

## 5. Technical Constraints & Design Considerations
- **Non-blocking Loop Protection:** Để tránh AI bị mắc kẹt vĩnh viễn, luật Delta Lock phải được tôn trọng tuyệt đối trong workflow. Phát hiện lặp vòng 2 lần không cải thiện = Return Error to User.

---

## 6. Definition of Done (DoD)
- [ ] Mở file cấu hình profile của Tien-Shinhan để chêm đoạn `USE SKILL: qa-simulator-guardian.md`.
- [ ] Refactor `/fix-bug.md` thêm Explicit Step gọi QA Guardian và kiểm tra Score.
- [ ] Refactor `/code-review.md` thêm QA Simulation Step trước khi duyệt PR.
- [ ] Cờ `status` chuyển sang IN_PROGRESS và hoàn tất khi pull-request merge code xong.
