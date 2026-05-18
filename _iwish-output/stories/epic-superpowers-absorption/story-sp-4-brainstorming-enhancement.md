# Story SP-4: Brainstorming Enhancement — 2-3 Approaches, YAGNI Challenge & Visual Routing

## Story ID: SP-4
## Epic: SP-ABSORB (Superpowers Absorption)
---
id: "story-sp-4"
status: "Done"
priority: "High"
---
## Estimated Effort: Medium

---

## User Story

> **As a** I-Wish user running `/brainstorming` or invoking Socratic Review,
> **I want** the AI to always propose 2-3 alternative approaches with trade-offs, challenge unnecessary scope via YAGNI questions, and intelligently decide when to generate visual mockups vs text answers,
> **So that** my design decisions are better informed, scope creep is caught early, and I don't waste tokens on unnecessary visual generation.

---

## Background & Rationale

**Source:** Superpowers `brainstorming` skill — "2-3 Approaches with Trade-offs", "YAGNI Ruthlessly", "Visual Companion per-question routing".

Three gaps in current I-Wish brainstorming:
1. **No mandatory alternatives:** AI often proposes one approach and asks "ok?". User has no basis for comparison.
2. **No YAGNI challenge-back:** When user asks for features that may not be MVP-necessary, AI adds them without question. We want AI to *challenge back* (but NOT auto-cut).
3. **No visual routing:** Gotenks generates mockups for every question, even conceptual ones that are better answered in text.

Additionally, Superpowers' "Quick Design Check" for small tasks is a valuable soft-gate that prevents both over-engineering (full brainstorming for a typo fix) and under-engineering (zero thought for a "simple" change that has hidden complexity).

---

## Acceptance Criteria

### AC-1: 2-3 Approaches Rule (Socratic Review Gate 0 + `/brainstorming`)
- [x] Socratic Review `discovery` mode (Gate 0) integrates the 2-3 approaches rule directly into its existing Option A/B/C format.
- [x] Options A and B MUST be fully fleshed-out architectural/design approaches (with pros/cons/context), rather than simple yes/no questions.
- [x] Format for each approach (embedded within the Option slots):
  ```markdown
  **Option A: [Approach Name] ⭐ (Recommended)**
  - **Mô tả:** [1-2 câu]
  - **Ưu điểm:** [bullets]
  - **Nhược điểm:** [bullets]
  - **Phù hợp khi:** [context]
  
  **Option B: [Approach Name]**
  ...
  ```
- [x] AI MUST lead with recommended option (Option A) and explain WHY
- [x] `/brainstorming` workflow updated to require this step before design presentation

### AC-2: YAGNI Challenge in Socratic Review
- [x] New question type added to Socratic Review: "YAGNI Challenge"
- [x] Triggered when agent detects features that may exceed MVP scope
- [x] Format:
  ```markdown
  ### ⚠️ YAGNI Check
  Feature **[X]** có vẻ vượt quá MVP scope. Bạn chắc chắn cần nó trong phiên bản đầu?
  
  **Option A:** Giữ lại — vì [lý do user có thể có]
  **Option B:** Defer sang Phase 2 — giảm complexity, ship nhanh hơn
  **Option C:** Your own answer → ___
  
  > 💡 **Agent rationale:** [tại sao agent nghĩ đây có thể là scope creep]
  ```
- [x] AI **CHỈ đặt câu hỏi**, KHÔNG tự ý cắt scope
- [x] User response "Giữ lại" → agent proceeds without further challenge on that feature

### AC-3: Quick Design Check (Soft Gate for Small Tasks)
- [x] New fragment created: `.agent/fragments/quick-design-check.md`
- [x] Applicable for tasks classified as "minor", estimated < 30 minutes, or with a Plan-Tune Complexity Score (CS) ≤ 2.
- [x] Contains 5 rapid questions:
  1. "Task này ảnh hưởng đến component/module nào?"
  2. "Có side-effect nào với các feature khác không?"
  3. "Cần test gì sau khi xong?"
  4. "Có cần backward-sync với PRD/Story không?"
  5. "Approach nào bạn định dùng? (Có approach nào khác không?)"
