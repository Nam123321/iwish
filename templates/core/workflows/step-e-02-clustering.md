---
description: 'Step E-02: Clustering — Group instincts by context to identify evolution targets'
---

# Step E-02: Clustering

## Objective
Group unresolved instincts by their `ctx` tags to identify which Skills, Workflows, or Agents need upgrading.

## Instructions

### 1. Parse Context Tags

For each instinct, split the `ctx` field by comma. Build a frequency map:
```
prisma: [inst_001, inst_005, inst_012]
react: [inst_003, inst_007]
ui,modal: [inst_002, inst_009, inst_010]
```

### 2. Form Clusters

A **Cluster** is a group of 3+ instincts sharing at least one `ctx` tag.

For each cluster, determine:
- **Target Capability**: Which existing SKILL.md / Workflow / Agent should absorb these lessons?
- **Action Type**: `UPDATE_SKILL` (add rules to existing skill) | `CREATE_SKILL` (no skill exists for this context yet) | `UPDATE_WORKFLOW` (adjust process steps)

### 3. Map Clusters to Existing Assets

Search the `.agent/skills/` directory for matching skills:
```
Cluster "prisma" → Check if `.agent/skills/prisma-*/SKILL.md` exists
Cluster "ui,modal" → Check if `ux-patterns.yaml` or `.agent/skills/ux-guardian/SKILL.md` exists
```

If **no matching skill** exists → Mark action as `CREATE_SKILL`.
If **matching skill exists** → Mark action as `UPDATE_SKILL`.

### 4. Present Evolution Plan

```
🔄 Evolution Plan
━━━━━━━━━━━━━━━━
Cluster 1: "prisma" (5 instincts)
  → UPDATE_SKILL: .agent/skills/prisma-best-practices/SKILL.md
  → New rules to add: 3

Cluster 2: "ui,modal" (3 instincts)
  → UPDATE_SKILL: .agent/skills/ux-guardian/SKILL.md
  → New rules to add: 2

Cluster 3: "kubernetes" (4 instincts)
  → CREATE_SKILL: .agent/skills/kubernetes-ops/SKILL.md
  → Rules to create: 4
```

Wait for user confirmation before proceeding to Step E-03.

## Exit Criteria
- [ ] All instincts clustered by context
- [ ] Each cluster mapped to an action (UPDATE or CREATE)
- [ ] Evolution plan approved by user
