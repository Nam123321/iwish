# STORY-PSA-2.2: Local DevEx Ops Integration (misc/*)

**Epic:** [EPIC-PSA](_iwish-output/epics/epic-pocock-skills-absorption.md)
**Status:** READY

## 1. Goal
Thiết lập hệ thống bảo vệ chất lượng tự động (Guardrails) đa lớp, tích hợp các công cụ quét "Magic Number" và "Context Leak" để bảo vệ tính toàn vẹn của Kiến trúc và Dữ liệu. Tối ưu hóa sự phối hợp giữa Agent (Lint sớm) và User (Husky chặn cuối).

## 2. Context & Memory
- **Memory**: Chiến lược Hybrid Guardrail (Linter trong Dev, Husky trong Commit).
- **Auto-Repair**: Vegeta tự động chạy `--fix` tối đa 2 lần.
- **Tools**: Husky, lint-staged, Secret Scan, Magic Number Hunter, Context-Leak Detector.

## 3. Acceptance Criteria (AC)
- **[AC-1] Early Linting Step**: Tích hợp lệnh `npm run lint:fix` vào quy trình `/step-04-self-check` của Vegeta.
- **[AC-2] Husky Orchestration**: Cấu hình Husky với hooks `pre-commit` (lint-staged) và `pre-push` (full tsc + Secret Scan).
- **[AC-3] Auto-Repair Protocol**: Vegeta tự động fix lỗi linter (max 2 lần) trước khi báo cáo.
- **[AC-4] I-Wish Registry Hook**: Script kiểm tra file có trong `knowledge-graph.yaml` hay không.
- **[AC-5] DevEx Documentation**: Cập nhật mục "Quality Guardrails" trong `I-Wish-ARCHITECTURE.md`.
- **[AC-6] Magic Number Hunter**: Script quét các giá trị CSS/Style hardcode chưa được gắn Token (Hỗ trợ mở rộng ngoài Stitch).
- **[AC-7] Context-Leak Detector**: Script cảnh báo các dữ liệu mang tính "Business Data" bị hardcode thay vì lấy từ DB/Config.

## 4. Implementation Tasks
- [ ] [T1] Cập nhật logic xử lý lint tự động cho Vegeta trong `iwish-bmm-quick-dev.md`.
- [ ] [T2] Cài đặt & cấu hình Husky/lint-staged trong `package.json`.
- [ ] [T3] Viết script `.agent/scripts/check-registry.js`.
- [ ] [T4] Viết script `.agent/scripts/magic-hunter.js` (Generic Token detection).
- [ ] [T5] Viết script `.agent/scripts/context-leak-detector.js` (Hardcoded Data detection).
- [ ] [T6] Cập nhật `I-Wish-ARCHITECTURE.md`.

## 5. QA Simulator Hybrid Scorecard
| Axis | Score (1-10) | Justification |
|---|---|---|
| Functional Correctness | 10 | Các lớp guardrail chặn đứng lỗi từ gốc. |
| Data Integrity | 10 | Context-Leak detector bảo vệ tính đúng đắn của dòng chảy dữ liệu. |
| Security | 10 | Secret Scan chặn lộ API keys. |
| Performance | 9 | Tiết kiệm token cho Agent, dồn việc nặng cho local scripts. |
| Error Handling | 9 | Tự động fix lỗi lint giúp giảm gián đoạn. |
| Code Quality | 10 | Loại bỏ triệt để Magic numbers. |
| UX Empathy | 9 | Hệ thống mượt mà, ít lỗi vặt, code sạch hơn. |
| **TOTAL AVERAGE** | **9.6/10** | **PREMIUM QUALITY** |
