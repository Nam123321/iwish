# STORY-NAV-1.2: Narrative Stage Structure

## 1. Description
As a Project Member,
I want the dashboard categorized into Origin, Spark, Deep Dive, and Forge stages with an expand/collapse mechanism,
So that the project's evolution is logically grouped and large research files do not overwhelm the initial UI view.

## 2. Acceptance Criteria
- [ ] **AC1 (Narrative Layout):** The UI contains four vertically stacked, distinct sections representing the project stages: Origin, Spark, Deep Dive, and Forge.
- [ ] **AC2 (Data Handshake):** The UI reads mock artifact data from a globally injected object (`window.I-Wish_NAV_DATA`) defined in a local `.js` file, ensuring the dashboard runs entirely offline without a `localhost` server.
- [ ] **AC3 (Progressive Disclosure):** Artifact cards with extensive content automatically shorten/clamp their text to show key ideas only. A "Zoom In" or "Read More" interaction is provided to expand the detail view.
- [ ] **AC4 (Graceful Fallback):** If a narrative stage has no associated data in the global object, the section displays an elegant, themed empty state (e.g., "Awaiting sparks...").

## 3. Tracer Bullet (Vertical Slice)
- **Data Layer:** A static `js/navigator-data.js` file defining `window.I-Wish_NAV_DATA` with at least one mock artifact for each stage.
- **Logic Layer:** A lightweight `js/navigator-engine.js` script that maps the data object and dynamically injects DOM nodes.
- **Presentation Layer:** The 4 stage containers in `idea-navigator.html` and the CSS/JS for the expand/collapse interaction.

## 4. Technical Specifications & Dev Notes
- **Complexity Score (CS):** 5/10 (Medium). *Warning: Expanding/collapsing very large DOM nodes can affect reflow. Consider using the native HTML `<dialog>` element for "Zoom In" deep dives rather than inline expansion.*
- **CSS Architecture:** Leverage existing `navigator-theme.css`. Utilize CSS `line-clamp` for the shortened view to maintain layout stability.
- **Data Structure:** The bridge object should look like:
  ```javascript
  window.I-Wish_NAV_DATA = {
    "origin": [...],
    "spark": [...],
    "deep_dive": [...],
    "forge": [...]
  };
  ```

## 5. AC-To-Task Traceability Matrix
- **[Task 1] Define Data Contract:** Create `navigator-data.js` mock object. -> *Covers AC2*
- **[Task 2] Build Layout Containers:** Add Origin, Spark, Deep Dive, Forge section HTML. -> *Covers AC1, AC4*
- **[Task 3] Develop JS Engine:** Create `navigator-engine.js` to parse data and render cards. -> *Covers AC1, AC2*
- **[Task 4] Implement Progressive Disclosure:** Add CSS clamping and JS expand/modal logic. -> *Covers AC3*

## 6. QA Simulator Guardian Audit (Fat-Guardian)
| Axis | Score (1-10) | Justification & Edge Case Mitigations |
|---|---|---|
| Functional Correctness | 9 | Simple mapping from global JS object to specific HTML container IDs. |
| Data Integrity & State | 10 | Purely read-only display state; no mutation risks on the frontend. |
| Security & Validation | 9 | `innerHTML` usage must be careful even with static files, but offline nature mitigates XSS risk. |
| Performance & Scalability | 8 | Initial DOM rendering of many nodes could spike CPU. Clamping text mitigates reflow costs. |
| Error Handling & Recovery | 9 | Handled via Empty States (AC4) if data arrays are missing or malformed. |
| Architectural Depth & Leverage | 10 | The JS Data Object pattern completely decouples the UI from the future Python crawling script. |
| UX Empathy | 10 | The vertical timeline creates a journey, while progressive disclosure avoids overwhelming the user. |
| **TOTAL AVERAGE** | **9.28** | **PASSED** (≥ 8.5) |
