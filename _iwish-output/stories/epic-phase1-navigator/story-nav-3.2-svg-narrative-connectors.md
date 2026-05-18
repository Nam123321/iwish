---
epic_id: EPIC-NAV-3
story_id: STORY-NAV-3.2
title: SVG Narrative Connectors
status: completed
phase: "forge"

---
# Story NAV-3.2: SVG Narrative Connectors

## Context & Tracer Bullet
The dashboard needs visual lines connecting related sections (e.g., Spark to Deep Dive) so that the relationship between ideas and research is obvious.

**Tracer Bullet (Vertical Slice):**
1. **Data Source (Markdown):** YAML frontmatter in Markdown files will define semantic relationships (e.g., `related_to: ["file-abc"]`).
2. **Data Bridge (Python):** `sync_navigator.py` parses these relationships and maps them into the `navigator-data.js` output as an edge/node graph.
3. **Frontend (JS/HTML):** `navigator-engine.js` reads the graph relationships and draws static SVG or Canvas lines over the HTML elements once the DOM is fully rendered.

## Acceptance Criteria

- **AC1:** Backend (`sync_navigator.py`) parses YAML frontmatter from markdown files to extract semantic relations (e.g. `related_to`, `depends_on`) and injects them into the generated `navigator-data.js`.
- **AC2:** Frontend (`navigator-engine.js`) reads the relationships from `navigator-data.js` and draws static SVG paths or Canvas lines connecting the corresponding DOM elements.
- **AC3:** SVG lines are drawn only once when the page finishes loading (Static Draw on Load). Window resize recalculations are explicitly deferred to Phase 2 to minimize complexity.
- **[EDGE-CASE] AC4:** If a referenced target element (`related_to`) is missing or not rendered in the DOM, the frontend must fail gracefully and simply skip drawing that specific connector without crashing the app.

---

## AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Backend parses YAML relations | T1: Update `sync_navigator.py` | Extract frontmatter, build edge list | [x] |
| AC2 | Frontend draws static lines | T2: Implement SVG overlay | Calculate coordinates, inject SVG | [x] |
| AC3 | Defer resize recalculation | T2: Implement SVG overlay | Draw once on `window.onload` | [x] |
| AC4 | Handle missing targets | T2: Implement SVG overlay | Add element existence check | [x] |

---

## Fat-Guardian QA Simulator Audit

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | ACs clearly define the vertical slice from data extraction to UI rendering. |
| Data Integrity & State | 9 | Using static draw on load avoids complex DOM reflow race conditions. |
| Security & Validation | 9 | Reading frontmatter is safe; missing DOM targets are handled gracefully. |
| Performance & Scalability | 8 | Deferring resize recalculation prevents browser layout thrashing. |
| Error Handling & Recovery | 9 | Explicit edge case for missing targets prevents JS crashes. |
| Architectural Depth & Leverage | 8 | Separates relationship data extraction (backend) from rendering logic (frontend). |
| UX Empathy | 8 | Static lines provide clarity without the jitter of continuous resize recalculations. |

**TOTAL AVERAGE: 8.57 / 10**

### Architectural DNA Check (Pass/Fail)
- [x] **Tracer Bullet?** Yes. Full slice from Markdown frontmatter to SVG rendering.
- [x] **Deletion Testable?** Yes. The drawing logic can be removed or disabled without breaking the core content rendering.
- [x] **Interface vs Implementation?** Yes. The `navigator-data.js` graph structure acts as a clean interface between python extraction and JS rendering.
