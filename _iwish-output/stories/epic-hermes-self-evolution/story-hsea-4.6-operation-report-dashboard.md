---
id: "story-hsea-4.6"
epic_id: "epic-hsea"
title: "Operation Report & Health Dashboard"
status: "Ready"
priority: "High"
type: "ui-ux"
phase: "forge"

---
# User Story: HSEA-4.6 - Operation Report & Health Dashboard

## 1. Context & Rationale
Dự án cần một "Command Center" tập trung để theo dõi tiến độ và sức khỏe codebase một cách trực quan. Chúng ta sẽ kế thừa concept của `Idea Navigator` (sử dụng CSS có sẵn, cơ chế parse Markdown/JSON tĩnh) để xây dựng một trang Dashboard độc lập. Báo cáo này không chỉ thể hiện các chỉ số kỹ thuật (AST, Git) mà còn phản ánh năng lực "Self-Improving" của hệ thống thông qua các chỉ số về Learning và Skill Evolution.

Story này được nâng cấp sau khi hấp thụ repo `nexu-io/html-anything`, đặc biệt là hai pattern:
- `data-report`: KPI cards + chart containers có chiều cao cố định + bảng dữ liệu + insight blocks.
- `flowai-team-dashboard`: cấu trúc dashboard theo khu vực/tabs, nhấn mạnh scanability và vận hành đội ngũ.

## 2. Tracer Bullet (Vertical Slice)
**Dữ liệu (Data):** 
- Tiến độ: `sprint-status.yaml`.
- Codebase Health: `git log` (LOC).
- Defect Density: `bug-tracker.yaml`.
- Learning Metrics: Quét thư mục `.agent/skills` (và knowledge nếu có).
**Xử lý (Logic):** Tạo script `scripts/operation-report-gen.js` để tổng hợp dữ liệu, ánh xạ Bug -> Feature bằng Path/Metadata (Option A) thay vì `git blame` phức tạp.
**Trình bày (UI):** Tạo trang tĩnh độc lập `_iwish-output/operation-report/index.html` (kế thừa CSS theme của navigator) để render data, nhưng nâng lên HTML-first report surface theo pattern `html-anything`: hero summary, KPI cards, hotspot tables, insight blocks.
**Tương tác (Interaction):** Sau khi hoàn tất trigger, Agent tự động thông báo trong chat và đính kèm đường link file HTML cho User.

## 3. Acceptance Criteria (AC)

### AC-1: Section 1 - Project Overview
- [ ] Hiển thị % tiến độ hoàn thành dựa trên số lượng Story `done` trong `sprint-status.yaml`.
- [ ] Hiển thị các chỉ số dòng code (LOC): Tổng số dòng, số dòng thêm mới và số dòng đã xóa thông qua `git log`.
- [ ] Hiển thị hero summary và KPI card grid để người đọc nhìn 5 giây là hiểu trạng thái sprint.

### AC-2: Section 2 - Codebase Health & Hotspots
- [ ] Hiển thị 5 chỉ số sức khỏe codebase chính (nếu có dữ liệu): Complexity, Churn, Defect Density, Structural Risks, Hotspots.
- [ ] **Defect Density Detail:** Ánh xạ lỗi vào thư mục/module tương ứng dựa trên Path để thống kê "vùng nóng" mà không cần strict git-blame.
- [ ] Có ít nhất 1 bảng hotspot theo module và 1 bảng hotspot theo story/feature gần nhất.

### AC-3: Section 3 - Learning & Self-Evolution
- [ ] Hiển thị số lượng Knowledge Items (nếu có).
- [ ] Hiển thị số lượng SKILL đang active.
- [ ] Hiển thị thêm 3-5 insight cards dạng editorial summary thay vì chỉ liệt kê raw counts.

