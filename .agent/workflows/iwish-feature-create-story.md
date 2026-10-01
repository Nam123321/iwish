---
legacy_name: 'create-story'
description: 'Create the next user story from epics+stories with enhanced context analysis and direct ready-for-dev-agent marking'
disable-model-invocation: true
---

> [!IMPORTANT]
> **[DOMAIN ROUTING GATE]** Hệ thống Watchmen (Category A) sẽ tự động kiểm duyệt Domain của bạn vào cuối lượt. Để tránh bị Block, bạn BẮT BUỘC phải chạy lệnh: `python3 .agent/scripts/domain-skill-router.py --context-file <file_đang_làm_việc>`. Nếu có skills trả về, BẮT BUỘC dùng `view_file` nạp toàn bộ.



IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/make-story/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/make-story/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/make-story/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
4.1. **CRITICAL — GATHER STORY TARGET:** If the user hasn't specified which story they want to create, STOP and ask them (e.g., "Which Epic and Story would you like to generate?").
4.1a. **CRITICAL — EPIC EVALUATION PASSPORT PREFLIGHT (ZERO-TRUST):** Before generating, rewriting, or validating any story content, derive the parent `epic_id` from the requested story target and run:
   `python3 .agent/scripts/pipeline-integrity-runner.py --target "<epic_id>" --type epic --phase planning`
   - If this command exits non-zero, you MUST HALT normal story creation. Do not create or modify `story.md`, `task.md`, `ui-spec.md`, or `data-spec.md`.
   - When blocked, start the Epic evaluation workflow instead: run full Party Mode with PM, Architect, and Review roles (minimum 2 rounds), run Unknowns full scan across all four quadrants for the Feature Group and Epic, collect immutable evidence receipts, and create `_iwish-output/epic-evaluations/Epic-<epic_id>/evaluation-passport.json`.
   - The passport MUST bind approval to the exact `context_digest` reported by `validate-epic-evaluation.py --draft`. FG-level evaluation may be linked as evidence, but it MUST NOT substitute for Epic-level evaluation.
   - Only resume `/make-story` after the validator returns exit code 0 for the same Epic snapshot.
4.2. **CRITICAL — LOAD PRODUCT CONTEXT (PRD & EPICS):** Before generating any story output, you MUST locate and read the product requirements:
   - Read the PRD: `@{project-root}/_iwish-output/2. Product Planning/2.1. product-brief-or-prd.md` (or resolve dynamically). **If no PRD file is found, you MUST HALT and warn the user: "⚠️ PRD chưa tồn tại. Vui lòng chạy /create-prd trước để khởi tạo PRD của dự án."**
   - Read the Epics list: `@{project-root}/_iwish-output/2. Product Planning/2.4. epics-and-stories.md` to extract the high-level requirements for the chosen Epic and Story.
