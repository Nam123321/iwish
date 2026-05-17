---
name: absorb-repo
description: "Orchestrator workflow for the Repo Absorption Protocol (RAP). Drives a 9-phase pipeline to deep-learn, analyze, and integrate external repositories into BMAD with human-in-the-loop checkpoints."
---

# 🌀 `/absorb-repo` Orchestrator Workflow

## 📌 OVERVIEW
This workflow is the master orchestrator for the **Repo Absorption Protocol (RAP)**. It seamlessly connects security auditing, knowledge extraction, and intelligent integration into a 9-phase pipeline.

**Usage:** `/absorb-repo https://github.com/owner/repo-name`

---

## 🚦 INITIALIZATION
1. **Validate Input:** Ensure the URL is a valid GitHub repository link.
2. **Extract Name:** Extract `{repo-name}` from the URL.
3. **Set Runtime Home:** Use `BMAD_HOME=${BMAD_HOME:-~/.bmad-dragonball}`. Runtime artifacts MUST stay under `${BMAD_HOME}` until explicitly promoted.
4. **Prepare Runtime Directories:** Ensure `${BMAD_HOME}/sandbox/`, `${BMAD_HOME}/absorbed-repos/{repo-name}/`, `${BMAD_HOME}/repo-dna/`, `${BMAD_HOME}/gap-analysis/`, and `${BMAD_HOME}/generated-skills/` exist.
5. **State Recovery:** Check `${BMAD_HOME}/absorbed-repos/{repo-name}/` for existing artifacts. If found, ASK the user: *"Artifacts detected. Resume from the last completed phase or restart pipeline?"*
6. **Setup:** If restarting or fresh, create directory `${BMAD_HOME}/sandbox/{repo-name}/`.

---

## 🛠️ THE 9-PHASE PIPELINE

### Phase 0: SECURITY GUARDIAN 🛡️ (Agent: Hit)
- **Action:** Invoke `.agent/skills/security-guardian/SKILL.md`.
- **Steps:**
  1. L1 Trust Signal (remote GitHub check).
  2. `git clone --depth=1 {url} ${BMAD_HOME}/sandbox/{repo-name}/` (Phase 0.5 - Clone).
  3. Run L2 (Secret Scan), L3 (Dependency Audit), and L4 (Behavioral Analysis).
- **Gate:** If L2 or L4 fails → **BLOCK**. User override is required to proceed.
- **Output:** `${BMAD_HOME}/absorbed-repos/{repo-name}/security-report.md`.

### Phase 1: INGEST 📦 (Agent: Whis)
- **Action:** Invoke Phase 1 of `repo-absorption` skill.
- **Steps:** Generate `.repomixignore` and run `repomix` to pack the repository into an AI-friendly format.
- **Gate:** Output must exist. If > 2MB, emit WARNING for token limits.
- **Output:** `${BMAD_HOME}/absorbed-repos/{repo-name}/context.md`.

### Phase 1.5: INDEXING 🕸️ (Agent: Piccolo) — NEW
- **Action:** Build a unified Knowledge Graph from the cloned repo using Dual-Indexer Strategy.
- **Steps:**
  1. **Tech Graph (Primary):** Execute `/analyze-codebase` on `${BMAD_HOME}/sandbox/{repo-name}/` to generate CodeGraphContext (CGC) via AST/Tree-sitter.
  2. **AST-to-Asset Tracing:** Instruct CGC to identify all File-System Read calls (`fs.readFileSync`, `open()`, `path.join()` + `readFile`, `load()`, `require()` for non-code assets) within the AST. For each call, create an Edge: `[source_code_file] -READS-> [target_text_file]`.
  3. **Hybrid Resolution Algorithm (3-Layer Label Assignment):**
     - **Layer 1 — Static Tracing:** If AST resolves a hardcoded path to a `.md`, `.txt`, `.prompt`, `.yaml` file → Label target as `[P0.5 - Linked Behavioral Asset]`.
     - **Layer 2 — Fuzzy Tracing:** For any `.md` / `.prompt` / `.yaml` files NOT linked by Layer 1:
       - Run `grep_search` across ALL code files for the file's basename as a string literal.
       - **Path-based Heuristics (Anti-Collision):** If `grep` finds multiple matches for the same basename (e.g., `system_prompt.md` exists in 3 folders), resolve by selecting the match with the shortest Directory Distance from the calling file.
       - If matched → Label as `[P1.5 - Dynamically Linked Asset]`.
     - **Layer 3 — Orphan Isolation:** Files with NO link from Layer 1 or 2 → Label as `[P4 - Orphan Asset]`.
  4. **Token Overflow Guard:** If the total number of Behavioral Assets (P0.5 + P1.5 + P4) exceeds **50 files**, apply triage:
     - Keep ALL `P0.5` files (must-read).
     - Keep ALL `P1.5` files (likely important).
     - From `P4` (Orphan), keep ONLY files in root-level directories or files > 500 bytes. Discard the rest.
     - If still > 50, sort by file size descending and keep only top 50.
