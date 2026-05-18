# Epic: Phase 1 Visual Narrative & Idea Navigator

## Epic ID: PH1-NAV
## Status: In-Progress
## Priority: High

---

## Objective

Chuyển đổi các kết quả đầu ra của Phase 1 (Brainstorming, Research, Product Brief) từ các file Markdown rời rạc thành một trải nghiệm thị giác hợp nhất, mang tính dẫn dắt và tương tác cao thông qua một Dashboard HTML duy nhất (One-Page Journey). Mục tiêu là giúp các thành viên trong dự án dễ dàng nắm bắt toàn bộ dòng chảy ý tưởng và các bằng chứng hỗ trợ mà không cần đọc từng file lẻ.

Sau khi hấp thụ `nexu-io/html-anything`, epic này được nâng cấp theo hướng **HTML-first artifact surfaces**:
- Navigator không chỉ là nơi đọc Markdown đẹp hơn, mà là bề mặt xuất bản HTML có bố cục kể chuyện, scanability cao, và tái sử dụng được cho các report/command-center khác.
- Các pattern ưu tiên hấp thụ: JSON contract rõ ràng giữa generator và view, KPI/report cards, insight blocks, hotspot tables, và section hóa theo nhiệm vụ vận hành.

## Phạm vi (Scope)

### Trong phạm vi (IN):
- Xây dựng layout One-Page với phong cách thiết kế "Celestial Realm" (Premium Aesthetics).
- Phát triển cơ chế "Data Bridge" thông qua `navigator-data.js` để cập nhật nội dung từ Markdown.
- Tích hợp logic "Visual Lineage" sử dụng SVG connectors để kết nối các Idea với Research tương ứng.
- Tạo kỹ năng `Navigator-Guardian` để quản lý việc đồng bộ hóa tự động.
- Inject "Post-Step Hook" vào các workflow Analysis hiện có của I-Wish.
- Chuẩn hóa Navigator như một HTML surface có thể dùng lại cho report/dashboard khác trong hệ I-Wish.
- Hấp thụ các quy tắc trình bày từ `html-anything` cho các story HTML trong tương lai: section rõ, summary nhanh, data blocks giàu ngữ cảnh.

### Ngoài phạm vi (OUT):
- Chuyển đổi ngược từ HTML sang Markdown (chỉ hỗ trợ 1 chiều: MD -> HTML).
- Tích hợp các phase sau (Phase 2, 3...) vào Navigator (chỉ tập trung vào Phase 1).
- Clone nguyên xi hệ template/agent runtime của `html-anything` vào I-Wish.

## Acceptance Criteria (Epic Level)
- [ ] File `idea-navigator.html` hiển thị đầy đủ và đẹp mắt trên trình duyệt local.
- [ ] Nội dung trong HTML tự động cập nhật khi các file `.md` trong `_iwish-output/` thay đổi (thông qua sync script/agent).
- [ ] Có các đường dẫn trực quan (SVG/Gradient) thể hiện mối liên kết giữa các Idea và Research.
- [ ] Tất cả các workflow của Phase 1 đều tự động kích hoạt bước Sync Navigator sau khi hoàn thành.
- [ ] File HTML là duy nhất và có thể chia sẻ dễ dàng giữa các thành viên.
- [ ] Navigator tạo được tiền đề cho các HTML report khác dùng lại cùng contract hiển thị mà không phải phát minh lại từ đầu.

---

## Stories

### Story NAV-1: Celestial One-Page Template
Thiết kế và xây dựng layout One-Page với phong cách premium, tích hợp trình render Markdown (`marked.js`).

### Story NAV-2: Navigator Data Bridge & Sync Engine
Phát triển lớp trung gian `navigator-data.js` và script tự động đồng bộ hóa nội dung từ file MD vào Dashboard.

### Story NAV-3: Navigator Guardian Skill & Workflow Injection
Xây dựng Skill quản lý Navigator và tiêm bước "Post-Step Hook" vào các workflow Analysis của I-Wish.

### Story NAV-4: Visual Lineage & Narrative Connectivity
Triển khai hệ thống kết nối trực quan (SVG Connectors) và logic dẫn dắt câu chuyện giữa các component ý tưởng và nghiên cứu.

### Story NAV-5: HTML Surface Pattern Standardization
Tiếp nhận các pattern đã được kiểm chứng từ `html-anything` để chuẩn hóa section layout, card grammar, insight blocks, và JSON/UI contract cho toàn bộ family `Navigator` và `Operation Report`.

---

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| HTML file quá lớn gây lag | Áp dụng Lazy Loading và Section Collapsing cho các báo cáo research dài. |
| Vỡ cấu trúc layout khi inject nội dung lạ | Sử dụng Shadow DOM hoặc CSS scoping chặt chẽ cho phần nội dung Markdown. |
| Mất đồng bộ dữ liệu | Navigator Guardian sẽ thực hiện "Integrity Check" mỗi khi Agent khởi động. |
| Hấp thụ quá nhiều từ repo ngoài làm lệch I-Wish visual language | Chỉ hấp thụ pattern level (information architecture, report grammar), không bê nguyên UI runtime. |
