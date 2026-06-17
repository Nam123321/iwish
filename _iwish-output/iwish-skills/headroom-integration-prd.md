# Product Requirements Document: Headroom Integration (System Skill)

## 1. Mục tiêu (Objective)
Tích hợp `headroom` (công cụ nén context) vào lõi của hệ thống I-Wish dưới dạng một **SYSTEM_SKILL**. Module này sẽ chạy như một always-on proxy daemon để tự động nén (compress) các payload quá tải (JSON, AST, RAG context) giúp tiết kiệm 60-95% lượng token khi gửi đến LLM, mà không làm mất thông tin nhờ cơ chế CCR (Continuous Context Reversibility).

## 2. Phạm vi (Scope)
- **Tích hợp Compound**: Đóng gói Headroom Proxy dưới dạng một background service chạy song song với I-Wish.
- **Bảo vệ Tính Toàn vẹn (Integrity Protection)**: 
  - **Tắt hoàn toàn nén văn bản (Prose Compression)**: Cấm Headroom sử dụng mô hình ML để nén các tệp markdown (`.md`), text (`.txt`), prompt (`.prompt`) hoặc cấu hình (`.yaml`). Đảm bảo Agent đọc được 100% nội dung gốc.
  - **Chỉ nén Cấu trúc (Structural Compression)**: Chỉ cho phép nén kết quả trả về từ Terminal, Logs, JSON, và cây AST của mã nguồn.
- **Whitelist Protection**: Ngoài việc cấm nén văn bản, cấu hình whitelist chặn can thiệp vào thư mục `.agent/workflows/*` và các file `PRD`, `Epic`, `Story`.
- **Đóng gói**: Tạo `headroom-skill.md` để tự động hóa việc khởi động proxy và phân phối cấu hình endpoint cho tất cả các Agents.

## 3. Yêu cầu Chức năng (Functional Requirements)
- **FR1**: I-Wish Orchestrator có khả năng kích hoạt Headroom Proxy daemon khi khởi động session.
- **FR2**: Hệ thống cung cấp cơ chế Bypass/Whitelist cho các đuôi tệp hoặc tên tệp được chỉ định (`PRD`, `Epic`, `Story`, `DNA`).
- **FR3**: Triển khai MCP tool `headroom_retrieve` cho phép Agents fetch lại nguyên văn context nếu bản nén (compressed text) không đủ chi tiết.

## 4. Yêu cầu Phi Chức năng (Non-Functional Requirements)
- **NFR1 (Hiệu năng)**: Overhead của proxy không được làm tăng quá 2 giây cho mỗi request.
- **NFR2 (Tương thích)**: Hoạt động trơn tru với các mô hình API tương thích OpenAI hoặc Anthropic mà I-Wish đang dùng.

## 5. User Stories & Acceptance Criteria
Sẽ được định nghĩa chi tiết trong tệp Epic và Story đi kèm.
