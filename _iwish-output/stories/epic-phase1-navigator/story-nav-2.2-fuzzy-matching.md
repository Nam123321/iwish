---
story_id: NAV-2.2
title: Fuzzy File Matching & Socratic Resolution
phase: forge
status: Completed
assignee: Vegeta
refs: [epic-phase1-navigator.md]
---
# Story: NAV-2.2 - Fuzzy File Matching & Socratic Resolution

## 1. Meta Data
- **Epic:** Epic: Phase 1 Visual Narrative & Idea Navigator (PH1-NAV)
- **Story ID:** NAV-2.2
- **Title:** Fuzzy File Matching & Socratic Resolution
- **Status:** Ready for Implementation
- **Complexity Score:** 3/10 (Medium)
- **Assignee:** Vegeta (Execution Agent)

## 2. Context & Background
In NAV-2.1, we built a robust sync engine that parses Markdown frontmatter to generate a unified `navigator-data.js` payload. However, cross-referencing between files (e.g., linking an Idea to its Research document) often relies on loose text references (e.g., `ref: target-topic`). 
If a reference has multiple potential matches (ambiguity), the system currently lacks a way to resolve it gracefully. This story implements a Fuzzy File Matching system that detects ambiguities and leverages an **Agent-in-the-loop Socratic Review** to resolve conflicts at the root (the Markdown file) before proceeding.

## 3. Tracer Bullet (Vertical Slice)
- **Trigger:** `sync-navigator.py` parses a file and encounters a loose reference.
- **Processing:** The engine performs a fuzzy string match against all known files. 
- **Ambiguity Detection:** If multiple files match above a certain threshold, the script halts and outputs a structured `AmbiguousMatchError` detailing the conflicting files and proposing a recommended match.
- **Resolution (Agent-in-the-loop):** The executing agent reads the error, initiates a Socratic Review to ask the user, updates the source Markdown file with the exact filename to clear the ambiguity, and re-runs the sync.

## 4. Acceptance Criteria (AC)
- **AC1 (Fuzzy Engine):** The script successfully implements a fuzzy matching heuristic (e.g., partial substring matching, Levenshtein, or simple keyword intersection) to link loose references to actual markdown files.
- **AC2 (Conflict Detection):** If a reference matches >= 2 files with similar confidence, the script MUST NOT guess silently. It MUST throw a structured error/warning in the terminal detailing the conflict and listing the candidates.
- **AC3 (Recommendation):** The conflict output MUST include a "Best Guess / Recommendation" to help the user/agent decide faster.
- **AC4 (Agent Resolution Protocol):** The implementation documentation or script output must explicitly instruct the executing agent to ask the user (Socratic Mode), update the source file, and retry, rather than proceeding with a null link.

## 5. Tasks & Traceability Matrix

| AC | Task Description | Status |
|---|---|---|
| AC1 | Implement `fuzzy_match(reference, candidates)` function in `sync-navigator.py`. | TODO |
| AC2 | Add logic to detect `matches.length > 1` and raise a specific `AmbiguousMatchError` with details. | TODO |
| AC3 | Include basic scoring in the fuzzy matcher to highlight the highest scoring candidate in the error output. | TODO |
| AC4 | Document the Agent Socratic Resolution loop in a comment block or terminal output so Vegeta knows how to handle the error. | TODO |

## 6. QA Simulator Guardian Scorecard
| Row | Category | Evaluation Criteria | Score (1-10) |
|---|---|---|---|
| 1 | **State Machine** | Does fuzzy matching break the parsing loop? No, handled via explicit exceptions. | 9 |
| 2 | **Data Integrity** | Prevents false-positive links by forcing explicit resolution. | 10 |
| 3 | **Race Conditions** | Single-threaded script; no race conditions present. | 9 |
| 4 | **Edge Cases** | Handles zero matches (null link) and multiple matches (halt & ask). | 9 |
| 5 | **Security** | No arbitrary code execution from reference strings. | 9 |
| 6 | **Performance** | Basic substring/scoring is O(N) where N is file count. Very fast. | 9 |
| 7 | **UX Empathy** | Terminal output includes explicit options and a recommendation for the user. | 10 |
| **TOTAL** | **AVERAGE** | **Actionable, robust, and user-centric.** | **9.3 / 10** |

## 7. Dev Notes
- Avoid installing heavy external libraries (like `thefuzz` or `fuzzywuzzy`) unless absolutely necessary. A simple lowercase intersection + substring match is usually sufficient for our file naming conventions.
- The `AmbiguousMatchError` output should look something like:
  ```
  AMBIGUITY DETECTED: Reference 'user-auth' matches:
  1. user-auth-api.md (Score: 80) -> RECOMMENDATION
  2. user-auth-ui.md (Score: 75)
  AGENT INSTRUCTION: Ask user to choose, update the source markdown to the exact filename, and rerun.
  ```
