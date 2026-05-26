---
name: 'repo-absorption-wrapper'
description: "Core engine for deep-learning an external repository in 5 phases: INGEST (pack with Repomix), INDEX (Dual-Indexer with Hybrid Resolution), MAP (Graph-Directed architecture mapping), DISSECT (Dual-Layer priority-based deep reading), and DOCUMENT (generate repo-dna.md with Symlink)."
---

# 🧠 Repo Absorption Skill (5-Phase Deep Learning Engine)

## 📌 OVERVIEW
This skill is the core intelligence engine for the Repo Absorption Protocol (RAP). It transforms a raw external repository into structured, actionable knowledge. By reading a codebase AND its behavioral assets (prompts, workflows, personas) intelligently, you extract both the "brain" (logic, architecture, patterns) and the "soul" (AI behaviors, decision logic) of the repo.

## 🎯 TRIGGER
Use this skill when you need to deeply understand, analyze, and map a cloned repository, typically during the `/absorb-repo` orchestrator workflow.

## 🚦 PREREQUISITES
1. The target repository MUST have been successfully vetted by the `security-guardian` skill.
2. The repository MUST be cloned into the sandbox: `${IWISH_HOME}/sandbox/{repo-name}/`.
3. Runtime output directories MUST exist under `${IWISH_HOME:-~/.iwish}`. Reports go to `${IWISH_HOME}/absorbed-repos/{repo-name}/`; generated capability drafts go to `${IWISH_HOME}/generated-*`.

---

## 🛠️ EXECUTION PHASES (Must be executed in order)

### PHASE 1: INGEST (Pack repo into AI-friendly format)
**Goal:** Compress the repository context into a single readable file using Repomix.
1. **Detect Type:** Inspect `package.json`, `requirements.txt`, `go.mod`, etc., to identify the language/framework.
   - *Monorepo Check:* If you detect `packages/`, `apps/`, or a workspace configuration, PAUSE and ask the user which sub-package to target before proceeding.
2. **Setup Filters:** Create a `.repomixignore` file in the repo root if it doesn't exist, containing:
   ```
   node_modules/
   dist/
   build/
   .next/
   coverage/
   *.min.js
   __pycache__/
   .venv/
   vendor/
   .git/
   *.lock
   ```
3. **Run Repomix:** Execute the following command:
   ```bash
   npx repomix --output ${IWISH_HOME}/absorbed-repos/{repo-name}/context.md --style markdown ${IWISH_HOME}/sandbox/{repo-name}/
   ```
   - *Fallback:* If `repomix` is unavailable or fails, fallback to manual exploration (3-Layer methodology) and emit a WARNING to the user: "Repomix unavailable — using fallback. Results may be less comprehensive."
4. **Validate Output:**
   - Verify `${IWISH_HOME}/absorbed-repos/{repo-name}/context.md` exists and is > 1KB.
   - If the file size is > 2MB, emit a WARNING: "Large context — may exceed token limits. Consider aggressive filtering."

### PHASE 1.5: INDEX (Dual-Indexer — Build Knowledge Graph)
**Goal:** Create a unified Knowledge Graph that links code AND behavioral assets (prompts, workflows, personas).

#### Step 1: Tech Graph (Primary — CGC)
1. Execute `/analyze-codebase` on `${IWISH_HOME}/sandbox/{repo-name}/` to generate CodeGraphContext via AST/Tree-sitter.
2. If successful, the Tech Graph provides: Module Boundaries, Entry Points, Hub Nodes, Dependency Edges.

#### Step 2: AST-to-Asset Tracing
1. Instruct CGC to identify all File-System Read calls within the AST:
   - **Target Patterns:** `fs.readFileSync()`, `fs.readFile()`, `open()`, `Path.read_text()`, `load()`, `require()` (for non-JS/TS assets), `path.join()` + any read function, template literal paths.
2. For each detected call where the target is a `.md`, `.txt`, `.prompt`, `.yaml`, `.json` (non-package) file:
   - Create an Edge in the graph: `[source_code_file] -READS-> [target_text_file]`.

#### Step 3: Hybrid Resolution Algorithm (3-Layer Label Assignment)
For ALL `.md`, `.txt`, `.prompt`, `.yaml` files found in the repository:

