---
description: 'Structured /audit-ux-patterns workflow to scan, map, and expose UX behavioral inconsistencies across the codebase.'
---

# /audit-ux-patterns

> **Mục tiêu:** Quét toàn bộ source code của dự án để tìm ra những vi phạm / mâu thuẫn về UX Operations (quy trình vận hành giao diện). Xuất báo cáo và đề xuất chuẩn hóa lên Master UX Record.

---

## Phase 1: Static Discovery (Tĩnh)

1. Quét AST hoặc `find` các file thuộc UI Components / Pages (`.tsx`, `.jsx`, `.vue`).
2. Xác định các hành vi UX phổ biến có trong source code:
   - **Modals/Dialogs**: Dùng thẻ `div` tự chế? Dùng Headless UI? Dùng thư viện Component (AntD, MUI)?
   - **Bulk Actions**: Nằm ở Table header? Nằm ở cart trôi (floating)?
   - **Form Submission**: Luồng validation báo đỏ dưới ô text, hay báo toast trên góc màn hình? Toast ở vị trí nào?
   - **Empty States / Loading**: Sử dụng Skeleton hay Spinner?

## Phase 2: Behavioral Mapping (Với CodeGraphContext)

> **MANDATORY INTELLIGENCE CHECK:** Bắt buộc dùng `CodeGraphContext` (CGC) để truy hồi hành vi gọi hàm.

3. Dùng CGC `find_callers` để map ra các Component sử dụng chung một cơ chế. VD: `useModal`, `openDialog`, `showToast`.
4. Tìm sự khác biệt trong Context hoặc Props truyền vào (VD: `<Modal placement="center">` tại 10 file nhưng có `<Modal placement="right">` tại 2 file có cùng hành vi Logic).
5. (Optional) Nếu có FeatureGraph, gắn UX UI component mapping vào Feature node. Tính năng "Tạo Order" và "Tạo Product" có chung hành vi "Create Entity", hãy xem chúng có mở UI giống nhau không.

## Phase 3: Diagnostic Reporting (Xuất Báo Cáo)

6. Tổng hợp các điểm nghẽn và vi phạm vào một file `ux-inconsistencies-report.md`.
7. Format báo cáo:
   - **Hành vi (Behavior):** Tạo mới một Data Item (Create Entity)
   - **Hiện trạng (Current Reality):** 
     - 70% dùng Modal bật giữa màn hình.
     - 30% chuyển sang một Page riêng biệt (Direct Page).
   - **Tác động UX:** Gây nhầm lẫn cho End-Users khi navigate hệ thống.

## Phase 4: Master Pattern Drafting & Auto-Refactoring

8. Xây dựng hoặc Cập nhật file `ux-patterns.yaml`. Dựa trên kết quả scan, đề xuất nhóm Rules chung (lấy số đông làm chuẩn hoặc Best Practices được Master quy định).
9. Mời User Review báo cáo: "Tôi tìm thấy 5 mâu thuẫn lớn trong cách mở Modal. Đây là Draft Master `ux-patterns.yaml`. Bạn chọn rule chuẩn nào?"
10. Sau khi User Approve Rule, Agent kích hoạt chế độ **Auto-Refactoring**:
    - Build script `multi_replace_file_content` hoặc `/quick-dev` hàng loạt lên 30% file vi phạm để ép về Pattern chuẩn.
    - Cập nhật lại CodeGraphContext thông qua `add_code_to_graph` cho từng file vừa sửa.
