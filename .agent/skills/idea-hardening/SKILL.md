---
name: idea-hardening
description: "Core ideation policies: mandatory 2-3 approaches with trade-offs, YAGNI ruthlessness (challenge-back), and visual companion routing (Stitch vs HTML/Mermaid)."
---

# Idea Hardening

Bộ kỹ năng này thắt chặt kỷ luật thiết kế trong BMAD, đảm bảo mọi ý tưởng đều được thử thách qua các góc nhìn đối lập và bảo vệ MVP khỏi sự phình to không cần thiết (scope creep).

## 1. Quy tắc 2-3 Approaches (Mandatory)

Khi đề xuất phương án giải quyết (trong Brainstorming hoặc Socratic Review), Agent KHÔNG được phép chỉ đưa ra một lựa chọn duy nhất.

- **Option A ⭐ (Recommended):** Phương án tối ưu nhất theo nhận định của Agent.
- **Option B:** Phương án thay thế (vd: tradeoff giữa tốc độ ship vs tính mở rộng).
- **Option C:** Your own answer → ___

Mỗi Option phải bao gồm: **Mô tả**, **Ưu điểm**, **Nhược điểm**, và **Ngữ cảnh phù hợp**.

## 2. YAGNI Challenge (You Ain't Gonna Need It)

Agent phải đóng vai trò là người gác cổng MVP. Khi phát hiện yêu cầu feature có dấu hiệu vượt quá Story/PRD hiện tại:

- **Action:** Đặt câu hỏi phản biện (Challenge-back).
- **Template:** "Feature [X] có vẻ vượt quá MVP scope. Bạn chắc chắn cần nó ngay bây giờ hay có thể dời sang Phase 2 để ship nhanh hơn?"
- **Rule:** CHỈ hỏi, không tự ý cắt bỏ. Nếu User trả lời "Giữ lại", Agent phải tuân thủ và không hỏi lại feature đó trong cùng session.

## 3. Visual Routing (Efficiency Policy)

Tiết kiệm token và thời gian bằng cách chọn đúng định dạng hiển thị cho từng loại câu hỏi:

- **Sử dụng Stitch UI (Visual):** Cho các vấn đề về Layout, Mockup UI, so sánh màu sắc/vị trí.
- **Sử dụng HTML/Mermaid (Conceptual):** Cho các vấn đề về Logic, luồng dữ liệu (Data Flow), bảng so sánh Trade-offs, hoặc danh sách Requirements.

**Nguyên tắc:** "Người dùng sẽ hiểu rõ hơn nếu THẤY nó (Stitch) hay ĐỌC nó (Text/HTML)?"

## 4. Quick Design Check (Soft Gate)

Đối với các task nhỏ (Complexity Score CS ≤ 2), thay vì brainstorming toàn phần, hãy sử dụng 5 câu hỏi nhanh từ `.agent/fragments/quick-design-check.md`.