| Layer | Method | Condition | Label |
|-------|--------|-----------|-------|
| **Layer 1: Static Tracing** | AST Edge exists | File is directly referenced by hardcoded path in code | `[P0.5 - Linked Behavioral Asset]` |
| **Layer 2: Fuzzy Tracing** | `grep_search` for basename | File basename appears as string literal in any code file | `[P1.5 - Dynamically Linked Asset]` |
| **Layer 3: Orphan Isolation** | No match from L1 or L2 | File has no detectable relationship to any code | `[P4 - Orphan Asset]` |

**Anti-Collision Rule (Path-based Heuristics):**
When Layer 2 `grep` returns multiple matches for the same basename (e.g., `system_prompt.md` exists in `auth/`, `billing/`, `core/`):
1. For each match, calculate the **Directory Distance** = number of `../` steps between the calling file and the target file.
2. Select the match with the **shortest Directory Distance**.
3. If tied, prefer the match in the **same top-level directory** as the calling file.
4. If still ambiguous, label ALL matches as `[P1.5]` and flag for human review in Phase 5.

#### Step 4: Token Overflow Guard
If total Behavioral Asset count (P0.5 + P1.5 + P4) exceeds **50 files:**
1. Keep ALL `[P0.5]` files (must-read, linked by code).
2. Keep ALL `[P1.5]` files (likely important, dynamically linked).
3. From `[P4 - Orphan]` files: Keep ONLY files in root-level behavioral directories (`prompts/`, `agents/`, `workflows/`) OR files > 500 bytes.
4. Discard remaining `[P4]` files.
5. If STILL > 50: Sort remaining by file size descending, keep top 50.
6. Emit WARNING with count of discarded files.

#### CGC Failure Fallback
If `analyze-codebase` fails (FalkorDB offline, unsupported language, Tree-sitter error):
1. Emit WARNING: `"CGC indexing failed — [error reason]. Falling back to Heuristic Scan."`
2. **Directory Scan:** `tree -L 3 -I 'node_modules|.git|dist|build'` on sandbox repo.
3. **Heuristic Feature Scan:**
   - Parse `package.json` → extract `scripts`, `bin`, `main` fields.
   - Parse `Makefile` → extract target names.
   - Parse `docker-compose.yml` → extract service names.
   - Search for behavioral directories: `prompts/`, `skills/`, `workflows/`, `agents/`, `commands/`, `personas/`, `roles/`, `templates/`.
   - Search for CLI entry points: files matching `*cli*`, files containing `argparse`, `commander`, `yargs`, `clap`.
4. ALL `.md`/`.prompt`/`.yaml` files found inside behavioral directories → Label as `[P0.5 - Linked Behavioral Asset]`.
5. ALL other `.md` files → Label as `[P4 - Orphan Asset]`.

**Output:** Asset Inventory saved to `${IWISH_HOME}/absorbed-repos/{repo-name}/asset-inventory.md` containing:
```markdown
## Asset Inventory for {repo-name}
### Indexing Method: [CGC | Heuristic Fallback]

### P0.5 — Linked Behavioral Assets (X files)
- path/to/file.md (linked by: source.ts:L42)

### P1.5 — Dynamically Linked Assets (X files)
- path/to/file.md (grep match in: loader.ts)

### P4 — Orphan Assets (X files)
- path/to/file.md (no code reference found)

### Discarded (Token Guard): X files removed
```

### PHASE 2: MAP (Graph-Directed Architecture Mapping)
**Goal:** Understand the macro-structure using the Knowledge Graph before reading details.

#### If CGC Succeeded (Graph-Directed Mode):
1. **Query Graph for Entry Points:** Nodes with high in-degree or marked as `main`/`bin` in `package.json`.
2. **Query Graph for Module Boundaries:** Connected components (clusters) in the dependency graph.
3. **Query Graph for Hub Nodes:** Top 10 nodes by connectivity (PageRank or degree centrality).
4. **Compound Detection:** If graph contains ≥ 3 disconnected clusters → Classify as **Compound Repo** and flag for Phase 5.

#### If CGC Failed (Heuristic Mode):
1. Use `tree` output from Phase 1.5 fallback.
2. **Entry Point ID:** Identify main execution points (`main.ts`, `index.ts`, `app.ts`, `manage.py`, `cmd/main.go`, `package.json` "main"/"bin", Dockerfile `CMD`).
3. **Dependency Graph:** Parse dependency files to categorize packages (runtime vs dev vs peer).
4. **Module Boundaries:** Map logical components/layers manually.

