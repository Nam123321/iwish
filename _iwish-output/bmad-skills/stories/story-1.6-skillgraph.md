---
story_id: "STORY-SIM-1.6"
epic_id: "EPIC-SIM-01"
title: "Kiến trúc Dual-Track Skill Lifecycle & Proactive Routing SkillGraph"
status: "COMPLETED"
assignee: "Vegeta"
priority: "HIGH"
phase: "forge"

---
# Story 1.6: Kiến trúc Dual-Track Skill Lifecycle & Proactive Routing SkillGraph

## 1. Mục tiêu (Objective)
Cải tổ toàn diện vòng đời quản lý, tạo mới và tái sử dụng Skill trong I-Wish nhằm giải quyết 2 vấn đề lớn:
1. **Sự cồng kềnh khi tạo Skill:** Người dùng (user) chỉ muốn I-Wish học một repo để code dự án của họ, nhưng lại phải đi qua luồng tạo Epic/Story phức tạp dành cho việc build core system.
2. **Skill Decay (Kỹ năng bị lãng quên):** Sự phụ thuộc vào router tĩnh `iwish-bmm-router.md` khiến các skill mới không bao giờ được gọi đến nếu user không nhớ câu lệnh.

**Mục tiêu chính:**
- Thiết lập **Dual-Track Skill Lifecycle**: 
  - **Track 1 (System Skills):** Build skill cho hệ thống I-Wish (cần Epic/Story, quản lý tại folder `_iwish-output/iwish-skills/` độc lập với user project).
  - **Track 2 (User-Space Capabilities):** Học context (như absorb-repo) cho dự án user (Zero-Story flow, inject thẳng vào memory).
- Xây dựng **SkillGraph Registry** (`skill-graph.yaml`) đóng vai trò trung tâm khám phá.
- Chuyển Grand Priest từ định tuyến tĩnh sang **Proactive Routing**, tự động query SkillGraph và gợi ý Action Chips cho user.

---

## 2. Target Users & Personas
- **I-Wish Orchestrator (Grand Priest):** Cần SkillGraph để tự động tìm và gợi ý workflow/skill phù hợp với intent của user.
- **Người dùng cuối (End User):** Cần một trải nghiệm "Plug & Play" nhẹ nhàng khi absorb các repo/thư viện phục vụ cho dự án của họ, mà không bị làm phiền bởi các luồng PRD/Epic/Story nội bộ của I-Wish. Không cần nhớ các lệnh slash command.

---

## 3. Scope & Phân loại Deliverables

### 3.1. Kiến trúc Dual-Track
- **Track 1 (I-Wish-SKILL Building):**
  - Định nghĩa quy chuẩn thư mục: Bất kỳ quy trình tạo System Skill nào cũng phải lưu các file quản trị (PRD, Epic, Story, sprint-status.yaml) tại `_iwish-output/iwish-skills/` thay vì lưu chung với dự án của user.
- **Track 2 (User-Space Context Injector):**
  - Bỏ qua các bước tạo Epic/Story. Output từ việc absorb repo sẽ được đẩy thẳng vào Context Window của tác vụ hiện tại.

### 3.2. Proactive Routing SkillGraph
- Thiết kế schema `skill-graph.yaml` với đầy đủ metadata (id, path, keywords, depends_on, confidence, category).
- Nâng cấp action `crystallize` trong `iwish-dynamic-skill-generator.md` để auto-inject vào SkillGraph sau mỗi lần tạo System Skill mới.
- Thêm action `discover` (Librarian Pattern) cho phép Agent query SkillGraph bằng keyword.
- Cập nhật luồng `absorb-repo.md` để kết nối thẳng vào kiến trúc Dual-Track ở Phase 5 & 6.

### Ngoài scope (Out-of-scope):
- Vector-based semantic search (chỉ dùng keyword matching cho MVP).
- UI dashboard phức tạp cho SkillGraph.

---

## 4. Technical Constraints & Data Architecture

### 4.1 Folder Separation cho System Skills
- **PRD:** `_iwish-output/iwish-skills/prds/`
- **Epics:** `_iwish-output/iwish-skills/epics/`
- **Stories:** `_iwish-output/iwish-skills/stories/`
- **Sprint Status:** `_iwish-output/iwish-skills/sprint-status.yaml`

### 4.2 SkillGraph Schema (`skill-graph.yaml`)
```yaml
version: "1.0"
last_updated: "2026-05-14T00:00:00Z"
skills:
  - id: "absorb-repo"
    path: ".agent/workflows/absorb-repo.md"
    category: "workflow"
    keywords: ["absorb", "repo", "learn", "github", "ingest"]
    confidence: 1.0
```

