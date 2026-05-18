---
epic: "epic-phase1-navigator"
story_id: "nav-3.1"
title: "Pivot Point Visualization"
status: "Ready for Implementation"
phase: "forge"
admiralty: "A1"

---
# Story NAV-3.1: Pivot Point Visualization

[Reliability: A1]

## Logic Steps
- Step 1: Detect PIVOT keyword in Markdown files during sync.
- Step 2: Aggregate extracted pivot blocks into a JSON data bridge.
- Step 3: Inject CSS highlighters into the UI based on `hasPivot` metadata.
- Step 4: Enable interactive filtering for all pivot-containing artifacts.

## Context
As a Project Member, I want the dashboard to automatically highlight key project pivots so that I can easily spot where major directional changes occurred.

This story implements the detection and highlighting of "PIVOT" keywords across markdown files, bridging the python sync engine and the frontend visual layer to create an interactive narrative.

## Acceptance Criteria

**AC1: Backend Detection & Extraction**
- **Given** `sync-navigator.py` scans a markdown file containing the exact keyword `PIVOT`
- **When** the script generates `navigator-data.js`
- **Then** it must add a `hasPivot: true` metadata flag for that file.
- **And** it must extract the specific paragraph or list-item containing the `PIVOT` keyword into a structured `pivots` array inside the file's data payload.
- **[EDGE-CASE] Given** multiple `PIVOT` keywords exist in one file **When** parsing **Then** the array must capture all occurrences without crashing or overwriting.

**AC2: Frontend Visual Highlighting**
- **Given** the frontend `idea-navigator.html` renders a file's markdown content
- **When** a `PIVOT` paragraph is encountered (identified either via marked.js extension or inline HTML injection from the backend)
- **Then** the UI must visually highlight the containing paragraph or list item (e.g., applying a `.pivot-highlight` CSS class with a glowing border or badge).
- **[EDGE-CASE] Given** the `PIVOT` keyword is inside a code block or standard text without paragraph breaks **When** highlighting **Then** the UI styling must not break the layout or overflow.

## AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Backend Extract | T1: Update Python Sync Script | ST1.1 (Regex detection), ST1.2 (JSON structure update) | ☐ |
| AC2 | Frontend Highlight | T2: Implement UI Styling | ST2.1 (CSS rules), ST2.2 (JS rendering logic) | ☐ |

## Dev Notes
- **Tracer Bullet:** The vertical slice ensures data extraction in Python correctly bridges into JavaScript array structures, allowing the UI to react predictably.
- **Scope Restriction:** As clarified during Socratic Review, the highlight applies strictly to the containing paragraph/list-item, NOT the entire markdown section under the heading.

## QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | Straightforward extraction and rendering loop; edge cases for multiple pivots covered. |
| Data Integrity & State | 9 | `navigator-data.js` schema gracefully extended; no state mutation risks. |
| Security & Validation | 8 | Safe extraction; relying on marked.js escaping to prevent XSS from extracted blocks. |
| Performance & Scalability | 9 | Regex matching during static sync; zero performance cost on client-side rendering. |
| Error Handling & Recovery | 9 | Backend skips extraction cleanly if no pivot found. |
| Architectural Depth & Leverage | 9 | Separates extraction (backend) from presentation (frontend). |
| UX Empathy | 9 | Highlighting focuses user attention without overwhelming the UI block. |
**TOTAL AVERAGE:** 8.85/10

### Architectural DNA Check
- [x] **Tracer Bullet?** Yes (Vertical slice from Python Sync to HTML UI).
- [x] **Deletion Testable?** Yes (Pivot detection logic can be disabled without breaking the sync).
- [x] **Interface vs Implementation?** Yes (Frontend only consumes `hasPivot` and `pivots[]` array).