#### Both Modes:
1. **Behavioral Layer Overlay:** Merge Asset Inventory (P0.5, P1.5 files) into the architecture map as a distinct "Behavioral Module" layer.
2. **Diagram:** Generate a Mermaid.js diagram showing BOTH technical modules AND behavioral assets (≥ 3 nodes required).
3. **Classify Repo Type:** One of: `agent-framework`, `prompt-collection`, `workflow-engine`, `ui-library`, `backend-api`, `monorepo`, `full-stack`, `hybrid-agent`, `cli-tool`.

### PHASE 3: DISSECT (Dual-Layer Graph-Directed Deep Reading)
**Goal:** Extract core logic AND behavioral intelligence without wasting tokens on boilerplate.

#### Tech Layer (Code Reading)
**If CGC available:** Read files ordered by Hub Node rank (highest connectivity first).
**If CGC unavailable:** Read files in static priority order:
- **P0 [Core Logic]:** Business rules, state machines, controllers.
- **P1 [Integration]:** API routes, event handlers, hooks.
- **P2 [Configuration]:** Env setups, feature flags, constants.
- **P3 [Tests]:** `*.test.ts`, `test_*.py` (Documentation by example).
- **P5 [Build/Deploy]:** Dockerfile, CI/CD, scripts.

**Reading Strategy:**
- **< 100 lines:** Read entirely.
- **100-500 lines:** Read entirely, focus on key patterns.
- **> 500 lines:** Use `grep_search` to find symbols first, then read targeted sections.
- **> 1000 lines:** MUST NOT read entirely. Structural search only.

#### Behavioral Layer (Prompt & Workflow Extraction) — NEW
Read in this strict order:
- **P0.5 [Linked Behavioral Assets]:** Read ALL files entirely. These are the "soul" of the repo.
- **P1.5 [Dynamically Linked Assets]:** Read ALL files entirely. Likely important.
- **P4 [Orphan Assets]:** Read only the first 50 lines. Skip if clearly irrelevant (CHANGELOG, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT).

**Behavioral Extraction Requirements:**
For EACH Behavioral Asset, extract and document:
| Field | Description |
|-------|-------------|
| **Role/Persona** | What identity does this prompt/workflow assume? |
| **System Prompt** | The core instruction set. |
| **Tool Usage Pattern** | Which tools/APIs does it invoke? |
| **Workflow Steps** | Sequential execution logic. |
| **Decision Logic** | Branching, routing, or conditional behavior. |
| **Guard Rails** | Safety constraints, limits, boundaries. |

