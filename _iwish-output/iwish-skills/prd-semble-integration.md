# Product Requirements Document (PRD): Semble & Multi-Agent Parallel Orch Integration

## 1. Goal Description
The objective is to integrate the Semble local code-search capability into the I-Wish multi-agent parallel orchestration framework. This will enable token-efficient story reading, dynamic dependency mapping across parallel tasks, and pre-merge semantic verification, reducing the total token budget and avoiding logical conflicts in parallel agent branches.

---

## 2. Functional Requirements (FR)

### FR1: Local Hybrid Search Skill (`semble-search`)
- Implement a system skill `semble-search` wrapping the `semble` CLI.
- Provide helper options to run searches via `uvx --from "semble[mcp]" semble` if `semble` is not globally installed.

### FR2: Token-Efficient Story Reading
- Implement a helper script in the story development workflow that extracts requirements (FRs) from active user stories, queries Semble, and appends the exact relevant chunks to the agent's context (instead of nạp cả file).

### FR3: Cross-Story Conflict Detector (Dependency Mapping)
- Scan parallel active user stories during planning/sprint-status.
- For each story, run a concept search against the codebase.
- Analyze the result intersection: if multiple stories target overlapping code files or related symbols, flag them as high-risk, issue an alert, and apply an Interface Lock.

### FR4: Semantic Merge Audit
- Before merging a parallel story branch into the `main` branch, run a scan on modified symbols using `semble search`.
- Check if other active branches call old or modified signatures to prevent runtime failures.

---

## 3. Non-Functional Requirements (NFR)

### NFR1: Performance & CPU Isolation
- Indexing and query execution must run strictly offline on local CPU, keeping search latency below 500ms per query.

### NFR2: Graceful Degradation
- If Python or `uv` is unavailable, fall back automatically to standard regex `grep_search` and output a warning.