- **Fallback (CGC Failure):** If `analyze-codebase` fails (FalkorDB offline, unsupported language, Tree-sitter error):
  1. Emit WARNING: "CGC indexing failed. Falling back to Heuristic Scan."
  2. Execute Directory Scan: `tree -L 3 -I 'node_modules|.git|dist|build'`.
  3. Execute Heuristic Feature Scan:
     - Scan `package.json` scripts, `Makefile` targets, `docker-compose.yml` services.
     - Search for behavioral directories: `prompts/`, `skills/`, `workflows/`, `agents/`, `commands/`, `personas/`, `roles/`.
     - Scan CLI entry points: files matching `cli.ts`, `cli.py`, files with `argparse`, `commander`, `yargs`.
  4. All `.md`/`.prompt` files found in behavioral directories → Label as `[P0.5 - Linked Behavioral Asset]`.
- **Gate:** At least 1 indexing method (CGC or Heuristic) must complete. Asset inventory must be generated.
- **Output:** Asset Inventory with labels (`P0.5`, `P1.5`, `P4`) saved to `${BMAD_HOME}/absorbed-repos/{repo-name}/asset-inventory.md`.

### Phase 2: MAP 🗺️ (Agent: Piccolo) — UPGRADED
- **Action:** Invoke Phase 2 of `repo-absorption` skill. Now **Graph-Directed**.
- **Steps:**
  1. **If CGC succeeded:** Query the Knowledge Graph for:
     - Entry Points (nodes with high in-degree or marked as `main`/`bin`).
     - Module Boundaries (connected components / clusters).
     - Hub Nodes (top 10 nodes by PageRank or connectivity).
     - **Compound Detection:** If the graph contains ≥ 3 disconnected clusters → classify as Compound Repo.
  2. **If CGC failed (Heuristic mode):** Use traditional directory scan + entry point identification from Phase 1.5 fallback data.
  3. **Behavioral Layer Overlay:** Merge the Asset Inventory (P0.5, P1.5 files) into the architecture map as a separate "Behavioral Module" layer.
  4. **Diagram:** Generate a Mermaid.js diagram showing BOTH technical modules AND behavioral assets. Must include ≥ 3 nodes.
  5. **Classify:** Determine the repo type. Now includes: `agent-framework`, `prompt-collection`, `workflow-engine`, `ui-library`, `backend-api`, `monorepo`, `full-stack`, `hybrid-agent`.
- **Gate:** At least 3 modules identified. Mermaid diagram generated. Asset Inventory merged.
- **Output:** Architecture Blueprint section prepared.

### Phase 3: DISSECT 🔬 (Agent: Whis) — UPGRADED
- **Action:** Invoke Phase 3 of `repo-absorption` skill. Now **Dual-Layer + Graph-Directed**.
- **Steps:**
  1. **Tech Layer (Graph-Directed Deep Reading):**
     - If CGC available: Read files ordered by Hub Node rank (highest connectivity first).
     - If CGC unavailable: Fall back to static priority order (P0→P5).
  2. **Behavioral Layer (Prompt & Workflow Extraction):**
     - Read ALL `[P0.5 - Linked Behavioral Asset]` files entirely (these are the "soul" of AI repos).
     - Read ALL `[P1.5 - Dynamically Linked Asset]` files entirely.
     - For `[P4 - Orphan Asset]` files: Read only the first 50 lines to determine relevance. Skip if clearly irrelevant (changelog, license, contributing guide).
  3. **Extraction Requirements:**
     - For each Behavioral Asset, extract: **Role/Persona**, **System Prompt**, **Tool Usage Pattern**, **Workflow Steps**, **Decision Logic**.
     - For each Tech module, extract: **Where, What, How, Why, Edge Cases** (existing requirement).
- **Gate:** At least 5 core patterns documented across BOTH layers combined.
- **Output:** Core Logic Patterns + Behavioral Patterns sections prepared.

### Phase 4: DOCUMENT 📑 (Agent: Whis) — UPGRADED
- **Action:** Invoke Phase 4 of `repo-absorption` skill using `repo-dna-template.md`.
- **Steps:**
  1. Compile all findings into the 11-section template.
  2. **Flexible Template Rules:**
     - All 11 sections must be addressed.
     - If a section is genuinely N/A for the repo type (e.g., "Database Schema" for a prompt-only repo), write `N/A — [Reason]. Repo classified as [type].`
     - Section 10 (Reusable Patterns) MUST include Behavioral Patterns (Prompts, Personas, Workflows) if they exist.
  3. **Single Source of Truth (Symlink):**
     - Save the runtime source of truth to: `${BMAD_HOME}/repo-dna/{repo-name}-dna.md`
     - Create a symlink in sandbox: `ln -s ${BMAD_HOME}/repo-dna/{repo-name}-dna.md ${BMAD_HOME}/sandbox/{repo-name}/repo-dna.md`
     - **DO NOT** create a second copy. The sandbox path is a symlink only. Copy into `_bmad-output/repo-dna/` only after explicit promotion.
