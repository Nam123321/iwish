# 🛡️ Quy trình Đánh giá Mã nguồn 3 Lớp (3-Layer Code Review Protocol)

Quy trình đánh giá mã nguồn này là chốt chặn cuối cùng trước khi một story được chấp thuận tích hợp vào nhánh chính. Mọi Code Reviewer phải áp dụng quy trình này một cách nghiêm ngặt.

---

## 📌 PHƯƠNG CHÂM KIỂM DUYỆT (ANTI-SYCOPHANCY)
- **Hoài nghi mang tính xây dựng (Constructive Skepticism):** Luôn bắt đầu đánh giá với giả định mã nguồn có lỗi hoặc chưa tối ưu.
- **Cấm chấp thuận mù quáng:** Tuyệt đối không tuyên bố "code trông ổn" hoặc phê duyệt story mà không chỉ ra được ít nhất 3 vấn đề cần cải thiện (về hiệu năng, phong cách, kiểm thử hoặc bảo mật).
- **Không tin tưởng báo cáo hoàn thành:** Không đọc phần tóm tắt của developer. Đối chiếu và kiểm tra trực tiếp qua Git Diff.

---

## ⚙️ CÁC LỚP BẢO VỆ CHÍNH (THE 3-LAYER QUALITY GATES)

> [!WARNING]
> **PHÂN TÁN NHẬN THỨC (PARALLEL EXECUTION):**
> Lớp 1, 1.8 và 2 ĐƯỢC GIAO CHO **Standards Guardian Agent**.
> Lớp 1.5 ĐƯỢC GIAO CHO **Spec Guardian Agent**.
> Lớp 3 ĐƯỢC GIAO CHO **Master Orchestrator**.

### 🔴 LỚP 1: CỔNG KIỂM TRA CƠ HỌC & MÙI CODE (LAYER 1 - MECHANICAL & SMELL GATE)
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

4. **[NEW] SMELL BASELINE AUDIT (ZERO-TRUST GATE):**
   Standards Guardian Agent BẮT BUỘC phải đối chiếu mã nguồn với danh sách 5 Code Smells cốt lõi:
   - **Mysterious Name:** Tên hàm/biến có phản ánh đúng chức năng không?
   - **Duplicated Code:** Có logic nào bị lặp lại đáng kể không?
   - **Feature Envy:** Method có thao tác với dữ liệu của class khác nhiều hơn dữ liệu của chính nó?
   - **Primitive Obsession:** Dùng string/int thay cho Domain Object (ví dụ: ZipCode, Email)?
   - **Shotgun Surgery:** Một sửa đổi nhỏ có khiến nhiều file bị đổi theo không?
   
   **Đầu ra bắt buộc:** Agent phải xuất ra một cấu trúc JSON (được nhúng trong file `raw-layer1-2.json`) chứa mảng `smell_matrix`, liệt kê trạng thái `[Passed]` hoặc `[Failed]` cho từng loại Smell. Thiếu ma trận này = TỰ ĐỘNG BÁC BỎ.

---

### 🟠 LỚP 1.5: CỔNG TUÂN THỦ ĐẶC TẢ VẬT LÝ (LAYER 1.5 - SPEC COMPLIANCE PHYSICAL GATE)
**Thực thi bởi: Spec Guardian Agent**
Trước khi chuyển sang đánh giá đối lập, Agent phải xác minh code thực sự triển khai đúng những gì đặc tả đã định nghĩa bằng cách chạy **verify-review-evidence.py**. **Đây là bước bắt buộc — không được bỏ qua.**

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> Reviewer tuyệt đối KHÔNG tự tính điểm SCS hoặc tự báo cáo điểm SCS theo cách thủ công.
> Chỉ có điểm SCS được tính bởi `spec-compliance-checker.py` và ghi nhận trong `checker-output-{id}.json` mới là hợp lệ.

1. **Chạy script kiểm tra tự động:**
   Reviewer BẮT BUỘC phải thực thi lệnh kiểm định vật lý:
   ```bash
   python3 .agent/scripts/verify-review-evidence.py <story_dir> <story_id> --ui-spec <path> --data-spec <path> --story <path> --scs-threshold 95
   ```
   *Yêu cầu: Script phải trả về mã thoát `0`. Nếu script báo lỗi hoặc exit code là `1` (do SCS < 95%, trôi lệch spec hash do sửa spec mà chưa cập nhật checker baseline, hoặc phát hiện mock chưa được phê duyệt/auth mocks), Reviewer phải lập tức dừng đánh giá và bác bỏ (REJECT) story.*

