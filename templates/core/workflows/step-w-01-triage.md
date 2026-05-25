---
description: 'Step W-01: Intake & Triage — Classify what capability type is needed'
---

# Step W-01: Triage

## Objective
Understand the user's need and determine the appropriate capability type to create.

## Instructions

### 1. Gather Intent
Ask the user:
- **"What problem are you trying to solve?"** (e.g., "I need agents to understand Kubernetes", "I want a workflow for database migrations")
- **"Do you have any reference materials?"** (Links, PDFs, repos, or existing documentation)

### 2. Classify Capability Type

Based on the user's description, determine which type of capability is needed:

| Signal | Classification | Output |
|--------|---------------|--------|
| User needs the system to **know about** a technology/framework | **SKILL** | `.agent/skills/<name>/SKILL.md` |
| User needs a **repeatable process** with defined steps | **WORKFLOW** | `.agent/workflows/<name>.md` + `step-*.md` files |
| User needs a **dedicated persona** with its own menu and responsibilities | **AGENT** | `.agent/agents/<name>.md` + supporting skills/workflows |

### 3. Decision Heuristics

- If the request is about **"learn X" / "understand Y" / "know how to use Z"** → SKILL
- If the request is about **"automate X" / "when I do Y, run Z" / "a process for..."** → WORKFLOW  
- If the request involves **"a specialist for X" / "dedicated role" / "I want someone who..."** → AGENT (includes at least 1 Skill + 1 Workflow)
- If uncertain → Ask the user: *"Based on your description, I think this could be [A] or [B]. Which feels more appropriate?"*

### 4. Confirm with User

Present the classification decision:
```
📋 Triage Result:
- Capability Type: [SKILL / WORKFLOW / AGENT]
- Name: <proposed-name>
- Rationale: <why this type was chosen>
- Estimated deliverables: <list of files that will be created>
```

Wait for user confirmation before proceeding to Step W-02.

## Exit Criteria
- [ ] User's intent is clearly understood
- [ ] Capability type is classified and confirmed
- [ ] Proposed name is agreed upon
