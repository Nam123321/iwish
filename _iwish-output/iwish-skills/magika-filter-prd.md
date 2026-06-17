# Product Requirements Document (PRD): Magika Binary Filter System Skill

## 1. Executive Summary
The **Magika Binary Filter** is a supportive `SYSTEM_SKILL` designed to intelligently pre-filter and classify file contents using Google's Magika (Deep Learning-based file type detection). Its primary goal is to prevent I-Wish agents and indexers from processing binary or unreadable files by mistake, thereby saving tokens, preventing indexing errors, and speeding up Repo Absorption and Codebase Analysis.

## 2. Problem Statement
Currently, I-Wish relies on file extensions or basic heuristics to determine if a file is text or binary. This leads to issues where:
- Repomix ingests `.dat` or extensionless files that are actually binary, causing token bloat.
- Agents reading unfamiliar file types waste context space on unreadable byte representations.
- CodeGraphContext indexers crash or waste time parsing non-code files.

## 3. Scope & Objectives
### In Scope
- Create a reusable skill (`magika-binary-filter/SKILL.md`) that wraps the Magika CLI/Python package.
- Integration into `/absorb-repo` (Phase 1: Ingest) as a pre-flight hook.
- Integration into `/analyze-codebase` to ignore binary assets automatically.

### Out of Scope
- Replacing standard linters.
- Deep semantic analysis of code logic (Magika only identifies the MIME type).

## 4. Functional Requirements
- **FR1 (Execution):** The skill MUST be able to execute `magika` against a single file or a directory recursively.
- **FR2 (Output Format):** The skill MUST output a structured JSON or list of files explicitly marked as `binary` or `unsupported` MIME types.
- **FR3 (Integration):** The skill MUST provide an interface for `capability-agent` or `orch-agent` to automatically append binary files to `.repomixignore` or `.gitignore` equivalent during ingestion.

## 5. Non-Functional Requirements
- **Performance:** Scanning 1,000 files MUST take less than 2 seconds (leveraging Magika's ~1ms/file speed).
- **Environment:** Requires Python and `magika` pip package installed in the host environment.
- **Security:** Model inference runs locally. No data is sent out of the user's machine.

## 6. Verification & Acceptance Criteria
- **AC1:** Running the skill on a directory containing images, compiled binaries, and source code correctly identifies the binaries and excludes them from the text output.
- **AC2:** The skill documentation (`SKILL.md`) correctly conforms to I-Wish system skill frontmatter standards.
