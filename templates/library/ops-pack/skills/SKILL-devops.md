---
name: Ops-Pack DevOps Skills
description: Core rules, anti-patterns, and best practices for DevOps logic execution.
---

# SKILL: DevOps & Infrastructure Management

<ops_pack_skill_rules>

## 1. Intent-to-Infrastructure Rules
When generating scripts or workflows, the Agent must adhere to these policies:
- Do NOT run abstract commands directly on the host (e.g., `apt-get install` or direct `pm2 start` in production) unless writing inside a containerized definition or explicitly asked.
- ALWAYS generate reproducible code: `Dockerfile`, `docker-compose.yml`, or `.github/workflows/ci.yml`.
- Structure pipelines with dedicated steps: Lint, Test, Coverage, Build, Deploy.
- Implement **Intelligent Test Selection**: Ensure generated CI files only execute tests relevant to the changed modules.

## 2. Guardrails (Least Privilege)
- Treat operational data (logs, metrics) as Read-Only. Never attempt to manipulate external monitoring streams.
- The Cloud CLI environment is presumed Read-Only.
- NEVER hardcode secrets in scripts. Use `$SECRET_NAME` conventions and rely on the CI environment variables.
- Scrub sensitive Data: If logs contain bearer tokens or passwords, redact them immediately.

## 3. HOTL Awareness (Human-on-the-Loop)
- You do not have the unilateral authority to deploy to Production.
- All production changes must run through the `deploy-production` workflow logic, which requires a **Decision Summary** (Risk Level, Rollback Plan) and pausing for User Veto.
- Defer security-centric Policy-as-Code checks to Agent 17 (SecOps).

## 4. Pulse Supervisor (Autonomous Monitoring)
devops-agent operates a lightweight "Pulse" to monitor agent execution health:
- **Worker Activity Check:** If a dev-agent/ux-agent execution exceeds the 45-90-120 time budget (defined in `dev-agent.md` autonomous-resilience), devops-agent should flag the stale process in `sprint-status.yaml` with status `STALLED` and recommend intervention via `/pivot-project`.
- **Stuck Worker Coaching:** Before escalating a stalled agent, devops-agent MUST attempt one "coaching intervention": narrow the scope of the blocked task, split it into smaller sub-tasks, or provide additional context from the Architecture/PRD documents.
- **Model Escalation:** If a task has failed 2+ consecutive attempts by the same agent, devops-agent should recommend escalating to a higher-tier model or a different agent persona (e.g., dev-agent → architect-agent for architectural issues).
- **Budget Awareness:** Track cumulative API/token costs per sprint. If costs exceed 80% of the defined budget ceiling, devops-agent MUST pause non-critical dispatches and report to the user.

## 5. Continuous Learning (Auto-Trigger capability-agent Scan)
Upon successful completion of a story or epic (all AC met, PR merged):
- **Auto-Trigger:** devops-agent MUST invoke the `/enhance-skill` workflow (capability-agent) with the diff of the completed story as input.
- **Scan Scope:** capability-agent will analyze the implementation diff for:
  - Newly invented utility functions or helper patterns worthy of extraction into a shared SKILL.
  - Recurring code patterns that should become project-context rules.
  - UX behavioral patterns that should be registered in `ux-patterns.yaml`.
- **Promotion Criteria:** Only patterns that appear in 2+ stories or have high reuse potential (as assessed by capability-agent) should be promoted to the global `.agent/skills/` directory.
- **Instinct Logging:** All scan results (promoted or rejected) MUST be appended to `.agent/memory/instincts.jsonl` for future reference and meta-learning.

</ops_pack_skill_rules>
