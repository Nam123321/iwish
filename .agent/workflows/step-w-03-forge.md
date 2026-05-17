---
description: 'Step W-03: Forge — Generate the physical capability files'
---

# Step W-03: Forge (Assembly & Distillation)

## Objective
Transform the approved `capability-spec.md` blueprint into production-ready draft BMAD capability files under `${BMAD_HOME}`.

## Instructions

### 1. Load the Specification
Read the `capability-spec.md` and `metadata.yaml` generated in Step W-02. Verify the spec has status "spec-approved" and metadata has `status: draft`.

### 2. Generate Files Based on Capability Type

#### If Type = SKILL
Create directory and file:
```
${BMAD_HOME}/generated-skills/<skill-name>/SKILL.md
```

**SKILL.md Format (MANDATORY):**
```markdown
---
name: "<skill-name>"
description: "Use when <triggering conditions, symptoms, and keywords>. DO NOT put a workflow summary here."
---

# <Skill Name>

## When to Use This Skill
<conditions that trigger this skill's usage>

## Core Rules
1. <rule>
2. <rule>

## Red Flags — STOP and Reconsider
<Insert Red Flags from Step W-02b>
- If you find yourself thinking "[Lazy LLM Excuse]", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (BMAD Standard) |
|---|---|
| <Excuse> | <Reality> |

## Anti-Patterns
- ❌ NEVER <bad pattern>
- ❌ NEVER <bad pattern>

## Best Practices
- ✅ ALWAYS <good pattern>
- ✅ ALWAYS <good pattern>

## Boilerplate / Snippets
<code blocks with common setup patterns>

## Version Notes
- <version-specific information>
```

#### If Type = WORKFLOW
Create the following files:
1. **Gateway**: `${BMAD_HOME}/generated-workflows/<workflow-name>/<workflow-name>.md` (with YAML frontmatter: name, description)
2. **Steps**: One `step-<prefix>-NN-<name>.md` per phase (follow existing BMAD step conventions)
3. **Template wrapper draft**: `${BMAD_HOME}/generated-workflows/<workflow-name>/templates/core/workflows/bmad-bmm-<workflow-name>.md` only if intended for public distribution

#### If Type = AGENT
Create all of the following:
1. **Agent Persona**: `${BMAD_HOME}/generated-agents/<agent-name>/<agent-name>.md` (XML-based persona with menu, following existing agent conventions like piccolo.md)
2. **Template wrapper draft**: `${BMAD_HOME}/generated-agents/<agent-name>/templates/core/workflows/bmad-agent-bmm-<agent-name>.md`
3. **Supporting Skills**: At least 1 draft `SKILL.md` in `${BMAD_HOME}/generated-skills/<agent-skill>/`
4. **Menu Items**: Wire workflow references into the agent's `<menu>` section

### 3. Prepare Promotion Plan

For ALL capability types:
- Ensure the new files follow BMAD naming conventions
- Do NOT write to `.agent/`, `templates/`, or `.agent/knowledge-graph.yaml` in this step
- Add a `promotion-plan.md` listing canonical destination paths and KG registration fields
- Keep `metadata.yaml` at `status: draft`
- Create an adoption review pack following `docs/iwish-adoption-review-pack-standard.md`:
  - `integration-guide.md`
  - `integration-guide.html`
- Create `routing-profile.yaml` following `docs/iwish-routing-profile-standard.md` so Orch has a machine-readable first-pass summary.
- The review pack MUST summarize:
  - framework placement
  - use cases
  - edge cases
  - stress cases
  - constraints
  - Orch routing hints
  - review questions for the user

### 4. CSO (Claude Search Optimization) Validation Gate

Before concluding this step, explicitly audit every `description` field generated in the YAML frontmatter:
- **Constraint:** The `description` MUST NOT contain a summary of the workflow or steps (e.g., "This workflow reads the spec, creates files, and validates them.").
- **Constraint:** The `description` MUST ONLY contain triggering conditions (e.g., "Use when generating a new skill or upgrading an existing agent").
- **Constraint (Banned Verbs):** If the description contains action verbs describing what the script does (e.g., "generates", "creates", "produces", "reads"), it MUST raise a warning flag and be rewritten.
- If any description violates these constraints, rewrite it immediately before proceeding.

### 5. Update Sprint Tracker

```yaml
phases:
  forge: done
```

## Exit Criteria
- [ ] All physical files exist at correct paths
- [ ] Files follow BMAD DSL conventions (YAML frontmatter, XML menus)
- [ ] Draft remains under `${BMAD_HOME}` with no canonical repo writes
- [ ] `promotion-plan.md` exists
- [ ] Sprint tracker updated
- [ ] Ready for validation in Step W-04
