---
legacy_name: 'create-story'
description: 'Create the next user story from epics+stories with enhanced context analysis and direct ready-for-dev-agent marking'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/make-story/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/make-story/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/make-story/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
4.1. **CRITICAL — GATHER STORY TARGET:** If the user hasn't specified which story they want to create, STOP and ask them (e.g., "Which Epic and Story would you like to generate?").
4.2. **CRITICAL — LOAD PRODUCT CONTEXT (PRD & EPICS):** Before generating any story output, you MUST locate and read the product requirements:
   - Read the PRD: `@{project-root}/_iwish-output/2. Product Planning/2.1. product-brief-or-prd.md` (or resolve dynamically). **If no PRD file is found, you MUST HALT and warn the user: "⚠️ PRD chưa tồn tại. Vui lòng chạy /create-prd trước để khởi tạo PRD của dự án."**
   - Read the Epics list: `@{project-root}/_iwish-output/2. Product Planning/2.4. epics-and-stories.md` to extract the high-level requirements for the chosen Epic and Story.
4.3. **CRITICAL — PRESERVE PLACEHOLDER STORY CONTEXT & VALIDATION PRE-CHECK:**
   - Check if the target story file `@{project-root}/_iwish-output/stories/story-N.M.md` (or dynamic matching path) already exists.
   - If it exists, you MUST run a validation pre-check on it first: `python3 .agent/scripts/validate-story.py "path/to/story.md"`.
   - If the validation pre-check fails (meaning the file is a preliminary draft or skeleton placeholder without required FMEA reviews, risk matrices, or scorecards), you **MUST NOT** skip the story design steps. You MUST read the existing content to preserve any comments, notes, or `[NOTE]`, `[WARNING]`, `[ALERT]` flags written by previous agents, extract them, and carry them forward into the new story, but you MUST proceed with the full Socratic loop (Step 5.4), Edge Case scan (Step 6b), and validation gates. Do NOT bypass these gates just because the file physically exists.
   - If notes appear to conflict, merge them chronologically, flag them with a `[POTENTIAL-CONFLICT]` prefix, and explicitly append them into the `## 🧭 6. Developer & Cross-Story Notes` section of the newly generated story. DO NOT overwrite or delete them without preserving them.
4.4. **CRITICAL — LOAD NAVIGATION & ARCHITECTURE CONTEXT:**
   - Read `@{project-root}/_iwish-output/2. Product Planning/2.5. feature-hierarchy.md` (if exists) for UI navigation context.
   - Read any existing database specs (`2.2. database-spec.md`) or architecture documents if relevant.
