---
description: 'Step E-04: Commit — Finalize evolution, archive instincts, and report'
---

# Step E-04: Commit & Report

## Objective
Finalize the evolution cycle by archiving resolved instincts and presenting a summary to the user.

## Instructions

### 1. Archive Resolved Instincts

From `.agent/memory/instincts.jsonl`:
- Read all lines
- Separate into two groups: **resolved** (those that were just upgraded) and **unresolved** (remaining)
- Write unresolved instincts back to `instincts.jsonl`
- Append resolved instincts to `instincts.archive.jsonl` (create if not exists)

### 2. Generate Evolution Report

Present to the user:

```
✅ Whis Evolution Cycle Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
  Instincts Processed: <count>
  Instincts Resolved: <count>
  Instincts Remaining: <count>

🔧 Changes Made:
  Skills Updated: <count>
    - <skill-name>: +<N> rules
  Skills Created: <count>
    - <skill-name> (NEW)
  Workflows Patched: <count>
    - <workflow-name>: <description>

🎯 Impact:
  Agents that benefit: <list of agent names>
  Features hardened: <list of feature areas>

📅 Next Evolution: Recommended after <N> more instincts accumulate
```

### 3. Log the Evolution Event

Append a meta-instinct to `instincts.jsonl`:
```jsonl
{"ts":"YYYY-MM-DD","src":"enhance-skill","ctx":"meta,evolution","bad":"capability gap","good":"<N> skills evolved","sev":1}
```

### 4. Cleanup

- Verify `instincts.jsonl` contains only unresolved instincts
- Verify `instincts.archive.jsonl` contains the resolved ones
- If FeatureGraph is available: Verify all resolved instincts have `resolved: true`

## Exit Criteria
- [ ] Resolved instincts archived
- [ ] Unresolved instincts preserved
- [ ] Evolution report presented to user
- [ ] Meta-instinct logged
- [ ] All files in consistent state