### 4.3 Keyword Matching Algorithm (cho action `discover`)
- Tokenize query thành mảng từ khóa.
- So sánh Jaccard Similarity giữa query tokens và `keywords[]`.
- Trả về top-N skill có Jaccard > 0.3.

---

## 5. Acceptance Criteria (Tiêu chí hoàn thành BẮT BUỘC)

### AC1: Phân tách I-Wish-SKILL Building Directory
- **GIVEN** Một Agent bắt đầu quá trình tạo System Skill mới (PRD -> Epic -> Story).
- **WHEN** Agent tạo các file quản lý tiến độ.
- **THEN** Toàn bộ file này phải được lưu tại namespace riêng `_iwish-output/iwish-skills/` (gồm thư mục con prds, epics, stories) và sử dụng một file `sprint-status.yaml` độc lập. Không được lưu đè lên `_iwish-output/stories/` của user project.

### AC2: SkillGraph Schema được khởi tạo
- **GIVEN** Kiến trúc I-Wish cần một registry trung tâm cho dynamic skills.
- **WHEN** File `skill-graph.yaml` được tạo tại `dragonball_distribution/templates/core/skills/`.
- **THEN** Chứa đủ các mảng `skills[]` và metadata cơ bản. Seed graph với các skill hiện có.

### AC3: Discover Action (Librarian Pattern) & Proactive Routing
- **GIVEN** Grand Priest nhận một yêu cầu ngôn ngữ tự nhiên từ User.
- **WHEN** Grand Priest gọi `discover` bằng keyword.
- **THEN** Trả về danh sách skill liên quan nhất (Jaccard > 0.3) và Grand Priest phải hiển thị chúng thành giao diện đề xuất (Action Chips) cho User chọn, thay vì tự động chạy dựa trên router tĩnh.

### AC4: Nâng cấp `absorb-repo` workflow
- **GIVEN** Workflow `/absorb-repo` đang ở Phase 5 (Compare).
- **WHEN** Trình bày Gap Analysis cho user.
- **THEN** Hệ thống phải yêu cầu user phân loại đây là `SYSTEM_SKILL` hay `USER_SPACE`.
- **AND** Ở Phase 6: Nếu là `SYSTEM_SKILL`, tự động kích hoạt luồng I-Wish-SKILL Building (lưu vào thư mục iwish-skills). Nếu là `USER_SPACE`, inject vào project context, không tạo Story.

---

## 6. Tasks/Subtasks

- [x] **Task 1: Thiết lập thư mục I-Wish-SKILL Building**
  - [x] 1.1 Khởi tạo cấu trúc `_iwish-output/iwish-skills/` với các thư mục rỗng và `sprint-status.yaml` mẫu.
  - [x] 1.2 Viết tài liệu hướng dẫn (hoặc rule trong context) để Agent tuân thủ việc phân tách này khi nhận lệnh tạo skill.

- [x] **Task 2: Thiết kế và tạo `skill-graph.yaml`**
  - [x] 2.1 Tạo file schema chuẩn và seed dữ liệu.
  - [x] 2.2 Nâng cấp `crystallize` action để auto-inject vào SkillGraph.
  - [x] 2.3 Thêm `discover` action với thuật toán Jaccard.

- [x] **Task 3: Cập nhật quy trình `absorb-repo.md`**
  - [x] 3.1 Sửa Phase 5: Thêm menu lựa chọn Track (System vs User-Space).
  - [x] 3.2 Sửa Phase 6: Thêm logic định tuyến - gọi lệnh I-Wish-SKILL Building nếu là System Skill, hoặc Zero-Story flow nếu là User-Space.

- [x] **Task 4: Integration Test**
  - [x] 4.1 Mock kịch bản tạo System Skill -> verify file nằm trong `iwish-skills/`.
  - [x] 4.2 Mock kịch bản tìm kiếm skill qua Grand Priest -> verify gợi ý Action Chips.

---

## 7. Dev Notes
- **Tại sao tách thư mục?** Để User có thể sử dụng I-Wish để code dự án thực tế của họ mà không bị các Artifacts tạo Skill nội bộ của I-Wish ghi đè hoặc làm rác (pollute) dự án.
- **Tại sao YAML thay vì Vector DB?** Dưới 100 skill thì Jaccard similarity trên file YAML là đủ nhanh và không cần setup infrastructure phức tạp.

---

## 8. Definition of Done (DoD)
- [x] Cấu trúc thư mục độc lập `iwish-skills` đã sẵn sàng.
- [x] File `skill-graph.yaml` tồn tại và chứa seed data.
- [x] `iwish-dynamic-skill-generator.md` được cập nhật tính năng discover/crystallize.
- [x] `absorb-repo.md` được cập nhật luồng Dual-Track.
- [x] Status đổi thành `COMPLETED`.
