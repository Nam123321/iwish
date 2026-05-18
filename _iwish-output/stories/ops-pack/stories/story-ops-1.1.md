---
epic: EPIC-OPS-01
storyId: STORY-OPS-1.1
status: "Completed"
priority: "P0"
assignee: "Whis"
phase: "forge"

---
# Story 1.1: Build Agent Krillin & DevOps SKILL.md

## 1. TL;DR
Create the `Krillin` SRE/DevOps agent persona and its core operational bounds (`SKILL-devops.md`) to establish the baseline for all Day 0 and Day 1 automation capabilities.

## 2. Context & Problem
I-Wish requires a dedicated agent to handle deployment, infrastructure-as-code, and Day 2 operations. Without Krillin, developers must write deployment scripts and CI configurations manually, leading to drift and security risks.

## 3. Technical Requirements & Architectural Constraints

### 3.1. Agent Persona (`.agent/agents/krillin.md`)
- **Format:** I-Wish Agent Registry XML/YAML standard.
- **Name:** Krillin
- **Role:** Principal SRE & DevOps Automation Engineer.
- **Tone:** Professional, precise, safety-first.
- **Menu System:** Must implement a `menu-handler` that routes commands to `setup-ci-pipeline`, `deploy-staging`, `deploy-production`, and `incident-response`.

### 3.2. DevOps SKILL (`templates/library/ops-pack/skills/SKILL-devops.md`)
- **Format:** I-Wish SKILL definition with YAML frontmatter.
- **Rules:**
  - **Intent-to-Infrastructure:** Always translate natural language to IaC (Terraform, Docker Compose, GitHub Actions).
  - **Least Privilege:** Default to Read-Only operations unless explicitly approved.
  - **HOTL Awareness:** Must defer to Android 17 (SecOps) for deployment validation.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Invoking Krillin**
- **Given** I am a user in the workspace
- **When** I run the `/Krillin` slash command
- **Then** the terminal loads the Krillin agent persona and displays the DevOps menu.

**Scenario 2: Menu Routing Compliance**
- **Given** Krillin is active
- **When** the user selects "Setup CI Pipeline"
- **Then** the system calls the `setup-ci-pipeline.md` workflow.

## 5. Development Execution Steps (For Whis/Vegeta)
1. Ensure directory `.agent/agents/` exists. Generates `krillin.md`.
2. Ensure directory `templates/library/ops-pack/skills/` exists. Generates `SKILL-devops.md`.
3. Self-Check: Verify YAML frontmatter and XML tag closure in the generated files.
4. Mark story as `COMPLETED`.

---
> **Status:** COMPLETED
