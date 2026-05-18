---
story_id: "STORY-PSA-1.1"
epic_id: "EPIC-PSA"
title: "Socratic Review Mode (Grill Me)"
status: "DONE"
assignee: "Vegeta"
priority: "P1"
phase: "forge"

---
# Story PSA-1.1: Socratic Review Mode

## 1. Objective
Tích hợp cơ chế "Socratic Review Mode" (lấy cảm hứng từ `grill-me` và `grill-with-docs` của Matt Pocock) như một **4-Gate Quality System** xuyên suốt vòng đời dự án — từ Brainstorming đến Implementation. Skill hoạt động theo mô hình **Progressive Socratic Loop** (hỏi từng nhánh, đào sâu, tổng hợp) thay vì xả danh sách câu hỏi.

## 2. User Story
As a Developer / PM / Architect,
I want a structured Socratic Review Mode that stress-tests ideas at every critical phase (Discovery → Story → Implementation → Drift Detection),
So that I can catch flaws early, improve PRD/Architecture quality, and prevent Feature Drift.

## 3. Design Decisions (Locked)

### DD1: Progressive Socratic Loop (Depth-First)
Agent hỏi **tối đa 1-2 câu mỗi lượt**, đào sâu theo từng nhánh (branch) cho đến khi triệt để, rồi mới chuyển sang nhánh tiếp theo. KHÔNG được xả danh sách câu hỏi kiểu "questionnaire".

### DD2: Question Format — "2 Options + Open Slot"
Mỗi câu hỏi Socratic PHẢI tuân theo format:
- ❓ Câu hỏi cụ thể
- **Option A:** Phương án "an toàn" / conventional
- **Option B:** Phương án "táo bạo" / alternative
- **Option C:** User tự đưa ra câu trả lời khác → ___
- 💡 Agent rationale: Giải thích ngắn TẠI SAO câu hỏi này quan trọng (max 2 câu)

### DD3: Relationship with `anti-sycophancy.md`
- `anti-sycophancy.md` = **DNA nền (Global Fragment)** — inject vào MỌI agent, quy định tư thế hoài nghi xây dựng
- `socratic-review` = **Protocol có cấu trúc (Scoped Skill)** — chỉ kích hoạt tại các Gate cụ thể, vận hành tư thế đó thành vòng lặp phỏng vấn có Exit Condition
- Không merge hai artifact. Skill PHẢI reference fragment trong Prerequisites.

### DD4: 4-Gate Integration Model

| Gate | Workflow Target | Mode | Focus |
|---|---|---|---|
| **Gate 0** | `/brainstorming`, `/create-prd`, `/create-architecture`, `/technical-research` | `discovery` | Why this? Why now? Simplest version? Trade-offs? Tech stack justification? |
| **Gate 1** | `/create-story` | `business` | AC completeness, UX gaps, persona coverage, edge cases nghiệp vụ |
| **Gate 2** | `/Vegeta-story` (pre-Implementation Plan) | `technical` | DB schema, API contract, performance, security, migration, test strategy |
| **Gate 3** | Implementation Plan creation (any workflow incl. `/fix-bug`) | `drift` | Scope creep detection, backward sync scoring to PRD/Story/Epic |

### DD5: Exit Condition — Synthesis Report
Mỗi phiên Socratic kết thúc bằng bước **Synthesis**: Agent tóm tắt các quyết định đã chốt và HỎI user có muốn backward sync vào PRD/Feature List/Story không. Agent KHÔNG tự động ghi đè.

### DD6: Safety Constraint
Agent chỉ có quyền **đề xuất (propose)** thay đổi vào `project-context.md`, PRD, hoặc Feature List. Tuyệt đối **CẤM ghi đè tự động**. User phải xác nhận (approve) trước khi bất kỳ thay đổi nào được áp dụng.

## 4. Acceptance Criteria

- **AC1:** Skill `socratic-review` được tạo dưới dạng artifact độc lập tại `.agent/skills/socratic-review/SKILL.md` thông qua luồng `/create-capability` (Triage → Spec → Forge → Validate).
- **AC2:** Skill hỗ trợ 4 modes: `discovery`, `business`, `technical`, `drift` — mỗi mode có bộ câu hỏi định hướng riêng phù hợp với phase tương ứng.
- **AC3 (Gate 0 — Discovery):** Skill được tích hợp vào `/brainstorming`, `/create-prd`, `/technical-research` và `/create-architecture` như bước Quality Gate để stress-test ý tưởng, scope, và tech stack ngay từ giai đoạn sớm nhất.
- **AC4 (Gate 1 — Business):** Skill được tích hợp vào `/create-story` để validate AC, UX flow, và edge case nghiệp vụ trước khi output ra file story.
- **AC5 (Gate 2 — Technical):** Skill được tích hợp vào `/Vegeta-story` tại bước Pre-Implementation Plan để validate technical constraints.
- **AC6 (Gate 3 — Drift):** Skill kích hoạt bước Drift Detection khi Implementation Plan được tạo (bao gồm cả trong `/fix-bug`), phối hợp với STORY-PSA-1.2 (Backward Sync Hybrid Trigger).
- **AC7:** Mỗi câu hỏi Socratic phải tuân theo format "2 Options + Open Slot + Agent Rationale" (DD2).
- **AC8:** Agent chỉ có quyền "đề xuất" thay đổi context/PRD, CẤM ghi đè tự động (DD6).
- **AC9:** Skill PHẢI reference `anti-sycophancy.md` trong phần Prerequisites và kế thừa 6 Forcing Questions cho mode `discovery`.

