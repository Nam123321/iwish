---
id: "story-sp-6"
epic_id: "epic-superpowers-absorption"
title: "Semantic Orchestrator Evolution"
status: "todo"
priority: "High"
type: "capability"
phase: "forge"

---
# User Story: SP-6 - Semantic Orchestrator Evolution

## 1. Context & Rationale
Trong phiên bản cũ, Grand Priest (I-Wish Master Orchestrator) yêu cầu người dùng phải tự nhớ và chọn các lệnh từ một menu tĩnh (numbered list). Điều này trái với triết lý của AI Agentic workflow (Layer 1 Superpowers Repo), nơi Agent đóng vai trò như một người điều phối thông minh. 
Tính năng này sẽ nâng cấp Grand Priest thành một **Semantic Orchestrator**, có khả năng phân tích ý định (Intent) thông qua xử lý ngôn ngữ tự nhiên, tự động map sang các slash commands/workflows phù hợp, đồng thời sử dụng cơ chế Hybrid UI để chờ người dùng xác nhận trước khi thực thi.

## 2. Tracer Bullet (Vertical Slice)
**Dữ liệu (Data):** Bộ từ điển Intent Categories (DEVELOP, FIX, REVIEW, IDEATION, v.v.) và cấu trúc Routing Table.
**Xử lý (Logic):** Khi user nhập text tự nhiên, Grand Priest trích xuất `Primary Intent`, `Keywords`, `Confidence Level`. Sau đó map với Routing Table. Nếu Confidence > 80%, chuyển sang trạng thái chờ xác nhận. Nếu Confidence thấp, kích hoạt Conversational Fallback để hỏi lại.
**Trình bày (UI/Presentation):** Output markdown trình bày rõ Intent được phân tích, lý do đề xuất workflow, và một Hybrid Gate block (Ví dụ: `> [!IMPORTANT] Xác nhận: Bạn có muốn tôi chạy /quick-spec không?`).

## 3. Acceptance Criteria (AC)

### AC-1: Bỏ Menu tĩnh và Cài đặt Semantic Engine
- [ ] Xóa hệ thống điều khiển menu theo số thứ tự cứng trong file `.agent/agents/grand-priest.md`.
- [ ] Thêm block `<semantic-routing-engine>` với danh sách các categories (DEVELOP, FIX, REVIEW, OPERATIONS, IDEATION, PARTY_MODE).

### AC-2: Intent-to-Workflow Mapping
- [ ] Thiết lập Routing Table nội tại cho Agent:
  - Yêu cầu xây tính năng mới, phức tạp -> Đề xuất `/create-story` hoặc `/quick-spec`.
  - Yêu cầu code nhanh một chức năng -> Đề xuất `/quick-Vegeta`.
  - Yêu cầu sửa lỗi -> Đề xuất `/fix-bug`.
  - Yêu cầu lên ý tưởng -> Đề xuất `/brainstorming` hoặc `/create-prd`.

### AC-3: Multi-Tier Hybrid Gate (Socratic Validation)
- [ ] Bổ sung Rule bắt buộc Agent phải trình bày Intent được phân tích.
- [ ] Phân cấp mức độ tự tin (Confidence) để xử lý UX:
  - 90% - 100%: Đưa ra lệnh/workflow trực tiếp để người dùng xác nhận chạy.
  - 70% - 89%: Đưa ra danh sách các lựa chọn workflow kèm số thứ tự (1, 2, 3...) để người dùng gõ số chọn nhanh.

### AC-4: Conversational Fallback
- [ ] Nếu Confidence < 70% hoặc Intent không rõ ràng, Agent sẽ lùi về làm chatbot để đặt câu hỏi thu thập thêm Context trước khi đưa ra danh sách định tuyến.

### AC-5: Orchestration Handback Rule
- [x] Bổ sung logic Handback vào I-Wish core runtime (`workflow-engine.xml`).
- [x] Đảm bảo sau khi một workflow hoàn tất (Turn-Exit Diagnostics với exit_reason = `completed`), agent tự động thông báo quay trở về vai trò Grand Priest và sẵn sàng nhận lệnh tiếp theo mà không cần user gọi lại `@/Grand-Priest`.

