# Ops-Pack — System Architecture & Tech Spec

**Author:** Piccolo (Architect Agent)  
**Date:** 2026-04-11  
**Version:** 1.0  
**Status:** Draft  

---

## 1. Architectural Principles

Ops-Pack follows the **Day 0 / Day 1 / Day 2** paradigm, shifting I-Wish from purely "Code Generation" to **"Cognitive Operations"**. The framework introduces a Dual-Agent model:

1. **Agent Krillin (DevOps/SRE):** Focuses on Availability, Performance, Deployment Automation, and AIOps (Root Cause Analysis).
2. **Android 17 (SecOps Guardian):** Focuses on Policy-as-Code, Least Privilege auditing, Secret Management, and enforcing the Veto Protocol.

Both agents adhere strictly to the I-Wish DSL (XML workflows, YAML frontmatter, strict routing).

---

## 2. Directory Structure & Layout

The Ops-Pack library lives alongside `frontend-pack` and `code-intelligence-pack`:

```text
/templates/library/ops-pack/
├── README.md                      # Pack instructions
├── skills/
│   ├── SKILL-devops.md            # Default rules for Krillin (Containerization, IaC)
│   └── SKILL-secops.md            # Default rules for Android 17 (SAST, Guardrails)
├── workflows/
│   ├── iwish-agent-bmm-krillin.md  # Agent Krillin Menu & Personas
│   ├── iwish-agent-bmm-17.md       # Android 17 Menu & Personas
│   ├── day-0/
│   │   ├── setup-ci-pipeline.md
│   │   └── provision-infra.md
│   ├── day-1/
│   │   ├── pre-deploy-check.md    # Android 17 intercepts here
│   │   ├── deploy-staging.md
│   │   └── deploy-prod.md         # Triggers Veto Protocol
│   └── day-2/
│       ├── setup-monitoring.md
│       ├── incident-response.md   # AIOps RCA
│       ├── rollback-deploy.md
│       └── finops-optimize.md
```

Additionally, global Agent registry updates:
- `.agent/agents/krillin.md`
- `.agent/agents/17.md`

---

## 3. Workflow Routing & State Flow

### 3.1 Intent-to-Infrastructure (Day 0)
1. User invokes `/Krillin` → Selecting "Setup CI".
2. Krillin requests stack details via `notify_user` equivalent.
3. Krillin generates `.github/workflows/ci.yml`.
4. Optionally, `/17` runs SAST validation on the generated YAML (Policy-as-Code check).

### 3.2 Human-on-the-Loop (HOTL) Veto Protocol (Day 1)
When deploying to Production (`deploy-prod.md`):
1. **Trigger:** `/deploy-production`
2. **Audit Phase:** Android 17 runs `pre-deploy-check.md`. If vulnerabilities exist, workflow terminates.
3. **Execution Pause:** Krillin compiles the deployment plan (e.g., Blue-Green).
4. **Veto Gate:** Krillin outputs a **Decision Summary** (Risk Level, Fallback Plan) and halts (waiting for Human).
5. **Approval:** If user says "Approve", Krillin executes the script.

### 3.3 AIOps Auto-Remediation & Whis Logging (Day 2)
1. **Trigger:** User reports incident via `/incident-response`.
2. Krillin analyzes ingested logs, groups correlated errors.
3. If error matches a *Self-Healing Runbook*, Krillin proposes automated fix.
4. **Instinct Logging:** Any manual override or new root cause detected is instantly logged to `.agent/memory/instincts.jsonl` for **Whis** to ingest during the next `/enhance-capability` cycle.

---

## 4. Guardrails & Limits

Android 17 enforces system-wide Guardrails across the Ops-Pack:
- **Max Tool Calls:** Deployment scripts cannot run indefinitely. Workflow max steps = 15.
- **Read-Only Default:** Day 2 analysis (logs/metrics) defaults to Read-Only cloud access. 
- **Secret Scrubbing:** Any token or password encountered by Krillin is masked by Android 17 before being written to files or logs.
- **Immutable Audit:** All executed deployment terminal commands MUST be echoed into a `deploy-audit.log` file.
