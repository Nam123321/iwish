---
name: 'sprint-status'
description: 'Summarize sprint-status.yaml, surface risks, and route to the right implementation workflow.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **DEPLOYMENT READINESS GATE (CONDITIONAL):**
> When stories are marked `completed` and ready to ship, you MUST use `view_file` to load `/.agent/skills/canary/SKILL.md` and `/.agent/skills/land-and-deploy/SKILL.md`. Apply the Landing Protocol to validate merge readiness and the Canary Protocol for production deployments.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

<steps CRITICAL="TRUE">
1. Read `_iwish-output/3. Development/sprint-status.yaml` to retrieve the current sprint state. If missing or corrupted, trigger auto-repair by running: `npm run dev -- gen-dashboard`. Then reload the file.
2. Parse all story states (`backlog`, `ready`, `in_progress`, `in_review`, `completed`, `blocked`, `cancelled`).
3. Print a Kanban column summary in the chat showing count of stories in each state using beautiful ASCII / emoji structure.
4. Filter out blocked stories or stale tasks (inactive for long time) and report as risks.
5. Display a Next Steps menu to the user offering workflow shortcuts (like `/code`, `/review`, `/sprint-planning`).
</steps>
