# Epics & Stories: Ruflo Selective Integration
> Ngày tạo / Created: 2026-05-31
> Trạng thái / Status: Chờ Phê duyệt (Awaiting Approval)
> Bản dịch: Song ngữ (Vietnamese / English)

Tài liệu này phân rã các yêu cầu tích hợp thành các Epic và User Story để đưa vào sprint chạy thực tế.

---

## Epic 1: Agent Booster & WASM/Regex LLM Bypass

### Story 1.1: Xây dựng Bộ lọc Regex và WASM cục bộ (Local Regex & WASM Skill)
- **Mục tiêu:** Tạo skill `agent-booster` chạy cục bộ để thực hiện sửa đổi mã nguồn đơn giản.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Nhận diện và so khớp chính xác ít nhất 3 mẫu intent sửa đổi (ví dụ: wrapping in try-catch, formatting, JSDoc creation).
  - AC2: Chạy Node/WASM regex replace trong vòng dưới 10ms.
  - AC3: Tích hợp timeout 100ms chặn ReDoS. Tự động trả về cờ fallback nếu quá thời gian hoặc không khớp mẫu.

### Story 1.2: Tích hợp Booster vào Trình phát triển Câu chuyện (Dev-Agent Integration)
- **Mục tiêu:** Wire skill `agent-booster` vào các chặng chạy đầu của dev-agent để đánh giá bypass LLM.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Khi dev-agent nhận lệnh sửa đổi, gọi `agent-booster` trước.
  - AC2: Nếu booster thành công, bỏ qua bước gọi LLM và trực tiếp cập nhật file nguồn.
  - AC3: Nếu booster fallback, chuyển tiếp yêu cầu đến LLM chính xác mà không làm hỏng payload ngữ cảnh.

---

## Epic 2: Topological Rollback Engine

### Story 2.1: Quản lý Stack Rollback và Registry Tác vụ (Rollback Task Stack Manager)
- **Mục tiêu:** Triển khai cấu trúc quản lý các hook rollback khi thực thi tác vụ.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Cho phép đăng ký cặp hành động `(execute, rollback)` cho mỗi sub-task.
  - AC2: Lưu trữ stack các tác vụ con đã hoàn thành (`completed_stack`).
  - AC3: Có hàm `rollbackAll()` duyệt qua stack theo thứ tự đảo ngược và thực thi hook tương ứng.

### Story 2.2: Tích hợp Rollback và Cơ chế Chặn Lặp (Rollback Integrator & Fail-Safe Hook)
- **Mục tiêu:** Nhúng rollback engine vào core workflow runner của I-Wish.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Tự động kích hoạt rollback khi story build hoặc test thất bại.
  - AC2: Nếu một lệnh rollback bị crash, dừng lập tức, ghi log lỗi chi tiết, không chạy tiếp các rollback sau để tránh loop vô hạn.
  - AC3: Chuyển giao quyền kiểm soát môi trường sạch/bẩn về cho User để xử lý thủ công.

---

## Epic 3: Multi-Provider Thompson Sampling Router

### Story 3.1: Quét Cấu hình Mô hình Đa nhà cung cấp và Lưu trữ Thống kê (Model Discovery & Stats Tracker)
- **Mục tiêu:** Triển khai module đọc môi trường và lưu trữ dữ liệu thống kê cuộc gọi.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Đọc tệp cấu hình của I-Wish để lấy danh sách các API model và provider đang hoạt động.
  - AC2: Tạo tệp lưu trữ lịch sử thống kê hiệu năng tại `.iwish/routing-stats.json`.
  - AC3: Ghi nhận latency, cost và kết quả thành công/thất bại của mỗi lần chạy.

### Story 3.2: Bộ định tuyến Thompson Sampling Động (Dynamic Beta-Distribution Router)
- **Mục tiêu:** Xây dựng thuật toán chọn model dựa trên phân phối Beta.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Tính toán giá trị Beta ($ \alpha, \beta $) cho mỗi model từ tệp thống kê hiệu năng.
  - AC2: Đề xuất model tối ưu nhất cho từng nhiệm vụ theo xác suất Thompson Sampling trong vòng dưới 20ms.
  - AC3: Tự động cập nhật ma trận khi có model mới được bổ sung hoặc model cũ bị tắt cấu hình.

---

## Epic 4: TDD London School Fragment

### Story 4.1: Tạo tài liệu Fragment TDD London (`tdd-london-principles`)
- **Mục tiêu:** Biên soạn tệp fragment hướng dẫn viết mock test chuẩn mực.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Tạo file `.agent/fragments/tdd-london-principles.md` với các hướng dẫn về mock và stub.
  - AC2: Cung cấp ít nhất 3 kịch bản viết mock thực tế bằng Vitest/Jest.
  - AC3: Tích hợp vào danh sách đăng ký `knowledge-graph.yaml`.

### Story 4.2: Tích hợp Double-Lock cho TDD Fragment
- **Mục tiêu:** Cài đặt chốt chặn Double-Lock trong story template để ép LLM đọc fragment khi cần.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Thêm chỉ thị Double-Lock vào đầu file template story khi phân loại là mock-heavy test.
  - AC2: Xác thực LLM tự động gọi `view_file` để nạp fragment này trước khi viết code test.

---

## Epic 5: Compliance Self-Check Refinement

### Story 5.1: Tích hợp Cổng quét Tự động (Security & Magic Numbers Scan)
- **Mục tiêu:** Bổ sung các lệnh quét tĩnh tự động vào quy trình self-check.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Tích hợp gitleaks hoặc quét secret cục bộ vào chặng self-check của I-Wish.
  - AC2: Phát hiện và cảnh báo các magic numbers hoặc context-leak về giá trị cứng.
  - AC3: Ngăn chặn chuyển trạng thái Story sang DONE nếu phát hiện lỗi bảo mật nghiêm trọng.

---

## Epic 6: Git Hook & Worktree Automation

### Story 6.1: Tự động hóa dọn dẹp Git Worktree
- **Mục tiêu:** Nâng cấp thư viện git-operations để tự động dọn dẹp các nhánh nháp/worktree.
- **Tiêu chí Chấp nhận / Acceptance Criteria:**
  - AC1: Viết script tự động quét và thu hồi (git worktree remove) các worktree đã hoàn thành nhiệm vụ.
  - AC2: Tích hợp lệnh dọn dẹp tự động vào bước cuối cùng sau khi Consensus Party-Mode hoàn tất.
  - AC3: Ghi nhận lịch sử dọn dẹp vào báo cáo merge.