4.3. **CRITICAL — PROGRAMMATIC LAYOUT MODE DETECTION & PRE-CHECK:**
   - Detect the workspace layout mode programmatically:
     - If the story pertains to creating or upgrading an internal agent capability, skill, workflow, or architecture (i.e. Meta-SDLC), you **MUST** use the **Evolution Lab Layout**: `@{project-root}/.agent/evolution-lab/stories/story-{story_id}.md` (filename is `story-{story_id}.md`).
     - Else if directory `_iwish-output/3. Development/1. Epic & Story/` exists physically in the workspace, you **MUST** use the **Hierarchical Layout**: `@{project-root}/_iwish-output/3. Development/1. Epic & Story/{Feature_Group}/Epic-{epic_id}/Story-{story_id}/story.md` (filename is strictly `story.md`).
     - Otherwise, you **MUST** use the **Flat Layout**: `@{project-root}/_iwish-output/stories/story-{story_id}.md` (filename is `story-{story_id}.md`).
   - Determine the target story path based on this detected mode.
   - Check if this target story file already exists. If it exists, you MUST run a validation pre-check on it first: `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase pre-code`.

    - **[AMENDMENT MODE — REFACTORED STORY GUARD]**: If the story file exists AND the story's frontmatter `status` is `refactored`:
      1. **DO NOT** overwrite or regenerate the story from scratch. The story has previously completed a full design cycle and only needs delta updates.
      2. Load the existing `story.md` completely into context as the **"Approved Base"**.
      3. Identify the **AC Delta** from the Change Log section (appended by `/refactor-story`). These are the new/modified/deprecated ACs that triggered the refactor.
      4. **Surgical Edit Only**: Use `replace_file_content` or `multi_replace_file_content` to:
         - Append new ACs and Edge Cases to the appropriate acceptance criteria section.
         - Modify existing ACs in-place where specified by the change log.
         - Mark deprecated ACs with `[DEPRECATED]` prefix (do NOT delete them).
         - **[CRITICAL] UPDATE TRACEABILITY MATRIX**: Do NOT generate the AC-to-Task matrix manually in Markdown. The system now uses a Zero-Trust `traceability.json` model. You MUST NOT add any Markdown tables for traceability. Instead, ensure your ACs and Tasks are cleanly numbered so the daemon (`ac-to-task-mapper.py`) can parse them during the pipeline gates.
      5. **Preserve ALL** existing sections: FR Covered mapping, OKF frontmatter (except status), Cross-Feature Dependencies, QA Scorecard, Developer Notes, and any `[NOTE]`/`[WARNING]`/`[ALERT]` flags.
      6. Re-run **Edge Case Guardian** ONLY on the new/modified ACs (not the entire story).
      7. Re-run `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase pre-code` — must PASS.
      8. **SKIP** full Socratic loop (Step 5.4) unless the AC delta fundamentally changes the story's vertical slice.
      9. Proceed to Step 2 (Spec Generation) with `INHERITED_SPEC_MODE = true`.

      > [!WARNING]
      > **OVERWRITE PROTECTION**: When Amendment Mode is active, using `write_to_file` with `Overwrite: true` on `story.md` is **STRICTLY FORBIDDEN**. This is a HARD BLOCK.

   - If the validation pre-check fails (meaning the file is a preliminary draft or skeleton placeholder without required FMEA reviews, risk matrices, or scorecards), you **MUST NOT** skip the story design steps. You MUST read the existing content to preserve any comments, notes, or `[NOTE]`, `[WARNING]`, `[ALERT]` flags written by previous agents, extract them, and carry them forward into the new story, but you MUST proceed with the full Socratic loop (Step 5.4), Edge Case scan (Step 6b), and validation gates. Do NOT bypass these gates just because the file physically exists.
   - If notes appear to conflict, merge them chronologically, flag them with a `[POTENTIAL-CONFLICT]` prefix, and explicitly append them into the `## 🧭 6. Developer & Cross-Story Notes` section of the newly generated story. DO NOT overwrite or delete them without preserving them.
4.3b. **CRITICAL — NLM CONTEXT ENRICHMENT GATE (PRE-PULL):**
   Before generating story content, you MUST run the Context Enrichment Need Score (CENS) gate:
   a. Run: `python3 .agent/scripts/calculate-cens.py --context-type story --context-file "<target_story_path>" --output-json _iwish-output/adhoc-workspace/scratch/cens-score.json`
      - If `<target_story_path>` does not exist yet (new story), use the parent epic file path instead.
   b. Run: `python3 .agent/scripts/resolve-notebook-targets.py --context-type story --context-id "<story_id>" --output-json _iwish-output/adhoc-workspace/scratch/notebook-targets.json`
   c. Load and follow `.agent/fragments/nlm-context-enrichment-gate.md` to execute the appropriate enrichment level.
   d. The enriched context MUST be used to inform story ACs, edge cases, and cross-feature dependencies.
4.4. **CRITICAL — LOAD NAVIGATION & ARCHITECTURE CONTEXT:**
   - Read `@{project-root}/_iwish-output/2. Product Planning/2.5. feature-hierarchy.md` (if exists) for UI navigation context.
   - Read any existing database specs (`2.2. database-spec.md`) or architecture documents if relevant.