## 5. Complexity Score (Plan Tune Heuristic)
- **AC Volume:** 9 ACs (> 8) → +1
- **Data Model Spread:** 0 models → +0
- **UI Surface:** 0 components → +0
- **Cross-Domain:** 4 workflow domains (brainstorming/PRD/story/dev) → +1
- **Flow Complexity:** Multi-mode skill with 4 gates → +1
- **Test Burden:** 0 E2E tests, but simulated QA required → +0
- **Total CS:** 3
- **Verdict:** ✅ **OK** (< 4, no mandatory split)

## 6. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Tạo Skill qua `/create-capability` | T1: Chạy phễu Triage → Spec → Forge → Validate | ST1.1: W-01 Triage (classify SKILL) <br> ST1.2: W-02 Spec (ingest sources, adversarial review) <br> ST1.3: W-03 Forge (sinh SKILL.md) <br> ST1.4: W-04 Validate (lint, register) | [x] |
| AC2, AC7, AC9 | Thiết kế multi-mode + question format | T2: Implement 4 modes + format rules trong SKILL.md | ST2.1: Mode definitions (discovery/business/technical/drift) <br> ST2.2: Question template (2 Options + Open Slot) <br> ST2.3: anti-sycophancy prerequisite reference | [x] |
| AC3 | Gate 0: Discovery integration | T3: Cập nhật workflow configs cho Discovery phase | ST3.1: Edit `iwish-brainstorming.md` <br> ST3.2: Edit `iwish-bmm-create-prd.md` <br> ST3.3: Edit `iwish-bmm-create-architecture.md` (hoặc step tương ứng) <br> ST3.4: Edit `iwish-bmm-technical-research.md` | [x] |
| AC4 | Gate 1: Business integration | T4: Cập nhật workflow `/create-story` | ST4.1: Edit `iwish-bmm-create-story.md` | [x] |
| AC5 | Gate 2: Technical integration | T5: Cập nhật workflow `/Vegeta-story` | ST5.1: Edit `iwish-bmm-dev-story.md` | [x] |
| AC6 | Gate 3: Drift integration | T6: Cập nhật workflow cho Drift Detection | ST6.1: Edit Implementation Plan creation step (`fix-bug.md`) <br> ST6.2: Link with STORY-PSA-1.2 (Backward Sync) | [x] |
| AC8 | Safety constraint (no auto-overwrite) | T7: Hardcode safety rules in SKILL.md | — | [x] |

## 7. Dependencies
- **Depends on:** `anti-sycophancy.md` fragment (must exist, currently ✅ available)
- **Depended by:** STORY-PSA-1.2 (Backward Sync Hybrid Trigger — Gate 3 `drift` mode feeds into its scoring mechanism)

## 8. Definition of Done
- [x] Design Decisions (DD1–DD6) reviewed and locked by user.
- [x] Skill file `.agent/skills/socratic-review/SKILL.md` created via `/create-capability`.
- [x] 4 modes implemented with distinct question focus areas.
- [x] Question format (2 Options + Open Slot + Rationale) enforced in SKILL.md.
- [x] Workflow configs updated to reference socratic-review at appropriate gates (including technical-research & fix-bug).
- [x] anti-sycophancy.md referenced in Prerequisites section.
- [x] Safety constraint (no auto-overwrite) hardcoded.
- [x] QA Simulator Guardian audit score ≥ 8.5/10.

## 9. QA Simulator Guardian Audit (Hybrid Scorecard)
| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | 4-Gate model phủ toàn bộ vòng đời: Discovery → Story → Implementation → Drift. |
| Data Integrity & State | 9 | Read-only + Propose only. Không có quyền ghi đè tự động lên bất kỳ artifact nào. |
| Security & Validation | 9 | Hard rule cấm overwrite `project-context.md` và PRD. User approval bắt buộc. |
| Performance & Scalability | 8 | Progressive Loop (1-2 câu/lượt) tối ưu context window hơn so với xả danh sách. |
| Error Handling & Recovery | 9 | Workflow vẫn an toàn nếu user skip bất kỳ Gate nào. Fallback hoạt động bình thường. |
| Code Quality & Maintainability | 9 | Skill độc lập, multi-mode, dễ mở rộng thêm mode mới trong tương lai. |
| UX Empathy | 10 | "2 Options + Open Slot" giảm cognitive load đáng kể. User không bị ngợp bởi câu hỏi trống. |
| **TOTAL AVERAGE** | **9.0** | ✅ **PASSED** (≥ 8.5/10) |
