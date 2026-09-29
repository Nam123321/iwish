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

### 🟠 LỚP 1.5: CỔNG TUÂN THỦ ĐẶC TẢ (LAYER 1.5 - SPEC COMPLIANCE GATE)
Trước khi chuyển sang đánh giá đối lập, Reviewer phải xác minh code thực sự triển khai đúng những gì đặc tả đã định nghĩa. **Đây là bước bắt buộc — không được bỏ qua.**

> **[CRITICAL]** Nạp skill Spec Compliance Guardian: `view_file .agent/skills/spec-compliance-guardian/SKILL.md`

1. **Nạp đặc tả bắt buộc (Mandatory Spec Loading):**
   - BẮT BUỘC nạp file Story (với đầy đủ ACs và Tasks)
   - BẮT BUỘC nạp file UI Spec (nếu story liên quan đến giao diện)
   - BẮT BUỘC nạp file Data Spec (nếu story liên quan đến dữ liệu/API)
   - BẮT BUỘC nạp file `api-routes.ts` (nếu story liên quan đến API endpoints)
   - Nếu bất kỳ file đặc tả bắt buộc nào THIẾU → **DỪNG ĐÁNH GIÁ** với lỗi "Missing spec file"

2. **Kiểm tra Đồng bộ UI Spec ↔ Code:**
   - `[UI-1]` So sánh cây component trong UI Spec với cấu trúc file component thực tế. Ghi nhận: component thiếu, sai cấu trúc lồng nhau, component thừa không có trong spec.
   - `[UI-2]` Trích xuất design tokens từ UI Spec và kiểm tra code sử dụng đúng token. Ghi nhận: màu hardcoded, tham chiếu token sai.
   - `[UI-3]` Trích xuất responsive rules từ UI Spec và kiểm tra breakpoint classes. Ghi nhận: thiếu breakpoint, logic breakpoint sai.
   - `[UI-4]` Trích xuất state definitions (loading/empty/error) từ UI Spec và kiểm tra code paths. Ghi nhận: thiếu xử lý state.

3. **Kiểm tra Đồng bộ Data Spec ↔ Code:**
   - `[DATA-1]` So sánh entity fields trong Data Spec với Prisma schema field-by-field. Ghi nhận: field thiếu, type sai, relation thiếu, constraint sai.
   - `[DATA-2]` So sánh DTO contracts trong Data Spec với TypeScript interfaces thực tế trong controllers/api-client. Ghi nhận: field thiếu, type sai, nesting sai.
   - `[DATA-3]` So sánh API routes trong Data Spec với `api-routes.ts` và controller decorators thực tế. Ghi nhận: route thiếu, HTTP method sai, params sai.

4. **Ma trận Truy vết AC (AC Traceability Matrix):**
   - Với MỖI Acceptance Criterion trong story:
     - Xác định artifact code cụ thể triển khai AC đó (file:line reference)
     - Xác định artifact test cụ thể kiểm thử AC đó
     - Tạo hàng: `[AC Text] → [Code Reference] → [Test Reference]`
   - Nếu bất kỳ AC nào thiếu Code Reference → **BÁC BỎ (REJECT)**
   - Nếu bất kỳ AC nào thiếu Test Reference → **CẢNH BÁO (WARN)**

5. **Tính điểm SCS (Spec Compliance Score):**
   ```
   SCS = (UI compliance × 0.30 + Data compliance × 0.30 + AC coverage × 0.40) × 100
   ```
   - Nếu SCS < 85% → **BÁC BỎ** với báo cáo diff chi tiết, gửi lại cho dev.
   - Nếu SCS ≥ 85% → Ghi nhận SCS vào review report, chuyển sang Lớp 1.8 (nếu có logic code) hoặc Lớp 2.

---

### 🟢 LỚP 1.8: CỔNG BIÊN DỊCH & KIỂM TRA RUNTIME (LAYER 1.8 - COMPILATION & HEALTH-CHECK GATE)
Cổng này đảm bảo code thực sự chạy được, chống lỗi Vite 500. **Lưu ý: Cổng này có tính chọn lọc để tiết kiệm tài nguyên.**

1. **Selective Trigger (Kích hoạt có chọn lọc):**
   - BẮT BUỘC chạy cổng này nếu Git Diff có sửa đổi các file logic, components, cấu hình (`src/**/*.ts`, `src/**/*.tsx`, `vite.config.ts`, `schema.prisma`...).
   - BỎ QUA cổng này nếu thay đổi chỉ nằm trong file tĩnh, tài liệu, markdown, hoặc các chỉnh sửa không ảnh hưởng logic.

2. **Compilation Gate (Biên dịch tĩnh):**
   - Chạy lệnh build: `npm run build` hoặc `npx vite build --emptyOutDir`.
   - Lệnh build phải redirect log ra file vật lý (vd: `> _iwish-output/evidence/build-review.log 2>&1; echo $? > _iwish-output/evidence/build.exitcode`).
   - Kiểm tra bằng `validate-evidence.js`. Nếu thất bại → Điểm SCS bị ép về 0% → **BÁC BỎ (REJECT)**.

3. **Runtime Health-Check (Xác minh Runtime):**
   - Khởi động dev server chạy ngầm (ví dụ: `npm run dev -- --port 3004 &`).
   - Chờ server sẵn sàng, chạy `curl -I http://localhost:3004` để xác minh trả về HTTP 200 OK.
   - Hủy process server (`kill`) ngay sau khi kiểm tra.
   - Nếu trả về 500 hoặc server crash → **BÁC BỎ (REJECT)**.

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
4. **Unknowns Scanner (Adversarial Micro Scan):**
   - Nạp `unknowns-scanner` skill (`.agent/skills/unknowns-scanner/SKILL.md`)
   - Chạy với: phase=review, depth=full
   - Tools: debiasing-check, drift-detector, merge-quiz
   - Nếu findings có mức độ critical → TỰ ĐỘNG BÁC BỎ (REJECT) bản đánh giá.


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

4. **Cập nhật trạng thái Story (Story Status Update):**
   - NẾU đợt đánh giá được CHẤP THUẬN (APPROVED), bạn BẮT BUỘC phải cập nhật trường `status` trong frontmatter của file `story.md` thành `testing` hoặc `pending_qa`. Chạy lệnh: `python3 .agent/scripts/update-story-status.py <path-to-story.md> pending_qa`.
   - NẾU bị BÁC BỎ (REJECTED), bạn phải cập nhật `status` thành `in-progress` hoặc `dev_failed`. Chạy lệnh: `python3 .agent/scripts/update-story-status.py <path-to-story.md> dev_failed`.
   - Tuyệt đối không để nguyên trạng thái cũ.
