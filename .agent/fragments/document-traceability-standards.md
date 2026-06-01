# Document Traceability & Folder Standards

Để đảm bảo tính truy vết (traceability), kế thừa thông tin và tránh mất mát ngữ cảnh giữa các giai đoạn từ Ý tưởng đến Mã nguồn, Iwish chuẩn hóa cấu trúc thư mục lưu trữ tài liệu đầu ra (outputs) và nguyên tắc liên kết thông tin.

---

## 1. Cấu trúc Thư mục Chuẩn (Standard Directory Tree)

Tất cả các tài liệu lập kế hoạch, nghiên cứu và báo cáo sẽ được lưu trữ dưới thư mục đầu ra của dự án (mặc định là `_iwish-output/` hoặc `docs/planning/` tùy cấu hình dự án) theo cấu trúc phân lớp sau:

```text
_iwish-output/
├── 1. Idea Discovery/
│   ├── 1.1. idea-discovery.md           # Output của /idea-discover (Làm rõ ý tưởng ban đầu)
│   ├── 1.2. idea-bank.md                # Output của /brainstorm (Các phương án & MVP scope)
│   ├── 1.3. idea-challenge.md           # Output của /idea-challenge (PRFAQ stress-test)
│   └── 1.4. research/
│       ├── market-research.md           # Nghiên cứu thị trường (chỉ áp dụng cho Commercial Software)
│       ├── competitor-research.md       # Nghiên cứu đối thủ (Commercial) hoặc các Tool thay thế hiện có (Internal)
│       ├── domain-research.md           # Nghiên cứu nghiệp vụ chuyên môn (luật, kế toán, sinh học, v.v.)
│       ├── technical-research.md        # Khảo sát khả thi kỹ thuật, thư viện, kiến trúc đề xuất
│       └── project-context.md           # Bối cảnh & quy tắc phát triển dự án
│
├── 2. Product Planning/
│   ├── 2.1. product-brief-or-prd.md     # Tài liệu PRD chính (Kế thừa từ mục 1.3 và 1.4)
│   ├── 2.2. database-spec.md            # Thiết kế Schema dữ liệu tổng thể (nếu có DB)
│   ├── 2.3. ui-ux-spec.md               # Tiêu chuẩn thiết kế giao diện tổng thể (UX Spec & User Journeys - nếu có FE)
│   ├── 2.4. epics-and-stories.md        # Danh sách Epics và Stories phân rã từ PRD
│   └── design-system/
│       └── {portal-slug}/
│           └── DESIGN.md                # Design System Master (Base Tokens, Colors, Typography)
│
├── 3. Development/
│   ├── 1. Epic & Story/                 # Quản lý sự phát triển theo cấu trúc thư mục cây
│   │   └── Epic-[ID]/                   # Thư mục cho từng Epic (Ví dụ: Epic-POC)
│   │       ├── epic-spec.md             # Tài liệu đặc tả kỹ thuật / thiết kế của Epic (nếu có)
│   │       └── Story-[ID]/              # Thư mục cho từng Story thuộc Epic
│   │           ├── story.md             # File Story chính (AC, Tasks, QA Scorecard)
│   │           ├── ui-ux-spec.md        # Thiết kế giao diện riêng cho Story này (nếu có FE)
│   │           └── database-spec.md     # Thiết kế dữ liệu riêng cho Story này (nếu có DB)
│   ├── 2. Bug Report/                   # Thư mục chứa danh sách báo cáo lỗi phát sinh
│   │   └── Bug-[ID].md                  # Chi tiết báo cáo lỗi
│   ├── sprint-status.yaml               # Trạng thái Sprint hiện tại
│   └── project-expansion-review/
│       └── PER-[feature-name].md        # Báo cáo đánh giá tác động mở rộng dự án
│
└── 4. Verification & Release/
    ├── 4.1. walkthrough.md              # Báo cáo kết quả kiểm thử và nghiệm thu tính năng
    ├── 4.2. merge-report.json           # Báo cáo sáp nhập code và kiểm tra xung đột
    └── 4.3. retrospective.md            # Rút kinh nghiệm sau mỗi epic/sprint
```

---

## 2. Nguyên tắc Cạnh tranh & Thay thế (Competitor Rules)
- **Dự án Thương mại (Commercial Software)**: File `competitor-research.md` phải tập trung vào các đối thủ thương mại trực tiếp và gián tiếp trên thị trường (tính năng, giá cả, mô hình kinh doanh).
- **Dự án Nội bộ (Internal Tool)**: File `competitor-research.md` sẽ đổi hướng nghiên cứu thành **Các công cụ/quy trình thay thế đang có** (vd: Excel, giấy tờ, hoặc phần mềm cũ). Nó phải chỉ ra rõ:
  1. *Quy trình hiện tại hoạt động thế nào?*
  2. *Điểm không hài lòng lớn nhất của User đối với giải pháp hiện có?*
  3. *Tại sao giải pháp hiện tại chưa đáp ứng được?*

---

## 3. Nguyên tắc Kế thừa & Liên kết (The Inheritance Protocol)

Mỗi tài liệu được tạo ra ở bước sau **bắt buộc** phải có cơ chế kế thừa tài liệu trước đó để tránh "lười biếng thông tin" và trôi lệch mục tiêu:

### 🔗 Quy tắc liên kết bắt buộc:
1. **PRD / Product Brief (`2.1. product-brief-or-prd.md`)**:
   - Phải có phần mở đầu `# 0. Upstream References` liên kết trực tiếp đến [1.3. idea-challenge.md](file:///_iwish-output/1.%20Idea%20Discovery/1.3.%20idea-challenge.md) và các file trong [1.4. research/](file:///_iwish-output/1.%20Idea%20Discovery/1.4.%20research/).
   - Phải chứng minh các yêu cầu chức năng (FRs) giải quyết trực tiếp nỗi đau được chỉ ra trong nghiên cứu đối thủ/quy trình cũ.

2. **Epics & Stories (`2.4. epics-and-stories.md`)**:
   - Mỗi Epic được tạo ra phải map 1-1 với các mục tiêu trong PRD.
   - Mỗi User Story phải có mục `Upstream Traceability` chỉ ra nó thuộc Epic nào và giải quyết tính năng nào của PRD.

3. **Project Expansion Review (`PER-[name].md`)**:
   - Khi có yêu cầu mới, PER phải đọc lại toàn bộ [1.3. idea-challenge.md](file:///_iwish-output/1.%20Idea%20Discovery/1.3.%20idea-challenge.md) và các file nghiên cứu cũ để trả lời câu hỏi: *"Tính năng mới này có phá vỡ hay phủ định giả định cốt lõi nào của dự án không?"*.

---

## 4. Cách áp dụng (Agent Action Rule)

1. **Khởi tạo dự án**: Khi kích hoạt lệnh `/idea-discover`, Agent phải tạo cấu trúc thư mục này trước tiên.
2. **Double-Lock Check**: Khi thực hiện bất kỳ bước nào, Agent phải dùng `view_file` để tải tài liệu của bước trước đó làm tiền đề tư duy. Không tự giả định lại từ đầu.
3. **Cập nhật đồng bộ**: Khi PER định tuyến quay lại mức 2 hoặc mức 3, Agent phải cập nhật các file tương ứng trong cấu trúc thư mục này trước khi cho phép tiến hành tiếp.
