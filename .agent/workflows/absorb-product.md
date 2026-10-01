# 🌀 `/absorb-product` Reverse Engineering Workflow

## 📌 OVERVIEW
This workflow is the orchestrator for extracting Open Source Toolsets, Products, or Operating Systems into standard I-Wish libraries. It is designed to "reverse-engineer" a foreign codebase into standard I-Wish project artifacts (Feature Graphs, Project Planning, Architecture, Tactical Insights), avoiding context overload via Progressive Disclosure and Top-Down analysis.

**Usage:** `/absorb-product https://github.com/owner/repo-name`

---

## 🚦 INITIALIZATION
1. **Validate Input:** Ensure the URL is a valid GitHub repository link.
2. **Extract Name:** Extract `{repo-name}` from the URL.
3. **Set Runtime Home:** 
   - Ensure the library directory exists: `_iwish-output/libraries/{repo-name}/`
   - Setup subdirectories:
     - `1. Project Planning/`
     - `2. Architecture & Graphs/`
     - `3. Tactical Insights/`
     - `4. Extraction & Upgrades/`
4. **State Recovery:** Check `_iwish-output/libraries/{repo-name}/` for existing artifacts to resume if needed.

---

## 🛠️ THE 5-PHASE PIPELINE

### Phase 1: INGESTION & ISOLATION 📦 (Agent: devops-agent / review-agent)
- **Action:** Safely clone and filter the target repository.
- **Steps:**
  1. `git clone --depth=1 {url} _iwish-output/adhoc-workspace/{repo-name}/`
  2. Invoke `magika-binary-filter` to aggressively filter binaries, `.git`, `vendor/`, `node_modules/`, and heavy static assets.
- **Output:** A clean, token-efficient source directory ready for AST scanning.

### Phase 2: STRUCTURAL GRAPHING 🕸️ (Agent: architect-agent)
- **Action:** Perform Bottom-up analysis using CodeGraphContext (CGC).
- **Steps:**
  1. Execute `/analyze-codebase` on the cloned directory to build a robust AST/Dependency graph.
  2. Document module inter-dependencies and database schema (if detected).
  3. Perform Codebase Health Analysis (complexity, coverage, tight coupling).
- **Output:** 
  - `_iwish-output/libraries/{repo-name}/2. Architecture & Graphs/codebase-graph.md`
  - `_iwish-output/libraries/{repo-name}/2. Architecture & Graphs/knowledge-graph.md`
  - `_iwish-output/libraries/{repo-name}/2. Architecture & Graphs/codebase-health-report.md`

### Phase 3: PRODUCT REVERSE ENGINEERING 🧩 (Agent: pm-agent / analyst-agent)
- **Action:** Perform Top-down analysis to extract User Flows, Features, and Design Specs.
- **Steps:**
  1. From entry points (e.g., API Routes, Frontend UI, CLI commands), reverse engineer the core Use Cases.
  2. Structure the product into Features, Epics, and Stories (hypothetical, mapped to their implementation).
  3. Extract and formalize the UI/UX flows and Design Tokens into I-Wish standard specifications.
  4. Generate a Markdown hierarchy and a Mermaid Feature Graph to map features together.
- **Output:** 
  - `_iwish-output/libraries/{repo-name}/1. Project Planning/tech-stack.md`
  - `_iwish-output/libraries/{repo-name}/1. Project Planning/feature-list.md`
  - `_iwish-output/libraries/{repo-name}/1. Project Planning/feature-hierarchy.md`
  - `_iwish-output/libraries/{repo-name}/1. Project Planning/feature-graph.md`
  - `_iwish-output/libraries/{repo-name}/1. Project Planning/ui-spec.md`
  - `_iwish-output/libraries/{repo-name}/1. Project Planning/DESIGN.md`

### Phase 4: TACTICAL DEEP-DIVE 🔬 (Agent: dev-agent / architect-agent)
- **Action:** Deep-dive into specific engineering implementations.
- **Steps:**
  1. Identify how the repository handles difficult problems (e.g., caching, DB performance, WebSocket scaling).
  2. Extract Edge-Case handling patterns.
  3. Document Development, CI/CD, and Deployment tactics.
- **Output:** 
  - `_iwish-output/libraries/{repo-name}/3. Tactical Insights/use-case-solutions.md`
  - `_iwish-output/libraries/{repo-name}/3. Tactical Insights/constraint-edge-case-tactics.md`
  - `_iwish-output/libraries/{repo-name}/3. Tactical Insights/dev-deployment-tactics.md`

### Phase 5: SYNTHESIS & EXTRACTION 💎 (Agent: capability-agent / orch-agent)
- **Action:** Synthesize findings into reusable I-Wish assets.
- **Steps:**
  1. Aggregate the most critical lessons from the repository.
  2. Identify specific functions, tactics, or modules that can be packaged into **new Skills or Workflows** for I-Wish.
- **Output:** 
  - `_iwish-output/libraries/{repo-name}/4. Extraction & Upgrades/key-learnings.md`
  - `_iwish-output/libraries/{repo-name}/4. Extraction & Upgrades/potential-skills.md`

---
## 🏁 COMPLETION
- Display a summary of the newly created Library to the user.
- Recommend running `/create-skill` on any items identified in `potential-skills.md`.
