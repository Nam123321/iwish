---
name: taste-skill-injector
description: Nạp và cấu hình bắt buộc luật thiết kế (SKILL.md) của Taste-skill vào bối cảnh (context) của Agent trước khi tiến hành sinh code giao diện (UI/UX).
---

# 🎨 `/taste-skill-injector` Workflow

## 📌 TỔNG QUAN
Workflow này đóng vai trò như một bộ nạp (Injector) để truyền tải sức mạnh chống-slop của repo `taste-skill` vào Agent. Thay vì dùng Prompt ngôn ngữ tự nhiên chung chung (ví dụ: "hãy thiết kế đẹp theo taste-skill" - dễ gây ảo giác), workflow này **BẮT BUỘC** đọc chính xác file `SKILL.md` và ép LLM phải tuân thủ các thông số cụ thể.

**Sử dụng:** `/taste-skill-injector` hoặc `/use-taste-skill`

---

## 🚦 CÁC BƯỚC THỰC THI

### Bước 1: Intake & Dial Configuration (Cấu hình Tham số)
Agent hỏi (hoặc nhận tham số từ lệnh) các cấu hình cho 3 Nút vặn (Dials) của taste-skill:
1. **DESIGN_VARIANCE (1-10):** Mức độ phá cách layout (Mặc định: 6).
2. **MOTION_INTENSITY (1-10):** Mức độ phức tạp của animation GSAP (Mặc định: 5).
3. **VISUAL_DENSITY (1-10):** Mức độ dày đặc thông vị trí trên UI (Mặc định: 5).

*Lưu ý:* Người dùng cũng có thể chọn một biến thể skill khác (như `minimalist-ui`, `high-end-visual-design`, `brutalist-skill` nằm trong `skills/`). Nếu không, dùng mặc định `design-taste-frontend`.

### Bước 2: Context Load (Đọc nguồn chân lý)
- Agent sử dụng công cụ đọc file (`view_file` hoặc tương đương) để đọc toàn bộ nội dung file `SKILL.md` của taste-skill.
- Đường dẫn hệ thống mặc định (nếu đã import): `/tmp/taste-skill/taste-skill-main/skills/design-taste-frontend/SKILL.md` (hoặc đường dẫn đăng ký tương ứng trong I-Wish workspace).
- **Tuyệt đối không:** Agent không được phép "đoán" hoặc "bịa" ra nội dung taste-skill nếu không tìm thấy file. Nếu file không tồn tại, phải dừng lại và yêu cầu chạy `/register-skill-pack`.

### Bước 3: Execution Context Injection (Nhúng luật vào ngữ cảnh)
- Khi gọi các lệnh sinh UI (như `/code`, `/make-ui-spec` hoặc giao việc cho `ux-agent` / `dev-agent`), Agent phải nối **TOÀN BỘ NỘI DUNG** của `SKILL.md` vừa đọc được vào **System Prompt** hoặc **Mandatory Constraint** của tiến trình đó.
- Gắn thêm cấu hình 3 tham số (từ Bước 1) vào cuối file `SKILL.md` nạp vào.
- Chỉ thị cứng cho subagent: *"Bạn BẮT BUỘC phải áp dụng 100% các luật (Rule) trong tài liệu này (không dùng placeholder, bắt buộc dùng GSAP, v.v). Không được phép làm trái."*

---

## 🚫 LỖI CẦN TRÁNH
- Agent giả lập (Hallucination) việc áp dụng taste-skill mà thực chất chỉ tạo ra CSS thông thường. Phải kiểm chứng xem code sinh ra có đúng cấu trúc animation và nguyên tắc chống-slop của file `SKILL.md` hay chưa.
