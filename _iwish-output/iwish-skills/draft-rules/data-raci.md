# Ma Trận Phân Định Trách Nhiệm Dữ Liệu (Data RACI Matrix)

Bản tài liệu này định nghĩa rõ vai trò và trách nhiệm trong việc thiết kế, chỉnh sửa, và tích hợp cơ sở dữ liệu/luồng dữ liệu giữa các Subagent để tránh xung đột kiến trúc và trôi lệch schema (schema drift) khi chạy song song.

---

## 1. Định nghĩa các Vai trò (Role Definitions)

*   **Kira++ (Data Architect - Kiến trúc sư Dữ liệu):** Sở hữu cấu trúc lưu trữ dữ liệu tĩnh, cấu trúc bảng, và tính toàn vẹn của database schema.
*   **Shinji (Data Strategist - Chiến lược gia Dữ liệu):** Sở hữu luồng di chuyển dữ liệu động, cơ chế bộ nhớ đệm (caching), event bus, và tối ưu hóa truy vấn/hiệu năng.
*   **Dev Agent (Developer - Agent Lập trình):** Triển khai mã nguồn logic thực tế dựa trên thiết kế dữ liệu đã được phê duyệt.

---

## 2. Ma Trận RACI (RACI Matrix)

| Nhiệm vụ / Hoạt động | Kira++ (Architect) | Shinji (Strategist) | Dev Agent |
| :--- | :---: | :---: | :---: |
| **Thiết kế Prisma Schema (Bảng, Cột, Quan hệ, Kiểu dữ liệu)** | **A / R** | **C** | **I** |
| **Tạo & Thực thi Migration (Prisma Migrations)** | **A / R** | **I** | **I** |
| **Thiết kế Luồng dữ liệu, Event Bus, và Caching (Redis)** | **C** | **A / R** | **I** |
| **Tối ưu Index & Phân tích query chậm (Slow Queries)** | **R** | **A / R** | **I** |
| **Viết code Service/Repository sử dụng Prisma Client** | **I** | **I** | **A / R** |
| **Đồng bộ hóa Database Schema khi phát triển nhánh song song** | **A / R** | **C** | **I** |

*Chú thích: **R** = Responsible (Người thực hiện), **A** = Accountable (Người phê duyệt & chịu trách nhiệm chính), **C** = Consulted (Người được tham vấn), **I** = Informed (Người nhận thông tin).*

---

## 3. Quy trình Ràng buộc (Binding Protocol)

### Quy tắc 1: Cấm Dev Agent tự ý thay đổi Prisma Schema
*   Mọi thay đổi đối với `schema.prisma` hoặc việc tạo migration mới **chỉ** được phép thực hiện sau khi có sự đồng thuận thiết kế từ Kira++ và Shinji.
*   Dev Agent **không bao giờ** được phép tự sửa `schema.prisma` trực tiếp để giải quyết lỗi biên dịch khi chưa chạy qua bước **Step 2.5 (Data Design)**.

### Quy tắc 2: Đồng bộ hóa thiết kế dữ liệu (Step 2.5 Gate)
*   Khi có bất kỳ câu chuyện (User Story) nào liên quan đến cơ sở dữ liệu (Database-impacting stories), bắt buộc phải thực hiện bước `step-02.5-data-design` để tạo file đặc tả `data-blueprint.md` trước khi bàn giao cho Dev Agent.
*   Tệp `data-blueprint.md` sẽ chứa Prisma Schema đề xuất và luồng dữ liệu, được ký duyệt (sign-off) ảo bởi Kira++ và Shinji.

### Quy tắc 3: Cô lập SQLite khi chạy nhánh song song
*   Mỗi Git Worktree được cấu hình để trỏ vào một file SQLite test riêng biệt (`test-worktree-${storyId}.db`) thông qua biến môi trường `DATABASE_URL` trong `.env` cục bộ của worktree đó.
*   Tránh tuyệt đối việc nhiều worktrees dùng chung một tệp SQLite gây khóa DB hoặc ghi đè dữ liệu thử nghiệm.
