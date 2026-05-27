# Integration Guide: `antigravity-awesome-skills`

This integration guide serves as the official **Adoption Review Pack** for the `antigravity-awesome-skills` repository.

## 1. What Is It
- **Name:** `antigravity-awesome-skills`
- **Source:** [GitHub - sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)
- **Current Registration State:** `DRAFT_ADOPTION` (Under review for integration)
- **Shape Classification:** `repository-reference` / `module-pack`
- **Role Classification:** `supportive-registry`

## 2. Why It Exists
- **Job It Solves:** Automates the setup, categorization, and deployment of 1,470+ specific, file-based AI developer skills across different local IDE environments (Cursor, Claude Code, Gemini CLI, etc.).
- **Why I-Wish Wants It:** It offers a massive catalog of expert-written developer playbooks (like the Karpathy coding guidelines, specialized debugging procedures, and testing strategies) that can act as specialized skills for our agents.
- **Gap It Fills:** I-Wish currently lacks automated quality validation (linting) for custom skills, and does not have a large library of pre-packaged developer playbooks.

## 3. Delivery Framework Placement
- **Phases Helped:** `discover`, `plan`, `solution`, `implement`, `validate`.
- **Stages/Tasks Served:** `sprint-planning`, `feature-implementation`, `code-review-internal`, `security-auditing`.
- **Classification:** `supportive` (Used to enhance existing agent profiles or provide specialized validation tools).

## 4. Input -> Process -> Output
- **Inputs Expected:**
  - Target environment configurations (e.g. `--claude`, `--cursor`).
  - Target directory path for skill extraction.
  - Optional filters (CSV of tags, categories, or risk labels).
- **Process:**
  1. The installer CLI clones the repository.
  2. Filters skills using the `skill-filter.js` logic.
  3. Validates path and symlink safety.
  4. Copies selected skills into the host environment folder.
- **Outputs Produced:**
  - Extracted `.md` skills in the specified destination.
  - An installation manifest `.antigravity-install-manifest.json` for pruning and version control.

## 5. Use Cases
- **Core Use Cases:**
  - Auditing and validating custom skill structures in I-Wish via `skill-linter`.
  - Utilizing representative coding guidelines (such as `andrej-karpathy-skills`) in dev-agent workflows.
- **Adjacent Use Cases:**
  - Using the Svelte/Vite search catalog locally to search for specific programming recipes.
- **Do-Not-Use Cases:**
  - Do NOT run the global installer script (`install.js` or `activate-skills.sh`) inside I-Wish sandbox execution, as it modifies files outside the project directory.

## 6. Edge Cases / Stress Cases / Constraints
- **Edge Cases:**
  - Symlink attacks: Maliciously crafted third-party skills containing symlinks to `/etc/passwd`. (Mitigated by the internal `symlink-safety.js` check).
- **Stress Cases:**
  - Token/Context Poisoning: Loading thousands of skills into an agent's context will cause token limits to blow up (Gemini issue #215). (Mitigated by strict selective extraction).
- **Operational Constraints:**
  - Must remain strictly isolated. The CLI installer must be skipped or isolated.
- **Governance Constraints:**
  - Skills must be validated against the standard I-Wish schema (frontmatter, name, description, inputs, outputs).

## 7. Agent / Workflow / Skill Coordination
- **Canonical Agents:** `orch-agent`, `capability-agent`, `review-agent`.
- **Workflows Calling It:** `/create-skill`, `/absorb-repo`, `/review`.
- **Supportive Skills Pairing:** `skill-linter` pairs directly with `/create-skill` to automatically lint files.
- **Coordination Mode:** Should only be accessed selectively via parent workflows, never loaded in bulk directly by host agents.

## 8. Orch Routing Hints
- **Trigger Phrases:** `validate skill`, `lint skill`, `awesome skills`, `karpathy rules`, `install skill`.
- **Anti-Triggers:** `install all skills`, `npx awesome skills`.
- **Preferred Routing Stage:** `orchestration` (during skill creation or validation).
- **Proposal Mode:** Proposed automatically when a new skill is generated or when the user requests specialized reference materials.

## 9. Review Questions for the User
- **Desired Use Cases:** Do you want to adopt the automated `skill-linter` tool to validate your custom skills?
- **Risky Edge Cases:** Are you comfortable with skipping the global installer script to enforce strict sandbox isolation?
- **Approval Boundaries:** Should we integrate selected skills (like `@andrej-karpathy-skills`) directly as a system skill or keep them in reference folders?

## 10. Example Scenarios
- **Scenario 1: Automated Skill Validation**
  - *User:* `/create-skill my-custom-skill`
  - *Agent:* Automatically invokes `skill-linter` (extracted from the awesome-skills validation scripts) to verify frontmatter compliance before registering the skill.
- **Scenario 2: Karpathy Coding Execution**
  - *User:* `/dev-agent implement feature X following karpathy rules`
  - *Agent:* Loads `@andrej-karpathy-skills` context to enforce small surgical changes and verifiable success criteria.
