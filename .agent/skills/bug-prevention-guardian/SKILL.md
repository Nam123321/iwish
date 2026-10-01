---
name: bug-prevention-guardian
description: "Cross-checks new code against historical bug patterns (RBAC, UI state, DB constraints) using semantic search and deterministic validation scripts."
---

# Bug Prevention Guardian

This skill enforces the **Closed-Loop Learning System** by validating your planned code changes against historical bug patterns encountered in the `cowok.ai` project.

## When to use this skill
- Before implementing any significant UI state logic (e.g., collapsible panels, responsive layouts).
- Before writing or modifying any Database Queries or Prisma Schemas.
- Before altering RBAC (Role-Based Access Control) policies or middleware.
- When executing the `review` phase of the `/fix-bug` or `/code` workflows.

## How to use this skill

### 1. Semantic Search (For Business Logic & UI Patterns)
Run the semantic search script to query the local knowledge base (`references/bug_patterns.md` and related KGs) for similar historical issues.
Provide keywords describing the files you are modifying or the logic you are touching.

**Command:**
```bash
python3 .agent/skills/bug-prevention-guardian/scripts/semantic_search.py "keywords here"
```

**Instruction for Agent:** Read the output of the search. If there are historical anti-patterns related to your current task, you MUST adapt your code to avoid them (e.g., do not use `display: none !important` on react-resizable-panels).

### 2. Strict Validator (For Structural & Deterministic Rules)
Run the strict validation script to ensure there are no regression errors in database constraints, environment variable presence, or rigid API structures.

**Command:**
```bash
python3 .agent/skills/bug-prevention-guardian/scripts/strict_validator.py "path/to/modified/file"
```

**Instruction for Agent:** If the validator fails, you MUST fix the errors before completing your task. Do NOT bypass the validator.

## Phase 3: Self-Learning Protocol (How to Update This Skill)
If you just successfully fixed a NEW bug, do **NOT** modify this skill or the Python scripts directly. 
Instead, extract the RCA and Lesson Learned and append it to `_iwish/runtime/bug_patterns_candidate_cache.md`. 
Only when a pattern reaches a frequency threshold (>2 times) or is explicitly approved by a Human (HITL), will it be merged into `references/bug_patterns.md` or promoted into a deterministic rule inside `strict_validator.py`.
