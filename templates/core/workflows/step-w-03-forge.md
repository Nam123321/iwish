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
description: "<one line description>"
---

# <Skill Name>

## When to Use This Skill
<conditions that trigger this skill's usage>

## Core Rules
1. <rule>
2. <rule>

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

### 4. Update Sprint Tracker

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
