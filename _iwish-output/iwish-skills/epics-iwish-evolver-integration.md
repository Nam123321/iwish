# Epics & Stories: I-Wish & Autoresearch Core Integration

This document outlines the epics and stories required to integrate the I-Wish self-evolving skill engine, fortified with Autoresearch's quantitative loops, into the I-Wish system.

---

## Epic 1: Autonomous Git Sandbox & Evolver Wrapper

### Story 1.1: Git Sandbox Wrapper for Skill Mutations
- **Goal**: Create a system wrapper script `git-sandbox-wrapper.sh` that checks out a temporary git branch prior to evolving any skill, executing rollback (`git reset --hard`) on failure.
- **Acceptance Criteria**:
  - AC1: Before running skill mutation (`FIX`, `DERIVED`, `CAPTURED`), checkout `evolve/<skill-name>-sandbox`.
  - AC2: Run the evolver mutation on target files.
  - AC3: If test/validation fails, run `git reset --hard` and return error.
  - AC4: If validation passes, stage edits and prepare for promotion.

### Story 1.2: SQLite and File Lineage Sync
- **Goal**: Integrate the local SQLite database of I-Wish into the I-Wish registry to record skill evolution lineages (parent-child relationships, version hashes, success scores).
- **Acceptance Criteria**:
  - AC1: Persist lineage records for every mutation step in `iwish.db`.
  - AC2: Read and write sidecar `.skill_id` files in the skill directory to keep identity portable.

---

## Epic 2: Time-Budgeted Execution & Metric Gathering

### Story 2.1: Warm-up Overhead Filtering & Time-Budget Enforcement
- **Goal**: Implement execution timing guards that skip initial warm-up steps (e.g. Docker spin-up, first embedding model load) and enforce strict time budgets.
- **Acceptance Criteria**:
  - AC1: Discard execution times of the first run (cold run) or the first few warm-up steps.
  - AC2: Measure wall-clock runtime for subsequent runs, raising a timeout if `duration >= budget`.

### Story 2.2: Prompt Density & Token Telemetry
- **Goal**: Calculate prompt compression density (character entropy/bits-per-byte) and track tokens consumed per successful task step.
- **Acceptance Criteria**:
  - AC1: Compute tokenizer-agnostic character-level entropy for prompt files.
  - AC2: Reject evolved skills that increase prompt size by more than 20% without improving success metrics.

---

## Epic 3: Error Recovery & Hermes Contract Promotion

### Story 3.1: Stack Trace Parser & Reflection Loop
- **Goal**: Write a traceback parser that extracts target lines and file positions from Python/Node stack traces, injecting them back into the evolver's prompt context.
- **Acceptance Criteria**:
  - AC1: Parse traceback logs, identifying the exact file path and line number of the crash.
  - AC2: Insert line-specific error context into the mutation prompt.

### Story 3.2: Hermes Curator Recommendation Generator
- **Goal**: Construct a utility that exports successfully validated evolved skills into a YAML recommendation file matching the I-Wish Hermes contract, prompting the user for one-click approval.
- **Acceptance Criteria**:
  - AC1: Generate a YAML file with `disposition: patch` or `disposition: merge` and a confidence score.
  - AC2: Provide a promotion script that copies the skill files from sandbox to `.agent/` upon user approval.