1b. **[NEW] BEHAVIORAL COVERAGE GUARDIAN (ZERO-TRUST EXECUTION GATE):**
   Standards Guardian Agent BẮT BUỘC phải xác minh test coverage bằng skill `behavioral-coverage-guardian`.
   - Nạp skill: `.agent/skills/behavioral-coverage-guardian/SKILL.md`
   - BẮT BUỘC thực thi script python runner để xác minh physical coverage của các file business logic.
   ```bash
   python3 .agent/skills/behavioral-coverage-guardian/scripts/runner.py --story <story_id> --coverage-file coverage/lcov.info
   ```
   *Yêu cầu: Lệnh phải trả về exit code `0`. Nếu exit code `1` (Type 1: Thiếu file, hoặc Type 2: Thiếu coverage cho business logic), lập tức TỪ CHỐI (REJECT) bản đánh giá.*

2. **Kiểm tra Mocks chưa được phê duyệt:**
   - Script tự động quét xem có mock nào không có annotation `[MOCK_APPROVED]`. Mọi auth mocks (Category E) sẽ bị chặn cứng (exit 1) và không thể phê duyệt.
   
3. **Đồng bộ hóa SSOT:**
   - Nếu spec bị chỉnh sửa sau khi chạy baseline checker, script sẽ báo lỗi trôi lệch hash. Dev phải chạy lại baseline checker trước khi gửi review.
   
4. **Kết quả:**
   - Ghi lại kết quả chạy script `verify-review-evidence.py` vào báo cáo đánh giá (review report) trước khi tiến hành Lớp 2.
   - Với MỖI Acceptance Criterion trong story:
     - Xác định artifact code cụ thể triển khai AC đó (file:line reference)
     - Xác định artifact test cụ thể kiểm thử AC đó
     - Tạo hàng: `[AC Text] → [Code Reference] → [Test Reference]`
   - Nếu bất kỳ AC nào thiếu Code Reference → **BÁC BỎ (REJECT)**
   - Nếu bất kỳ AC nào thiếu Test Reference → **CẢNH BÁO (WARN)**

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
**Thực thi bởi: Standards Guardian Agent**
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
**Thực thi bởi: Master Orchestrator**
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

4. **Cập nhật trạng thái Story & Auto-Sync (Story Status Update & Git Sync):**
   - NẾU đợt đánh giá được CHẤP THUẬN (APPROVED):
     - Bạn BẮT BUỘC phải cập nhật trường `status` trong frontmatter của file `story.md` thành `pending_qa`. Chạy lệnh: `python3 .agent/scripts/update-story-status.py <path-to-story.md> pending_qa`.
     - **[DATA LOSS PREVENTION RULE]** Nếu điểm Spec Compliance Score (SCS) đạt **trên 95%**, hệ thống BẮT BUỘC phải tự động đồng bộ (auto-sync) lên GitHub ngay lập tức để bảo toàn dữ liệu (hỗ trợ Loop Engineering & DevOps workflow). 
       - LƯU Ý CHO SUB-AGENT: Bạn (Review Agent) phải TƯỜNG MINH yêu cầu Agent điều phối chính (Orchestrator) chạy chuỗi lệnh sau trong báo cáo kết quả của bạn, vì Orchestrator mới là người nắm quyền ghi lệnh vào terminal:
       `git add <các_file_thuộc_scope_của_story> && git commit -m "chore(auto-sync): story <story_id> completed with SCS > 95% [pending_qa]" && git push origin HEAD`
       - LƯU Ý CHO ORCHESTRATOR: Nếu nhận được kết quả SCS > 95% từ sub-agent, bạn BẮT BUỘC phải thực thi chuỗi lệnh git push trên trực tiếp trên terminal của mình.
   - NẾU bị BÁC BỎ (REJECTED), bạn phải cập nhật `status` thành `in-progress` hoặc `dev_failed`. Chạy lệnh: `python3 .agent/scripts/update-story-status.py <path-to-story.md> dev_failed`.
   - Tuyệt đối không để nguyên trạng thái cũ.

5. **Lesson Captured (BẮT BUỘC):**
   - Đặc biệt khi bản đánh giá bị **BÁC BỎ (REJECTED)**, bạn BẮT BUỘC phải đúc kết kinh nghiệm ở cuối báo cáo bằng ĐÚNG định dạng thẻ Markdown sau (để script có thể tự động trích xuất):
   ```markdown
   ### Root Cause
   [Giải thích nguyên nhân cốt lõi gây ra lỗi]
   ### Actionable Rule
   [Quy tắc hành động cụ thể để sửa lỗi]
   ### Bài học
   [Đúc kết bài học hệ thống nếu có]
   ```
   - Thiếu các thẻ này sẽ khiến hệ thống không thể tự động rút trích bài học và cập nhật Knowledge Graph.
