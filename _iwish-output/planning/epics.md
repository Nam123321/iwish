---
stepsCompleted: [1]
inputDocuments: ["_iwish-output/epics/epic-phase1-navigator.md", "_iwish-output/prd.md"]
phase: "deep_dive"

---
# Idea Navigator - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Idea Navigator, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System shall provide a unified HTML dashboard (`idea-navigator.html`) visualizing all Phase 1 artifacts.
FR2: Dashboard shall categorize content into four narrative stages: Origin, Spark, Deep Dive, and Forge.
FR3: System shall automatically detect and display "Pivot Points" marked with the `PIVOT` keyword in MD files.
FR4: Dashboard shall use dynamic SVG/Canvas connectors to show logical links between ideas and supporting research.
FR5: System shall provide a synchronization script (`sync_navigator.py`) to crawl `_iwish-output/` and update the dashboard data.
FR6: System shall support fuzzy matching for core Phase 1 files (Brainstorming, PRD, Product Brief).
FR7: Dashboard shall render Markdown content within the HTML sections using a library (e.g., `marked.js`).
FR8: System shall implement a `Navigator-Guardian` skill to trigger sync after any Phase 1 workflow step.

### NonFunctional Requirements

NFR1: Aesthetics: UI must follow "Celestial Realm" theme with glassmorphism and animations.
NFR2: Performance: Dashboard must load quickly and handle large research reports without lagging.
NFR3: Reliability: Sync process must handle missing or malformed MD files gracefully.
NFR4: Stability: Layout structure must remain stable across updates to minimize token usage during agent interactions.

### Additional Requirements

- Tech Stack: Vanilla HTML/CSS/JS + Python (Sync) + JSON (Bridge).
- Design Pattern: Decoupled presentation (HTML) from data source (MD).
- UX: Narrative leads the user through the project's evolution.
- Deployment: Local file-based access (no server required for viewing).

### FR Coverage Map

FR1: Epic 1 - Unified HTML dashboard
FR2: Epic 1 - Narrative stages (Origin, Spark, Deep Dive, Forge)
FR3: Epic 3 - Pivot Point detection
FR4: Epic 3 - Visual narrative connectors (SVG)
FR5: Epic 2 - Python sync script
FR6: Epic 2 - Fuzzy file matching logic
FR7: Epic 1 - In-browser Markdown rendering
FR8: Epic 4 - Navigator-Guardian skill & workflow hooks

## Epic List

## Epic List

### Epic 1: Celestial Core & Narrative Layout
Establish the visual foundation and the one-page narrative structure using the "Celestial Realm" theme.
**FRs covered:** FR1, FR2, FR7, NFR1

### Epic 2: Navigator Data Bridge & Sync Intelligence
Implement the robust bridge between Markdown source files and the HTML presentation layer with an automated Python sync engine.
**FRs covered:** FR5, FR6, NFR3, NFR4

### Epic 3: Interactive Visual Lineage & Insights
Enhance the dashboard with dynamic interactivity, automatic pivot point visualization, and SVG-based narrative connectors.
**FRs covered:** FR3, FR4, NFR2

### Epic 4: Navigator-Guardian & Workflow Integration
Formalize the dashboard as the project's source of truth by integrating it into all I-Wish Phase 1 workflows via a specialized Guardian skill.
**FRs covered:** FR8

---

## Epic 1: Celestial Core & Narrative Layout

Establish the visual foundation and the one-page narrative structure using the "Celestial Realm" theme.

### Story 1.1: Base HTML Skeleton & Celestial Styling

As a Project Member,
I want a unified, visually premium HTML dashboard using the "Celestial Realm" theme,
So that I can view project artifacts in a modern and engaging interface.

**Acceptance Criteria:**
**Given** the user opens `idea-navigator.html` in a local browser
**When** the page loads
**Then** the UI displays the "Celestial Realm" design language (glassmorphism, dark nebula background, premium typography)
**And** the layout is fully responsive.
**[EDGE-CASE] Given** the user is on a very small mobile screen **When** the layout renders **Then** the design adapts without breaking horizontal overflow.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A (Static HTML/CSS)
* **Shinji Lite:** N/A
* **Quinn Lite:** Visual regression testing required.

### Story 1.2: Narrative Stage Structure

As a Project Member,
I want the dashboard categorized into Origin, Spark, Deep Dive, and Forge stages,
So that the project's evolution is logically grouped.

**Acceptance Criteria:**
**Given** the dashboard is loaded
**When** the user scrolls or navigates
**Then** there are four distinct, clearly labeled sections: Origin, Spark, Deep Dive, and Forge
**And** each section contains container elements ready for data injection.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Verify DOM structure contains IDs for the 4 stages.

### Story 1.3: Markdown Rendering Engine

As a Project Member,
I want markdown content to be properly formatted as HTML within the dashboard,
So that raw text files are easily readable.

