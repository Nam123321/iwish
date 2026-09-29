# Story 2.1: Design DNA Extraction Guide & Safe-JS Cloner

**Epic:** Epic 2: Visual DNA study Integration
**Story Title:** Design DNA Extraction Guide
**Goal:** Add guidelines for Visual DNA Study Mode to the `/clone-website` or `ui-ux` skill directory and implement a secure hybrid cloner.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This story creates the core guidelines for visual extraction, updates the skill registry, registers files in the knowledge graph, and integrates a secure asset harvesting protocol in the cloner rules.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** a reference URL or screenshot, **When** visual study is triggered, **Then** the agent must follow the 5-step DNA protocol (Surface, Type, Structure, Motion, Rhythm).
- **AC2:** **Given** URL mode input, **When** scraping assets, **Then** it must filter out marketplaces/signature designs, download static assets (images, SVGs), and handle rhythm blind spots safely.
- **AC3:** **Given** target Javascript assets, **When** cloning JS files, **Then** the cloner must apply the **Safe-JS Cloner Protocol**:
  - Outbound CSP Injection (`connect-src 'none'`) in the output HTML.
  - Network API Mocking shim (`safe-shim.js`) to disable outbound calls.
  - Interactive User Approval Gate when obfuscated or minified JS is detected (warning the user to check if it's a standard framework library).

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 3 (≤ 8) → 0
2. **Data Model Spread:** 0 (≤ 3) → 0
3. **UI Surface:** 0 (No UI) → 0
4. **Cross-Domain:** 0 → 0
5. **Flow Complexity:** 1 (Interactive approval loop) → 0
6. **Test Burden:** 1 (Verifying CSP injection and mock scripts) → 0
**Complexity Score (CS):** 0 (✅ OK - Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|-------------------|---------------------------|--------|
| AC1 | 5-Step DNA Protocol | Task 1: Create `design-dna-extraction.md` detailing the visual extraction checklist. | ✅ Mapped |
| AC2 | URL/Image Input Channels | Task 1: Document URL refusal filters and image mode guidelines. | ✅ Mapped |
| AC3 | Safe-JS Cloner Protocol | Task 2: Create `hybrid-cloner.md` specifying the 3-layer security protocol (CSP, shim, and user approval gate). | ✅ Mapped |

---

## 💬 5. Socratic Review Synthesis Summary
- **Decisions Made:** Resolved to allow JS cloning but completely sandboxed.
- **Security Layers:** 
  1. Network connections blocked via CSP.
  2. Network APIs mocked in the DOM.
  3. Static check with interactive prompt requesting user approval for obfuscated/minified files instead of silent block.
- **Auto-Sync:** Checked against core framework capabilities. Backwards compatibility is preserved.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | Security rules prevent runtime data leaks while preserving page scripting. |
| Data Integrity & State | 10 | Static rules files do not drift runtime state. |
| Security & Validation | 10 | Outbound CSP and Shim APIs form a robust sandbox defense-in-depth. |
| Performance & Scalability | 9 | Shallow checks ensure minimal overhead during clone execution. |
| Error Handling & Recovery | 9.5 | User approval gate handles ambiguous obfuscated files gracefully. |
| Architectural Depth & Leverage | 10 | Provides a secure foundation for subsequent website absorption without system contamination. |
| UX Empathy | 9 | Warning prompt is descriptive, helping developers identify framework directories. |

**TOTAL AVERAGE: 9.64/10 (PASS)**

---

**Status:** `READY-FOR-DEV`
