---
name: 'create-epics-and-stories'
description: 'Use when PRD and Architecture documents are complete and need to be broken down into implementation-ready user stories.'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/_bmad/bmm/workflows/3-solutioning/create-epics-and-stories/workflow.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. FOLLOW THE ABOVE COMMAND FIRST to draft the Epics & Stories.
2. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding generation, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Produce the Scorecard directly at the bottom of the Epic/Story documents. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If lower, HALT workflow and loop back to rewrite the gaps.
</steps>

> **NAVIGATOR GUARDIAN SYNC (CRITICAL)**
> Upon completing the workflow and saving the output files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
