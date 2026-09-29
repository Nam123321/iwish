# Story 3.1: 8-State Component Preview Generation rule

**Epic:** Epic 3: 8-State Component Previews
**Story Title:** 8-State Component Preview Generation rule
**Goal:** Enforce 8-state `.preview.html` generation for UI components to verify interactive states before development handoff.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story creates the verification guidelines for component interactive states, updates the UX Guardian skill registry, and registers the rule file in the knowledge graph.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a new primitive interactive UI component is created or modified, **When** validating the implementation, **Then** it must generate a corresponding `[component-name].preview.html` in the component directory.
- **AC2:** **Given** the preview HTML file, **When** rendered, **Then** it must display a single vertical stack of the component in all 8 interactive states (Default, Hover, Active, Focus, Disabled, Loading, Selected, Error).
- **AC3:** **[EDGE-CASE]** **Given** the component is static (e.g. icons, typography layouts, grid containers), **When** verifying the rule, **Then** it must exclude them from preview generation to prevent useless file bloat.
- **AC4:** **Given** pseudo-classes (like `:hover`, `:active`) cannot be rendered statically, **When** building the preview, **Then** it must utilize static helper classes (e.g. `.pseudo-hover`, `.pseudo-active`) paired in CSS to force-display the states simultaneously.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 0 (≤ 3) → 0
3. **UI Surface:** 0 (Only validation rules) → 0
4. **Cross-Domain:** 0 → 0
5. **Flow Complexity:** 0 → 0
6. **Test Burden:** 1 (Verifying compiler parsing and state rendering) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Generate `.preview.html` file | Task 1: Create `8-state-preview-rule.md` under `.agent/skills/ux-guardian/` to guide developers. | ✅ Mapped |
| AC2 | Define the 8 interactive states | Task 1: Detail the 8 states check-list inside the rule file. | ✅ Mapped |
| AC3 | Exclude Static Components | Task 1: Add scoping constraints and exclusions to the rule file. | ✅ Mapped |
| AC4 | Static Helper Classes | Task 1: Add CSS helper class mapping specifications in the rule file. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Decisions Made:** Scoped preview generation strictly to interactive leaf components.
- **Static Simulation:** Mandated static CSS class mapping to display active/hover states simultaneously without mouse interaction.
- **Disfavored Path:** Rejected forcing previews for layout/container components.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Explicit static class simulation solves the browser limitation. |
| Data Integrity & State | 10 | Clean documentation and rules without side effects. |
| Security & Validation | 10 | Zero risk; no runtime code execute paths. |
| Performance & Scalability | 9.5 | Preventing layout preview generation avoids token and workspace bloat. |
| Error Handling & Recovery | 9 | Scope limits prevent developer confusion on non-interactive pages. |
| Architectural Depth & Leverage | 10 | Directly integrates into the UX Guardian framework for passive linting. |
| UX Empathy | 10 | Dramatically improves visual assurance and speed of UI review. |

**TOTAL AVERAGE: 9.79/10 (PASS)**

---

**Status:** `READY-FOR-DEV`
