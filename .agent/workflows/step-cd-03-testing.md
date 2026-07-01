---
description: 'Step CD-03: Testing — Executed by iwish-feature-dev-story.md'
---

# Step CD-03: Testing

## Objective
Execute the instructions defined in this step for the iwish-feature-dev-story.md workflow.

> **[CRITICAL COMPLIANCE REQUIREMENT]**
> This is a sharded workflow step. Do NOT run this step independently without the context of the main orchestrator `iwish-feature-dev-story.md`.

## Instructions

4.8. ZOOM-OUT CHECKPOINT. During execution, if you detect you have been editing the SAME file for 3+ consecutive tool calls without referencing any other file or running validation, you MUST activate the Zoom-Out Heuristic from `@{project-root}/.agent/skills/pivot-guardian/SKILL.md` §4. Map the module neighborhood (callers, dependencies, epic/story context) before continuing. This prevents tunnel vision.
4.9. CRITICAL — UI ENRICHMENT READINESS GATE (Gate Option A). Before generating any implementation plan, verify the UI Spec. If the UI Spec contains `Enrichment_Required: true`, check if the `[POST_STITCH_ENRICHMENT_LOGIC]` section is populated. If it is empty or missing, you MUST HALT execution immediately and output: "Story này yêu cầu UI Pro Max nhưng UI Spec chưa được Enrich. Vui lòng chạy lệnh bổ sung hoặc gõ `APPROVE_OVERRIDE` để bỏ qua." Do not proceed without user override.
4.10. CRITICAL — INCREMENTAL BOUNDARY CROSS-CHECK. Instead of waiting for full feature completion, you MUST invoke `qa-agent` incrementally. Immediately after implementing a distinct boundary module (e.g., an API endpoint, a database schema, or a Frontend UI Hook), you MUST trigger `qa-agent` to validate the Data Contract between layers. Do NOT proceed to implementing the consuming layer until `qa-agent` confirms the boundary schema matches perfectly.
4.11. CRITICAL — BRAND ASSETS INCLUSION. If developing Frontend UI, check if the directory `_iwish-output/brand-identity/assets/` exists AND contains vector/image assets (e.g., SVGs, PNGs). If so, you MUST explicitly import and render these physical brand assets (e.g., primary logo SVGs, mark/symbol SVGs, icons) in the UI source code rather than using generic placeholders or mock image tags.
5. Save outputs after EACH section when generating any documents from templates
6. CRITICAL: STITCH-TO-CODE ENFORCEMENT. If implementing UI from a Stitch output, you MUST rigidly map React components using DOM-Driven Layout (following the visual DOM structure of the approved Stitch HTML), NOT Schema-Driven Layout. The generated HTML/CSS from Stitch is the Absolute Source of Truth. You MUST download and reference these Stitch artifacts natively.
7. CRITICAL: VISUAL ENFORCEMENT GATE. Before finalizing any UI task or handing off, invoke the UX Guardian or 'stitch-design-taste' skill to visually validate the implementation against the CSS/HTML visual contract. DO NOT assume functional logic replaces visual validation.
8. CRITICAL: I-Wish Master decrees that all future /dev-story executions must conclude with a deterministic compiler check. The agent MUST use the `run_command` tool to execute `python3 .agent/scripts/code_validator_runner.py <command>` (e.g., `python3 .agent/scripts/code_validator_runner.py pnpm build`, `python3 .agent/scripts/code_validator_runner.py nest build`, or `python3 .agent/scripts/code_validator_runner.py npx tsc --noEmit`) before finalizing the review and updating the walkthrough. Do NOT run the compiler directly.
9. CRITICAL: ARCHITECTURE GUARDIAN GATE (GOD FILE PREVENTION). Ensure no file exceeds the **300-500 lines threshold** (excluding auto-generated files like Prisma). **Workflow Continuity:** If a file temporarily exceeds this limit during active coding, you may finish implementing the Acceptance Criteria to ensure the feature works. However, BEFORE finishing the story and proceeding to `step-04-self-check`, you MUST invoke a `/refactor` phase to modularize the overgrown file. Never finalize a story leaving a "God File" behind.
48.5. CRITICAL — CODEBASE HEALTH & SIMPLIFICATION SYNERGY. Before completing the story and proceeding to `step-04-self-check`, you MUST run `/codebase-health` statically or verify that modified files do not violate complexity metrics (nesting depth >= 3, function length >= 50 lines). If any modified file exceeds these thresholds or is flagged as a hotspot, you MUST activate the `code-simplification` skill (`.agent/skills/code-simplification/SKILL.md`) to systematically refactor the code and reduce nesting/complexity while running tests to verify exact behavior parity.
38.5. CRITICAL: STORY STATUS UPDATE. Upon completing the story execution and before concluding your turn, you MUST explicitly update the `status` field in the physical `story.md` file (e.g. from `backlog` or `in-progress` to `dev_completed`). Do NOT leave it as backlog. Use `replace_file_content` to update the yaml frontmatter of the story file.
38. CRITICAL: OPERATION REPORT UPDATE. Upon completing the story execution, the agent MUST run `node scripts/operation-report-gen.js` to update the Operation Report metrics and Health Dashboard, and then explicitly notify the user in chat that the Operation Report has been updated, providing the absolute file URI to `_iwish-output/operation-report/index.html`.
39. CRITICAL: PIPELINE CONTINUATION PROMPT. Because the automated `/flow` pipeline requires explicit user consent before moving to code review and testing, you MUST conclude your final chat message by asking the user: *"Implementation is complete. Would you like me to execute Step 5 (`/review`) and Step 6 (`/manual-test`) to validate this feature?"*
</steps>

## Exit Criteria
- [ ] Completed all instructions in this step successfully.
