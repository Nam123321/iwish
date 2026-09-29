# 🧭 Ruflo Selective Integration & Adoption Review Guide
> Ngày tạo / Created: 2026-05-31
> Trạng thái / Status: Chờ Phê duyệt (Awaiting Approval)
> Bản dịch: Song ngữ (Vietnamese / English)

Tài liệu này hướng dẫn cách trích xuất chọn lọc các thành phần của **Ruflo** để tích hợp làm **SYSTEM_SKILL** của I-Wish, tuân thủ nguyên tắc an toàn, cô lập dự án và tối ưu hóa tài nguyên.

---

## 1. Tổng quan & Phân loại / What is it
- **Tên thư viện / Repo name:** Ruflo (trước đây là Claude Flow)
- **Nguồn / Source:** `https://github.com/ruvnet/ruflo`
- **Trạng thái đăng ký / Registration state:** Phê duyệt trích xuất chọn lọc làm `SYSTEM_SKILL` (Approved for Selective Extraction).
- **Phân loại Hình dạng / Shape classification:** `compound` (chứa các skill-attachment và workflow-patch độc lập).
- **Phân loại Vai trò / Role classification:** `supportive` (hỗ trợ nâng cao hiệu năng, giảm chi phí và quản lý lỗi quy trình).

---

## 2. Lý do Tích hợp / Why it exists
- **Tác vụ giải quyết / Job solved:**
  1. Tránh lãng phí chi phí gọi LLM cho các chỉnh sửa định dạng mã nguồn đơn giản.
  2. Tự động dọn dẹp các tệp tin lỗi hoặc khôi phục mã nguồn khi một bước trong chuỗi công việc (workflow) bị thất bại.
  3. Định tuyến động cuộc gọi đến model phù hợp nhất dựa trên tỷ lệ thành công lịch sử và chi phí.
- **Lý do I-Wish cần hấp thụ / Why I-Wish wants it:** I-Wish hiện đang đi toàn bộ luồng chỉnh sửa qua LLM (tốn kém token và chậm) và chưa có cơ chế rollback tự động khi Story bị lỗi biên dịch giữa chừng.
- **Khoảng cách được lấp đầy / Gap filled:** Bổ sung cơ chế bypass LLM cho tác vụ cơ bản (qua Agent Booster), cơ chế phục hồi lỗi đảo ngược (Topological Rollback) và cơ chế định tuyến thông minh (Thompson Sampling Router).

---

## 3. Vị trí trong Khung phân phối / Delivery Framework Placement
- **Quy trình hỗ trợ / Phases served:** 
  - Quy trình phát triển `/code` và `/iwish-feature-dev-story` (sử dụng Agent Booster để sửa nhanh và Topological Rollback để khôi phục lỗi).
  - Trình điều phối chính `orch-agent` (sử dụng Thompson Router cho mọi cuộc gọi API LLM).
- **Phân cấp Vai trò / Framework Role:** `supportive` (hoạt động ngầm để gia tốc và bảo vệ các quy trình chính).

---

## 4. Mô hình Dữ liệu: Vào -> Xử lý -> Ra / Input -> Process -> Output

### 4.1. Agent Booster (Bypass LLM)
- **Đầu vào / Input:** Mã nguồn đích + Ý định chỉnh sửa (intent description).
- **Xử lý / Process:** So khớp biểu thức chính quy (regex) cục bộ thông qua Node-WASM.
- **Đầu ra / Output:** Mã nguồn đã sửa đổi (nếu khớp regex) hoặc chuyển giao (fallback) cho LLM.

### 4.2. Topological Rollback (Phục hồi Lỗi)
- **Đầu vào / Input:** Danh sách tác vụ con đã hoàn thành + Hook Rollback tương ứng của từng tác vụ.
- **Xử lý / Process:** Khi phát hiện lỗi biên dịch hoặc lỗi kiểm thử ở một bước, duyệt qua danh sách theo thứ tự đảo ngược (`completed.reverse()`) và gọi hàm rollback.
- **Đầu ra / Output:** Khôi phục trạng thái mã nguồn sạch trước khi thực hiện tác vụ lỗi.

### 4.3. Thompson Sampling Router (Định tuyến Động)
- **Đầu vào / Input:** Danh sách LLM providers khả dụng trong cấu hình môi trường I-Wish + Lịch sử latency/cost/success-rate.
- **Xử lý / Process:** Tính toán phân phối Beta và chọn mẫu ngẫu nhiên để chọn model tối ưu.
- **Đầu ra / Output:** Cấu hình model được đề xuất cho payload tiếp theo.

---

## 5. Các Kịch bản Sử dụng / Use Cases

### 5.1. Kịch bản Cốt lõi / Core Use Cases
1. **Formatting & Trivial Edits:** Tự động định dạng mã nguồn, bọc try-catch lỗi ngoại lệ, hoặc thêm kiểu dữ liệu TS mà không tốn 1 token LLM nào.
2. **Auto-Cleanup on Test Failure:** Khi một story bị lỗi kiểm thử ở bước cuối, tự động revert toàn bộ code đã sửa để tránh làm hỏng môi trường phát triển.
3. **Adaptive LLM Routing:** Tự động điều hướng các task nhẹ sang Haiku/Gemini Flash và các task nặng sang Sonnet/GPT-4o để cân đối chi phí.