- [ ] Vegeta và Songoku workflows reference this fragment for non-story tasks
- [ ] Quick Design Check is a SOFT gate — user can skip with "proceed"

### AC-4: Visual Routing in Gotenks
- [ ] Gotenks workflow includes per-question routing logic:
  - **Use visual generation (Stitch UI)** for: UI mockups, layout comparisons, design polish, spatial relationships
  - **Use text/HTML/Mermaid** for: requirements questions, conceptual choices, tradeoff lists, technical decisions
- [ ] Decision test documented: "Would the user understand this better by SEEING it than READING it?"
- [ ] If user explicitly requests a visual for an abstract concept, output raw HTML/Mermaid instead of a full Stitch UI generation to save tokens while fulfilling the visual request.

---

## Technical Tasks

1. **Initialize** `.agent/skills/idea-hardening/SKILL.md`
   - Define core policies: 2-3 Approaches rule, YAGNI triggers, Visual Routing logic.

2. **Edit** `.agent/skills/socratic-review/SKILL.md`
   - Integrate `idea-hardening` policies into `discovery` mode (Gate 0).
   - Add "YAGNI Challenge" question type.

3. **Edit** `.agent/workflows/iwish-brainstorming.md`
   - Add reference to `idea-hardening` skill.
   - Add CS-based routing to Quick Design Check.

4. **Edit** `.agent/fragments/quick-design-check.md`
   - Finalize the 5 rapid questions.

5. **Edit** `.agent/workflows/gotenks.md`
   - Add Visual Routing decision logic (Stitch vs. HTML/Mermaid).

---

## Dependencies
- None (can run in parallel with SP-1, SP-2, SP-3)

## Notes
- The YAGNI Challenge is specifically designed to **challenge back** the user, not to silently remove scope. This is a critical distinction from Superpowers' "YAGNI Ruthlessly" which allows agent auto-cutting.
- Quick Design Check replaces the Superpowers Hard Gate with a more pragmatic Soft Gate appropriate for I-Wish's diverse task types (UI/UX, DevOps, backend, etc.).

---

## Plan Tune Complexity Score (CS)
- **AC Volume:** 4 ACs (+0)
- **Data Model:** 0 models (+0)
- **UI Surface:** 0 components (+0)
- **Cross-Domain:** 0 (+0)
- **Flow Complexity:** 0 (+0)
- **Test Burden:** 0 (+0)
- **Total CS:** `0` (Verdict: ✅ **OK** - Proceed normally)

## AC-To-Task Traceability Matrix
| Acceptance Criteria | Mapped Task(s) | Status |
|---|---|---|
| AC-1: 2-3 Approaches Rule | Task 1, Task 2 | ✅ MAPPED |
| AC-2: YAGNI Challenge | Task 1 | ✅ MAPPED |
| AC-3: Quick Design Check | Task 2, Task 3 | ✅ MAPPED |
| AC-4: Visual Routing | Task 4 | ✅ MAPPED |

## QA Simulator Guardian Scorecard
| Axis | Score (1-10) | Rationale |
|---|---|---|
| **1. Happy Path** | 9.0 | ACs clearly outline Socratic changes, triggers for Quick Check, and visual routing rules. |
| **2. Edge Cases** | 9.0 | Handles the edge case of users explicitly demanding visuals for abstract concepts by using HTML/Mermaid output. |
| **3. Security & Compliance** | 9.0 | No security implications; strict prompt constraint adherence. |
| **4. Concurrency & State** | 9.0 | Stateless prompt/workflow rules. |
| **5. Performance & Scale** | 9.5 | Explicitly saves expensive Stitch UI generation tokens by using HTML/text routing. |
| **6. Usability & Accessibility** | 9.0 | Quick Design check is a SOFT gate to prevent unnecessary friction for developers. |
| **7. UX Empathy** | 9.5 | "Challenge back" without auto-cutting respects the user's intent while mitigating scope creep. |
| **TOTAL AVERAGE** | **9.1** | **PASS** (≥ 8.5/10) |
