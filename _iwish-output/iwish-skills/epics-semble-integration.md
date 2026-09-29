# Epics & Stories: Semble & Multi-Agent Parallel Orch Integration

This document maps the requirements for integrating Semble into I-Wish's multi-agent parallel orchestration.

---

## Epic 1: Semble Retrieval Skill & Story Reading

### Story 1.1: Semble CLI Wrapper Skill
- **Goal**: Create a system skill `semble-search` in `_iwish-output/iwish-skills/` that wraps the `semble` CLI and falls back to `uvx` when not globally installed.
- **Acceptance Criteria**:
  - AC1: Execute `semble search` and return parsed JSON chunks.
  - AC2: Expose `find_related` helper.
  - AC3: Fall back gracefully to `grep_search` if python/uv is missing.

### Story 1.2: Context-Aware Story Chunk Injector
- **Goal**: Write a script to query Semble with story requirements and inject exact code snippets into the dev-agent's prompt.
- **Acceptance Criteria**:
  - AC1: Extract key concepts from a story file.
  - AC2: Retrieve relevant chunks (top-k=5) and format them as markdown blocks in the prompt context.

---

## Epic 2: Parallel Coordination & Merge Conflict Audit

### Story 2.1: Cross-Story Dependency Scanner
- **Goal**: Implement a script that analyzes overlaps in search results across parallel active stories to detect conflicts.
- **Acceptance Criteria**:
  - AC1: Query Semble for all active stories in the sprint.
  - AC2: Compare target file paths and highlight intersection areas.
  - AC3: Alert orchestrator if overlapping dependencies exist.

### Story 2.2: Semantic Merge Audit Hook
- **Goal**: Create a pre-merge script verifying symbol call-sites across branches using Semble.
- **Acceptance Criteria**:
  - AC1: Identify modified symbols in branch changes.
  - AC2: Query Semble to scan if other branches contain stale references.
