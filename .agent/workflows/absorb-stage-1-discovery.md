---
name: absorb-stage-1-discovery
description: Stage 1 of the Repo Absorption Protocol (Discovery & Mapping). Covers Security, Ingestion, Indexing, and Architecture Mapping.
---

# 🌀 `/absorb-stage-1-discovery` (Stage 1: Discovery & Mapping)

## 📌 OVERVIEW
This is the first physical stage of the Repo Absorption Protocol. It focuses on safely acquiring the code, extracting architectural Hub Nodes without token bloat, and building a structural map of the target repository.

---

## 🛠️ THE PIPELINE

### Phase 0: SECURITY GUARDIAN 🛡️ (Agent: review-agent)
- **Action:** Invoke `.agent/skills/security-guardian/SKILL.md`.
- **Steps:**
  1. L1 Trust Signal (remote GitHub check).
  2. `git clone --depth=1 {url} ${IWISH_HOME}/sandbox/{repo-name}/` (Phase 0.5 - Clone).
  3. Run L2 (Secret Scan), L3 (Dependency Audit), and L4 (Behavioral Analysis).
- **Gate:** If L2 or L4 fails → **BLOCK**. User override is required to proceed.
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/00-security/security-report.md`.

### Phase 1: INGEST 📦 (Agent: capability-agent)
- **Action:** Invoke Phase 1 of `repo-absorption` skill.
- **Steps:** 
  1. Generate `.repomixignore`.
  2. Invoke `bash .agent/skills/magika-binary-filter/scripts/magika-filter.sh ${IWISH_HOME}/sandbox/{repo-name} ${IWISH_HOME}/sandbox/{repo-name}/.repomixignore` to automatically filter and block binary files.
  3. **IMPORTANT [P4 Mitigation]:** Do NOT generate a monolithic `context.md` file. The protocol now uses Source-Driven Reading via AST/Hub Nodes to prevent context degradation.

### Phase 1.5: INDEXING 🕸️ (Agent: architect-agent)
- **Action:** Build a unified Knowledge Graph using Dual-Indexer Strategy and extract Hub Nodes.
- **Steps:**
  1. **Tech Graph (Primary):** Execute `/analyze-codebase` on `${IWISH_HOME}/sandbox/{repo-name}/` to generate CodeGraphContext (CGC). This MUST generate `${IWISH_HOME}/absorbed-repos/{repo-name}/01-indexing/cgc-health-report.json`.
  2. **Config & Infra Identification [P0.5]:** Use `grep_search` or `list_dir` to manually locate critical config files (e.g., `.env.example`, `docker-compose.yml`, `config.yaml`, `package.json`, `Makefile`). Add these to the `[P0.5 - Linked Behavioral Asset]` list, as they may be missed by pure AST tracing.
  3. **AST-to-Asset Tracing:** Identifies Read calls in AST to map behavioral assets (Prompts, YAMLs).
     - Assign labels: `[P0.5]`, `[P1.5]`, `[P4]`.
  4. **Token Overflow Guard [P10 Fix]:** 
     - ONLY extract the **Top 10 Hub Nodes** (by PageRank or in-degree connectivity) into the active context for the next phase.
     - For remaining files, rely strictly on `grep_search` and `view_file` as needed.
- **CGC Health Gate & Fallback (Tiêu chuẩn 2.1):** 
  If `cgc-health-report.json` parse rate < 60% or fails, **HALT** and ask User to choose 1 of 3 options:
  - **Option 1:** Retry CGC (Fix syntax errors and try again).
  - **Option 2:** Pseudo-Graph Regex Scanner (Use fallback regex-based mapping).
  - **Option 3:** Human-in-the-Loop (HITL) Entry Points (User manually specifies the files).
- **Output:** Asset Inventory with labels (`P0.5`, `P1.5`, `P4`) and Top 10 Hub Nodes list saved to `01-indexing/asset-inventory.md`.

### Phase 2: MAP 🗺️ (Agent: architect-agent)
- **Action:** Create the Architecture Diagram.
- **Steps:**
  1. Query the Knowledge Graph (or Pseudo-Graph) for Entry Points, Module Boundaries, and Hub Nodes.
  2. Merge the Asset Inventory (P0.5, P1.5) into the architecture map.
  3. Generate a Mermaid.js diagram showing Tech modules AND Behavioral assets.
  4. Determine Repo Type (`agent-framework`, `prompt-collection`, `ui-library`, etc.).
- **Output:** Architecture diagram saved to `01-indexing/architecture-map.md`.

---

## 🚫 ZERO-TRUST PHYSICAL GATE
To prove completion of Stage 1 and transition to Stage 2, you MUST run:
```bash
python3 .agent/scripts/pipeline-integrity-runner.py --target "{repo-name}" --type absorb --phase discovery
```
**If the script returns an error, you MUST NOT proceed to Stage 2.**

> **Next Step:** If the gate passes, invoke `/absorb-stage-2-analysis` passing the `{repo-name}`.
