---
name: open-design-mcp-integration
description: Hướng dẫn thiết lập, đăng ký và sử dụng Open-Design thông qua MCP Server để Agent có thể trực tiếp stream và sinh UI artifact chuẩn mực thay vì tự code tay.
---

# 🌐 `/open-design-mcp-integration` Workflow

## 📌 TỔNG QUAN
`open-design` không phải là một bộ thư viện UI thông thường mà là một nền tảng (Workspace) thiết kế UI cho Agent. Nó bao gồm sẵn một **MCP Server**. Workflow này hướng dẫn hệ thống I-Wish cách kết nối với phần mềm `open-design` đang chạy ngầm trên máy tính của User thông qua giao thức MCP, từ đó Agent có thể dùng các "Tool" do open-design cung cấp để tạo giao diện thay vì đoán mò.

**Sử dụng:** `/open-design-mcp-integration` hoặc `/use-open-design`

---

## 🚦 CÁC BƯỚC THỰC THI

### Bước 1: Khởi chạy Open-design Daemon (Thực hiện bởi User)
- Agent bắt buộc phải yêu cầu User đảm bảo rằng daemon của open-design đang chạy trên máy (Bằng cách mở app Open Design hoặc chạy `pnpm tools-dev` từ mã nguồn của họ).
- **Tuyệt đối không:** Agent không được phép tự giả lập "đang dùng open-design" nếu chưa kết nối được với MCP Server của nó.

### Bước 2: Đăng ký MCP Server vào I-Wish
- Nếu cấu hình của hệ thống I-Wish (file `mcp_servers.json` hoặc cấu hình tương đương) chưa có `open-design`, Agent sẽ đề xuất chạy lệnh:
  `od mcp install <agent>` (Hoặc trực tiếp đọc file cấu hình từ `od mcp print` để ghi vào file cấu hình của hệ thống Cowok-ai).
- Xác minh rằng Agent hiện tại đã có thể gọi được các tools của `open-design` (Ví dụ như các công cụ render artifact, đọc design system, v.v.).

### Bước 3: Thiết lập Design Contract (`DESIGN.md`)
- `open-design` hoạt động dựa trên file tham chiếu thương hiệu `DESIGN.md`.
- Agent kiểm tra xem trong project hiện tại (hoặc trong workspace của open-design) đã có file `DESIGN.md` chưa. Nếu chưa, gọi workflow `/make-ui-spec` để tạo ra một file `DESIGN.md` mô tả các nguyên tắc của thương hiệu (Màu sắc, Typography, Spacing).

### Bước 4: Execution (Streaming Artifacts via MCP)
- Khi nhận yêu cầu sinh UI (Ví dụ: "Thiết kế Landing Page"), thay vì tự viết các file HTML/CSS/React thông thường, Agent **BẮT BUỘC** sử dụng các Tool do MCP Server của `open-design` cung cấp.
- Agent truyền tham số gồm: (1) Mục tiêu thiết kế, (2) File `DESIGN.md` tham chiếu, và (3) Lựa chọn Skill hoặc Template từ `open-design`.
- Kết quả sinh ra sẽ là một Artifact nguyên bản (Prototype, Dashboard, Deck, v.v) được `open-design` trực tiếp render qua iframe sandbox của nó.

---

## 🚫 LỖI CẦN TRÁNH
- Agent cố gắng tự sinh code HTML/CSS và tự nhận đó là "open-design". `open-design` là một công cụ phải được gọi thông qua MCP (Call Tool), không phải là thư viện để agent copy code.
- Bỏ qua file `DESIGN.md` khiến kết quả thiết kế không nhất quán với thương hiệu.
