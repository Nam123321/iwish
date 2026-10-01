---
name: "epic-story-sync-guardian"
description: "Use when an agent performs any file creation, moving, renaming, or deletion involving Epics and Stories, or when checking the overall sprint status tracking integrity."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# epic-story-sync-guardian

## When to Use This Skill
- You are executing `/reconcile-change`, `/sprint-planning`, `/create-epics-and-stories`, or any task that modifies the physical directory structure of `_iwish-output/3. Development/1. Epic & Story`.
- The user reports missing stories in `sprint-status.yaml` or you are about to finalize a sprint status evaluation.

## Core Rules
1. **SSOT Matching:** The physical filesystem is the absolute Single Source of Truth (SSOT). `sprint-status.yaml` is merely a compiled index.
2. **Hard Gate:** If the Python validation script detects a discrepancy between the physical structure and the tracking YAML, you MUST HALT the workflow. Do NOT attempt to manually patch the YAML using text-replace.
3. **Remediation:** If the gate fails, you must invoke `python3 .agent/scripts/sync_all_statuses.py` to automatically rebuild the `sprint-status.yaml` from physical files.

## Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-SYNC-01 | Compare Epic/Story counts between physical directories and YAML index | Category A | `validate-sprint-status.py` exit code | Script output (0 = pass, 1 = fail) |

## Execution Guide (Tier 1 Only)
To execute this skill, you MUST NOT run generic bash commands to grep the YAML. You MUST run the included Python runner to perform the structural integrity check:
`python3 .agent/skills/epic-story-sync-guardian/scripts/validate-sprint-status.py`

## Red Flags — STOP and Reconsider
- **Attempting a text-replace on `sprint-status.yaml`:** Stop! You are bypassing the generator. The file is auto-generated.
- If you find yourself thinking "I'll just add the missing story manually to the YAML", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just patch the YAML file quickly using `replace_file_content` to fix the missing story." | The YAML file will be overwritten on the next sync. You must fix the physical file location and run the sync script. |

## Industry Standards & Best Practices
- **Data Integrity:** Keep compiled indexes strictly decoupled from manual editing to avoid silent data drift.

## Boilerplate / Snippets
```bash
# Validating sprint status
python3 .agent/skills/epic-story-sync-guardian/scripts/validate-sprint-status.py

# Remediation (If validation fails)
python3 .agent/scripts/sync_all_statuses.py
```
