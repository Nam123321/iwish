---
story_id: "STORY-SIM-1.1b"
epic_id: "EPIC-SIM-01"
title: "Tái cấu trúc `qa-simulator-guardian` thành Fat-Guardian"
status: "READY_FOR_VEGETA"
assignee: "Vegeta"
phase: "forge"

---
# Story 1.1b: Tái cấu trúc `qa-simulator-guardian` thành Fat-Guardian

## 1. User Value
Chuyển đổi kỹ năng cốt lõi `qa-simulator-guardian.md` của I-Wish từ mô hình tham chiếu lỏng lẻo sang mô hình "Nguyên khối lai" (Fat-Guardian). Đảm bảo mọi phân tích QA nội bộ đều được định lượng chuẩn xác bằng hệ thống 13 Lõi Deliverable và tính điểm khắt khe trên 6 Trục (Axes) mà không phải lệ thuộc vào việc reference rườm rà tới `SKL_Simulator_v1`.

## 2. Requirements & Acceptance Criteria (AC)

### AC1: Đóng gói toàn phần Ma trận 13-Types & Adaptive Limit
- **GIVEN** An internal I-Wish Agent invokes `qa-simulator-guardian.md`.
- **WHEN** It reaches the Assessment block.
- **THEN** The file MUST natively enforce the Adaptive Test Case Count (Light 10, Med 15-20, Heavy 25-30).
- **AND** It MUST enforce the explicit checking criteria specific to one of the 13 defined types (e.g. Prompt -> CO-STAR, UI -> Error States, Automation -> Idempotency).

### AC2: Chuẩn định Bảng tính điểm (The Exact Scoring Math)
- **GIVEN** The mental sandbox completes evaluating the deliverable.
- **WHEN** Outputting the `<hybrid-scoring-and-verdict>` matrix.
- **THEN** The scoreboard MUST strictly itemize and score the 6 Core Axes (`Completeness`, `Clarity`, `Edge Cases/8-Pillars`, `Efficiency`, `Scalability`, `Output Quality`) plus the `REAL-USER UX Empathy` metric.

### AC3: Track Delta & Auto-Fix Enforceability
- **THEN** The final markdown output MUST feature a **Delta Tracker** to mathematically enforce the `< 0.5` improvement lock.
- **AND** If the output is FIXABLE, the instruction MUST explicitly order the Host AI (if tools present) to physically patch the code via MCP or file write.

## 3. Definition of Done
- [ ] Mở file `qa-simulator-guardian.md`. Xóa hoặc refactor đoạn rác tham chiếu cũ.
- [ ] Bơm khối `<step-0-classification-and-adaptive-count>` và bảng chấm `6-Axes` trực tiếp vào file.
- [ ] File sau update phải đảm bảo host AI tự động có quyền hành Auto-Fix lập tức sau khi user "Approve".
