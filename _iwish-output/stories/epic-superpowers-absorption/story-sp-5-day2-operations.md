---
id: "story-sp-5"
epic_id: "epic-sp-absorb"
title: "Day 2 Operations: Health Check & GitTree Analytics"
status: "Todo"
priority: "High"
type: "capability"
phase: "forge"

---
# User Story: SP-5 - Day 2 Operations: Health & GitTree Analytics

## 1. Context & Rationale
Sau khi hoàn thiện các chốt chặn bảo vệ (Guardians) và hệ thống Ideation, I-Wish cần hấp thụ năng lực **Day 2 Operations** từ repository Superpowers gốc. Day 2 Operations không phải là việc xây tính năng mới, mà là khả năng tự chẩn đoán, đo lường "sức khỏe" và phân tích lịch sử tiến hóa của codebase để phòng ngừa nợ kỹ thuật (Technical Debt). 

Story này tập trung vào việc Forge (chuyển hóa) 2 năng lực cốt lõi: **Codebase Health** (Phân tích AST/Cấu trúc tĩnh) và **GitTree/GitNexus** (Phân tích lịch sử commit/Churn).

*(Lưu ý: Bisection Search và Git Worktrees đã được gộp chung vào một Story khác về Incident Response, Story này tập trung hoàn toàn vào Monitoring & Analytics).*

## 2. Tracer Bullet (Vertical Slice)
**Dữ liệu (Data):** Đọc AST và Git History -> Enrich (bơm thêm) các thuộc tính `complexity`, `dead_code`, `churn_rate` trực tiếp vào các Node `File` trong **CodebaseGraph**.
**Xử lý (Logic):** Tạo 2 workflow/skill (`codebase-health` và `git-tree`) để thực thi logic phân tích. Tích hợp dữ liệu này vào ngữ cảnh của `Pivot Guardian`.
**Trình bày (UI/Presentation):** Tự động sinh ra các báo cáo Markdown định kỳ tại `_iwish-output/health-reports/`.

## 3. Acceptance Criteria (AC)

### AC-1: Codebase Health Analytics (AST)
- [ ] Forge workflow/script `codebase-health` từ Superpowers.
- [ ] Cập nhật CodebaseGraph: Node `File` phải lưu trữ được các chỉ số `complexity_score`, `has_circular_dependency` (boolean), và `is_dead_code` (boolean).
- [ ] Sinh báo cáo `health-report.md` liệt kê Top 10 file phức tạp nhất và danh sách Dead code.

### AC-2: GitTree / GitNexus Analytics (History)
- [ ] Forge workflow/script `git-tree` từ Superpowers.
- [ ] Phân tích lịch sử Git (mặc định 30 ngày gần nhất) để tính toán **Code Churn** (tần suất sửa đổi).
- [ ] Cập nhật CodebaseGraph: Node `File` lưu trữ thêm `churn_count` và `last_modified_date`.
- [ ] Phát hiện "Implicit Coupling" (2 file không import nhau nhưng luôn được commit cùng nhau) và lưu dưới dạng Edge `[:CO-COMMITTED_WITH]` trong CodebaseGraph.

### AC-3: Hybrid Graph Persistence & Snapshots
- [ ] Đảm bảo dữ liệu "Hiện tại" luôn được ghi đè/cập nhật trực tiếp lên CodebaseGraph (Merge approach) để tối ưu tốc độ truy vấn cho Agent.
- [ ] Đảm bảo dữ liệu "Lịch sử" được lưu trữ dưới dạng Markdown Snapshots trong `_iwish-output/health-reports/YYYY-MM-DD/` (để theo dõi xu hướng mà không làm phình Graph).

### AC-4: Pivot Guardian Integration (Contextual Trigger)
- [ ] Cập nhật `Pivot Guardian` SKILL: Khi Agent dự định sửa một file, Pivot Guardian sẽ check CodebaseGraph. Nếu file có `complexity_score > ngưỡng_quy_định` HOẶC `churn_count > ngưỡng_báo_động`, Agent MUST phát ra cảnh báo "Hotspot Detected" trước khi sửa.

## 4. Tasks (AC-Task Traceability Matrix)

| ID | Task Description | Maps To | Status |
|---|---|---|---|
| T1 | Soạn thảo script/workflow `codebase-health` để parse AST và tính metrics. | AC-1 | Todo |
| T2 | Soạn thảo script/workflow `git-tree` để đọc git log, tính churn và implicit coupling. | AC-2 | Todo |
| T3 | Viết logic Cypher/Neo4j để Upsert (Enrich) dữ liệu vào các Node `File` trong CodebaseGraph. | AC-1, AC-2, AC-3 | Todo |
| T4 | Xây dựng hàm xuất báo cáo Markdown Snapshot (Daily report generator). | AC-3 | Todo |
| T5 | Cập nhật file `.agent/skills/pivot-guardian/SKILL.md` để query Neo4j lấy health context. | AC-4 | Todo |

## 5. Dev Notes & Memory Context
- **Architecture Decision:** Sử dụng phương pháp **Hybrid Merge** (như đã thảo luận trong Gate 1 Socratic). Không tạo `HealthGraph` riêng. Dữ liệu runtime nạp thẳng vào CodebaseGraph. Dữ liệu xu hướng (trends) lưu bằng Markdown.
- **Neo4j Warning:** Cẩn thận khi cập nhật Graph (T3) để không làm mất các thuộc tính structural hiện có của Node `File` (đừng dùng lệnh `SET n = {}`, hãy dùng `SET n += {}`).
- **Dependencies:** Cần đảm bảo hệ thống có CLI `git` và tool parser AST tương thích với repo (ví dụ: `ts-morph` hoặc `madge` nếu codebase là JS/TS).

---
## 🛡️ QA Simulator Guardian (7-Row Hybrid Scorecard)
**Domain Classified:** DevSecOps & AI Infrastructure

| Axis | Score | Rationale |
|---|---|---|
| **1. Data Integrity** | 9 | Hybrid Merge strategy protects Neo4j from temporal bloat while ensuring real-time metrics for Agents. |
| **2. Security** | 8 | Read-only analysis. No execution of arbitrary code during AST parsing. |
| **3. Eng Discipline** | 9 | Enforces "Day 2 Ops" mentality. Forces Agents to respect file fragility (churn/complexity) before modifying. |
| **4. Perf/Cost** | 8 | Storing historical trends in Markdown rather than Neo4j saves significant graph traversal cost. |
| **5. State Consist.** | 8 | AC-3 explicitly mandates safe upsert patterns (`SET +=`) to prevent structural graph destruction. |
| **6. Resilience** | 9 | Pivot Guardian acts as a circuit breaker for touching brittle files. |
| **7. UX Empathy** | 8 | Developers get readable MD reports; Agents get fast Neo4j properties. Best of both worlds. |
| **TOTAL AVERAGE** | **8.43** | **HIGH QUALITY (Pass)** |