### AC-6: Context-Aware Routing (Sprint-Status Integration)
- [x] Grand Priest bắt buộc phải tham chiếu file `_iwish-output/stories/sprint-status.yaml` để lấy đường dẫn file của story khi user đề cập đến một feature, epic, hoặc story.
- [x] **Source of Truth Check**: Vì `sprint-status.yaml` có thể bị out-of-sync (Agent quên update), Grand Priest phải mở trực tiếp file story `.md` để đọc trường `status:` thực tế.
- [x] Logic Routing mới: Ưu tiên gợi ý `@[/Vegeta-story]` nếu story đã có file vật lý và có trạng thái `todo`, `ready`, hoặc `in-progress`. Ngược lại mới gọi các quy trình planning như `@[/create-story]`.

### AC-7: Anti-Planning & Routing-Only Rule
- [x] Thiết lập rule nghiêm ngặt cấm Grand Priest tự động vào `planning_mode`, tạo plan, hoặc viết code.
- [x] Grand Priest chỉ có nhiệm vụ duy nhất là phân tích Intent và map ra các lệnh slash command, sau đó trình bày cho user quyết định (Hybrid UI).

## 4. Tasks (AC-Task Traceability Matrix)

| ID | Task Description | Maps To | Status |
|---|---|---|---|
| T1 | Xóa logic menu cũ và định nghĩa cấu trúc thẻ XML `<semantic-routing-engine>` trong file Agent. | AC-1 | Done |
| T2 | Định nghĩa các Categories và Mapping Table cơ bản cho các I-Wish workflows. | AC-2 | Done |
| T3 | Bổ sung System Rules liên quan đến Socratic Validation (Hybrid UI) để yêu cầu user confirm trước khi chạy. | AC-3 | Done |
| T4 | Thêm chỉ dẫn ứng xử khi Confidence thấp (Conversational Fallback). | AC-4 | Done |
| T5 | Cập nhật Step 5 trong `workflow.xml` và `workflow-engine.xml` để thêm rule Orchestration Handback. | AC-5 | Done |
| T6 | Bổ sung rule bắt buộc tham chiếu `sprint-status.yaml` vào `<context-biasing>` và cập nhật routing table cho Grand Priest. | AC-6 | Done |
| T7 | Thêm rule ANTI-PLANNING & ROUTING-ONLY để ngăn Grand Priest tự động thực thi task thay vì điều hướng. | AC-7 | Done |

## 5. Dev Notes & Memory Context
- Grand Priest không bao giờ tự code. Vai trò của Grand Priest chỉ là phân tích ý định và trỏ người dùng tới đúng Agent (Vegeta, Songoku, Shenron) hoặc đúng Workflow.
- Việc nâng cấp này ảnh hưởng trực tiếp đến lớp giao tiếp đầu tiên của người dùng, nên Rule Socratic/Hybrid Gate là **bắt buộc** để tránh việc Agent gọi sai workflow gây mất thời gian.

---

### QA Simulator Guardian - Hybrid Scorecard

| Assessment Axis | Criteria Met? | Score (1-10) | Guardian Notes |
|---|---|---|---|
| 1. Logical Integrity | Yes | 10/10 | Routing table maps completely to existing workflows. |
| 2. Edge Case Handling | Yes | 9/10 | Handled via Conversational Fallback rule (AC-4) for low confidence. |
| 3. State Integrity | Yes | 9/10 | Hybrid Gate ensures system state doesn't mutate without user confirmation. |
| 4. Security & Permissions | Yes | 10/10 | Safe by design as Agent awaits user permission to trigger executions. |
| 5. Reusability / Architecture| Yes | 9/10 | Extensible XML structure for `<semantic-routing-engine>`. |
| 6. Testability | Yes | 10/10 | Can be simulated via NLP prompt injection directly. |
| 7. UX Empathy (Hybrid) | Yes | 10/10 | Removes cognitive load of remembering slash commands. Huge UX win. |
| **TOTAL AVERAGE** | | **9.5/10** | **APPROVED. Ready for implementation.** |