4.4b. **CRITICAL — ARCHITECTURE COHERENCE GATE (ADR↔Story Tech Pre-Check):**
   - Before generating story content, you MUST run the architecture coherence checker to verify the story's planned technologies align with active ADR decisions:
   ```bash
   python3 .agent/scripts/architecture-coherence-checker.py \
     --architecture "_iwish-output/2. Product Planning/2.5. architecture.md" \
     --story-dir "<story_dir>" \
     --output-json "<story_dir>/coherence-report.json"
   ```
   - If the story directory doesn't exist yet (new story), use `--epic-dir` with the parent epic directory instead.
   - If `overall_status == "FAIL"` (CRITICAL/HIGH conflicts detected), you MUST HALT story creation and present the conflicts to the user with the 3 resolution options:
     - Option A: Update the ADR/TDR to officially adopt the technology
     - Option B: Rewrite the story to use the canonical technology per ADR
     - Option C: Create a phased migration plan
   - If the script warns "TDR not found" (fallback to body-scan), you MUST warn the user: "⚠️ TDR file thiếu. Kết quả coherence check có thể không chính xác. Nên chạy full architecture scan để tạo TDR."
5. Save outputs after EACH section when generating any documents from templates
5.2a. **FR COVERED MAPPING:** The generated story markdown MUST explicitly include `**FR Covered:** [FR-ID: FR Name]` (e.g., `**FR Covered:** [FR-1.1: Platform Mode Detection]({project-root}/_iwish-output/2.%20Product%20Planning/2.1.%20product-brief-or-prd.md#FR-1.1)`) immediately under the title or Epic metadata.
5.2b. **OKF FRONTMATTER ENFORCEMENT:** The generated story file (at the target path determined in step 4.3) MUST begin with a valid OKF YAML frontmatter block containing: `type` (I-Wish Story), `title` (Story Title), `description` (Story Goal), `resource` (Logical ID of this story (e.g., Story-1.1)), `tags` (array containing "story"), `status` (default to `backlog`), `timestamp` (ISO-8601), `links_to` (array referencing the Logical ID of the parent PRD file (e.g., `PRD`, `Epic-N`) or any other path resolved for the PRD—and any relevant architecture specs), and `dependencies` (array containing story IDs this story depends on). You MUST query the SSOT Graph Builder (`python3 .agent/scripts/build-reconciliation-graph.py` or `iwish query`) to extract exact dependencies, filtering only valid Story/Epic nodes. If the script fails (exit code != 0), you MUST HALT and clearly inform the user; DO NOT inject an empty array or stack trace.
5.3. **IDENTIFY TRACER BULLET (Vertical Slice):** Before generating the story, you MUST explicitly identify the **Tracer Bullet** for this story. A story MUST represent a complete vertical slice of behavior (UI -> API -> DB). If the story is only a horizontal layer (e.g., "Implement DB only"), you MUST halt and propose a vertical merge or slice.
5.3b. **CHECK PROJECT EXPANSION (PER):** Analyze if the story introduces a completely new feature, feature group, or significant project expansion. If so, you MUST HALT and prompt the user to load `/.agent/fragments/project-expansion-review.md` or run `/pivot-project` first to perform the **Project Expansion Review (PER)**. This ensures alignment with previous market/tech research and evaluates pivot risks, routing back to the planning or discovery phases if needed.
5.5. CRITICAL — PLAN TUNE COMPLEXITY CHECK. After generating ACs, load `@{project-root}/.agent/fragments/plan-tune-heuristic.md` and calculate the Complexity Score (CS). If CS ≥ 7, HALT and present a split proposal. If CS 4-6, WARN the user and recommend splitting. (Do NOT trigger Technical Gate 2 during story creation regardless of the complexity score; technical reviews belong in the Dev phase).
5.6. CRITICAL — AC-TO-TASK TRACEABILITY GATE. Do NOT generate the AC-to-Task matrix manually using LLM logic or in Markdown. The system now uses a Zero-Trust `traceability.json` model. You MUST NOT add any Markdown tables for traceability to `story.md`. Instead, ensure your ACs and Tasks are cleanly numbered so the out-of-band daemon (`ac-to-task-mapper.py`) can parse them during the next pipeline gates.
5.7. CRITICAL — PROJECT MEMORY GATE. Before drafting story context or Dev Notes, check for `@{project-root}/.agent/memory/PROJECT.md`. If present, load only the sections relevant to the current epic/story and treat them as the primary persistent project memory. Check `@{project-root}/.agent/memory/USER.md` only for stable collaboration preferences. `USER.md` MUST NOT override project constraints, approved architecture, story ACs, workflow instructions, or the current user request. If memory conflicts, resolve in this order: system/safety rules → project instructions/artifacts → workflow/story instructions → current user request → user preferences → historical session notes.
5.8. CRITICAL — CONTEXT BUDGET FOR MEMORY. Do not paste full memory files into the story by default. Summarize only the relevant project memory as citable Dev Notes, and prefer fresh PRD/architecture/epic artifacts over stale memory.
5.8b. CRITICAL — MAP ACS TO TASKS. After generating the ACs and Tasks, you MUST run: `uv run .agent/scripts/ac-to-task-mapper.py --story <path/to/story.md>`. This step automatically generates `task-traceability.json`.
5.9. CRITICAL — TRI-AGENT LITE SCAN & CROSS-FEATURE DEPENDENCIES. After ACs and Tasks are generated, you MUST perform the following:
   a. **Load Template Appendix:** Read the full contents of `@{project-root}.agent/templates/featuregraph/featuregraph-template-appendix.md`. This defines the mandatory section format.
   b. **Generate Tier 1 Tags:** Scan the generated ACs and Tasks to produce inline Tier 1 tags:
      - `[DATA: ModelName1, ModelName2]` — for Prisma/DB models created or modified by this story.
      - `[SEED: description]` — for shared/seed models that other features also use.
      - `[FLOW-OUT: domain.entity.action]` — for outgoing events or data this story produces.
      - `[FLOW-IN: domain.entity.action]` — for incoming events or data this story depends on.
      Place these tags inline next to the relevant AC or Task they describe.
   c. **Identify Story-Level Dependencies:** You MUST invoke the SSOT Graph Builder to retrieve dependencies. Safely parse the strict JSON output of the Graph Builder to avoid YAML syntax corruption from CLI log pollution (stdout). Extract only relevant Story/Epic IDs and populate the `dependencies: [...]` block in the frontmatter. Also verify their current development statuses in `sprint-status.yaml`. If any dependency is not marked as `completed`, warn the user and tag the story status as blocked.
   d. **Generate Cross-Feature Dependencies Section:** After the QA Scorecard, include a `## Cross-Feature Dependencies` section with exactly these subsections:
      - `### Impacts` — FRs this story changes that other features depend on, with reason.
      - `### Consumes` — FRs this story depends on, with what it uses.
      - `### Shared Entities` — Prisma models shared with other FRs.
      - `### Cross-Portal` — If the feature appears on multiple portals, list them.
      - `### Data Flow (Provider -> Consumer)` — Explicitly map the data flow from source provider to consumer interfaces to ensure no breakage.
      - `### Story-Level` — Other stories this story depends on, with their current status from `sprint-status.yaml`.
   e. **Edge Cases:**
      - If the project PRD has no FR definitions (early-stage or brownfield), still generate Shared Entities and Event Flow tags but skip FR linkage and add a `> NOTE: No FR definitions found in PRD. FR linkage skipped.` note.
      - If the story has zero cross-feature dependencies (fully self-contained), still include the `## Cross-Feature Dependencies` section with the note: `No cross-feature dependencies identified`.
6. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before finalizing the user story, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Embed the Scorecard directly at the bottom of the story document. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If it fails, HALT workflow and rewrite the story to fix logic gaps.
6b. CRITICAL — EDGE CASE GUARDIAN SCAN & KNOWLEDGE GRAPH UPDATE. After writing the story's initial happy-path ACs, you MUST invoke the Review Agent (`@{project-root}/.agent/agents/review-agent.md`) loading the Edge Case Guardian SKILL (`@{project-root}/.agent/skills/edge-case-guardian/SKILL.md`) to systematically perform an 8-Pillar scan on the story, score identified edge cases with FMEA, and add any critical edge cases to the story's ACs with the `[EDGE-CASE]` prefix. Additionally:
    - You MUST instruct the Review Agent to write and save the review report file strictly at `@{project-root}/_iwish-output/reviews/review-story-{story_id}.md` (e.g. `review-story-17.1.md`, using dots, not dashes or underscores in the ID). If in Evolution Lab Layout, save to `@{project-root}/.agent/evolution-lab/reviews/review-story-{story_id}.md`.
    - Add them as risk nodes to the appropriate pillar files in `@{project-root}/_iwish-output/edge-case-knowledge/pillars/`.
    - Update the index file at `@{project-root}/_iwish-output/edge-case-knowledge/index.md`.
    - Update the epic risk matrix at `@{project-root}/_iwish-output/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md` (derive {epic_id} from the first digit of the story ID, e.g. 1-1-user-auth -> Epic-1) using the template from `@{project-root}/.agent/fragments/risk-matrix-template.md`. If in Evolution Lab Layout, save to `@{project-root}/.agent/evolution-lab/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md`.