#### Anti-Patterns (DO NOT READ):
- ❌ Compiled/transpiled code (`dist/`, `build/`, `.min.js`).
- ❌ Dependencies (`node_modules/`, `vendor/`).
- ❌ Binaries, images, lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`).
- ❌ Auto-generated files (`*.schema.json`, `*codegen*`, `*.generated.*`, `openapi.json` > 1000 lines).

*Output Requirement:* Document ≥ 5 core patterns total across BOTH layers (Where, What, How, Why, Edge Cases for Tech; Role, Prompt, Workflow for Behavioral).

### PHASE 4: DOCUMENT (Generate DNA — Single Source of Truth)
**Goal:** Save the extracted knowledge into a permanent format with NO duplication.

1. Use the I-Wish 11-section template (Story RAP-1.3).
2. **Flexible Template Rules:**
   - You MUST address all 11 sections.
   - If a section is genuinely N/A for the repo type (e.g., "Database Schema" for a prompt-only repo), write: `N/A — [Reason]. Repo classified as [{repo-type}].`
   - **Section 10 (Reusable Patterns) is MANDATORY** and MUST include Behavioral Patterns (Prompts, Personas, Workflows, Decision Logic) if they were extracted in Phase 3.
   - DO NOT fabricate content for irrelevant sections. Honesty > Completeness.

3. **Save Output (Runtime Symlink Strategy — Single Source of Truth):**
   ```bash
   # Step 1: Save runtime source of truth
   mkdir -p ${IWISH_HOME}/repo-dna/
   # Write DNA content to: ${IWISH_HOME}/repo-dna/{repo-name}-dna.md
   
   # Step 2: Create symlink in sandbox (NOT a copy)
   ln -sf ${IWISH_HOME}/repo-dna/{repo-name}-dna.md ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md
   
   # Step 3: Verify symlink
   ls -la ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md
   # Expected: repo-dna.md -> ${IWISH_HOME}/repo-dna/{repo-name}-dna.md
   ```
   - ⚠️ **NEVER** create a second independent copy. The sandbox path MUST be a symlink.
   - Copy into `_iwish-output/repo-dna/` only when the DNA is explicitly promoted into the canonical repo.

### PHASE 5: COMPARE & CONTRAST (Gap & Comparison Matrix)
**Goal:** Perform an objective gap analysis and comparison between the external codebase/behavioral assets and I-Wish's existing resources.

1. **Anti-Sycophancy Review:** Load `.agent/fragments/anti-sycophancy-guard.md` to establish constructive skepticism. Identify at least 3 architectural risks or "bloat" patterns in the external repository.
2. **Feature Categorization:** Group the target repository's files and features into logical functional groups (e.g., *Tooling Skills*, *Custom Rules/Checklists*, *Coordination Workflows*, *Installer/Sync Scripts*, *Utility Modules*).
3. **Safety Isolation Check:** Proactively inspect files (e.g., `install.sh`, `sync-skills.sh`, Python/JS installation hooks) for script patterns that write to paths outside the current project workspace (e.g., global paths like `$HOME/.claude/` or system bin paths). If found, automatically classify these groups as `SKIP` to enforce strict project isolation.
4. **Comparison Matrix Structure:** Generate a structured bilingual (Vietnamese/English) comparison matrix saved as `${IWISH_HOME}/gap-analysis/{repo-name}-comparison.md`. The matrix MUST follow a strict 5-column table format:
   - **Nhóm Tính năng / Feature Group**: Logical categorized component/module.
   - **Ưu điểm / Pros**: Unique strengths, optimizations, or capabilities.
   - **Nhược điểm / Cons**: Weaknesses, token overhead, maintenance cost, or limitations.
   - **Khoảng cách & Trùng lặp / Gap & Overlaps**: Precise overlap or delta compared to existing I-Wish assets.
   - **Phương án & Nơi tích hợp / Proposed Action & Target**: Action track (`ADOPT` | `MERGE` | `REPLACE` | `SKIP`) and Target type (`SYSTEM_SKILL` | `USER_SPACE` | `SKIP`).
5. **Actionable Integration Spec:** For all feature groups marked as `ADOPT` or `MERGE` into `SYSTEM_SKILL`, define:
   - Specific destination directories under `.agent/` (e.g., `.agent/skills/white-hacker/rules/`).
   - Standardization rules for YAML frontmatter schema to match I-Wish:
     ```yaml
     name: name-of-skill
     description: Clear role/purpose
     inputs: [input_vars]
     outputs: [output_vars]
     mcp_tools_required: [mcp_tools]
     subagent_triggers: [triggers]
     ```
   - Invocation and routing mechanisms (RAG-injecting, loading dynamically via `load_skill`, or triggering via subagent rules).
6. **Save Output:**
   - Save the Comparison Report to `${IWISH_HOME}/gap-analysis/{repo-name}-comparison.md`.
   - Create a symlink in the absorbed repo directory: `ln -sf ${IWISH_HOME}/gap-analysis/{repo-name}-comparison.md ${IWISH_HOME}/absorbed-repos/{repo-name}/comparison.md`.

## 🏁 COMPLETION CRITERIA
The skill is successfully executed when:
1. `repomix` context has been generated (Phase 1).
2. Asset Inventory with labels has been produced (Phase 1.5).
3. An architecture map and Mermaid diagram have been created, including Behavioral overlay (Phase 2).
4. At least 5 core patterns have been identified across Tech + Behavioral layers (Phase 3).
5. `{repo-name}-dna.md` has been written to `${IWISH_HOME}/repo-dna/` with a verified symlink in sandbox (Phase 4).
6. `{repo-name}-comparison.md` has been written to `${IWISH_HOME}/gap-analysis/` with a verified symlink in the absorbed repo directory (Phase 5) following the strict 5-column bilingual matrix and containing the integration plan.
