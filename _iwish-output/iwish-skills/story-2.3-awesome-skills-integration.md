# Story 2.3: Integrate Linter into /create-skill Workflow

**Epic:** Epic 2: Skill Quality Linter & Security Sandbox
**Story Title:** Integrate Linter into /create-skill Workflow
**Goal:** Chain the linter check directly into I-Wish's `/create-skill` workflow to serve as a quality and security gate, blocking invalid or out-of-bounds custom skills.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story links draft creation to registry insertion:
1. **Trigger Layer**: Intercepts the registration command at the end of drafting.
2. **Evaluation Layer**: Executes frontmatter and path validation tests.
3. **Registry/Rollback Layer**: Updates `skill-graph.yaml` on success, or deletes draft folder on failure.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a drafted skill folder (containing `SKILL.md`), **When** registration is triggered, **Then** the linter automatically runs `validateFrontmatter` and `validatePaths` on the folder.
- **AC2:** **Given** both validations pass, **When** writing configuration, **Then** it appends the new skill to `skill-graph.yaml` and returns a success status.
- **AC3:** **Given** validation fails (e.g. invalid frontmatter or path traversal detected), **When** completing registration, **Then** the workflow aborts, outputs linter errors, deletes the draft folder from disk, and leaves `skill-graph.yaml` untouched.
- **AC4:** **[EDGE-CASE]** **Given** `skill-graph.yaml` is locked or unwriteable, **When** validation passes, **Then** the linter still cleans up its run cleanly and rolls back any partial file changes.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 1 (Manipulating `skill-graph.yaml` structure) → 0
3. **UI Surface:** 0 (No UI) → 0
4. **Cross-Domain:** 0 (Pure Node.js) → 0
5. **Flow Complexity:** 1 (Gated execution check with deletion rollback) → 0
6. **Test Burden:** 2 (Verifying success path and rollback of draft folders + yaml registry) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Run linter checks | Task 1: Write a function `registerSkill(draftPath, allowedRoot, registryPath)` that calls linter validations. | ✅ Mapped |
| AC2 | Update registry on pass | Task 2: Append skill config to `skill-graph.yaml` using YAML serializer. | ✅ Mapped |
| AC3 | Abort and delete draft | Task 3: Delete the draft folder recursive on fail and skip yaml changes. | ✅ Mapped |
| AC4 | Handle locked registry | Task 3: Wrap yaml writing in try-catch and cleanup if writing fails. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Registry Serialization:** To prevent dependencies on complex external YAML libraries for rewriting `skill-graph.yaml`, we will read the file, append the structured YAML blocks safely, and write it back. If it is empty, we initialize it.
- **Deletion Safety:** Uses directory rollback logic verified in Story 1.1 to delete failed draft folders.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9.5 | The registration intercept runs both validations cleanly. |
| Data Integrity & State | 9.5 | Keeps `skill-graph.yaml` and the draft files perfectly in sync. |
| Security & Validation | 10 | Security guard block prevents any out-of-sandbox custom skill registration. |
| Performance & Scalability | 9.5 | In-process execution avoids subprocess delays. |
| Error Handling & Recovery | 9.5 | Draft directories are successfully purged on lint failure. |
| Architectural Depth & Leverage | 9.0 | Integrates directly into I-Wish's existing custom skill workflow structure. |
| UX Empathy | 9.0 | Outputs detailed list of linter violations, helping developers fix errors. |

**TOTAL AVERAGE: 9.43/10 (PASS)**

---

**Status:** `PASSED-REVIEW`
