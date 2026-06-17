# 🛡️ Quy trình Đánh giá Mã nguồn 3 Lớp (3-Layer Code Review Protocol)

Quy trình đánh giá mã nguồn này là chốt chặn cuối cùng trước khi một story được chấp thuận tích hợp vào nhánh chính. Mọi Code Reviewer phải áp dụng quy trình này một cách nghiêm ngặt.

---

## 📌 PHƯƠNG CHÂM KIỂM DUYỆT (ANTI-SYCOPHANCY)
- **Hoài nghi mang tính xây dựng (Constructive Skepticism):** Luôn bắt đầu đánh giá với giả định mã nguồn có lỗi hoặc chưa tối ưu.
- **Cấm chấp thuận mù quáng:** Tuyệt đối không tuyên bố "code trông ổn" hoặc phê duyệt story mà không chỉ ra được ít nhất 3 vấn đề cần cải thiện (về hiệu năng, phong cách, kiểm thử hoặc bảo mật).
- **Không tin tưởng báo cáo hoàn thành:** Không đọc phần tóm tắt của developer. Đối chiếu và kiểm tra trực tiếp qua Git Diff.

---

## ⚙️ CÁC LỚP BẢO VỆ CHÍNH (THE 3-LAYER QUALITY GATES)

### 🔴 LỚP 1: CỔNG KIỂM TRA CƠ HỌC (LAYER 1 - MECHANICAL GATE)
Trước khi tiến hành đọc logic code, Reviewer phải xác nhận các kiểm tra cơ học tự động đã hoàn thành xuất sắc. Chạy các lệnh sau tại root dự án:

1. **Anti-Cheat Linter:**
   ```bash
   node scripts/anti-cheat-linter.js
   ```
   *Yêu cầu: Linter phải trả về mã thoát `0`. Nếu phát hiện code "lách luật" (comment-out > 25%, mock stubs rỗng, hoặc thiếu file test), lập tức dừng đánh giá với trạng thái `FAILED`.*

2. **Cross-Compilation Check:**
   ```bash
   npx tsc --noEmit
   ```
   *Yêu cầu: Đảm bảo không có lỗi biên dịch TypeScript trong toàn bộ dự án.*

3. **Database Schema Validate:**
   ```bash
   npx prisma validate
   ```
   *Yêu cầu: Đảm bảo cấu trúc tệp `schema.prisma` hợp lệ và không bị trôi lệch.*

---

### 🟡 LỚP 2: ĐỐI LẬP & PHẢN BIỆN (LAYER 2 - ADVERSARIAL AUDIT GATE)
Đóng vai trò là **Cynical Auditor** để tìm kiếm các lỗi logic và lỗ hổng:

1. **Khóa ghi trạng thái Task (Task Lock Gate):**
   - Nghiêm cấm Dev Agent tự ý đánh dấu hoàn thành `[x]` vào tệp `task.md` (tệp lưu tại thư mục story-specific hoặc session artifact) hoặc các file Story.
   - Trạng thái chỉ được cập nhật tự động sau khi Lớp 1 và Lớp 2 chạy qua thành công.
2. **Quét Over-Engineering & Bypass:**
   - Phát hiện các hàm trống, mock stubs rỗng (`return {}`, `return []`).
   - Kiểm tra xem code có thực sự triển khai đầy đủ các tiêu chí chấp nhận (AC) hay bỏ sót yêu cầu.
   - Tìm kiếm code thừa không nằm trong phạm vi yêu cầu (over-engineering).
3. **Kiểm tra Architecture Guardian (God File Prevention):**
   - Rà soát số dòng code của các file bị thay đổi hoặc tạo mới trong PR/Story.
   - Nếu phát hiện bất kỳ source file nào (không phải file tự sinh) vượt quá **ngưỡng 300-500 dòng**, bạn BẮT BUỘC phải đánh dấu LỖI NGHIÊM TRỌNG (CRITICAL ARCHITECTURE VIOLATION) và TỪ CHỐI (REJECT) bản đánh giá. Yêu cầu tác giả chạy `/refactor` để bóc tách file trước khi submit lại.

---

### 🔵 LỚP 3: KIỂM TRA CHÉO & KẾT NỐI (LAYER 3 - CROSS-STORY GATE)
Kiểm tra tác động chéo giữa các story đang chạy song song để tránh xung đột hệ thống:

1. **Truy vấn FeatureGraph:**
   Sử dụng các công cụ MCP FeatureGraph để kiểm tra:
   - Các bảng cơ sở dữ liệu được story hiện tại chỉnh sửa có bị chồng chéo với các story song song khác không.
   - Các API Endpoint mới có xung đột route.
   - Sự rò rỉ dữ liệu hoặc sai lệch trạng thái trong Middleware.
2. **Bảo toàn Tính tương thích ngược (Backward Compatibility):**
   - Đảm bảo migrations không phá vỡ dữ liệu hiện tại.
   - Kiểm tra API Contracts không làm hỏng các client cũ.

---

## 📊 KẾT QUẢ ĐÁNH GIÁ (REVIEW DISPOSITION & TRUST SCORE)

Reviewer phải kết luận đợt đánh giá bằng các thông tin sau:

1. **Hybrid Scorecard:** Tạo bảng điểm Hybrid Scorecard (6 Core Axes + 1 UX Empathy) theo tiêu chuẩn `qa-simulator-guardian`.
2. **Trust Score:** Gán nhãn độ tin cậy `Trust Score: High / Medium / Low`.
   - Nếu `Trust Score` là `Low`, đợt đánh giá bị **BÁC BỎ (REJECTED)**.
3. **Tier 1 Hybrid Graph Update:** BẮT BUỘC lưu lại kết quả Review (đặc biệt là Scorecard và Disposition) vào Knowledge Graph qua CLI:
   `iwish inject-node --file "_iwish-output/reviews/<tên-file-review>.md" --metadata '{"summary": "Code Review Scorecard", "tags": ["review", "audit"], "layer": "quality-control", "complexity": "medium"}'`