- **Gate:** All 11 sections addressed (no empty sections). Symlink verified with `ls -la`.
- **Output:** Single runtime `{repo-name}-dna.md` at `${BMAD_HOME}/repo-dna/` with symlink in sandbox.

### Phase 5: COMPARE ⚖️ (Agent: Piccolo)
- **Action:** Gap Analysis against existing BMAD assets.
- **Pre-requisite:** Invoke `.agent/fragments/anti-sycophancy-guard.md` to perform an adversarial review of the generated DNA.
- **Steps:**
  1. Load Section 10 of the generated DNA (Reusable Patterns).
  2. **Adversarial Stress-Test:** Identify at least 3 architectural risks or "bloat" patterns that should NOT be absorbed.
  3. Scan BMAD `.agent/` directories for overlapping functionality.
  3. **Compound Check:** Determine if the repo contains >3 independent modules (e.g., a monorepo).
  4. Formulate decisions: `ADOPT` (new), `MERGE` (improve existing), `REPLACE` (superior repo pattern), `SKIP` (irrelevant).
- **Output:** `${BMAD_HOME}/gap-analysis/{repo-name}-gap-analysis.md` and an index entry in `${BMAD_HOME}/absorbed-repos/{repo-name}/`.
- 🛑 **HUMAN CHECKPOINT 1:** Present `gap-analysis.md` to user.
  - **Wait for Input:** User must [Approve All], [Edit specific], [Reject All], or [Abort].
  - *If Compound detected:* Explicitly ask user if they want to integrate as a `BUNDLE` or selectively extract modules.

### Phase 6: INTEGRATE & CLASSIFY ⚙️ (Agent: Vegeta)
- **Action:** Implement approved suggestions and establish Routing Triggers.
- **Steps:**
  1. **Classify:** For each approved module, assign one of 4 types:
     - `SKILL_ATTACHMENT`: Small utility.
     - `DEDICATED_WORKFLOW`: Multi-step process.
     - `NEW_PERSONA`: Massive paradigm/domain.
     - `COMPOUND_INTEGRATION`: Multiple skills/workflows (The Librarian Pattern).
  2. **Create Draft Assets:** Generate the corresponding `.md` files under `${BMAD_HOME}/generated-skills/{id}/`, `${BMAD_HOME}/generated-workflows/{id}/`, or `${BMAD_HOME}/generated-agents/{id}/` with `metadata.yaml` status `draft`.
  3. **Inject Triggers:**
     - If `SKILL`: Inject trigger into Host Agent's profile.
     - If `WORKFLOW`: Inject trigger into `bmad-bmm-router.md`.
     - If `PERSONA` or `COMPOUND`: Spawn a `[Repo]-Specialist` and inject into `/summon` list.
- 🛑 **HUMAN CHECKPOINT 2 (Iterative):** For *each* implementation change and trigger injection, present the diff/code to the user.
  - **Wait for Input:** User must approve or skip *each* change independently.
- **Output:** Approved draft assets and proposed promotion diffs. Do not write into canonical `.agent/` paths until the user approves each promotion.

### Phase 7: VALIDATE 🧠 (Agent: Hit)
- **Action:** The Understanding Gate. Verify the agent actually comprehends the repo.
- **Steps:** Answer the following 5 questions based on the DNA and Context:
  1. What problem does this repo solve?
  2. How does the core logic work? (Execution flow)
  3. What is the state management pattern? (Data flow)
  4. What edge cases exist and how are they handled?
  5. Why did the author choose this approach? (Trade-offs)
- **Scoring:** Mark each as PASS (correct), PARTIAL (incomplete), FAIL (wrong).
- 🛑 **HUMAN CHECKPOINT 3:** Present the Q&A and scores to the user for validation.
  - **Gate:** Must score ≥ 4 PASS and ≤ 1 PARTIAL.
  - If Failed → HALT and recommend looping back to Phase 3 (DISSECT) to fill knowledge gaps.
- **Output:** `${BMAD_HOME}/absorbed-repos/{repo-name}/validation-report.md`.

---

## 🚫 ERROR HANDLING & GATES
- If any phase gate fails, **HALT** the workflow immediately. State the reason and offer remediation steps.
- **DO NOT** auto-proceed past any `HUMAN CHECKPOINT`. You must wait for explicit user approval.
