---
epic: "EPIC-NAV-1"
story_id: "STORY-NAV-2.1"
title: "Python Sync Engine Base"
status: "todo"
assignee: "Vegeta"
phase: "forge"

---
# User Story: Python Sync Engine Base

## 📖 Story Description
**As a** Developer / Project Member,
**I want** a Python script (`sync-navigator.py`) that can automatically read markdown files from the `_iwish-output` directory, extract their YAML frontmatter and content, and generate a valid JavaScript object for the Idea Navigator,
**So that** the `navigator-data.js` file is always up-to-date with the latest content without requiring manual copy-pasting, maintaining a single source of truth in the markdown files.

## 🎯 Context & Synthesis
- **Tracer Bullet:** A Python script that successfully parses a single Markdown file's YAML frontmatter and body, updating a structured JSON object inside `navigator-data.js` without breaking JS syntax.
- **Mapping Logic (Metadata-Driven):** The primary mapping attribute is the `phase:` tag within the YAML frontmatter (e.g., `phase: spark`).
- **Smart Fallback & Auto-Healing (User Amendment):** If the `phase` attribute is missing, the script will infer the phase by searching the file's directory structure or using fuzzy file search. **Crucially**, once the phase is inferred, the script MUST automatically update the source Markdown file to inject/append the `phase: [tên_phase]` tag into its YAML frontmatter. This ensures future runs rely purely on the metadata and bypass the fallback search. If the file cannot be found or inferred at all, it will log a "Missing" warning.

## ✅ Acceptance Criteria (AC)
- **AC1:** **Given** a directory of markdown files **When** the Python script runs **Then** it correctly parses the YAML frontmatter and markdown body of each file.
- **AC2:** **Given** a markdown file with a valid `phase` metadata **When** the script processes it **Then** it accurately maps the file to the corresponding phase bucket (Origin, Spark, Deep Dive, Forge) for the dashboard.
- **AC3 [EDGE-CASE]:** **Given** a markdown file *missing* the `phase` metadata **When** the script processes it **Then** it infers the phase via directory/search logic, **AND** automatically modifies the `.md` file to append the `phase` attribute into its frontmatter.
- **AC4:** **Given** the extracted data **When** generating the output **Then** it safely overwrites the `window.NAVDATA` variable in `_iwish-output/idea-navigator/js/navigator-data.js` with a valid, properly escaped JSON string, preserving JavaScript syntax.
- **AC5:** **Given** a file that cannot be mapped or found **When** processing **Then** the script gracefully skips it and logs a clear "Missing" or "Unmappable" warning to the console.

## 📋 AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | Parse MD & YAML | T1: Implement file reading and regex/YAML parsing | — | [ ] |
| AC2 | Map by Metadata | T2: Map parsed files to Dashboard phases | — | [ ] |
| AC3 | Smart Fallback & Auto-Heal | T3: Implement directory fallback & auto-update `.md` logic | — | [ ] |
| AC4 | Inject JS | T4: Safely serialize to JSON and overwrite `navigator-data.js` | — | [ ] |
| AC5 | Error Handling | T5: Implement logging for unmappable/missing files | — | [ ] |

## 🛡️ QA Simulator Guardian (Fat-Guardian) Audit
**Total Average Score: 9.7 / 10**

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 10 | The script directly addresses the need to bridge static MD and interactive JS dashboard. |
| Data Integrity & State | 10 | Auto-healing YAML ensures data integrity is preserved back into the Single Source of Truth (the .md files). |
| Security & Validation | 9 | Must ensure Python correctly escapes markdown strings (e.g., quotes, newlines) when writing JSON to avoid breaking the JS engine or allowing injection. |
| Performance & Scalability | 10 | Python filesystem operations and regex parsing will be virtually instantaneous for standard project sizes. |
| Error Handling & Recovery | 10 | Missing/unmappable files are safely bypassed with console warnings. |
| Architectural Depth & Leverage| 10 | Sets up the entire automation pipeline (Phase 1 -> Dashboard). |
| UX Empathy | 9 | Empowers developers by removing manual data entry; logs are clear and actionable. |

**Architectural DNA Check:**
- [x] **Tracer Bullet?** Yes. Represents the full end-to-end sync operation from `.md` to `.js`.
- [x] **Deletion Testable?** Yes. Deleting the script just stops auto-updates, but doesn't break the dashboard or markdown files.
- [x] **Interface vs Implementation?** Yes. Script acts as a pure adapter (Data Bridge) between standard Markdown and the UI's JSON schema.
