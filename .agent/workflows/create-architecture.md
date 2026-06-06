---
name: 'create-architecture'
description: 'Collaborative architectural decision facilitation for AI-agent consistency. Replaces template-driven architecture with intelligent, adaptive conversation that produces a decision-focused architecture document optimized for preventing agent conflicts.'
disable-model-invocation: true
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/step-03-starter.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. MULTI-AGENT TOPOLOGY DEFINITION: If the project involves AI agents, you MUST explicitly select and document one or more of the following 6-Pattern Architecture topologies in `architecture.md` (e.g. under an 'AI Agent Architecture' heading):
   - **Pipeline:** Sequential task execution.
   - **Fan-out/Fan-in:** Parallel execution aggregating into a single result.
   - **Expert Pool:** Routing tasks to specialized domain agents.
   - **Producer-Reviewer:** Execution paired with adversarial validation.
   - **Supervisor:** Central orchestrator managing dynamic sub-tasks.
   - **Hierarchical Delegation:** Multi-level breakdown for massive scopes.
   *Guideline:* Use `invoke_subagent` (Sub-agents) for isolated parallel/sequential tasks with no communication overhead. Use `send_message` (Agent Teams) ONLY when 2+ agents require direct conversational coordination.
2. FOLLOW THE COMMAND IN LINE 7 FIRST to draft the traditional software Architecture document. Be sure to append your Multi-Agent Topology decisions into the final `architecture.md`.
3. CRITICAL — SOCRATIC REVIEW GATE 0. Before finalizing the Architecture, you MUST execute the Socratic Review Mode (Gate 0: `discovery`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the architectural decisions, tech stack justifications, scalability assumptions, and your Multi-Agent Topologies.
</steps>

> **NAVIGATOR GUARDIAN SYNC (CRITICAL)**
> Upon completing the workflow and saving the output files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
