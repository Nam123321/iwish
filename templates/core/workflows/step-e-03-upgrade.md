---
description: 'Step E-03: Upgrade — Modify existing capabilities with learned patterns'
---

# Step E-03: Upgrade

## Objective
Apply the approved Evolution Plan by modifying existing SKILL.md files, creating new ones, or patching Workflow instructions.

## Instructions

### 1. For Each Cluster with Action `UPDATE_SKILL`:

1. Open the target `SKILL.md` file.
2. Locate the `## Anti-Patterns` and `## Best Practices` sections.
3. For each instinct in the cluster:
   - Add the `bad` pattern as a new Anti-Pattern: `- ❌ NEVER <bad>`
   - Add the `good` pattern as a new Best Practice: `- ✅ ALWAYS <good>`
4. If the SKILL.md has a `## Version Notes` section, append:
   ```
   - <date>: Evolved by Whis — added <N> rules from <source> instincts
   ```

### 2. For Each Cluster with Action `CREATE_SKILL`:

Use the Step W-03 Forge template to create a new SKILL:
1. Create directory: `.agent/skills/<cluster-name>/`
2. Generate `SKILL.md` with:
   - YAML frontmatter (name, description)
   - All `good` patterns as Best Practices
   - All `bad` patterns as Anti-Patterns
   - `## When to Use This Skill` section based on the `ctx` tags

### 3. For Each Cluster with Action `UPDATE_WORKFLOW`:

1. Open the target workflow or `instructions.xml` file.
2. Add a new `<check>` or `<critical>` block that enforces the learned rule.
3. Ensure the new rule does not conflict with existing rules.

### 4. Update FeatureGraph (if available)

For each instinct being resolved:
```cypher
GRAPH.QUERY featuregraph "MATCH (i:Instinct {id:'<inst_id>'}) SET i.resolved = true"
GRAPH.QUERY featuregraph "MATCH (i:Instinct {id:'<inst_id>'}), (sk:Skill {name:'<skill-name>'}) CREATE (i)-[:RESOLVED_IN {resolved_at:'<date>'}]->(sk)"
```

## Exit Criteria
- [ ] All UPDATE_SKILL clusters have been applied
- [ ] All CREATE_SKILL clusters have generated new SKILL.md files
- [ ] All UPDATE_WORKFLOW clusters have patched target files
- [ ] FeatureGraph updated with RESOLVED_IN edges