**Acceptance Criteria:**
**Given** raw Markdown strings are passed to the frontend
**When** the UI renders them
**Then** `marked.js` (or similar) parses the Markdown into styled HTML blocks (headers, lists, bold, etc.)
**[EDGE-CASE] Given** a markdown file contains malicious `<script>` tags (XSS risk) **When** `marked.js` processes it **Then** the output is sanitized and scripts are not executed.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Test XSS payloads in markdown source.

---

## Epic 2: Navigator Data Bridge & Sync Intelligence

Implement the robust bridge between Markdown source files and the HTML presentation layer with an automated Python sync engine.

### Story 2.1: Python Sync Engine Base

As an AI Agent / Developer,
I want a Python script (`sync_navigator.py`) to crawl the `_iwish-output` directory,
So that I can extract the latest Markdown content automatically.

**Acceptance Criteria:**
**Given** `sync_navigator.py` is executed
**When** it scans the workspace
**Then** it reads content from specific Phase 1 markdown files
**And** outputs a `navigator-data.js` file defining a global Javascript object with the file contents.
**[EDGE-CASE] Given** the Python script is executed but the target directory does not exist **When** it tries to scan **Then** it fails gracefully with a clear error message instead of crashing.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** File I/O operations, ensure read-only on source files.
* **Shinji Lite:** N/A
* **Quinn Lite:** Test with empty/missing directories.

### Story 2.2: Fuzzy File Matching Logic

As a Project Member,
I want the sync script to find files even if their exact names vary slightly,
So that minor naming changes don't break the dashboard.

**Acceptance Criteria:**
**Given** the sync script is looking for the Product Brief
**When** the file is named `product_brief.md` or `product-brief-v2.md`
**Then** the fuzzy matching logic identifies it correctly and injects its content.
**[EDGE-CASE] Given** multiple files match the fuzzy criteria **When** selecting the file to use **Then** the script prioritizes files in `_iwish-output/` over `.iwish-sandbox/`.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Test regex/fuzzy match edge cases with conflicting file names.

---

## Epic 3: Interactive Visual Lineage & Insights

Enhance the dashboard with dynamic interactivity, automatic pivot point visualization, and SVG-based narrative connectors.

### Story 3.1: Pivot Point Visualization

As a Project Member,
I want the dashboard to automatically highlight key project pivots,
So that I can easily spot where major directional changes occurred.

**Acceptance Criteria:**
**Given** a markdown file contains the exact keyword `PIVOT`
**When** it is rendered on the dashboard
**Then** the UI detects the keyword and visually highlights the surrounding block (e.g., with a glowing border or special badge).

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Ensure case-insensitive keyword detection logic.

### Story 3.2: SVG Narrative Connectors

As a Project Member,
I want visual lines connecting related sections (e.g., Spark to Deep Dive),
So that the relationship between ideas and research is obvious.

**Acceptance Criteria:**
**Given** the Origin, Spark, and Deep Dive sections are populated
**When** the dashboard renders
**Then** SVG paths or Canvas lines dynamically draw between the sections to indicate flow.
**And** the lines recalculate their positions if the window is resized.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Resize observer test for line recalculation.

### Story 3.3: DOM Rendering Optimization

As a Project Member,
I want the dashboard to handle very large research files smoothly,
So that scrolling and interacting doesn't lag the browser.

**Acceptance Criteria:**
**Given** a Deep Dive research file exceeds 5000 words
**When** it is rendered
**Then** the UI places the content in a scrollable container or a collapsible "Read More" section.
**[EDGE-CASE] Given** `navigator-data.js` fails to load or is corrupted **When** the HTML initializes **Then** a fallback error state is shown on the UI instead of a blank white screen.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Lighthouse performance test for large DOM payloads.

---

## Epic 4: Navigator-Guardian & Workflow Integration

Formalize the dashboard as the project's source of truth by integrating it into all I-Wish Phase 1 workflows via a specialized Guardian skill.

### Story 4.1: Navigator-Guardian Skill Development

As a I-Wish Agent,
I want a specific skill definition (`Navigator-Guardian`),
So that I have strict instructions on when and how to update the dashboard.

**Acceptance Criteria:**
**Given** an agent loads the `Navigator-Guardian` skill
**When** executing tasks
**Then** the agent knows to run `python sync_navigator.py` to rebuild the data bridge.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** N/A
* **Quinn Lite:** Verify skill instructions are parsed correctly by LLMs.

### Story 4.2: Post-Step Hook Injection

As a Project Administrator,
I want the Guardian skill injected into all Phase 1 workflows,
So that no manual intervention is required to keep the dashboard updated.

**Acceptance Criteria:**
**Given** a user completes a step like `iwish-bmm-create-product-brief.md`
**When** the step finishes
**Then** the workflow explicitly commands the agent to execute the Navigator-Guardian skill before concluding.

**Tri-Agent LITE Scan Summary:**
* **Kira Lite:** N/A
* **Shinji Lite:** Event trigger mapping to existing workflows.
* **Quinn Lite:** Test end-to-end workflow completion.
