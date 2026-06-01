---
name: create-prd
description: Use when starting a new product or feature that needs a formal PRD with
  functional requirements, success criteria, and user journeys. Triggers on requests
  for product specs, capability contracts, or feature documentation.
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/workflow-create-prd.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. FOLLOW THE ABOVE COMMAND FIRST to draft the PRD.
2. CRITICAL — SOCRATIC REVIEW GATE 0. Before finalizing the PRD, you MUST execute the Socratic Review Mode (Gate 0: `discovery`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the core scope, tech stack, and non-functional requirements.
3. CRITICAL — TECH STACK RESEARCH PASS. For Platform or Enterprise Platform products (>60 FRs or >5 user journeys), you MUST conduct a GitHub/web tech stack research round BEFORE the QA audit. This ensures FRs are validated against available open-source solutions and no capability domains are missed. Research should cover: agent frameworks, model serving, security tools, plugin systems, integration frameworks, and infrastructure tools relevant to the product domain.
4. CRITICAL — FR ADEQUACY CHECK. After Socratic Review and Tech Stack Research, validate that the FR count is appropriate for the product complexity class. If the product is Platform-class but has <60 FRs, HALT and perform a Deep Dive pass to discover missing capability domains. Use cross-journey synthesis (Step 3.7 of step-09-functional.md) and platform baseline categories (Step 3.6) to fill gaps.
5. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding the PRD generation, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian/SKILL.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Produce the Scorecard directly at the bottom of the PRD document output. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If lower, HALT workflow and loop back to rewrite the gaps.
6. CRITICAL — NAVIGATOR GUARDIAN SYNC. Upon completing all steps above, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
</steps>
