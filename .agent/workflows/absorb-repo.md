---
name: absorb-repo
description: Orchestrator workflow for the Repo Absorption Protocol (RAP).
  Drives a 9-phase pipeline to deep-learn, analyze, and integrate external
  repositories into I-Wish with human-in-the-loop checkpoints.
---

# 🌀 `/absorb-repo` Orchestrator Workflow

## 📌 OVERVIEW
This workflow is the master orchestrator for the **Repo Absorption Protocol (RAP)**. It seamlessly connects security auditing, knowledge extraction, and intelligent integration into a 9-phase pipeline.

**Usage:** `/absorb-repo https://github.com/owner/repo-name`

---

## 🚦 INITIALIZATION
1. **Validate Input:** Ensure the URL is a valid GitHub repository link.
2. **Extract Name:** Extract `{repo-name}` from the URL.
3. **Set Runtime Home:** Use `IWISH_HOME=${IWISH_HOME:-~/.iwish}`. Runtime artifacts MUST stay under `${IWISH_HOME}` until explicitly promoted.
4. **Prepare Runtime Directories:** Ensure `${IWISH_HOME}/sandbox/`, `${IWISH_HOME}/absorbed-repos/{repo-name}/`, `${IWISH_HOME}/repo-dna/`, `${IWISH_HOME}/gap-analysis/`, and `${IWISH_HOME}/generated-skills/` exist.
5. **State Recovery:** Check `${IWISH_HOME}/absorbed-repos/{repo-name}/` for existing artifacts. If found, ASK the user: *"Artifacts detected. Resume from the last completed phase or restart pipeline?"*
6. **Setup:** If restarting or fresh, create directory `${IWISH_HOME}/sandbox/{repo-name}/`.

---

## 🛠️ THE 9-PHASE PIPELINE

### Phase 0: SECURITY GUARDIAN 🛡️ (Agent: review-agent)
- **Action:** Invoke `.agent/skills/security-guardian/SKILL.md`.
- **Steps:**
  1. L1 Trust Signal (remote GitHub check).
  2. `git clone --depth=1 {url} ${IWISH_HOME}/sandbox/{repo-name}/` (Phase 0.5 - Clone).
  3. Run L2 (Secret Scan), L3 (Dependency Audit), and L4 (Behavioral Analysis).
- **Gate:** If L2 or L4 fails → **BLOCK**. User override is required to proceed.
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/security-report.md`.

### Phase 1: INGEST 📦 (Agent: capability-agent)
- **Action:** Invoke Phase 1 of `repo-absorption` skill.
- **Steps:** 
  1. Generate `.repomixignore`.
  2. Invoke `bash .agent/skills/magika-binary-filter/scripts/magika-filter.sh ${IWISH_HOME}/sandbox/{repo-name} ${IWISH_HOME}/sandbox/{repo-name}/.repomixignore` to automatically filter and block binary files.
  3. Run `repomix` to pack the repository into an AI-friendly format.
- **Gate:** Output must exist. If > 2MB, emit WARNING for token limits.
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/context.md`.

### Phase 1.5: INDEXING 🕸️ (Agent: architect-agent) — NEW
- **Action:** Build a unified Knowledge Graph from the cloned repo using Dual-Indexer Strategy.
- **Steps:**
  1. **Tech Graph (Primary):** Execute `/analyze-codebase` on `${IWISH_HOME}/sandbox/{repo-name}/` to generate CodeGraphContext (CGC) via AST/Tree-sitter.
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
- **Output:** Asset Inventory with labels (`P0.5`, `P1.5`, `P4`) saved to `${IWISH_HOME}/absorbed-repos/{repo-name}/asset-inventory.md`.

