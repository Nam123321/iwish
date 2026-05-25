---
description: 'Step E-01: Reflection — Read and analyze all accumulated instincts'
---

# Step E-01: Reflection

## Objective
Gather all unresolved instincts from Machine Memory and present a health report of the system's accumulated learnings.

## Instructions

### 1. Load Machine Memory

Read the file `.agent/memory/instincts.jsonl`. Parse each line as a JSON object.

### 2. Query FeatureGraph (if available)

If FalkorDB is running, execute:
```cypher
GRAPH.QUERY featuregraph "MATCH (i:Instinct) WHERE i.resolved = false RETURN i ORDER BY i.sev DESC"
```
This may return additional instincts that were indexed but not yet in the local JSONL file.

### 3. Generate Reflection Report

Present to the user:

```
🧠 Whis Reflection Report
━━━━━━━━━━━━━━━━━━━━━━━━
Total Unresolved Instincts: <count>
Severity Distribution:
  🔴 Critical (sev 5): <count>
  🟡 Important (sev 3-4): <count>
  🟢 Minor (sev 1-2): <count>

Top 5 Hotspot Contexts:
  1. <ctx> — <count> instincts
  2. <ctx> — <count> instincts
  ...

Source Distribution:
  fix-bug: <count>
  code-review: <count>
  dev-story: <count>
  ad-hoc: <count>
  audit-ux: <count>
  self-check: <count>
```

### 4. Triage Decision

- If total instincts < 3: Inform user "Not enough data for meaningful evolution. Continue working and instincts will accumulate."
- If total instincts ≥ 3: Proceed to Step E-02 (Clustering).

## Exit Criteria
- [ ] All instincts loaded from JSONL + Graph
- [ ] Reflection report presented to user
- [ ] Decision to proceed or defer is made
