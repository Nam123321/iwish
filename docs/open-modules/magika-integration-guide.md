# Adoption Review Pack: Magika

## 1. What is it
- **Capability/Repo name:** Magika (google/magika)
- **Source:** https://github.com/google/magika
- **Current registration state:** Pending `SYSTEM_SKILL` integration
- **Shape classification:** `skill-attachment`
- **Role classification:** `supportive`

## 2. Why it exists
- **What job it solves:** ML-based, ultra-fast file type detection.
- **Why I-Wish wants it:** I-Wish currently relies on file extensions or slow heuristics to identify file content, leading to inefficiencies during repository indexing and cloning (processing binary files as text). Magika resolves this accurately.
- **What gap it fills:** Fills the gap of accurate binary/text discrimination before passing data to Repomix or CodeGraphContext.

## 3. Delivery framework placement
- **Phase(s) it helps:** Discovery (Repo Absorption Protocol), Codebase Analysis (Graph Indexing)
- **Stage/task(s) it serves:** Ingest step, preprocessing step
- **Classification:** `supportive`

## 4. Input -> Process -> Output
- **Inputs:** Raw file paths or streams.
- **Process:** Reads chunks from start, middle, and end. Feeds into ONNX model.
- **Outputs:** High-confidence MIME type classification.

## 5. Use cases
- **Core use cases:** Pre-filtering files before running `repomix` (Phase 1 of `/absorb-repo`).
- **Adjacent use cases:** Quick file categorization in `clone-website`, skipping non-text binaries during `.agent/` scanning.
- **Do-not-use cases:** Do not use for deep semantic code analysis (it only tells you it is Python, not what the Python code does). Do not use to replace linting.

## 6. Edge cases / Stress cases / Constraints
- **Edge cases:** Zero-byte files or corrupted files may return generic `application/octet-stream`.
- **Stress cases:** High concurrency scanning of millions of files (requires batching).
- **Operational constraints:** Requires ONNX runtime. Adds ~1MB model dependency.
- **Governance constraints:** Must run locally without sending files to an external API to preserve privacy.
- **Routing caveats:** Must be invoked *before* text processing tools are triggered.

## 7. Agent / Workflow / Skill coordination
- **Canonical agents:** `capability-agent` (during repo ingest), `architect-agent` (during code analysis).
- **Workflows:** `/absorb-repo`, `/analyze-codebase`.
- **Supportive skills:** Combines well with `repo-absorption` skill to filter files.

## 8. Orch routing hints
- **Trigger phrases:** "analyze this repo", "pack repo", "index codebase", "filter binary files"
- **Anti-triggers:** "write code", "fix bug", "design ui"
- **Preferred routing stage:** INGEST / Indexing phase.
- **Proposal mode:** Proposed automatically by `/absorb-repo` as a supportive preprocessing step.

## 9. Review questions for the user
1. Do you approve injecting Magika into the standard `/absorb-repo` workflow as a pre-filter step?
2. Are you comfortable with adding the ONNX Python dependency (`magika` pip package) to the I-Wish system environment?
3. Should we strictly drop all files identified as non-text binaries from AI processing, or keep a log of them?

## 10. Example scenarios
- **Scenario A:** `/absorb-repo` is triggered on a massive repo with many `.dat` files that are actually binary. Magika flags them as `application/octet-stream` and Repomix skips them automatically.
- **Scenario B:** A user runs `/analyze-codebase`. Magika quickly scans the `assets/` folder and excludes binary images despite them lacking proper extensions.