### Phase 2: MAP 🗺️ (Agent: architect-agent) — UPGRADED
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
- **Gate:** At least 3 modules identified. Mermaid diagram generated. Asset Inventory merged### Phase 3: DISSECT 🔬 (Agent: capability-agent) — UPGRADED
- **Action:** Invoke Phase 3 of `repo-absorption` skill. Now **Dual-Layer + Graph-Directed**.
- **Steps:**
  1. **Tech Layer (Graph-Directed Deep Reading):**
     - If CGC available: Read files ordered by Hub Node rank (highest connectivity first).
     - If CGC unavailable: Fall back to static priority order (P0→P5).
  2. **Behavioral Layer (Prompt & Workflow Extraction):**
     - Read ALL `[P0.5 - Linked Behavioral Asset]` files entirely (these are the "soul" of AI repos).
     - Read ALL `[P1.5 - Dynamically Linked Asset]` files entirely.
     - For `[P4 - Orphan Asset]` files: Read only the first 50 lines to determine relevance. Skip if clearly irrelevant (changelog, license, contributing guide).
  3. **Extraction & Zoom-in Requirements:**
     - For prompt-only or hybrid repositories, the agent must read the *full content* of all primary rules and prompts and construct a **Granular Zoom-in Audit** mapping *each* core component/skill to its design pros/cons, edge cases, and exact implementation details.
     - For each Behavioral Asset, extract: **Role/Persona**, **System Prompt**, **Tool Usage Pattern**, **Workflow Steps**, **Decision Logic**.
     - For each Tech module, extract: **Where, What, How, Why, Edge Cases** (existing requirement).
- **Gate:** At least 5 core patterns documented across BOTH layers combined.
- **Output:** Core Logic Patterns + Behavioral Patterns sections prepared.

### Phase 4: DOCUMENT 📑 (Agent: capability-agent) — UPGRADED
- **Action:** Invoke Phase 4 of `repo-absorption` skill using `repo-dna-template.md`.
- **Steps:**
  1. Compile all findings into the 11-section template.
  2. **Flexible Template Rules:**
     - All 11 sections must be addressed.
     - If a section is genuinely N/A for the repo type (e.g., "Database Schema" for a prompt-only repo), write `N/A — [Reason]. Repo classified as [type].`
     - Section 10 (Reusable Patterns) MUST include Behavioral Patterns (Prompts, Personas, Workflows) if they exist.
  3. **Single Source of Truth (Symlink):**
     - Save the runtime source of truth to: `${IWISH_HOME}/repo-dna/{repo-name}-dna.md`
     - Create a symlink in sandbox: `ln -s ${IWISH_HOME}/repo-dna/{repo-name}-dna.md ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md`
     - **DO NOT** create a second copy. The sandbox path is a symlink only. Copy into `_iwish-output/repo-dna/` only after explicit promotion.
- **Gate:** All 11 sections addressed (no empty sections). Symlink verified with `ls -la`.
- **Output:** Single runtime `{repo-name}-dna.md` at `${IWISH_HOME}/repo-dna/` with symlink in sandbox.

