# Quick Design Check (Soft Gate)

> **Trigger:** Fragment này được gọi khi task được phân loại là "minor", ước tính < 30 phút, hoặc có Complexity Score (CS) ≤ 2.

**Mục tiêu:** Tránh over-engineering cho các task đơn giản nhưng vẫn đảm bảo không bỏ sót các side-effects tiềm ẩn.

Vui lòng trả lời nhanh các câu hỏi sau (hoặc gõ **"proceed"** để bỏ qua bước này):

1. **Scope:** Task này ảnh hưởng đến component/module cụ thể nào?
2. **Side-effects:** Có nguy cơ phá vỡ feature nào khác không? (VD: chung data state, chung CSS class).
3. **Verification:** Bạn dự định test kết quả bằng cách nào? (VD: log terminal, UI check).
4. **Consistency:** Có cần cập nhật PRD/Story để khớp với thay đổi này không?
5. **Approaches:** Bạn định làm theo cách nào? Có cách nào đơn giản hơn (YAGNI) không?

---
*Nếu bạn gõ "proceed", Agent sẽ hiểu rằng bạn đã tự cân nhắc các yếu tố trên và sẵn sàng triển khai ngay.*
