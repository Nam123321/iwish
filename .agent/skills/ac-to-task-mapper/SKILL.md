---
name: AC-to-Task Mapper
description: >
  Zero-Trust enforcer for the AC-to-Task Traceability Matrix. Parses story.md
  using an AST parser, extracts ACs and Tasks, and securely maps them without
  accumulating stale data. Emits task-traceability.json and updates the matrix.
---

# AC-to-Task Mapper (ac-to-task-mapper)

## Purpose
Automates the mapping between Acceptance Criteria (AC) and Implementation Tasks (T1, T2, etc.) in a `story.md` file. This replaces manual entry and LLM hallucinations in the `## AC-to-Task Traceability Matrix` table.

## Context & Zero-Trust Architecture
Tasks are ephemeral execution blocks, whereas source files are enduring artifacts. Therefore, this skill produces a **separate** `task-traceability.json` file rather than injecting ephemeral task IDs into the HMAC-secured `traceability.json` (which maps AC→File).

## Enforcement Maturity: Category A
This skill uses AST-based markdown parsing (`mistune` / `markdown-it-py` equivalent) to guarantee structural integrity. It completely replaces old mappings during updates to prevent stale tasks from accumulating when the implementation plan changes.

## Pipeline Integration (2-Step Sequential — MANDATORY)

> [!IMPORTANT]
> Agent MUST execute BOTH steps in sequence. Running only Step 1 or only Step 2 will leave the matrix incomplete (missing file evidence or missing task mapping respectively).

### Step 1: Traceability Linker (AC → File Code)
Scans the source code tree for `@story` tags and maps each AC to the actual implementation files and test files.

```bash
python3 .agent/scripts/auto-traceability-linker.py --story <path/to/story.md> --sync-matrix
```

**Output:**
- Updates columns: `Mapped Implementation Tasks`, `Test File Path`, `Missing Implementation?`, `Missing Test?`
- Emits: `traceability.json` + `traceability.json.sig`

### Step 2: Task Mapper (AC → Task)
Parses `story.md` to extract ACs and Tasks, then maps them using `@cover AC#` annotations.

```bash
python3 .agent/scripts/ac-to-task-mapper.py --story <path/to/story.md>
```

**Output:**
- Updates column: `Mapped Tasks`
- Emits: `task-traceability.json`

### Downstream Gate
- If `task-traceability.json` contains `[AUTO-MAP-FAILED]`, the gate must flag the story for human review.

## Rules of Engagement
1. **Explicit Mapping Over Guesswork**: The skill uses `@cover AC#` annotations in task descriptions as the primary source of truth. It does NOT use sequential guessing (AC1→T1).
2. **Safe Mutation**: The markdown table is mutated safely using AST, preserving existing file evidence links.
3. **Atomic Operations**: `story.md` writes are performed atomically via a `.tmp.md` file to prevent truncation.
4. **Clean Git Tree**: Workflows invoking this skill MUST explicitly stage and commit the updated `story.md`.