6b.2. CRITICAL — SOCRATIC REVIEW GATE 1 (POST-EDGE CASE). Now that ALL ACs (including `[EDGE-CASE]`) are gathered, you MUST execute the Socratic Review Mode (Gate 1: `business`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the UX flow, ACs, and **Tracer Bullet integrity**. 
    - **ANTI-YAGNI BUFFER RULE:** You are STRICTLY FORBIDDEN from deleting or rejecting complex technical Edge Cases (found in step 6b) just to keep the story simple. If an edge case is High Impact but technically complex, DO NOT delete it. Instead, tag it as `[DEFERRED-RISK]` or `[TECH-SPIKE-REQUIRED]` so it can be handled by Gate 2 during the Development phase.
    - You are FORBIDDEN from generating the final story text until the user has completed this Socratic loop and explicitly approved the Synthesis. **EXCEPTION (Auto-Approve Mode):** If `--auto-approve` is active, automatically approve the Socratic Review Synthesis and proceed to generate the final text WITHOUT pausing, unless the council reached an unresolved deadlock or required a business decision.

6c. **AUTOMATED STORY VALIDATION GATES:** Before injecting or declaring completion, you MUST run:
   `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase pre-code`
   If this validation script exits with a non-zero code, you MUST inspect the errors, rewrite/fix the missing or malformed blocks in the story file, and re-run validation until it passes (passes with Exit Code 0).
6d. CRITICAL — TIER 1 HYBRID GRAPH UPDATE. Sau khi hoàn thiện và xác thực thành công story file, bạn BẮT BUỘC phải "bơm" trực tiếp tóm tắt story này vào Knowledge Graph bằng lệnh CLI: `iwish inject-node --file "<target_story_path_determined_in_step_4.3>" --metadata '{"summary": "Mô tả ngắn gọn về tính năng", "tags": ["story", "planning"], "layer": "documentation", "complexity": "low"}'`. Lệnh này giúp FalkorDB nhận diện được node tài liệu này ngay lập tức.
6e. CRITICAL — UNKNOWNS SCANNER (QUICK).
    - Load the `unknowns-scanner` skill (`.agent/skills/unknowns-scanner/SKILL.md`).
    - Run with: phase=story, context_file={story_file}, depth=quick
    - If findings with severity=critical → HALT and present to user
6f. CRITICAL — CDI RECOMPILE. After the story file is successfully saved, you MUST run: `python3 .agent/scripts/compile-dependency-index.py` to regenerate the Dependency Index based on the new story's frontmatter.
6f.5. CRITICAL — AI-ML WORKLOAD CLASSIFICATION (Category A).
    - Run: `python3 .agent/scripts/classify-ai-workload.py --story-dir "<target_story_dir>" --auto-tag --output "<target_story_dir>/ai-classification.json"`
    - If AI/ML workload detected, automatically inject `domain: AI-ML` tag to activate downstream gates.
7. SMART NAVIGATION MENU (OPTION B). At the very end of story creation, analyze the generated story content. If the story is tagged with `[UI]` (Frontend) or `[DATA]` (Database/Schema), print a clear Next Steps Navigation Menu in the chat:
   - Explain what design files are needed based on the story tags.
   - Present clickable shortcuts for the user to trigger: `/make-ui-spec` (if UI tagged), `/make-data-spec` (if DATA tagged), or `/code` to skip design and proceed directly to coding.
   - Emphasize that resolving these specifications first ensures synchronicity between Frontend and Backend.
</steps>


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> Auto-triggered after story creation.

### KNOWLEDGE COLLECT: Capture story knowledge

1. Load `knowledge-collector` → Classify story knowledge (Project-specific)
2. Enrich relevant OP-1 notebook with story content
3. If story introduces new domain concepts: Update domain-taxonomy.yaml
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_id>" --type story --phase discovery`. If it fails, HALT immediately and do not proceed.
