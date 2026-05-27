# Open Design trong I-Wish (Adoption Review Pack)

Generated: 2026-05-26

## 1. Mục tiêu của tài liệu

Tài liệu này đánh giá, phân tích tính phù hợp của repository [nexu-io/open-design](https://github.com/nexu-io/open-design) đối với quy trình phát triển của hệ thống I-Wish. Tài liệu giúp xác định:

- `open-design` là gì và giải quyết vấn đề gì.
- Sự tương đồng và khác biệt với các module hiện tại (ví dụ: `html-anything`).
- Phân loại capability của nó trong hệ sinh thái I-Wish.
- Đề xuất phương án tích hợp (Registration Mode, Triggers, Workflow Coordination).

## 2. Snapshot tích hợp đề xuất

- **Repo nguồn:** [nexu-io/open-design](https://github.com/nexu-io/open-design)
- **Trạng thái đề xuất:** `COMPOUND_INTEGRATION` (Đăng ký dạng module ngoài liên kết hoặc chạy song song)
- **Kiểu module:** `compound-external` (Chứa frontend app, local daemon, SQLite và Electron shell)
- **Triggers đề xuất:** `design`, `ui-spec`, `prototype`, `deck-pitch`, `brand-spec`, `visual-direction`, `mkt-material`, `mkt-assets`, `media-generation`
- **Tool dependencies:** `better-sqlite3`, `pnpm`, `electron` (optional)

---

## 3. Open Design là gì?

`open-design` (OD) là một giải pháp mã nguồn mở, hoạt động local-first nhằm thay thế cho **Claude Design** (của Anthropic). OD có các đặc điểm cốt lõi:

- **BYOK (Bring Your Own Key/Agent):** OD không đi kèm LLM agent riêng mà tự động quét và kết nối với các AI Coding CLI hiện có trên máy (như Claude Code, Gemini CLI, Cursor Agent, v.v.) thông qua stdio hoặc API proxy normalized.
- **Visual & Prompting Controls:**
  - **Turn-1 Question Form:** Form khảo sát trước khi sinh giao diện (về tone, brand, surface, audience) giúp khóa định hướng thiết kế trong 30 giây, tránh việc model thiết kế sai hướng.
  - **Visual Direction Picker:** Cung cấp 5 trường phái thiết kế (Editorial Monocle, Modern Minimal, Warm Soft, Tech Utility, Brutalist Experimental) đi kèm bảng màu OKLch và font stack cố định.
- **Rich Assets & Media Generation:** Hỗ trợ 132 skills (như saas-landing, dashboard, mobile-onboarding) và 150 hệ thống thiết kế (Linear, Stripe, Supabase, sup...). Ngoài ra, nó tích hợp gpt-image-2, Seedance (video), HyperFrames (motion graphics) để tạo media assets trực tiếp vào thư mục dự án.
- **Daemon & Workspace Architecture:** Chạy local daemon để quản lý SQLite DB lưu trữ tab, session, project files và render kết quả ra sandboxed iframe (srcdoc) trên giao diện web hoặc Electron.

---

## 4. Phân loại theo Capability Funnel của I-Wish

### Shape: `compound`
OD là một hệ thống con hoàn chỉnh (subsystem) bao gồm web app frontend, daemon backend, CLI adapters, SQLite và media generation pipelines. Nó có quá nhiều module con để được phân loại là một `skill` đơn lẻ.

### Role: `supportive`
OD không thay thế quy trình phát triển cốt lõi của I-Wish (như `plan`, `make-story`, `code`, `review`). Nhiệm vụ của nó là hỗ trợ (supportive) tạo ra các visual artifacts chất lượng cao, phục vụ cho việc trình bày ý tưởng, dựng prototype nhanh và kiểm thử UX.

### Delivery Framework Placement
OD hỗ trợ mạnh mẽ nhất ở các phase:
- **Plan:** Tạo product brief đẹp, slides trình bày dự án (`guizang-ppt`, `weekly-update`).
- **Solution:** Tạo UI/UX Spec companion, mockups di động, landing pages, visual direction.
- **Validate:** Tạo các HTML status reports trực quan hoặc dựng prototype để test với người dùng thông qua `simulate-user`.
- **Deliver/Operate/Learn:** Tạo tư liệu Marketing (media, user guide, video giới thiệu, marketing materials).

---

## 5. Mối quan hệ giữa Open Design và HTML Anything

Cả hai dự án đều được phát triển bởi đội ngũ **nexu-io** và chia sẻ chung triết lý thiết kế (local-first, agent-driven HTML, BYOK). Tuy nhiên, chúng có mục tiêu và cách tiếp cận khác nhau:

| Tiêu chí | HTML Anything (`html-anything`) | Open Design (`open-design`) |
|---|---|---|
| **Mục tiêu chính** | Biến nội dung thô (Markdown, CSV, JSON) thành HTML đọc được. | Thay thế toàn diện Claude Design và Figma bằng AI agent. |
| **Giao diện** | Tối giản, tập trung vào code và export nhanh. | Rich UI Workspace với preview iframe, device frames, tabs, todo list. |
| **Phạm vi** | Hỗ trợ 8 CLIs, 75 templates, 9 surfaces. | Hỗ trợ 16 CLIs, 132 skills, 150 design systems. |
| **Media Generation** | Không hỗ trợ sâu (chủ yếu là code HTML/CSS). | Tích hợp sâu sinh ảnh, video và motion graphics (HyperFrames). |
| **Độ phức tạp** | Nhẹ nhàng, dễ dàng hấp thụ (`absorb`) vào I-Wish. | Rất nặng (monorepo, Express daemon, SQLite, Electron shell). |

> [!TIP]
> **Nhận xét:** `html-anything` giống như một thư viện render tĩnh mà I-Wish có thể tích hợp sâu vào backend. Trong khi đó, `open-design` là một ứng dụng/giao diện thiết kế tương tác hoàn chỉnh.

---

## 6. Đánh giá tính phù hợp (Suitability Assessment)

### Điểm cộng lớn (Advantages)
1. **Thiết kế UI chuyên nghiệp (Brand-grade UI):** OD giải quyết điểm yếu của các AI sinh code thông thường (thường sinh ra giao diện generic hoặc lỗi thời) bằng cách ép model dùng các Design System chuẩn (Linear, Stripe) và hệ màu OKLch cố định.
2. **Quy trình thiết kế đạt chuẩn (Anti-AI-Slop):** Cơ chế "Discovery Form" ở Turn-1 và "Self-Critique" ở cuối turn giúp kiểm soát chất lượng thiết kế của agent, giảm 80% số lần lặp vô ích.
3. **Local-first & Bảo mật:** Giữ toàn bộ mã nguồn, asset và database ở local máy của lập trình viên, phù hợp với định hướng bảo mật của I-Wish.

### Điểm trừ và Rủi ro (Disadvantages & Risks)
1. **Quá cồng kềnh (Bloatware):** OD chứa toàn bộ giao diện editor và daemons. Việc gộp mã nguồn của OD vào I-Wish (absorb) sẽ làm tăng kích thước codebase lên gấp nhiều lần, gây xung đột dependency nặng nề (Next.js 16 vs các bản cũ, better-sqlite3 native modules).
2. **Trùng lặp tính năng:** I-Wish đã tích hợp `html-anything` cho mục đích kết xuất HTML artifacts. Nếu đưa thêm OD, Orch Agent sẽ gặp khó khăn trong việc phân biệt ranh giới gợi ý giữa hai hệ thống.
3. **Bảo mật daemon:** Việc daemon OD tự ý quét PATH và thực thi 16 loại CLI adapters bằng cách spawn tiến trình con (child_process) tiềm ẩn lỗ hổng thực thi mã độc nếu repo chứa mã độc (cần L4 sandbox kỹ càng).

---

## 7. Đề xuất Phương án Tích hợp (Proposed Integration Plan)

Thay vì chạy quy trình **Absorb** toàn bộ mã nguồn (gây phình to codebase), I-Wish chọn phương án **Federated Link (Liên kết liên bang)** với các chính sách cụ thể sau:

1. **Keep External:** Coi `open-design` là một **External Platform Companion**. Người dùng tự chạy Open Design cục bộ (độc lập) bằng CLI của nó (`pnpm tools-dev`). Open Design đóng vai trò là một **Design Tool** tương tự như `stitch`, `figma`, hay `claude-design`.
2. **Lazy CLI Setup Check:** I-Wish sẽ không bắt buộc người dùng cấu hình CLI trước. Thay vào đó, I-Wish kiểm tra động trên `PATH` và nhắc nhở hoặc hướng dẫn người dùng cài đặt CLI tương ứng chỉ khi họ chạy các tác vụ liên quan đến Open Design.
3. **Stitch / API Connection:** I-Wish tương tác với Open Design thông qua các HTTP endpoints của daemon OD (ví dụ: `GET /api/skills`, `POST /api/import/claude-design`).
4. **Orch Routing:** `orch-agent` của I-Wish sẽ giữ vai trò người hướng dẫn:
   - Khi user yêu cầu vẽ UI chất lượng cao hoặc tạo prototype, `orch-agent` sẽ hướng dẫn user mở Open Design hoặc tự động gửi payload sang Open Design API để khởi tạo dự án.
   - Kết quả đầu ra (HTML/ZIP artifact) từ Open Design sẽ được sync ngược lại thư mục dự án của I-Wish để chạy qua các gate validation khác như `visual-fidelity-gate` và `simulate-user`.

---

## 8. Trình điều phối (Agent & Workflow Coordination)

### Phối hợp Agent
- **`orch-agent`:** Phát hiện yêu cầu thiết kế giao diện phức tạp hoặc marketing materials từ user -> Đề xuất sử dụng Open Design và route nhiệm vụ sang `ux-agent` hoặc `creative-agent`.
- **`ux-agent`:** Chịu trách nhiệm tương tác với Open Design APIs hoặc hướng dẫn người dùng thiết lập các Design Systems (`DESIGN.md`) trong không gian dự án để OD kế thừa.
- **`creative-agent`:** Sử dụng khả năng sinh ảnh, video giới thiệu (Seedance/HyperFrames) và các templates marketing của Open Design để phục vụ các tài liệu user guide, hoạt động quảng bá.
- **`dev-agent`:** Nhận file ZIP/HTML export từ Open Design, giải nén vào thư mục `src/` của dự án và tinh chỉnh logic nghiệp vụ (business logic).
- **`review-agent`:** Chạy các checklist validation trên các files code được lấy về từ Open Design.

### Routing Hints cho Orch
- **Triggers:** `"vẽ landing page kiểu Stripe"`, `"thiết kế slide deck pitch round"`, `"tạo dashboard quản trị đẹp"`, `"tạo video giới thiệu sản phẩm"`, `"tạo social poster/carousel marketing"`.
- **Anti-Triggers:** `"viết API login"`, `"migrate database"`, `"viết unit test"` (OD chỉ tập trung vào trình bày và UX giao diện).

---

## 9. Phản hồi và Quyết định của Người dùng (Resolved Review Questions)

Các câu hỏi đánh giá đã được thống nhất và chốt phương án như sau:

1. **Về hình thức ứng dụng:** Xác định Open Design hoạt động như một ứng dụng độc lập bên cạnh I-Wish. Vai trò của Open Design là một **Design Tool Adapter** (song song với `stitch`, `figma`, `claude-design`), đi kèm skill/workflow pack tương ứng để hỗ trợ thiết kế.
2. **Về khả năng sinh media (Video/Ảnh):** Đồng ý kết hợp với các workflow marketing để bao phủ từ khâu ý tưởng -> sản phẩm -> user guide -> marketing materials. Khả năng sinh ảnh, video (Seedance/HyperFrames) của Open Design sẽ được tích hợp để phục vụ các hoạt động Marketing.
3. **Về cài đặt CLI:** Thống nhất cơ chế kiểm tra động (lazy check). Phần setup CLI sẽ phụ thuộc vào người dùng; I-Wish chỉ nhắc nhở hoặc hướng dẫn cài đặt khi người dùng gọi các tác vụ sử dụng Open Design.
