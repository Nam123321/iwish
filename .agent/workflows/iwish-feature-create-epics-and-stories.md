---
name: 'create-epics-and-stories'
description: 'Use when PRD and Architecture documents are complete and need to be broken down into implementation-ready user stories.'
disable-model-invocation: true
version: '2.0'
changelog: |
  v2.0 (2026-06-17):
  - [NEW] Domain Ownership rule — 1 domain per epic, no mixed concerns
  - [NEW] Vertical Slicing — every story must cut FE + BE + DB
  - [NEW] Story Cap — 4-8 stories per epic, split into sub-epics if >8
  - [NEW] Data Spec Gate — mandatory Business Flow Analysis per story (API/DB/WS/Error/RBAC)
  - [NEW] Feature Hierarchy Quality Gates — ASCII tree, FR annotations, ≥95% coverage
  - [NEW] Domain Ownership Validation in Step 4
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/step-01-validate-prerequisites.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. FOLLOW THE ABOVE COMMAND FIRST to draft the Epics & Stories.
2. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding generation, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Produce the Scorecard directly at the bottom of the Epic/Story documents. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If lower, HALT workflow and loop back to rewrite the gaps.
</steps>

> **NAVIGATOR GUARDIAN SYNC (CRITICAL)**
> Upon completing the workflow and saving the output files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
