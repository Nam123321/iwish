---
name: 'code-review'
description: 'Perform an ADVERSARIAL Senior Developer code review that finds 3-10 specific problems in every story. Challenges everything: code quality, test coverage, architecture compliance, security, performance. NEVER accepts `looks good` - must find minimum issues and can auto-fix with user approval.'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **BMAD RUNTIME FALLBACK:** First run `./.agent/scripts/check-bmad-runtime.sh --mode project` or verify `_bmad/core/tasks/workflow.xml` and `_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-bmad-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml
3. Pass the yaml path @{project-root}/_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
6. CRITICAL: BMAD Master decrees that you MUST conclude the review with a deterministic compiler check. You must run a terminal command to verify project compilation (e.g., `pnpm build`, `nest build`, or `tsc --noEmit`) before finalizing the review and updating the walkthrough. If compilation fails, HALT and flag as a CRITICAL finding.
7. CRITICAL — VISUAL ENFORCEMENT GATE: For frontend UI changes, you MUST enforce DOM-driven layout by verifying against Stitch CSS/HTML. Reference `.agent/skills/stitch-design-taste/SKILL.md`. If the component structure relies on backend schemas rather than Stitch's DOM outputs, you MUST flag it as a CRITICAL 'Schema-Driven Layout' failure and order a refactor.
8. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding the code review, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian.md`. You must calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy) based on the classified domain. Produce the Scorecard directly into your review output.
</steps>