### AC-4: UI & Notification Flow
- [ ] Tạo file HTML tĩnh độc lập sử dụng CSS/JS concept của Idea Navigator.
- [ ] Có post-step hook trong các quy trình chính (như fix-bug, complete-story) để chạy script generator.
- [ ] Agent tự động thông báo bằng text trong chat kèm đường dẫn `file:///.../operation-report/index.html` (Agent chat notification).
- [ ] UI phải được tổ chức theo JSON contract rõ ràng để sau này có thể thay chart engine hoặc thêm tab/section mà không phải sửa generator quá nhiều.

## 4. Tasks

| ID | Task Description | Maps To | Status |
|---|---|---|---|
| T1 | Viết script `operation-report-gen.js` thu thập và xử lý data từ YAML, Git, thư mục. | AC-1, AC-3 | In Progress |
| T2 | Triển khai logic mapping Bug -> Module và Bug -> Story gần nhất (dựa trên Path/metadata) trong generator. | AC-2 | In Progress |
| T3 | Tạo `_iwish-output/operation-report/index.html` với layout HTML-first report, kế thừa theme Navigator nhưng tổ chức lại theo section rõ ràng. | AC-1, AC-4 | In Progress |
| T4 | Viết JS engine tĩnh (`report-engine.js`) để fetch `operation-report.json` và render KPI cards, hotspot tables, insight blocks. | AC-2, AC-3, AC-4 | In Progress |
| T5 | Cấu hình post-step hook vào file workflow và hướng dẫn Agent thông báo kèm link report. | AC-4 | Todo |
| T6 | Ghi lại pattern absorption từ `html-anything` để các lần nâng cấp Navigator/report sau vẫn giữ cùng visual contract. | AC-1, AC-4 | Todo |

## 5. Dev Notes
- **Optimization:** Script generator xuất ra 1 file `operation-report.json`. Trang HTML sẽ `fetch` file JSON này để render. Điều này giữ cho HTML tĩnh và nhẹ.
- **Mapping:** Áp dụng Option A - ánh xạ bug vào module/domain bằng cách kiểm tra thư mục gốc của file bị lỗi (VD: `src/inventory/*` -> Inventory Module).
- **Absorbed UI Rules from `html-anything/data-report`:**
  - KPI cards phải đọc được độc lập.
  - Report phải có insight blocks, không chỉ số liệu trần.
  - Nếu thêm chart canvas thật về sau, container phải có chiều cao cố định để tránh layout loop.
- **Absorbed Information Architecture from `flowai-team-dashboard`:**
  - Chia report thành các vùng vận hành rõ ràng: overview, hotspots, execution load, evolution.
  - Ưu tiên scanability của operator hơn hiệu ứng trình diễn.

---

## QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | Tracer bullet rõ ràng, script gom dữ liệu xử lý tĩnh, không gây mutation nguy hiểm. |
| Data Integrity & State | 9 | JSON gen tĩnh, read-only từ yaml/git, không có race condition. |
| Security & Validation | 9 | Static HTML chạy local, không có server backend, không nguy cơ injection ngoài. |
| Performance & Scalability | 8 | Mapping Option A (Path) thay vì `git blame` giúp script cực nhanh, không nghẽn. |
| Error Handling & Recovery | 8 | Nếu yaml lỗi hoặc parse fail, script có thể fallback return null hoặc empty array. Cần catch error cẩn thận. |
| Architectural Depth & Leverage| 9 | Tách biệt rạch ròi: Data Generator (Node) -> Data Transfer (JSON) -> View (HTML tĩnh). Dễ dàng delete/replace (Deletion testable). |
| UX Empathy | 8 | Trải nghiệm report trực quan, link được Agent gửi thẳng vào chat để User click, zero-setup. |

**TOTAL AVERAGE: 8.57/10** (PASS)

### Architectural DNA Check
- [x] **Tracer Bullet?** Yes, Vertical Slice từ DB/YAML parsing đến UI View (HTML).
- [x] **Deletion Testable?** Yes, module report hoàn toàn độc lập ở output folder, xóa không ảnh hưởng đến core app.
- [x] **Interface vs Implementation?** Yes, interface duy nhất là file JSON contract giữa Node script và HTML engine.
