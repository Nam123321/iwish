# 🧭 Semble Integration & Adoption Review Pack

This integration guide defines how the **Semble** local hybrid search tool will be adopted into the I-Wish system architecture.

---

## 1. Classification & Framework Placement
*   **Shape Classification**: `workflow-patch` & `skill`
*   **Role Classification**: `process-primary` & `supportive`
*   **Framework Placement**: Integrated directly into the I-Wish routing core (`orch-agent`) and exposed as a core utility skill (`code-search`) available to all agents.

---

## 2. Use Cases Analysis

### Core Use Cases
1.  **Semantic Code Chunk Retrieval**: AI agents fetch precise code snippets for query tasks, bypassing raw `grep` or parsing full files.
2.  **Zero-Config Workspace Indexing**: Instantly index codebases on CPU without needing a Docker container running FalkorDB.

### Adjacent Use Cases
1.  **Multi-Agent Parallel Orchestration (Story Resolution)**:
    - Parallel agents use Semble to scan and extract required code blocks relevant to their specific User Story.
2.  **Cross-Story Dependency Checking**:
    - The orchestrator maps overlapping file hits returned by parallel agent searches to flag potential concept conflicts before coding begins.
3.  **Semantic Merge Conflict Resolution**:
    - Performs concept-matching scans across branch modifications before merge, ensuring no stale references or broken interfaces remain in call-sites.

### Edge & Stress Cases
*   **Air-Gapped Environments (Edge)**: Downloading the `potion-code-16M` embedding model will fail if internet access is blocked.
    - *Remediation*: I-Wish will bundle or allow pre-downloading models.
*   **Monorepo RAM Overhead (Stress)**: In-memory LRU cache eviction thresholds must be configured dynamically to prevent OOM when indexing multi-gigabyte codebases.
*   **High Agent Concurrency (Stress)**: 10+ agents performing concurrent queries.
    - *Remediation*: Cache read queries or serialize disk access.

---

## 3. Constraints & Dependencies
*   **Engine**: Python 3.9+ and `uv`/`uvx`.
*   **Precision Trade-off**: Uses static embeddings (`model2vec`), which may lose contextual details compared to full-scale transformer models but operates with 200x faster indexing.

---

## 4. Agent, Workflow & Skill Coordination
```
             [orch-agent]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  [/plan /sprint]     [/code /review]
        │                   │
  (semble search)      (semble audit)
        │                   │
  [Cross-Story Dep]   [Pre-merge Audit]
```
*   **Plan/Sprint Workflows**: Resolve story dependencies by scanning target concepts.
*   **Code/Review Workflows**: Verify call-site changes before merging branches.

---

## 5. Orch Routing Hints
*   *Rule*: If the query involves "finding where X is implemented" or "getting context on how Y works" and FalkorDB is offline, immediately route retrieval through `code-search` instead of falling back to raw directory list.

---

## 6. Review Questions for the User
1.  **Fallback Automation**: Should I-Wish automatically fallback to Semble when FalkorDB is offline during `/analyze-codebase`?
2.  **Pre-Merge Gate**: Should the Semantic Merge Audit be a blocking gate in `/review` or simply issue a warnings report?
