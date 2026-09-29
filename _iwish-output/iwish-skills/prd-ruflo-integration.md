# Product Requirements Document (PRD): Ruflo Selective Features Integration
> Ngày tạo / Created: 2026-05-31
> Trạng thái / Status: Chờ Phê duyệt (Awaiting Approval)
> Bản dịch: Song ngữ (Vietnamese / English)

## 1. Mục tiêu / Goal Description
Mục tiêu là trích xuất chọn lọc và tích hợp 3 cơ chế tối ưu của Ruflo vào I-Wish dưới dạng các **SYSTEM_SKILL**:
1. **Agent Booster (LLM Bypass):** Chạy cục bộ các chỉnh sửa đơn giản qua regex/WASM để tiết kiệm chi phí và thời gian gọi LLM.
2. **Topological Rollback:** Tự động đảo ngược các tác vụ đã hoàn thành theo thứ tự ngược lại khi quy trình story gặp lỗi trung gian.
3. **Thompson Sampling Router:** Định tuyến động các cuộc gọi mô hình dựa trên phân phối Beta để tối ưu chi phí, hỗ trợ đa nhà cung cấp (multi-provider) tương thích với I-Wish.

---

## 2. Yêu cầu Chức năng / Functional Requirements (FR)

### FR1: Agent Booster Skill (`agent-booster`)
- **Yêu cầu:** Xây dựng một skill hệ thống chạy cục bộ bằng Node.js.
- **Tính năng:**
  - So khớp mã nguồn và mô tả yêu cầu sửa đổi của user với tập hợp mẫu regex của Ruflo (như bọc try/catch, comment JSDoc, thay thế kiểu dữ liệu cơ bản).
  - Nếu khớp, chạy trực tiếp regex replace và trả về file đã chỉnh sửa.
  - Tích hợp chốt chặn thời gian chạy (timeout: 100ms) để ngăn ngừa lỗi ReDoS treo CPU. Nếu quá thời gian, tự động hủy và chuyển giao (fallback) cho LLM.

### FR2: Topological Rollback Mechanism (`workflow-rollback`)
- **Yêu cầu:** Bổ sung cơ chế phục hồi lỗi vào trình chạy workflow của I-Wish.
- **Tính năng:**
  - Cho phép mỗi bước trong quy trình Story hoặc Sprint đăng ký một hành động rollback cụ thể (ví dụ: khôi phục tệp tin qua git checkout, xóa file mock/test sinh ra, hoặc rollback database schema).
  - Khi phát hiện một bước trung gian bị lỗi (như compile error, test suite fail), tự động duyệt qua danh sách các tác vụ đã chạy hoàn tất trước đó theo thứ tự ngược lại (`completed.reverse()`) và thực thi các rollback hook.
  - **Phòng chống lặp vô hạn:** Nếu chính hành động rollback bị lỗi, dừng ngay lập tức, ghi nhật ký lỗi (error log) và báo cáo để người dùng tiếp quản thủ công.

### FR3: Bộ định tuyến Thompson Sampling Đa nhà cung cấp (`thompson-router`)
- **Yêu cầu:** Xây dựng skill định tuyến mô hình học tăng cường.
- **Tính năng:**
  - Không bó cứng vào Claude; phải đọc cấu hình môi trường I-Wish để cập nhật danh sách các LLM providers (Google Gemini, Anthropic, OpenAI, Ollama) và các model đang khả dụng.
  - Áp dụng phân phối Beta động dựa trên lịch sử latency, cost và tỉ lệ thành công của mỗi tác vụ để chọn model tối ưu.
  - Hỗ trợ lưu trữ lịch sử thống kê cục bộ tại `.iwish/routing-stats.json`.

### FR4: Fragment Quy chuẩn Mocking TDD London (`tdd-london-principles`)
- **Yêu cầu:** Tạo tài liệu đặc tả và hướng dẫn viết mock cho LLM.
- **Tính năng:**
  - Đóng gói tài liệu fragment `tdd-london-principles.md` hướng dẫn chi tiết cách viết mock và stub bằng Vitest/Jest theo triết lý London School (Outside-In).
  - Tích hợp chốt chặn Double-Lock để ép LLM phải đọc fragment này khi story yêu cầu kiểm thử mock-heavy.

### FR5: Cải tiến Cổng Tuân thủ (Compliance Self-Check Refinement)
- **Yêu cầu:** Tích hợp bộ quét bảo mật và phát hiện magic numbers tự động vào `/step-04-self-check`.
- **Tính năng:**
  - Tự động quét secret leaks và phát hiện magic numbers trong code chỉnh sửa trước khi đánh dấu story hoàn thành.

### FR6: Tự động hóa Git Hook & Dọn dẹp Worktree
- **Yêu cầu:** Nâng cấp git operations trong I-Wish.
- **Tính năng:**
  - Tự động thực thi dọn dẹp các nhánh nháp và worktrees thừa sau khi chặng Consensus Party-Mode hoàn tất.

---

## 3. Yêu cầu Phi chức năng / Non-Functional Requirements (NFR)

### NFR1: An toàn Cách ly (Project Isolation)
- Cấm tuyệt đối việc thực thi các tập lệnh cài đặt (`install.sh`, `sync-skills.sh`) của Ruflo. Mọi cấu hình skill phải được tích hợp thủ công và cô lập trong không gian làm việc của I-Wish.

### NFR2: Độ trễ Tính toán thấp (Low Overhead Latency)
- Agent Booster phải chạy trong vòng dưới 10ms.
- Thompson Router phải tính toán và trả về model đề xuất trong vòng dưới 20ms để không ảnh hưởng đến trải nghiệm người dùng.
- Tác vụ quét static của chặng Compliance không được kéo dài quá 15 giây.

