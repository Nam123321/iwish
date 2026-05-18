# Epic: Pocock Skills Absorption & Architecture Upgrade

**Epic ID:** EPIC-PSA
**Status:** TODO

## 1. Objective
Hấp thụ toàn diện các mẫu hành vi cốt lõi từ `mattpocock/skills`. Nâng cấp luồng Socratic Review, giải quyết Feature Drift bằng Hybrid Triggers (Backward Sync), chuẩn hóa Local DevEx, và tiêm các triết lý kiến trúc (Vertical Slice, Module Depth) vào hạt nhân của I-Wish.

## 2. Scope
1. **Socratic Review Mode**: Nâng cấp khả năng phản biện tiền triển khai.
2. **Backward Sync**: Cơ chế đồng bộ ngược tự động (tại `/Vegeta-story`, `/fix-bug`, và `/step-04-self-check`).
3. **Productivity Tools**: Luồng `/prototype` và skill `/caveman-mode`.
4. **DevOps Guardrails**: Tích hợp các script kiểm tra (husky, linter) vào quy chuẩn I-Wish.
5. **Architectural Philosophy**: Cập nhật bộ từ vựng cho King-Kai và Piccolo.
6. **Testing Patterns**: Trích xuất Testing Anti-patterns cho Vegeta.

## 3. Stories
- **STORY-PSA-1.1**: Socratic Review Mode (grill-me)
- **STORY-PSA-1.2**: Backward Sync Hybrid Trigger (to-prd)
- **STORY-PSA-2.1**: Prototype Workflow & Caveman Mode
- **STORY-PSA-2.2**: Local DevEx Ops Integration (misc/*)
- **STORY-PSA-3.1**: Architectural Vocab (King-Kai) & Vertical Slicing (Piccolo)
- **STORY-PSA-3.2**: Testing Anti-patterns & Zoom-out heuristic (Vegeta)
