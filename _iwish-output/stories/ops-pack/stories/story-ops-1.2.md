---
epic: EPIC-OPS-01
storyId: STORY-OPS-1.2
status: "To Do"
phase: "forge"

---
# Story 1.2: Build Android 17 & SecOps SKILL.md

## 1. TL;DR
Create the `Android 17` SecOps agent persona and its core security bounds (`SKILL-secops.md`) to establish Policy-as-Code, deployment validation, and security guardrails within the Day 0 and Day 1 automation capabilities.

## 2. Context & Problem
I-Wish requires a dedicated security-focused agent to validate infrastructure and code changes made by development and Krillin (DevOps). Without Android 17, deployments may introduce vulnerabilities, insecure defaults, or policy violations. Android 17 acts as the Human-on-the-Loop (HOTL) gateway for deployment validation.

## 3. Technical Requirements & Architectural Constraints
1. **Agent Persona File**: Must create `.agent/agents/17.md` adhering to the I-Wish Agent Registry XML/YAML standard. The persona is analytical, unyielding, secure-by-default.
2. **Menu Options**: Must implement a menu handler with `security-scan`, `pre-deploy-check`.
3. **SKILL File**: Must create `templates/library/ops-pack/skills/SKILL-secops.md`.
4. **Behavior**: Android 17 acts as the "Veto Authority". It checks code against Policy-as-Code standards (e.g. checking OPA rules). Must scrub all passwords/tokens before processing logs. Requires explicit Human-on-the-Loop approval before overriding a Veto.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Invoking Android 17**
- **Given** I am a user in the workspace
- **When** I run the `/17` slash command
- **Then** the terminal loads the Android 17 persona
- **And** it displays the SecOps menu options (`security-scan`, `pre-deploy-check`).

**Scenario 2: Policy-as-Code Enforcement (Veto Protocol)**
- **Given** Android 17 is active during a deployment or code-generation workflow
- **When** Krillin or a user proposes an IaC or deployment script
- **Then** Android 17 validates the script against `SKILL-secops.md` policies
- **And** triggers the Veto Protocol, blocking the action, if any policy is violated.

**Scenario 3: Secret Scrubbing (Edge Case Mitigation)**
- `[EDGE-CASE]` **Given** logs or scripts containing sensitive tokens/passwords are provided in the prompt context
- **When** Android 17 processes them
- **Then** it must scrub all passwords and tokens before taking any action or generating outputs.

## 5. Development Execution Steps (For Whis/Vegeta)
1. Ensure directory `.agent/agents/` exists. Generate `17.md`.
2. Ensure directory `templates/library/ops-pack/skills/` exists. Generate `SKILL-secops.md`.
3. Self-Check: Verify YAML frontmatter and XML tag closure in the generated files. Check if Veto Protocol is explicitly outlined.
4. Mark story as `COMPLETED`.
