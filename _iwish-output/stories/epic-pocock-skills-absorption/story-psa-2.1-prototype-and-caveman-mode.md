---
story_id: "STORY-PSA-2.1"
epic_id: "EPIC-PSA"
title: "Prototype Workflow & Caveman Mode"
status: "DONE"
assignee: "Whis"
priority: "P2"
phase: "forge"

---
# Story PSA-2.1: Prototype Workflow & Caveman Mode

## 1. Objective
Tạo các luồng làm việc phục vụ năng suất (Productivity Tools) dựa trên `prototype` và `caveman` để tăng tốc độ thử nghiệm và tiết kiệm token giao tiếp.

## 2. User Story
As a Developer,
I want a dedicated workflow for prototyping and a highly compressed communication mode,
So that I can test ideas safely on throwaway branches and communicate efficiently without hallucination risks.

## 3. Acceptance Criteria
- **AC1:** Workflow `/prototype` được tạo ra. Yêu cầu tạo nhánh riêng, cấm commit trực tiếp lên `main`.
- **AC2:** Productivity Skill `/caveman-mode` được tạo ra. Có cảnh báo chỉ dành cho Senior Dev / Machine-to-machine.
- **AC3:** Tích hợp bộ quy tắc chống Hallucination (do nén token) vào `/caveman-mode`.

## 4. Definition of Done
- Hai file Markdown cho Workflow và Skill được tạo thành công.
- Cập nhật danh sách Registry.
