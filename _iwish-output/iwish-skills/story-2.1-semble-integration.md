# Story 2.1: Cross-Story Dependency Scanner

**Epic:** Epic 2: Parallel Coordination & Merge Conflict Audit
**Story Title:** Cross-Story Dependency Scanner
**Goal:** Implement a script that analyzes overlapping search results across parallel active stories to detect potential code conflicts before they happen.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. Complete flow:
1. **Input**: Sprint status YAML (list of active stories) + story files
2. **Processing**: Extract concepts per story → Query Semble per story → Compare target file paths
3. **Detection**: Identify intersection areas where multiple stories touch the same files/symbols
4. **Output**: Conflict report with severity levels and orchestrator alert

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a sprint with multiple active stories, **When** the scanner runs, **Then** it queries Semble for each active story's key concepts and collects the target file paths from search results.
- **AC2:** **Given** search results from all active stories, **When** comparing target file paths, **Then** it identifies and highlights intersection areas where 2+ stories reference the same file or overlapping line ranges.
- **AC3:** **Given** detected overlaps, **When** the conflict severity is HIGH (same file + overlapping line ranges), **Then** it emits an ALERT to the orchestrator with a structured JSON report containing: `{conflicting_stories, shared_files, overlap_ranges, severity}`.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 1 (Conflict report model) → 0
3. **UI Surface:** 0 → 0
4. **Cross-Domain:** 1 (Depends on Story 1.1 + 1.2) → 0
5. **Flow Complexity:** 2 (Multi-story query + intersection analysis) → 1
6. **Test Burden:** 2 (Mock multi-story scenarios) → 1
**Complexity Score (CS):** 2 (✅ OK)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|--------------------|-----------------------------|--------|
| AC1 | Multi-story Semble Query | Task 1: Parse sprint YAML, extract active stories, query semble per story. | ✅ Mapped |
| AC2 | File Path Intersection | Task 2: Build file-path sets per story, compute intersections. | ✅ Mapped |
| AC3 | Conflict Alert | Task 3: Score severity (LOW/MED/HIGH), emit JSON alert. | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Value**: Prevents merge conflicts in multi-agent parallel execution by detecting overlapping file modifications BEFORE coding starts.
- **Integration Point**: Called by `orch-agent` before dispatching parallel dev-agents.
- **Dependency**: Uses Story 1.2's concept extraction + Story 1.1's semble-search.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification |
|---|---|---|
| Functional Correctness | 9 | Set intersection logic is deterministic and well-defined. |
| Data Integrity & State | 8 | Reads sprint YAML + story files; no mutation. |
| Security & Validation | 9 | Local operations only. |
| Performance & Scalability | 7 | Linear in number of stories × semble queries; acceptable for typical sprints (≤10 stories). |
| Error Handling & Recovery | 8 | Degrades to "no conflicts detected" if semble unavailable. |
| Architectural Depth & Leverage | 10 | Core innovation for multi-agent parallel orchestration safety. |
| UX Empathy | 9 | Prevents costly merge conflicts; saves developer time. |

**TOTAL AVERAGE: 8.57/10 (PASS)**

---

**Status:** `DONE`
**Depends On:** Story 1.1, Story 1.2