### Phase 4.5: COMMUNITY AUDIT & RECENT UPDATES 🌐 (Agent: research-agent / analyst-agent) — UPGRADED
- **Action:** Research and collect empirical user feedback (praises, criticisms, suggestions), structured release history analysis, GitHub comment quality metrics, and repository health signals to provide real-world context on the repository.
- **Steps:**
  1. **Web Search & Issue Scan:**
     - Query search engines, developer forums, and social spaces for real user feedback: `{repo-name} feedback`, `{repo-name} pros cons`, `{repo-name} issues`.
     - Scan the repository's GitHub Issues, Discussions, and Pull Requests from the past 3-6 months.
     - **Vulnerability & Regression Sweep:** Specifically search for security vulnerability reports, regression reports, and design debates. If any critical issues are found, the agent must cross-reference them with the cloned codebase and explain the technical root cause in the report.
     - Extract community discussions and sentiment trends.
  2. **Release History & Changelog Analysis (NEW):**
     - **Fetch all tags/releases** via GitHub API: `https://api.github.com/repos/{owner}/{repo}/releases` and `https://api.github.com/repos/{owner}/{repo}/tags`.
     - **Build Release Timeline Table** with columns: Version, Date, Type (Major/Minor/Patch/Pre-release), Highlights, Breaking Changes.
     - **Analyze Versioning Strategy:** Is the repo following SemVer? Are there frequent breaking changes? What is the average release cadence (days between releases)?
     - **Identify Deprecations & Migration Patterns:** Scan release notes and CHANGELOG.md (if exists) for deprecated features, migration guides, and upgrade paths.
     - **Assess Stability:** Calculate the ratio of major vs patch releases. High major-release frequency signals instability.
     - **Output:** A structured "Release History" section in the report with the timeline table and analysis.
  3. **GitHub Comment & Engagement Analysis (NEW):**
     - **Issue Response Time:** Sample the 20 most recent Issues. For each, measure time from creation to first maintainer response. Calculate median response time.
     - **Comment Quality Metrics:**
       - Average comments per Issue/PR (engagement depth).
       - Ratio of maintainer comments vs community comments (maintainer involvement).
       - Presence of structured responses (code snippets, reproduction steps, workarounds) vs. one-liners.
     - **PR Review Quality:** Sample 10 recent merged PRs. Assess:
       - Review depth (inline comments, change requests, approval patterns).
       - Time from PR open to merge (velocity).
       - Number of reviewers per PR.
     - **Discussion Health:** If GitHub Discussions is enabled, scan for:
       - Unanswered questions (stale discussions).
       - Most discussed topics (feature requests vs. bugs vs. how-to).
     - **Output:** A structured "Comment & Engagement Analysis" section with metrics table.
  4. **Repository Health Signals (NEW):**
     - **Commit Frequency:** Fetch commit activity via `https://api.github.com/repos/{owner}/{repo}/stats/commit_activity`. Calculate weekly average commits over past 3 months.
     - **Contributor Diversity:** Fetch contributors via `https://api.github.com/repos/{owner}/{repo}/contributors`. Calculate:
       - Total contributor count.
       - **Bus Factor:** Number of contributors responsible for ≥80% of commits. Bus factor = 1 is HIGH RISK.
       - Active contributors (committed in past 3 months) vs. total.
     - **Stale Ratio:** Calculate `stale_issues / total_open_issues` and `stale_prs / total_open_prs` (stale = no activity for >30 days).
     - **Star/Fork Trend:** Compare current stars/forks with GitHub traffic data if available. Note if growth is accelerating, flat, or declining.
     - **Health Verdict:**
       - 🟢 **Healthy**: Weekly commits >3, bus factor >2, median response <48h, stale ratio <30%
       - 🟡 **Moderate**: Weekly commits 1-3, bus factor 1-2, median response 48h-7d, stale ratio 30-60%
       - 🔴 **At Risk**: Weekly commits <1, bus factor 1, median response >7d, stale ratio >60%
     - **Output:** A structured "Repository Health Signals" section with the verdict and metrics.
  5. **Deep Dive on Praises (Pros):**
     - For features/mechanisms users highly praise: deep dive into the code and architecture blueprints to identify *why* it works well and how it benefits the users.
  6. **Contrast on Criticisms (Cons):**
     - For user complaints, bugs, and performance bottlenecks: cross-reference and match them with our technical analysis from Phase 3 & 4. Verify if technical findings match community pain points, and identify hidden risks/limitations.
  7. **Evaluate Recent Developments (from Release History):**
     - Cross-reference the Release Timeline (Step 2) with the community feedback (Steps 5-6).
     - Detail what was recently added in the last 3-6 months and *why* these updates were introduced (what roles they play).
     - Assess if the system should deeply research these new enhancements, and if they fit within I-Wish design principles.
