# Story 3.1: Settings Parser .agent/settings.json

**Epic:** Epic 3: Project-Scoped Plugin Sync
**Story Title:** Settings Parser .agent/settings.json
**Goal:** Define and parse the configuration file `.agent/settings.json` at the root of the workspace to retrieve external reference skills or plugin bundles required for the project.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story implements the configuration parsing slice:
1. **File Detection Layer**: Scans the project root for `.agent/settings.json`.
2. **JSON Parsing Layer**: Reads and parses the JSON file, trapping parse errors.
3. **Extraction Layer**: Validates structural shapes and returns the list of declared plugins.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a valid `.agent/settings.json` exists in the workspace, **When** I-Wish initializes, **Then** it reads the file and parses the enabled plugins and active reference skills list.
- **AC2:** **[EDGE-CASE]** **Given** the settings file is missing, **When** starting, **Then** the parser returns a default empty configuration instead of throwing errors.
- **AC3:** **[EDGE-CASE]** **Given** the settings file contains invalid JSON syntax, **When** parsing, **Then** the parser catches the exception, logs a clear warning message to the user, and falls back to an empty config.
- **AC4:** **[EDGE-CASE]** **Given** the JSON is valid but does not match the expected structure (e.g. missing `plugins` key), **When** parsing, **Then** it ignores unknown keys and successfully returns default fields.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 0 (≤ 3) → 0
3. **UI Surface:** 0 (No UI) → 0
4. **Cross-Domain:** 0 (Pure Node.js) → 0
5. **Flow Complexity:** 1 (JSON parser try-catch checks) → 0
6. **Test Burden:** 2 (Mocking invalid JSON formats and verifying key extractions) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | Read and parse json | Task 1: Write a function `parseSettings(settingsPath)` that reads the JSON file. | ✅ Mapped |
| AC2 | Missing file default | Task 1: Return default empty configuration `{ plugins: {} }` if file does not exist. | ✅ Mapped |
| AC3 | Malformed JSON fallback | Task 2: Wrap parse in try-catch and log warning before returning defaults. | ✅ Mapped |
| AC4 | Ignore unknown keys | Task 2: Validate structure and extract only defined properties. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Fail-Safe Design:** Standardizes parser behavior to avoid bricking I-Wish boots if a developer commits a syntax typo in settings.json.
- **JSON Schema:** Maps the configuration layout (object containing `plugins` key with nested records containing `enabled` boolean and `active_skills` array).

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Simple JSON reading and validation performs reliably. |
| Data Integrity & State | 10 | Read-only config parser doesn't write back side effects. |
| Security & Validation | 9.5 | Avoids `eval` or dynamic object injection; uses standard `JSON.parse`. |
| Performance & Scalability | 9.5 | Reads local small config file in sub-millisecond time. |
| Error Handling & Recovery | 10 | Catch block fully insulates startup from syntax errors. |
| Architectural Depth & Leverage | 9.0 | Establishes a standard configuration API for plugin synchronization. |
| UX Empathy | 9.5 | Warning messages include file details and parser errors for quick debugging. |

**TOTAL AVERAGE: 9.64/10 (PASS)**

---

**Status:** `PASSED-REVIEW`
