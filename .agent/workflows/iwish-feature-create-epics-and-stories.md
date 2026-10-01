---
name: 'create-epics-and-stories'
description: 'Use when PRD and Architecture documents are complete and need to be broken down into implementation-ready user stories.'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/step-01-validate-prerequisites.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. FOLLOW THE ABOVE COMMAND FIRST to draft the Epics & Stories.
2. CRITICAL — AUTOPLAN 3-OPTION GATE. Run `python3 .agent/scripts/validate-autoplan-options.py <path_to_epic_doc>`. The document MUST present 3 distinct execution options (e.g., fast vs robust) and explicitly state the chosen option with EM and PM rationale. If it fails -> HALT (Human Gate) to revise the plan.
3. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding generation, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Produce the Scorecard directly at the bottom of the Epic/Story documents. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If lower, HALT workflow and loop back to rewrite the gaps.
4. CRITICAL — CDI RECOMPILE. After all epic and story files are saved, you MUST run: `python3 .agent/scripts/compile-dependency-index.py` to build the baseline Dependency Index.
</steps>

> **NAVIGATOR GUARDIAN SYNC (CRITICAL)**
> Upon completing the workflow and saving the output files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered after epic creation.

### FOUNDATION: Create OP-1 per epic

1. For each epic created: Load `notebook-lifecycle-manager` → Create `{Project}/Epic-{N}-Context` (OP-1)
2. Scan the newly created epic directory for `epic.md`, `story.md`, and any `*.md` planning artifacts → Push as sources to OP-1. **Do NOT hardcode filenames.**
3. Load `notebook-cross-query-engine` → Cross-query epic dependencies ↔ RL-4
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