- **Gate:** ALL of the following must be documented:
  - Release History Timeline Table (≥3 entries or explicit "No releases found" with tag analysis)
  - Comment & Engagement Metrics (with at least median response time and PR review depth)
  - Repository Health Verdict (🟢/🟡/🔴 with supporting data)
  - Praises with code deep-dive
  - Criticisms with technical cross-reference
  - Source links for all claims
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/community-report.md`.

### Phase 5: COMPARE & CONTRAST ⚖️ (Agent: architect-agent)
- **Action:** Gap Analysis and Comparison Matrix against existing I-Wish assets.
- **Pre-requisite:** Invoke `.agent/fragments/anti-sycophancy-guard.md` to perform an adversarial review of the generated DNA. Also, load the **Community Audit Report** from `${IWISH_HOME}/absorbed-repos/{repo-name}/community-report.md` as contextual input for praises and criticisms.
- **Steps:**
  1. Load Section 10 of the generated DNA (Reusable Patterns).
  2. **Synthesize Operational DNA:** Deeply analyze Section 10 to extract the core **Operational & Execution Mechanisms** of the target repository:
     - **Orchestration / Coordination Model**: How tasks/agents are orchestrated (e.g., sequential scripts, multi-agent coordination, event-driven loops).
     - **Skill Invocation / Prompt Loading**: How prompts and tools are resolved, parsed, and loaded into execution context.
     - **State & Context Management**: How variables, execution state, and agent memory are persisted and transferred across steps.
  3. **Adversarial Stress-Test:** Identify at least 3 architectural risks or "bloat" patterns that should NOT be absorbed. Enforce the **Anti-Sycophancy Guard** and document at least **three (3) Pushback Questions** targeting the design of the target repository.
  4. Scan I-Wish `.agent/` directories for overlapping functionality.
  5. **Categorize and Classify Assets:** Group the external repository's features/components into logical Functional Groups (e.g., Tooling Skills, Custom Rules/Checklists, Coordination Workflows, Installer/Sync Scripts, Utility Modules).
  6. **I-Wish Classification Funnel Audit (Shape & Role Axes):**
     - Load and read the Classification Matrix & Funnel Criteria from `.agent/IWISH-ARCHITECTURE.md` Section 1.
     - For each identified component or functional group, run it through the Classification Funnel by evaluating 3 criteria:
       - *Scope & Autonomy*: Simple rule / passive knowledge / active tool / end-to-end process.
       - *Execution Context*: Always on / injected when needed / called on demand / followed step-by-step.
       - *Reusability*: Scoped to specific tasks / shared globally.
     - Assign classifications on 2 axes:
       - **Shape Axis**: `dynamic-context` | `fragment` | `skill` | `workflow` | `agent` | `compound` | `skill-attachment` | `workflow-patch`.
       - **Role Axis**: `process-primary` | `supportive` | `foundational`.
  7. **Safety Isolation Check:** Proactively scan all repository files for configuration, setup, or installer scripts (e.g., `install.sh`, `sync-skills.sh`, Python/JS install hooks) that attempt to write to or configure directories outside the workspace (e.g., `$HOME/.claude/` or system-wide directories). Automatically classify these as `SKIP` to enforce strict project isolation.
  8. **Generate Comparison Report:** Create a structured bilingual (Vietnamese/English) comparison matrix saved as `{repo-name}-comparison.md`. The matrix MUST contain:
     - **Bảng So sánh & Phễu Phân loại / Feature Comparison & Classification Funnel Table**: A strict 7-column table format comparing feature groups:
       - *Nhóm Tính năng / Feature Group*: Logical categorized component/module.
       - *Phân loại (Hình dạng / Vai trò) / Classification (Shape / Role)*: Shape axis and Role axis classification (e.g., `skill-attachment / supportive`).
       - *Ưu điểm (gồm feedback thực tế) / Pros (incl. user feedback)*: Unique strengths, praises from community report deep-dived, or optimizations.
       - *Nhược điểm (đối chiếu feedback) / Cons (incl. user complaints)*: Weaknesses, token overhead, maintenance cost, user criticisms matched against technical analysis, or limitations.
       - *Khoảng cách & Trùng lặp / Gap & Overlaps*: Precise overlap or delta compared to existing I-Wish assets.
       - *Phương án & Nơi tích hợp / Proposed Action & Target*: Action track (`ADOPT` | `MERGE` | `REPLACE` | `SKIP` | `TOURNAMENT_PLUGIN`) and Target type (`SYSTEM_SKILL` | `USER_SPACE` | `SKIP`). Note: `TOURNAMENT_PLUGIN` packages the repo as an isolated Skill Attachment meant for A/B testing rather than merging its core logic into I-Wish.
       - *Tiêu chí Phễu / Funnel Criteria*: Justification details based on the 3 funnel criteria (Scope & Autonomy, Execution Context, Reusability).
     - **Phân tích Cơ chế Vận hành / Operational Mechanisms Analysis**: A dedicated section comparing the execution model, orchestrator flows, prompt loading methods, and state flow of the target repository versus I-Wish. Highlight which operational patterns should be adopted or avoided.
     - **Granular Zoom-in Audit Table**: A detailed skill-by-skill / component-by-component analysis evaluating pros, cons, and direct functional comparisons for prompt-only or compound repositories.
  9. **Create Detailed Integration Plan:** Following the matrix, provide concrete, actionable integration steps for each group marked for adoption/merging (e.g., target destination directories, frontmatter schemas, routing triggers).
  10. **Compound Check:** Determine if the repo contains >3 independent modules (e.g., a monorepo).
- **Output:** 
  - Save Gap Analysis report to: `${IWISH_HOME}/gap-analysis/{repo-name}-gap-analysis.md`
  - Save Comparison report to: `${IWISH_HOME}/gap-analysis/{repo-name}-comparison.md`
  - Create symlink in the absorbed repo directory: `ln -sf ${IWISH_HOME}/gap-analysis/{repo-name}-comparison.md ${IWISH_HOME}/absorbed-repos/{repo-name}/comparison.md`
- 🛑 **HUMAN CHECKPOINT 1:** Present `gap-analysis.md` and the newly structured bilingual `comparison.md` (featuring both Feature Comparison, Classification Funnel Audit, and Operational DNA Analysis) to the user.
  - **Wait for Input:** User must [Approve All], [Edit specific], [Reject All], or [Abort].
  - *Track Selection:* User MUST confirm if the absorption targets `SYSTEM_SKILL` or `USER_SPACE`.
  - *If Compound detected:* Explicitly ask user if they want to integrate as a `BUNDLE` or selectively extract modules.


### Phase 5.5: ADOPTION REVIEW PACK 🧭 (Agent: orch-agent / capability-agent)
- **Action:** Build a human-readable and Orch-readable adoption review pack before integration.
- **Steps:**
1. Use `docs/iwish-adoption-review-pack-standard.md` as the contract.
  1.5. If the repo is being registered into I-Wish runtime, prefer the runtime generator path so the pack stays aligned with other open-module intake flows.
2. Produce BOTH:
     - `${project-root}/docs/open-modules/{repo-name}-integration-guide.md`
     - `${project-root}/docs/open-modules/{repo-name}-integration-guide.html`
  3. The pack MUST include:
     - shape + role classification
     - framework placement
     - core use cases
     - adjacent use cases
     - edge cases
     - stress cases
     - constraints
     - agent / workflow / skill coordination
     - Orch routing hints
     - explicit review questions for the user
- **Purpose:** Give the user a readable review artifact and give Orch richer future routing context.
- **Gate:** Do not proceed to integration until the review pack exists.

### Phase 6: INTEGRATE & CLASSIFY ⚙️ (Agent: dev-agent)
- **Action:** Implement approved suggestions and establish Routing Triggers.
- **Steps:**
  1. **Dual-Track Routing:**
     - **If `SYSTEM_SKILL`:** 
       - Tự động gọi luồng **I-Wish-SKILL Building** (bắt buộc đi qua PRD -> Epic -> Story).
       - Toàn bộ file PRD, Epic, Story, sprint-status.yaml phải được ép buộc lưu trữ tại thư mục riêng `_iwish-output/iwish-skills/` để tránh ghi đè lên thư mục dự án của user.
       - Classify module (SKILL_ATTACHMENT, DEDICATED_WORKFLOW, NEW_PERSONA, COMPOUND_INTEGRATION) và tạo Draft Assets (tất cả các file SKILL.md, agent hoặc workflow mới được sinh ra phải tuân thủ nghiêm ngặt schema frontmatter chuẩn hóa gồm: name, description, inputs, outputs, mcp_tools_required, subagent_triggers).
       - Inject Triggers vào SkillGraph (`skill-graph.yaml`) hoặc Host Agent's profile.
     - **If `USER_SPACE`:** 
       - Kích hoạt **Zero-Story Flow**. Không tạo bất kỳ Epic/Story nào.
       - Inject data từ Phase 4 trực tiếp vào Memory/Context của tác vụ dự án hiện hành. Bỏ qua việc tạo Draft Assets hệ thống.
- 🛑 **HUMAN CHECKPOINT 2 (Iterative):** (Chỉ áp dụng cho `SYSTEM_SKILL`) For *each* implementation change and trigger injection, present the diff/code to the user.
  - **Wait for Input:** User must approve or skip *each* change independently.
- **Output:** Approved draft assets (for System Skill) or Injected Context (for User Space). Do not write into canonical `.agent/` paths until the user approves each promotion.

### Phase 7: VALIDATE 🧠 (Agent: review-agent)
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
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/validation-report.md`.

---

## 🚫 ERROR HANDLING & GATES
- If any phase gate fails, **HALT** the workflow immediately. State the reason and offer remediation steps.
- **DO NOT** auto-proceed past any `HUMAN CHECKPOINT`. You must wait for explicit user approval.
