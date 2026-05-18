---
name: 'create-prd-wrapper'
description: 'Create a comprehensive PRD (Product Requirements Document) through structured workflow facilitation'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/_iwish/bmm/workflows/2-plan-workflows/create-prd/workflow-create-prd.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. FOLLOW THE ABOVE COMMAND FIRST to draft the PRD.
2. CRITICAL — SOCRATIC REVIEW GATE 0. Before finalizing the PRD, you MUST execute the Socratic Review Mode (Gate 0: `discovery`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the core scope, tech stack, and non-functional requirements.
3. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding the PRD generation, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Produce the Scorecard directly at the bottom of the PRD document output. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If lower, HALT workflow and loop back to rewrite the gaps.
4. CRITICAL — NAVIGATOR GUARDIAN SYNC. Upon completing all steps above, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
</steps>