### 5.2. Kịch bản Lân cận / Adjacent Use Cases
1. **Database Schema Reversion:** Đảo ngược các file SQL migration tạm thời nếu bước chạy test DB bị lỗi.
2. **Local vs Cloud Routing:** Tự động định tuyến sang Ollama chạy cục bộ khi mất kết nối internet hoặc khi chi phí vượt hạn mức.

### 5.3. Các Trường hợp Cấm sử dụng / Do-Not-Use Cases
1. **Codebase Search:** **CẤM** sử dụng HNSW/vector core của Ruflo cho việc tìm kiếm code. I-Wish đã tích hợp **Semble** thông qua `/code-search` đem lại hiệu quả vượt trội (tiết kiệm 98% token) và không cần cài đặt vector core nặng nề của Ruflo.
2. **Auto-Installer Runs:** **CẤM** thực thi các file `install.sh` hoặc `sync-skills.sh` của Ruflo để ngăn ngừa hành vi sandbox escape ghi đè file hệ thống ngoài không gian làm việc.

---

## 6. Các Trường hợp Biên & Hạn chế / Edge Cases & Constraints
- **Lỗi ReDoS (Regex Denial of Service):** Biểu thức chính quy phức tạp trong Agent Booster có thể gây nghẽn CPU.
  - *Biện pháp:* Áp dụng cơ chế timeout 100ms cho mọi lệnh chạy regex; nếu quá giờ lập tức hủy tiến trình và chuyển tiếp cho LLM.
- **Rollback lặp vô hạn (Infinite Rollback Loop):** Xảy ra khi hành động rollback chính nó cũng gây ra lỗi.
  - *Biện pháp:* Nếu rollback lỗi, dừng ngay lập tức, báo cáo lên màn hình và chuyển quyền kiểm soát thủ công cho User.
- **Khóa chặt Provider (Vendor Lock-in):** Thompson Router gốc của Ruflo chỉ hỗ trợ Claude.
  - *Biện pháp:* Thiết kế giao diện router dạng mở rộng để lấy cấu hình model khả dụng từ môi trường của I-Wish làm tập dữ liệu Beta.

---

## 7. Phối hợp giữa Agent / Workflow / Skill (Coordination)
- **Agent chịu trách nhiệm / Owner:** `dev-agent` sử dụng Booster/Rollback; `orch-agent` sử dụng Thompson Router.
- **Workflow gọi trực tiếp:** `/code`, `/iwish-feature-dev-story`, `/correct-course`.
- **Cơ chế gọi:** Được kích hoạt tự động ở các chặng trung gian của workflow thay vì để người dùng gọi thủ công.

---

## 8. Chỉ dẫn Định tuyến của Trình điều phối / Orch Routing Hints
- **Trigger Words (Từ khóa kích hoạt):** `định dạng mã`, `thêm try-catch`, `rollback tác vụ`, `revert code`, `định tuyến model`.
- **Anti-Triggers (Từ khóa tránh):** `tìm kiếm code` (chuyển sang Semble), `cài đặt môi trường ruflo` (chuyển sang skip).
- **Proposing mode:** Đề xuất tự động (auto-proposed) dưới dạng một lớp đệm tối ưu hóa trong luồng chạy.

---

## 9. Câu hỏi Đánh giá dành cho Người dùng / Review Questions for the User
1. **Giới hạn Regex:** Bạn có muốn quy định cụ thể các mẫu mã nguồn nào được phép bypass LLM (ví dụ: chỉ cho phép bọc try/catch và thêm comment JSDoc)?
2. **Xác nhận Rollback:** Bạn muốn cơ chế rollback hoạt động tự động 100% hay cần có bước confirm thủ công trước khi revert file nguồn?
3. **Danh sách Model Router:** Thompson Router có nên tự động quét toàn bộ model có cấu hình API Key trong máy hay chỉ giới hạn trong danh sách được chỉ định?

---

## 10. Kịch bản Ví dụ / Example Scenarios

### Kịch bản 1: Sửa mã nguồn cơ bản
- **Yêu cầu của người dùng:** "Hãy định dạng lại file helper.ts và bọc logic xử lý API trong khối try-catch."
- **Hoạt động của Orch:** Nhận thấy yêu cầu khớp với Agent Booster Regex, thực hiện sửa đổi cục bộ trong <1ms mà không gọi API LLM.

### Kịch bản 2: Lỗi chạy Story trong Sprint
- **Hoạt động của quy trình:** `dev-story` đang thực hiện viết code cho Story 10.3, bước chạy `npm run test` bị lỗi.
- **Hoạt động của Rollback:** Phát hiện lỗi, kích hoạt rollback đảo ngược các file nguồn đã chỉnh sửa về trạng thái commit gần nhất, dọn dẹp file mocks tạm thời và báo cáo cho người dùng.
