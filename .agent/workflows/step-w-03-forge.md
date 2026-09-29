---
description: 'Step W-03: Forge — Generate the physical capability files'
---

# Step W-03: Forge (Assembly & Distillation)

## Objective
Transform the approved `capability-spec.md` blueprint into production-ready draft I-Wish capability files under `${IWISH_HOME}`.

## Instructions

### 1. Load the Specification
Read the `capability-spec.md` and `metadata.yaml` generated in Step W-02. Verify the spec has status "spec-approved" and metadata has `status: draft`.

### 2. Generate Files Based on Capability Type

#### If Type = SKILL
First, classify the skill based on `.agent/fragments/zero-trust-capability-standard.md`. Is it Tier 1 (High-Stakes/Physical) or Tier 2 (Cognitive)?

Create directories:
```bash
mkdir -p ${IWISH_HOME}/generated-skills/<skill-name>/references/
mkdir -p ${IWISH_HOME}/generated-skills/<skill-name>/scripts/
```

**If Tier 1 (High-Stakes):**
You MUST generate a Python script alongside the Markdown file. The script MUST import and use `iwish_runner_core.py`.
Write the script to `${IWISH_HOME}/generated-skills/<skill-name>/scripts/runner.py`.

**SKILL.md Format (MANDATORY):**
- **Size Constraint:** The `SKILL.md` file MUST NOT exceed 500 lines.
- **Progressive Disclosure:** Use `references/` for large blocks.
```markdown
---
name: "<skill-name>"
description: "Use when <triggering conditions>. DO NOT put a workflow summary here."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# <Skill Name>

## When to Use This Skill
<conditions that trigger this skill's usage>

## Core Rules
1. <rule>
2. <rule>

## Execution Guide (Tier 1 Only)
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
`python3 ${IWISH_HOME}/generated-skills/<skill-name>/scripts/runner.py --target <target>`

## Red Flags — STOP and Reconsider
<Insert Red Flags from Step W-02b>
- If you find yourself thinking "[Lazy LLM Excuse]", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| <Excuse> | <Reality> |

## Industry Standards & Best Practices
<Insert Key Learnings from Step W-02a>

## Boilerplate / Snippets
<code blocks with common setup patterns>
```

#### If Type = WORKFLOW
Create the following files:
1. **Gateway**: `${IWISH_HOME}/generated-workflows/<workflow-name>/<workflow-name>.md`
2. **Steps**: One `step-<prefix>-NN-<name>.md` per phase.

#### If Type = AGENT
Create all of the following:
1. **Agent Persona**: `${IWISH_HOME}/generated-agents/<agent-name>/<agent-name>.md`
2. **Template wrapper draft**: `${IWISH_HOME}/generated-agents/<agent-name>/templates/core/workflows/iwish-agent-feature-<agent-name>.md`
3. **Supporting Skills**: At least 1 draft `SKILL.md` in `${IWISH_HOME}/generated-skills/<agent-skill>/`
4. **Menu Items**: Wire workflow references into the agent's `<menu>` section

### 3. Prepare Promotion Plan
- Keep `metadata.yaml` at `status: draft`
- Create an adoption review pack following `docs/iwish-adoption-review-pack-standard.md`
- Create `routing-profile.yaml` following `docs/iwish-routing-profile-standard.md`

### 3.5. Anti-Fabrication Gate Classification (MANDATORY)

Before proceeding to CSO validation, classify every procedural gate in the generated capability:

1. **Read** `.agent/fragments/anti-fabrication-watchmen-pattern.md`
2. **Classify** every gate/check in the generated SKILL.md or workflow as:
   - **Category A (Deterministic):** Script exit codes, compiler checks, file existence — machine-verified, agent cannot fabricate
   - **Category B (Trust-Based):** Agent self-reported judgments, comparisons, scores — subject to bias and fabrication
3. **Calculate** the Enforcement Maturity Ratio: `Category A gates / Total gates × 100%`
4. **Threshold:** If Enforcement Maturity < 30% → FLAG the capability as "low enforcement maturity" in `metadata.yaml` and add a recommendation to convert at least 2 Category B gates to Category A (e.g., by creating a companion verification script)
5. **Evidence Trail:** For every Category B gate in the generated capability, define the evidence trail (what artifact proves the gate was actually executed — e.g., `view_file` tool call, raw script output, file:line references)
6. **Output:** Add a `## Gate Classification` table to the generated SKILL.md following the template in the fragment:
```markdown
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
```

### 4. CSO (Claude Search Optimization) Validation Gate
Before concluding this step, explicitly audit every `description` field generated in the YAML frontmatter.
- MUST NOT contain a summary of the workflow.
- MUST ONLY contain triggering conditions (Pushy Descriptions).

### 5. Update Sprint Tracker
```yaml
phases:
  forge: done
```

## Exit Criteria
- [ ] All physical files exist at correct paths
- [ ] Script generated for Tier 1 Skills using Core SDK.
- [ ] Files follow I-Wish DSL conventions.
- [ ] Draft remains under `${IWISH_HOME}` with no canonical repo writes.
- [ ] `promotion-plan.md` exists.
- [ ] Ready for validation in Step W-04.
