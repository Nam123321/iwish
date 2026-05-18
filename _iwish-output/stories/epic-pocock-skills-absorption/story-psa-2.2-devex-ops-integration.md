---
story_id: "STORY-PSA-2.2"
epic_id: "EPIC-PSA"
title: "Local DevEx Ops Integration"
status: "TODO"
assignee: "Whis"
priority: "P1"
phase: "forge"

---
# Story PSA-2.2: Local DevEx Ops Integration

## 1. Objective
Hấp thụ nhóm kỹ năng `misc/*` (Husky, git-hooks, pre-commit) và biến đổi chúng thành bộ "Local DevEx Guardrails" gắn liền với hệ sinh thái DevOps của I-Wish.

## 2. User Story
As a DevOps Engineer,
I want to standardize local development guardrails across all projects,
So that bad code is blocked before it reaches the CI/CD pipeline or Canary releases.

## 3. Acceptance Criteria
- **AC1:** Trích xuất các kịch bản cài đặt tự động từ nhóm `misc/*`.
- **AC2:** Cập nhật workflow `/land-and-deploy` để yêu cầu xác nhận Local Guardrails đã pass.
- **AC3:** Đóng gói thành một thư mục chuẩn hoặc một skill setup riêng biệt.

## 4. Definition of Done
- Cập nhật quy trình Land & Deploy.
- Tạo mẫu hướng dẫn (Templates) cho Pre-commit.
