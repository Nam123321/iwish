# Story 1.2: Dynamic Reference Skill Loader Command

**Epic:** Epic 1: Global Reference Cache & Dynamic Lookup
**Story Title:** Dynamic Reference Skill Loader Command
**Goal:** Implement a utility function and routing logic to dynamically load and read a specific reference skill's `SKILL.md` file from the global cache on-demand, with strict path traversal protections.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story implements a complete reading slice:
1. **Validation Layer**: Regex checks the skill ID and verifies path traversal safety.
2. **Resolution Layer**: Resolves the realpath of the reference skill file relative to the global cache folder.
3. **Execution Layer**: Reads and returns the file contents to the active agent or user session.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a valid skill ID (e.g. `security-auditor`), **When** `/read-reference-skill` is called, **Then** the system resolves the path to `~/.iwish/skills-reference/skills/<skill-id>/SKILL.md`.
- **AC2:** **Given** the resolved file exists, **When** loading the file, **Then** it reads the contents and returns the markdown text.
- **AC3:** **[EDGE-CASE]** **Given** a skill ID that does not exist in the cache directory, **When** requested, **Then** the loader throws a clean "Skill not found" exception.
- **AC4:** **[SECURITY]** **Given** an input containing relative directory sequences (e.g., `../../` or absolute targets outside sandbox), **When** validating the path, **Then** the loader immediately blocks the request and throws a path traversal security error.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 0 (≤ 3) → 0
3. **UI Surface:** 0 (No UI) → 0
4. **Cross-Domain:** 0 (Pure Node.js file I/O) → 0
5. **Flow Complexity:** 1 (Path resolution validation checks) → 0
6. **Test Burden:** 2 (Mocking cache paths and testing traversal attacks) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Resolve skill paths | Task 1: Resolve `<cache-root>/skills/<skill-id>/SKILL.md` using absolute pathing. | ✅ Mapped |
| AC2 | Output file contents | Task 2: Read file synchronously using `fs.readFileSync` and return/display text. | ✅ Mapped |
| AC3 | Handle missing skills | Task 3: Throw custom error if file does not exist on disk. | ✅ Mapped |
| AC4 | Block path traversal | Task 4: Resolve realpaths via `fs.realpathSync` and verify it starts with `<cache-root>/skills/`. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Security Check:** Strictly checks that the resolved absolute path starts with the cache root directory prefix. If the resolved path lies outside of the cache root directory, it is flagged as an attack and blocked.
- **ID Sanitization:** Applies alphanumeric and hyphen filtering (`^[a-zA-Z0-9_-]+$`) to the skill ID before starting filesystem queries, acting as the first line of defense.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Direct, clean read operations with zero side effects. |
| Data Integrity & State | 10 | Read-only operation; does not alter state. |
| Security & Validation | 10 | Double-layered validation (ID regex + realpath prefix verification) prevents any traversal. |
| Performance & Scalability | 9.5 | In-process execution with fast cached path operations. |
| Error Handling & Recovery | 9.0 | Clear exceptions distinguish between missing files and security blocks. |
| Architectural Depth & Leverage | 9.5 | Standardizes dynamic file queries, allowing future RAG logic to load context. |
| UX Empathy | 8.5 | Clean error messages keep developer informed if skill ID is typoed. |

**TOTAL AVERAGE: 9.5/10 (PASS)**

---

**Status:** `PASSED-REVIEW`
