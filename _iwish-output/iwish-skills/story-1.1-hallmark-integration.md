# Story 1.1: Integrate Anti-Slop Rules into UX Guardian

**Epic:** Epic 1: UX Guardian & Slop Test Integration
**Story Title:** Integrate Anti-Slop Rules into UX Guardian
**Goal:** Merge the key design rules from Hallmark's 69-gate slop test into I-Wish's `UX Guardian` rules.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story represents a complete vertical slice of validation behavior:
1. **Config Layer**: Creating the rules in a modular rule file (`ux-guardian-anti-slop.md`).
2. **Metadata Layer**: Exposing it via the main `ux-guardian/SKILL.md` sub-skills structure.
3. **Graph Registry**: Indexing the new file and its dependencies inside `knowledge-graph.yaml` to ensure it is discoverable by system linters and agent engines.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** the UX Guardian is invoked, **When** evaluating the page styling and markup, **Then** it must check against the anti-slop rules (including typography, spacing scale, OKLCH chroma checks, and transitions).
- **AC2:** **Given** interactive component styling, **When** validating interactive triggers, **Then** it must enforce distinct definitions for all 8 states (Default, Hover, Active, Focus, Disabled, Loading, Selected, Error) and check for Instant Focus Indicators.
- **AC3:** **Given** the visual checking process, **When** checks are executed, **Then** the anti-slop checks must run passively and automatically by default (always active).

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 0 (≤ 3) → 0
3. **UI Surface:** 0 (No frontend UI is created; purely validation logic) → 0
4. **Cross-Domain:** 0 (No) → 0
5. **Flow Complexity:** 0 (Simple rule execution) → 0
6. **Test Burden:** 1 (Verifying rule parsing and registering inside the linter) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Enforce Anti-Slop Check | Task 1: Create `ux-guardian-anti-slop.md` under `.agent/skills/ux-guardian/` mapping typography, spacing, and transition gates. | ✅ Mapped |
| AC2 | Enforce 8-State Previews | Task 2: Create `8-state-preview-rule.md` under `.agent/skills/ux-guardian/` mapping focus and state requirements. | ✅ Mapped |
| AC3 | Passive Execution by Default | Task 3: Update `ux-guardian/SKILL.md` to reference the sub-skills and declare passive auto-run behaviour. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Structure**: Anti-slop rules are kept modular in distinct files (`ux-guardian-anti-slop.md` and `8-state-preview-rule.md`) to prevent context window bloat, and are registered under `ux-guardian/SKILL.md` to ensure they are loaded automatically by agents.
- **Activation Mode**: Passively Active. Every visual validation pass will run these checks by default.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Rules are clearly defined, mapped, and integrated into I-Wish's master skill configs. |
| Data Integrity & State | 10 | Files are static markdown configurations, ensuring no side effects or runtime state drift. |
| Security & Validation | 9 | Strictly reads internal system rules; no external input vulnerabilities. |
| Performance & Scalability | 9 | Storing rules in separate smaller files prevents token bloat. |
| Error Handling & Recovery | 10 | Fallbacks are defined: system handles missing dependencies gracefully during compilation. |
| Architectural Depth & Leverage | 10 | Encapsulating aesthetic gates inside modular rulesets provides high reuse leverage for future UI stories. |
| UX Empathy | 10 | Directly prevents sloppy AI-generated designs from reaching the user's workspace. |

**TOTAL AVERAGE: 9.71/10 (PASS)**

### Architectural DNA Check:
- [x] **Tracer Bullet?** Yes (complete slice from config to Graph validation).
- [x] **Deletion Testable?** Yes (deleting the rule files will trigger registry linter errors).
- [x] **Interface vs Implementation?** Yes (agents only see the public skill descriptions while implementation details are stored in the rule files).

---

**Status:** `READY-FOR-DEV`
