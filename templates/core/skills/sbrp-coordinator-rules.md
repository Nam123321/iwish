---
name: ag-kit-sbrp-coordinator-rules
description: Quy tắc điều phối song song và tuần tự dành riêng cho quy trình sửa lỗi SBRP
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# 🛠️ Điều phối Sửa lỗi SBRP (SBRP Coordinator Rules)

Tài liệu này hướng dẫn chi tiết cách chạy Coordinator Mode trong quy trình `/fix-bug`.

---

## 🧭 Điều phối 4 Pha trong Sửa Lỗi (SBRP Concurrency Flow)

### 1. Pha Điều tra (Research Phase - Parallel)
*   **Hành vi:**
    *   Cho phép chạy song song các tiến trình đọc/tìm kiếm.
    *   Coordinator có thể dispatch 2-3 subtask tìm hiểu cùng lúc:
        *   `[P] Task 1: Check bug tracker for similar historic occurrences`
        *   `[P] Task 2: Run CGC queries (find_callers) for buggy symbols`
        *   `[P] Task 3: Inspect local story specs and logs`
    *   *Tiết kiệm context:* Các subagent tự chạy và trả về báo cáo kết luận ngắn gọn, thay vì in toàn bộ mã nguồn thô vào context window chính.

### 2. Pha Thiết kế (Synthesis Phase - Coordinator Control)
*   **Hành vi:**
    *   Coordinator chịu trách nhiệm duy nhất để "hiểu" nguyên nhân sâu xa (RCA).
    *   **CẤM** giao phó việc quyết định logic fix cho worker.
    *   Coordinator lập bảng thiết kế sửa đổi chi tiết, chỉ định rõ:
        *   File cần sửa đổi.
        *   Vị trí dòng code (line range).
        *   Đoạn code gốc vs Đoạn code thay thế chính xác.
    *   *Socratic Gate check:* Nếu có sự mập mờ giữa spec và code, dừng lại hỏi người dùng 1-2 câu Socratic.

### 3. Pha Thực thi (Implementation Phase - Sequential Writes)
*   **Hành vi:**
    *   Tất cả các hành động viết code (`replace_file_content` hoặc `write_to_file`) phải chạy **tuần tự (sequential)**.
    *   Nếu sửa nhiều file, chỉ sửa file X, kiểm tra compile cục bộ thành công, sau đó mới sửa file Y. Tránh sửa song song gây xung đột trạng thái workspace.

### 4. Pha Xác minh (Verification Phase - Parallel/Sequential)
*   **Hành vi:**
    *   Chạy song song: linter (`eslint`), type checker (`tsc --noEmit`), và test runner.
    *   Nếu lọt qua, chạy build tổng thể (`pnpm build`).
