---
name: ag-kit-coordinator-mode
description: Cơ chế điều phối 4 pha với quy tắc song song/tuần tự, Socratic Gate và Golden Rule worker prompt
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# 👑 Quy trình Điều phối Coordinator Mode (Golden Rule & Socratic Gate)

Bộ quy trình này áp dụng cho Orchestrator (`orch-agent`), `pm-agent` và `architect-agent` khi điều phối các tác vụ kỹ thuật ad-hoc phức tạp hoặc lập kế hoạch sprint.

---

## 🧭 Quy trình Điều phối 4 Pha (4-Phase Coordination Lifecycle)

```
[Phân rã & Phân loại]
        │
        ├── 1. PHA RESEARCH (Parallel Reads)
        │     └── Chạy song song nhiều agent/lệnh con để đọc code, tìm hiểu context
        │
        ├── 2. PHA SYNTHESIS (Golden Rule - Strict Orchestrator Control)
        │     └── Enforce: "Never Delegate Understanding"
        │     └── Tự tổng hợp root cause, chỉ định chính xác file/dòng code cần sửa
        │     └── Sinh Prompt chi tiết cho Worker
        │
        ├── 3. PHA IMPLEMENTATION (Sequential Writes)
        │     └── Cho Worker sửa từng file tuần tự để tránh xung đột mã nguồn
        │
        └── 4. PHA VERIFICATION (Parallel Checks)
              └── Chạy song song: tests, compile lint, security check
```

---

## 🔒 Golden Rule: Never Delegate Understanding
*   **QUY TẮC VÀNG:** Điều phối viên (Coordinator) tuyệt đối không bao giờ được giao phó việc "hiểu bản chất và quyết định cách viết code" cho các Worker con.
*   **Hành vi bắt buộc:**
    1.  Coordinator phải tự đọc và phân tích kết quả điều tra của pha Research.
    2.  Coordinator phải xác định rõ: file nào cần sửa, dòng nào cần thay thế, logic mới là gì.
    3.  Khi dispatch Worker (như `dev-agent`), Coordinator phải cung cấp một **Worker Prompt** cực kỳ cụ thể, ví dụ:
        *   *Sai:* "Dựa trên nghiên cứu, hãy sửa hàm render trong file X để tránh crash."
        *   *Đúng:* "Hãy chỉnh sửa file `src/components/Modal.tsx` từ dòng 45 đến 55. Thay thế hàm `renderHeader` bằng đoạn logic sau: [mã nguồn cụ thể] để xử lý trường hợp `title` bị null."

---

## 🏛️ Socratic Gate: Hỏi trước khi làm (Socratic Clarification Gate)
*   Trước khi tiến hành tạo Implementation Plan hoặc Story plan, Agent phải chạy kiểm tra Socratic Gate.
*   **Hành vi bắt buộc:**
    1.  Nếu yêu cầu của người dùng có bất kỳ điểm nào mơ hồ, chưa xác định rõ (về mặt kỹ thuật, màu sắc, luồng đi, hoặc data model), Agent **phải dừng lại**.
    2.  Đặt **1 đến 2 câu hỏi làm rõ (Socratic clarifying questions)** tập trung vào bản chất yêu cầu.
    3.  Chờ phản hồi của người dùng trước khi tiến hành viết plan thô. Không tự tiện đưa ra giả định.

---

## 🛡️ Concurrency Rules: Parallel Reads, Sequential Writes
*   **Research Phase:** Cho phép chạy song song các lệnh đọc (`view_file`, `grep_search`) để tối ưu hóa thời gian điều tra.
*   **Implementation Phase:** Chỉ cho phép thực hiện ghi mã nguồn (`replace_file_content`, `write_to_file`) tuần tự (sequential) trên từng file một. Cấm chạy các subtask ghi song song nếu chúng chia sẻ hoặc có quan hệ phụ thuộc lẫn nhau, tránh xung đột git hoặc lỗi compile.
*   **Verification Phase:** Cho phép chạy song song kiểm thử tĩnh (linter), biên dịch, và chạy unit tests để đẩy nhanh tiến độ kiểm tra.
