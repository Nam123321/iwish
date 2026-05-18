---
stepsCompleted: [vision, users, success-criteria, scope, innovation]
inputDocuments: [production-readiness-analysis.md]
date: 2026-04-07
author: Bulma (Business Analyst Agent)
phase: "forge"

---
# Product Brief: I-Wish Ops-Pack — DevOps & Production Lifecycle

## 1. Vision & Problem Statement

### Problem
I-Wish-DragonBall covers the full software development lifecycle from ideation through coding and testing — but **stops abruptly before production**. Teams using I-Wish have zero AI-assisted guidance for:
- Deploying code to staging/production environments
- Setting up CI/CD pipelines
- Monitoring live systems and responding to incidents
- Managing releases, rollbacks, and system maintenance

This gap forces teams to improvise deployment processes, creating inconsistency, risk, and wasted time.

### Vision
**Ops-Pack** extends I-Wish's lifecycle coverage from "Code Complete" through "Production Operations" — delivering a complete, AI-guided DevOps capability managed by a dedicated **Agent Krillin (SRE/DevOps Specialist)**.

### Unique Value Proposition
The only AI agent framework that covers the **entire product lifecycle** — transitioning DevOps from static rule-based automation to **Cognitive Operations** across the **Day 0, Day 1, and Day 2** paradigm. With **Agent Krillin** (DevOps/SRE) and **Android 17** (SecOps Guardian), we integrate Human-on-the-Loop (HOTL) governance, AIOps root-cause analysis (RCA), and self-healing infrastructure, learning continuously through Whis.

---

## 2. Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| **Solo Developer** | Indie dev deploying to VPS/Vercel | Guided deployment checklists, automated CI setup |
| **Startup Team (2-10)** | Small team without dedicated DevOps | Complete CI/CD pipeline generation, monitoring setup |
| **Enterprise Team** | Team with existing infra wanting I-Wish integration | Standardized release management, incident response protocols |
| **I-Wish Framework Maintainer** | Contributors to I-Wish-DragonBall itself | New library pack to distribute, Whis evolution testing |

---

## 3. Success Criteria

| ID | Success Metric | Target | Measurement |
|----|---------------|--------|-------------|
| SC-01 | Lifecycle coverage gap | 0 red gaps | All 8 gaps from Production Readiness Analysis resolved |
| SC-02 | Time to first deployment | < 30 min | From `iwish init` to live staging deploy using Krillin workflows |
| SC-03 | CI pipeline generation | Automated | Running `/setup-ci-pipeline` produces working GitHub Actions/GitLab CI YAML |
| SC-04 | Incident response time | < 5 min to triage | From alert to structured incident ticket using `incident-response` workflow |
| SC-05 | Whis integration | Functional | Ops-Pack created partially via `/create-capability` with instinct logging |

---

## 4. Product Scope

### Day 0 (Design & Infra Provisioning)
- Agent Krillin (DevOps) & **Android 17 (SecOps)** personas with strict Guardrails (Least Privilege)
- DevOps & SecOps root skills (`SKILL.md`)
- `setup-ci-pipeline` workflow (Intelligent Test Selection)
- `provision-infrastructure` workflow (Intent-to-Infrastructure IaC)

### Day 1 (Deployment & Delivery)
- `pre-deployment-checklist` workflow (Policy-as-Code Integration via Android 17)
- `deploy-staging` workflow 
- `deploy-production` workflow (HOTL Veto Protocol for High-Risk Actions)

### Day 2 (Operations & Evolution)
- Monitoring & observability setup (AIOps Metric Correlation)
- Incident response protocol (Automated RCA & Root Cause Isolation)
- `rollback-deployment` workflow (Telemetry Auto-trigger)
- `database-maintenance` & `create-release` workflows
- **Autonomous FinOps** & **Self-Healing Infrastructure Runbooks**
- Continuous Security Scanning (Android 17)

---

## 5. Key User Journeys

### Journey 1: First Deployment (Solo Dev)
1. Dev calls `/Krillin` → Agent greeting with menu.
2. Selects **"Setup CI Pipeline"** → Krillin asks about tech stack (Node/Python/Go, GitHub/GitLab).
3. Krillin generates `.github/workflows/ci.yml` with lint, test, build stages.
4. Dev merges PR → CI runs automatically.
5. Dev calls **"Deploy to Staging"** → Krillin runs pre-deployment checklist, generates deploy script.
6. Staging confirmed OK → Dev calls **"Deploy to Production"** → Krillin guides zero-downtime deploy.

### Journey 2: Production Incident & Self-Healing (Startup Team)
1. Alert fires (5xx error spike).
2. Team calls `/incident-response` → Krillin uses AIOps to group correlated alerts and identify the Root Cause.
3. Krillin proposes a fix runbook (Self-Healing attempt).
4. **Veto Protocol triggered:** Krillin generates a Decision Summary. Output to user for human approval.
5. User approves → Fix applied. If fix fails, Krillin triggers `/rollback-deployment`.
6. Post-mortem generated automatically (Factual, Blameless, 5 Whys RCA).
7. **Instinct logged** → Whis learns from the incident pattern and updates Krillin's SKILL.md.

### Journey 3: Periodic Maintenance (Any Team)
1. Monthly maintenance check → `/database-maintenance` → Krillin audits indexes, suggests vacuum.
2. `/security-scan` → Krillin runs `npm audit` / dependency scan, reports vulnerabilities.
3. `/create-release` → Krillin generates semantic version, changelog from commit history.

---

## 6. Competitive Differentiation

| Aspect | Other Frameworks | I-Wish Ops-Pack |
|--------|-----------------|---------------|
| Scope | Dev-only OR Ops-only | Full lifecycle (Brief → Ops) |
| Learning | Static playbooks | Dynamic instinct logging via Whis |
| Customization | One-size-fits-all | Stack-adaptive (AWS/GCP/Vercel/VPS) |
| Agent Integration | No agent ecosystem | Krillin integrates with Hit, Tien-Shinhan, Vegeta |
