---
name: ag-kit-context-compression-decant
description: Cơ chế gạn lọc tri thức và nén ngữ cảnh trong quá trình kết thúc sửa lỗi (Bug Decanting)
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# ⚗️ Quy trình Gạn Lọc Tri thức (Bug Decanting & Spec Sync Protocol)

Quy trình này hướng dẫn Agent cách khai thác các Phase Summaries và Session Checkpoints của Context Compression để cập nhật tự động cho hệ thống tài liệu và đồ thị tri thức sau khi kết thúc sửa lỗi.

---

## 🗜️ Trích xuất Delta (Context Delta Extraction)
Khi kết thúc pha code fix (Phase 5/6 của SBRP), Agent thực hiện so khớp trạng thái cuối session với checkpoint đầu session để trích xuất ra **Context Delta Block** chứa:
*   `files_changed`: Danh sách tệp đã chỉnh sửa.
*   `dependency_shifts`: Các import mới hoặc quan hệ gọi hàm (caller/callee) mới phát hiện.
*   `resolved_edge_cases`: Các kịch bản lỗi biên thực tế đã được fix.
*   `systemic_reasons`: Nguyên nhân sâu xa (Why #4 & Why #5).

---

## 🕸️ Cập nhật Đồ thị Tri thức Incremental (Incremental Graph Sync)
Agent sử dụng `dependency_shifts` từ Delta Block để chạy cập nhật đồ thị CGC và FeatureGraph:
1.  Nếu phát hiện một hàm gọi mới hoặc dependency ngầm định giữa 2 thành phần, chạy:
    `add_code_to_graph("<fixed_file_path>")` để index lại tệp tin đã chỉnh sửa.
2.  Nếu phát hiện quan hệ phụ thuộc chéo giữa các story hoặc tính năng (ví dụ: `Payment` gọi đến `OrderValidation`), sử dụng tool `add_feature_relationship` để đăng ký quan hệ mới trong FeatureGraph.

---

## 📑 Đúc kết Bug & Báo cáo Tự động (Bug Tracker Decanting)
1.  Agent trích xuất `resolved_edge_cases` và `systemic_reasons`.
2.  Tự động cập nhật `lessonsLearned` và `fixAttempts` trực tiếp vào `_iwish-output/bug-tracker.yaml`.
3.  Tạo mới hoặc append báo cáo vào `_iwish-output/bug-reports/YYYY-MM-sbrp-round{N}.md` bằng cách sắp xếp tuần tự các Phase Summaries đã tích lũy trong phiên chat.

---

## 🔄 Tự động Đồng bộ hóa Stories & Epics (Auto-Sync Spec)
Để triệt tiêu trôi lệch tài liệu (*Spec Drift*), Agent thực hiện đồng bộ hai chiều:
1.  **Story AC Update:**
    *   Agent mở file story tương ứng `_iwish-output/stories/[epic]/[story].md`.
    *   Nếu lỗi biên được sửa (`resolved_edge_cases`) là một kịch bản chưa được mô tả trong Acceptance Criteria (AC), Agent tự động chèn một dòng AC mới được gắn thẻ `[EDGE-CASE]` và mã bug ID tương ứng (ví dụ: `BUG-XXXX`).
2.  **Epic Progress Update:**
    *   Agent tự động đọc trạng thái trong `bug-tracker.yaml`.
    *   Cập nhật tỷ lệ hoàn thành, số lượng defect hoạt động của Epic tương ứng trong `_iwish-output/epics.md`.
