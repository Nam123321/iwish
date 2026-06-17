---
name: ag-kit-context-compression
description: Bộ quy tắc nhận thức nén ngữ cảnh 3 cấp độ giúp tối ưu hóa token và giữ vững sự tập trung
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# 🧠 Quy tắc Nén Ngữ Cảnh (Context Compression Protocol)

Bộ quy tắc này hướng dẫn tác nhân (Agent) cách quản lý Context Window trong các phiên hội thoại dài (trên 15 lượt chat) hoặc các tác vụ sửa lỗi phức tạp.

---

## 🔍 Ba Cấp độ Nén Ngữ Cảnh (3 Compression Levels)

### 🟢 Cấp độ 1: Micro-Compact (Nén đầu ra của Tool)
*   **Mục tiêu:** Tiết kiệm không gian context khỏi các log xuất thô từ terminal hoặc kết quả tìm kiếm quá dài.
*   **Nguyên tắc:**
    *   *Lọc Compile/Lint/Test Logs:* Thay vì in toàn bộ 100+ dòng stack trace của lỗi build hoặc test, chỉ trích dẫn 3-5 dòng chứa: file bị lỗi, dòng cụ thể, thông báo lỗi chính xác, và tóm tắt nguyên nhân.
    *   *Lọc Search/Grep Logs:* Khi dùng `grep_search` hoặc `find_callers`, chỉ hiển thị số lượng kết xuất khớp và trích dẫn các dòng code thực sự liên quan đến root cause. Giải phóng các kết quả nhiễu.

### 🟡 Cấp độ 2: Phase Summary (Tóm tắt Pha hoàn tất)
*   **Mục tiêu:** Dọn sạch lịch sử đọc file thô và các bước thử nghiệm trung gian khi chuyển pha.
*   **Nguyên tắc:**
    *   Khi hoàn thành một pha công việc (ví dụ kết thúc Phase 3: RCA trong `/fix-bug`), Agent tự động viết một **Phase Summary Block** ngắn gọn (~150-200 tokens) lưu trữ:
        *   **Điểm đã kiểm tra (Checked files):** Danh sách files và hàm đã đọc.
        *   **Root Cause phát hiện (Why #1-5):** Kết luận RCA cốt lõi.
        *   **Quyết định kỹ thuật (Technical decisions):** Giải pháp dự kiến và files sẽ thay đổi.
    *   *Giải phóng bộ nhớ:* Khi Phase Summary được xác lập, Agent coi như đã nén toàn bộ lượt chat đọc file trước đó và không cần lập lại chi tiết thô trong các phản hồi sau.

### 🔴 Cấp độ 3: Session Checkpoint (Điểm kiểm tra phiên)
*   **Mục tiêu:** Bảo toàn tri thức cốt lõi và trạng thái của cả phiên làm việc khi phiên kéo dài >20 lượt chat hoặc khi cần tiếp tục trong session mới.
*   **Nguyên tắc:**
    *   Khi phiên chat quá dài hoặc trước khi chuyển giao, Agent cập nhật file `task.md` (lưu tại thư mục story-specific hoặc session artifact) hoặc một file checkpoint tạm để lưu trữ một **Session Checkpoint Block** chứa:
        *   **Current Delta:** Diff code thực tế đã thay đổi.
        *   **Architecture decisions:** Các quyết định kiến trúc then chốt đã được thống nhất hoặc cần user phê duyệt.
        *   **Verification Status:** Lỗi test/compile cuối cùng chưa được giải quyết.
        *   **Next Actions:** 3 bước cụ thể tiếp theo cần thực thi.
    *   *Nạp lại nhanh:* Khi khởi động lại hoặc tiếp tục session, Agent chỉ cần đọc Session Checkpoint để khôi phục 100% ngữ cảnh mà không cần đọc lại toàn bộ transcript dài.

---

## 🚫 Nguyên tắc Bảo tồn Tri thức (Decision Integrity)
*   **QUY TẮC SẮT:** Tuyệt đối không được nén hoặc bỏ qua các **quyết định thiết kế cốt lõi (Core design decisions)** và **rationale** (lý do chọn giải pháp).
*   Mọi cấu trúc dữ liệu mới, thay đổi API contract, hoặc logic xử lý lỗi đặc thù (edge cases) bắt buộc phải được ghi rõ trong Phase Summary và Session Checkpoint.
