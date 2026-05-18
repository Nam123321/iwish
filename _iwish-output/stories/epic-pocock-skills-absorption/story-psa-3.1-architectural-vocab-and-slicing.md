---
story_id: "STORY-PSA-3.1"
epic_id: "EPIC-PSA"
title: "Architectural Vocab (King-Kai) & Vertical Slicing (Piccolo)"
status: "IN_PROGRESS"
assignee: "Antigravity"
priority: "P1"
phase: "forge"

---
# Story PSA-3.1: Architectural Vocab & Vertical Slicing

## 1. Objective
Tiêm các triết lý kiến trúc sắc bén từ `improve-codebase-architecture` vào hạt nhân DNA của I-Wish (Fragments, Skills, Agents) để tạo ra hệ thống guardrail kiến trúc tự động.

## 2. User Story
As a I-Wish Developer,
I want the system to automatically enforce Deep Modules and Vertical Slicing,
So that I don't accidentally build shallow abstractions or technical layers that don't deliver value.

## 3. Acceptance Criteria
- **AC1: Core DNA Injection**: Cập nhật `anti-sycophancy.md` để tự động phát hiện và chặn "Architectural Red Flags" (Shallow Modules, Horizontal Slicing).
- **AC2: Quality Gate Evolution**: Refactor Scorecard của `qa-simulator-guardian` để chấm điểm "Architectural Depth & Leverage".
- **AC3: Mandatory Tracer Bullets**: Cập nhật `/create-story` workflow yêu cầu xác định Vertical Slice cho mỗi story.
- **AC4: Agent Vocabulary**: Cập nhật system prompt của King-Kai và Piccolo với bộ từ vựng Pocock (Module, Interface, Depth, Seam, Adapter).
- **AC5: Deletion Test Integration**: Tích hợp Deletion Test vào Socratic Review (`grill-me`).

## 4. Tasks
- [x] Research and map architectural philosophies to I-Wish fragments/skills
- [x] Create implementation plan for PSA 3.1
- [x] Update anti-sycophancy.md with Architectural Red Flags
- [x] Refactor qa-simulator-guardian Scorecard (Depth & Leverage)
- [x] Update Socratic Review (Deletion Test & Tracer Bullets)
- [x] Inject Pocock Vocabulary into King-Kai and Piccolo
- [x] Update Create-Story workflow for mandatory Tracer Bullet identification
- [/] Verify implementation with a "Shallow Module" test case

## 5. Definition of Done
- Các file core được cập nhật và đăng ký.
- Agent tự động bác bỏ đề xuất "Horizontal Layer" khi chạy thử nghiệm.
