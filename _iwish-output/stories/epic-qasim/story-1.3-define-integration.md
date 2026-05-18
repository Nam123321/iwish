---
story_id: "STORY-SIM-1.3"
epic_id: "EPIC-SIM-01"
title: "Tích hợp QA Simulator ảo hóa vào Definition Workflows"
status: "READY_FOR_VEGETA"
assignee: "Vegeta"
phase: "forge"

---
# Story 1.3: Tích hợp QA Simulator vào Definition Workflows (Pre-Code QA)

## 1. User Value
Quán triệt tư tưởng "Shift-Left Testing". Bằng cách nhồi `qa-simulator-guardian.md` vào giữa các quy trình "Sinh Yêu Cầu" (như tạo PRD, phác thảo Story AC), hệ thống sẽ mô phỏng Mental Sandbox để phát hiện sớm các "Lỗ hổng Logic Nghiệp Vụ" và "Hành Vi Khách Hàng Tiêu Cực" KỂ TỪ TRƯỚC KHI sinh ra dòng code đầu tiên.

## 2. Requirements & Acceptance Criteria (AC)

### AC1: Stress-Test cho `/create-prd` và `/validate-prd`
- **GIVEN** The AI is processing the product requirements documentation workflow.
- **WHEN** It reaches the Final Generation/Validation Phase.
- **THEN** It MUST trigger the QA Simulator Guardian to stress-test the hypothetical PRD system against Concurrency, State Transition loops (8-pillars) and Physical environment friction (REAL-USER).
- **AND** Any failed mental test cases MUST force a rewrite of that PRD section.

### AC2: Definition of Ready (DoR) Gate cho `/create-story` 
- **GIVEN** The I-Wish workflow is drafting Acceptance Criteria (AC) for a dev ticket.
- **WHEN** Evaluating if the AC is complete.
- **THEN** The QA Guardian MUST run mental tests. If it finds "Missing Input Boundary checks" or "Lack of error messaging," it MUST block the status from reaching `READY_FOR_VEGETA` until the AC explicitly handles the gap.

### AC3: Definition of Ready (DoR) Gate cho `/create-epics-and-stories`
- **GIVEN** Generating an entire Epic backlog via the workflow.
- **THEN** The agent MUST invoke the QA Simulator on the Epic's business rules to detect high-level architectural dead-ends before splitting stories.

## 3. Definition of Done
- [ ] Workflow `validate-prd.md` and `create-prd.md` updated with the Pre-Code Mental QA Step.
- [ ] Workflow `create-story.md` and `create-epics-and-stories.md` updated with the Simulator DoR Gate.