5. Save outputs after EACH section when generating any documents from templates
5.2a. **FR COVERED MAPPING:** The generated story markdown MUST explicitly include `**FR Covered:** [FR-ID: FR Name]` (e.g., `**FR Covered:** [FR-1.1: Platform Mode Detection](file:///path/to/prd.md#FR-1.1)`) immediately under the title or Epic metadata.
5.2b. **OKF FRONTMATTER ENFORCEMENT:** The generated story file (e.g., `_iwish-output/stories/[epic]/[story].md` or `_iwish-output/stories/story-[epic]-[story].md`) MUST begin with a valid OKF YAML frontmatter block containing: `type` (I-Wish Story), `title` (Story Title), `description` (Story Goal), `resource` (absolute file URI of this story file), `tags` (array containing "story"), `timestamp` (ISO-8601), `links_to` (array referencing the actual path of the parent PRD file resolved dynamically via keyword search—e.g., `_iwish-output/2. Product Planning/2.1. product-brief-or-prd.md` or any other path resolved for the PRD—and any relevant architecture specs), and `dependencies` (array containing story IDs this story depends on, e.g. `["story-16.1"]`, or `[]` if none).
5.3. **IDENTIFY TRACER BULLET (Vertical Slice):** Before generating the story, you MUST explicitly identify the **Tracer Bullet** for this story. A story MUST represent a complete vertical slice of behavior (UI -> API -> DB). If the story is only a horizontal layer (e.g., "Implement DB only"), you MUST halt and propose a vertical merge or slice.
5.3b. **CHECK PROJECT EXPANSION (PER):** Analyze if the story introduces a completely new feature, feature group, or significant project expansion. If so, you MUST HALT and prompt the user to load `/.agent/fragments/project-expansion-review.md` or run `/pivot-project` first to perform the **Project Expansion Review (PER)**. This ensures alignment with previous market/tech research and evaluates pivot risks, routing back to the planning or discovery phases if needed.
5.4. CRITICAL — SOCRATIC REVIEW GATE 1. Before generating any story output, you MUST execute the Socratic Review Mode (Gate 1: `business`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the UX flow, Acceptance Criteria (AC), **Tracer Bullet integrity**, and edge cases. You are FORBIDDEN from generating the story text until the user has completed the Socratic loop and explicitly approved the Synthesis.
5.5. CRITICAL — PLAN TUNE COMPLEXITY CHECK. After generating ACs, load `@{project-root}/.agent/fragments/plan-tune-heuristic.md` and calculate the Complexity Score (CS). If CS ≥ 7, HALT and present a split proposal. If CS 4-6, WARN the user and recommend splitting.
5.6. CRITICAL — AC-TO-TASK TRACEABILITY GATE. Before finalizing, generate the AC-Task Traceability Matrix (see `plan-tune-heuristic.md` Part D). Every AC MUST map to at least 1 Task. If any AC has `⚠️ MISSING TASK`, HALT the workflow until a task is assigned.
5.7. CRITICAL — PROJECT MEMORY GATE. Before drafting story context or Dev Notes, check for `@{project-root}/.agent/memory/PROJECT.md`. If present, load only the sections relevant to the current epic/story and treat them as the primary persistent project memory. Check `@{project-root}/.agent/memory/USER.md` only for stable collaboration preferences. `USER.md` MUST NOT override project constraints, approved architecture, story ACs, workflow instructions, or the current user request. If memory conflicts, resolve in this order: system/safety rules → project instructions/artifacts → workflow/story instructions → current user request → user preferences → historical session notes.
5.8. CRITICAL — CONTEXT BUDGET FOR MEMORY. Do not paste full memory files into the story by default. Summarize only the relevant project memory as citable Dev Notes, and prefer fresh PRD/architecture/epic artifacts over stale memory.
5.9. CRITICAL — TRI-AGENT LITE SCAN & CROSS-FEATURE DEPENDENCIES. After ACs and Tasks are generated, you MUST perform the following:
   a. **Load Template Appendix:** Read the full contents of `@{project-root}/templates/library/code-intelligence-pack/featuregraph/featuregraph-template-appendix.md`. This defines the mandatory section format.
   b. **Generate Tier 1 Tags:** Scan the generated ACs and Tasks to produce inline Tier 1 tags:
      - `[DATA: ModelName1, ModelName2]` — for Prisma/DB models created or modified by this story.
      - `[SEED: description]` — for shared/seed models that other features also use.
      - `[FLOW-OUT: domain.entity.action]` — for outgoing events or data this story produces.
      - `[FLOW-IN: domain.entity.action]` — for incoming events or data this story depends on.
      Place these tags inline next to the relevant AC or Task they describe.
   c. **Identify Story-Level Dependencies:** Scan the backlog to identify other story IDs (e.g. `story-16.1`) that must be completed before this story can be implemented. Populate the `dependencies: [...]` block in the frontmatter, and also verify their current development statuses in `sprint-status.yaml`. If any dependency is not marked as `done`, warn the user and tag the story status as blocked.
   d. **Generate Cross-Feature Dependencies Section:** After the QA Scorecard, include a `## Cross-Feature Dependencies` section with exactly these subsections:
      - `### Impacts` — FRs this story changes that other features depend on, with reason.
      - `### Consumes` — FRs this story depends on, with what it uses.
      - `### Shared Entities` — Prisma models shared with other FRs.
      - `### Cross-Portal` — If the feature appears on multiple portals, list them.
      - `### Story-Level` — Other stories this story depends on, with their current status from `sprint-status.yaml`.
   e. **Edge Cases:**
      - If the project PRD has no FR definitions (early-stage or brownfield), still generate Shared Entities and Event Flow tags but skip FR linkage and add a `> NOTE: No FR definitions found in PRD. FR linkage skipped.` note.
      - If the story has zero cross-feature dependencies (fully self-contained), still include the `## Cross-Feature Dependencies` section with the note: `No cross-feature dependencies identified`.
6. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before finalizing the user story, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Embed the Scorecard directly at the bottom of the story document. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If it fails, HALT workflow and rewrite the story to fix logic gaps.
6b. CRITICAL — EDGE CASE GUARDIAN SCAN & KNOWLEDGE GRAPH UPDATE. After writing the story's initial happy-path ACs, you MUST invoke the Review Agent (`@{project-root}/.agent/agents/review-agent.md`) loading the Edge Case Guardian SKILL (`@{project-root}/.agent/skills/edge-case-guardian/SKILL.md`) to systematically perform an 8-Pillar scan on the story, score identified edge cases with FMEA, and add any critical edge cases to the story's ACs with the `[EDGE-CASE]` prefix. Additionally:
   - Add them as risk nodes to the appropriate pillar files in `@{project-root}/_iwish-output/edge-case-knowledge/pillars/`.
   - Update the index file at `@{project-root}/_iwish-output/edge-case-knowledge/index.md`.
    - Update the epic risk matrix at `@{project-root}/_iwish-output/edge-case-knowledge/epics/Epic-{epic_id}-risk-matrix.md` (derive {epic_id} from the first digit of the story ID, e.g. 1-1-user-auth -> Epic-1) using the template from `@{project-root}/.agent/fragments/risk-matrix-template.md`.
6c. **AUTOMATED STORY VALIDATION GATES:** Before injecting or declaring completion, you MUST run:
   `python3 .agent/scripts/validate-story.py "path/to/story.md"`
   If this validation script exits with a non-zero code, you MUST inspect the errors, rewrite/fix the missing or malformed blocks in the story file, and re-run validation until it passes (passes with Exit Code 0).
6d. CRITICAL — TIER 1 HYBRID GRAPH UPDATE. Sau khi hoàn thiện và xác thực thành công story file, bạn BẮT BUỘC phải "bơm" trực tiếp tóm tắt story này vào Knowledge Graph bằng lệnh CLI: `iwish inject-node --file "_iwish-output/stories/[epic]/[story].md" --metadata '{"summary": "Mô tả ngắn gọn về tính năng", "tags": ["story", "planning"], "layer": "documentation", "complexity": "low"}'`. Lệnh này giúp FalkorDB nhận diện được node tài liệu này ngay lập tức.
7. SMART NAVIGATION MENU (OPTION B). At the very end of story creation, analyze the generated story content. If the story is tagged with `[UI]` (Frontend) or `[DATA]` (Database/Schema), print a clear Next Steps Navigation Menu in the chat:
   - Explain what design files are needed based on the story tags.
   - Present clickable shortcuts for the user to trigger: `/make-ui-spec` (if UI tagged), `/make-data-spec` (if DATA tagged), or `/code` to skip design and proceed directly to coding.
   - Emphasize that resolving these specifications first ensures synchronicity between Frontend and Backend.
</steps>
