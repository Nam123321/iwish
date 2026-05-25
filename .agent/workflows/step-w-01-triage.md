---
description: 'Step W-01: Intake & Triage — Classify what capability type is needed'
---

# Step W-01: Triage

## Objective
Understand the user's need and determine the appropriate capability type to create.

This triage MUST classify the candidate on two axes:

1. **Shape axis:** `dynamic-context`, `fragment`, `skill`, `workflow`, `agent`, `compound`, `skill-attachment`, or `workflow-patch`
2. **Role axis:** `process-primary`, `supportive`, or `foundational`

Do not stop at naming the artifact shape only.

## Instructions

### 1. Gather Intent
Ask the user:
- **"What problem are you trying to solve?"** (e.g., "I need agents to understand Kubernetes", "I want a workflow for database migrations")
- **"Do you have any reference materials?"** (Links, PDFs, repos, or existing documentation)

### 2. Classify Capability Shape

Based on the user's description, determine which shape of capability is needed:

| Signal | Shape | Output |
|--------|-------|--------|
| Always-on rule, iron law, or global behavioral constraint | `dynamic-context` | foundational context / KG policy node |
| Reusable passive standard, doctrine, or guideline | `fragment` | `.agent/fragments/<name>.md` |
| Specialized callable procedure or tool | `skill` | `.agent/skills/<name>/SKILL.md` |
| Repeatable end-to-end process with ordered steps | `workflow` | `.agent/workflows/<name>.md` + `step-*.md` files |
| Dedicated role shell that owns decisions and routes capabilities | `agent` | `.agent/agents/<name>.md` + owned workflows/skills |
| Higher-order bundle spanning multiple jobs/capabilities | `compound` | generated module/subsystem package |
| Specialist helper injected into an existing workflow | `skill-attachment` | skill or skill draft + integration notes |
| Narrow patch to an existing workflow rather than new top-level flow | `workflow-patch` | `enhance-skill` patch/merge recommendation |

### 3. Classify Capability Role

After the shape decision, classify the role:

| Role | Meaning |
|------|---------|
| `process-primary` | Directly owns a stage/task in the main delivery framework from idea to product delivery |
| `supportive` | Improves another capability's execution, coverage, speed, safety, or adaptability |
| `foundational` | Shared injection used across many capabilities, usually not user-facing |

### 4. Decision Heuristics

- If the request is about **"learn X" / "understand Y" / "know how to use Z"** → SKILL
- If the request is about **"automate X" / "when I do Y, run Z" / "a process for..."** → WORKFLOW  
- If the request involves **"a specialist for X" / "dedicated role" / "I want someone who..."** → AGENT (includes at least 1 Skill + 1 Workflow)
- If the request exists mainly to support an existing delivery workflow rather than become a new public flow → `skill-attachment` or `workflow-patch`
- If the request mixes multiple coherent jobs and would become a mini-subsystem → `compound`
- If the request is a rule set that should be loaded everywhere or in many places → `fragment` or `dynamic-context`
- If uncertain → Ask the user: *"Based on your description, I think this could be [A] or [B]. Which feels more appropriate?"*

### 5. Delivery Framework Check

Also determine where it sits in the delivery framework:

- `Discover`
- `Plan`
- `Solution`
- `Implement`
- `Validate/Deliver`
- `Operate/Learn`

If it does not directly own a stage in this framework, it is probably `supportive` or `foundational`.

### 6. Confirm with User

Present the classification decision:
```
📋 Triage Result:
- Capability Shape: [dynamic-context / fragment / skill / workflow / agent / compound / skill-attachment / workflow-patch]
- Capability Role: [process-primary / supportive / foundational]
- Delivery Framework Placement: <phase + stage/task, if applicable>
- Name: <proposed-name>
- Rationale: <why this shape + role were chosen>
- Estimated deliverables: <list of files that will be created>
```

Wait for user confirmation before proceeding to Step W-02.

## Exit Criteria
- [ ] User's intent is clearly understood
- [ ] Capability shape is classified and confirmed
- [ ] Capability role is classified and confirmed
- [ ] Proposed name is agreed upon
