# Capability Spec: epic-story-sync-guardian

## Type: SKILL
## Status: Draft
## Created: 2026-07-25

### Problem Statement
Trong quá trình làm việc, user hoặc AI Agent có thể di chuyển, thêm hoặc xóa các thư mục vật lý của Epic/Story nhưng quên chạy lệnh `/reconcile-change` hoặc `sync_all_statuses.py`. Điều này dẫn đến lỗi lệch pha (drift) giữa cấu trúc thư mục thực tế và tệp tổng hợp `sprint-status.yaml`, gây mất mát thông tin Epic/Story hoặc sai lệch Feature Group. `epic-story-sync-guardian` ra đời để trở thành lớp gác cổng, tự động so khớp và chặn các thao tác (như commit mã nguồn hoặc kết thúc pha Planning) nếu phát hiện sự thiếu đồng bộ.

### Knowledge Sources
- Source 1: Hiện tượng lỗi trực tiếp trên dự án `Cowok-ai` — Epic 07b và các Story 08.30-08.36 bị mất hoặc rớt khỏi danh sách đúng của mình trong `sprint-status.yaml`.
- Source 2: Luồng `/reconcile-change` — Luồng tiêu chuẩn chịu trách nhiệm xử lý các biến động về cấu trúc.

### Core Concepts
1. **SSOT (Single Source of Truth) Matching:** Luôn coi các thư mục vật lý (physical folder) của Epic/Story là nguồn dữ liệu chuẩn xác nhất để tham chiếu ngược lại file tracking.
2. **Hard Gate:** Là chốt chặn không thỏa hiệp. Phải quét kiểm tra file hệ thống và file YAML, nếu lệch là HALT.
3. **Remediation Trigger:** Khi phát hiện lỗi, tự động hướng dẫn user gọi quy trình `/reconcile-change` hoặc trực tiếp khởi chạy script đồng bộ hóa.

### Anti-Patterns
- ❌ Cố gắng sửa lỗi trong `sprint-status.yaml` bằng các lệnh text edit thủ công (vd như sử dụng `replace_file_content` hoặc LLM tự viết đè).
- ❌ Bỏ qua trạng thái bất đồng bộ và tiếp tục phát triển tính năng.

### Best Practices  
- ✅ Tích hợp một Python script siêu nhẹ (`validate-sprint-status.py`) thực hiện đếm số lượng Epic/Story ở thư mục vật lý so với số lượng xuất hiện dưới dạng Header trong `sprint-status.yaml`.
- ✅ Nếu kết quả trả về False, Skill sẽ ngắt luồng và báo cáo lý do cụ thể.

### Deliverables
- [ ] File 1: `.agent/skills/epic-story-sync-guardian/SKILL.md`
- [ ] File 2: `.agent/skills/epic-story-sync-guardian/scripts/validate-sprint-status.py`
