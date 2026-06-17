# Story 1.1: Git Sandbox Wrapper for Skill Mutations

**Epic:** Epic 1: Autonomous Git Sandbox & Evolver Wrapper
**Story Title:** Git Sandbox Wrapper for Skill Mutations
**Goal:** Create a system wrapper script `git-sandbox-wrapper.sh` under `.agent/skills/iwish-evolver/scripts/` that implements a secure, git-backed rollback sandbox. Before applying any skill mutations, it checks out an isolated temporary branch, executes the mutation steps, and runs a hard reset (`git reset --hard`) if any step fails validation or testing, ensuring that the main codebase is never polluted with broken intermediate code.

---

## 🎯 1. Tracer Bullet Identification
**Is this a Vertical Slice?** Yes. This represents a complete vertical slice of the sandbox state machine:
1. **Script Layer**: `git-sandbox-wrapper.sh` shell script implementing branch isolation, command wrapping, error code routing, and hard resets.
2. **Git Integration**: Interacting with local repository Git references.
3. **Rollback Verification**: Ensuring failure states trigger successful resets while success states prepare files for staging.

---

## 📝 2. Acceptance Criteria (AC)
- **AC1:** **Given** the agent is about to evolve a skill, **When** `git-sandbox-wrapper.sh` is invoked, **Then** it creates and checks out a sandbox branch named `evolve/<skill-name>-sandbox` from the current HEAD.
- **AC2:** **Given** the sandbox branch is active, **When** a mutation command is executed and succeeds (returns status code 0), **Then** it retains the file changes, outputs the success code, and prepares files for validation.
- **AC3:** **Given** the mutation command or subsequent test command fails (returns non-zero status code), **When** handled by the wrapper, **Then** it immediately executes `git reset --hard HEAD` and `git checkout -` to return to the original branch, discarding all broken changes.
- **AC4:** **Given** the wrapper runs in a dirty repository, **When** invoked, **Then** it stash/saves untracked/unstaged changes, or errors out with a warning requiring a clean git state to prevent loss of user edits.

---

## 📐 3. Plan Tune Complexity Check
1. **AC Volume:** 4 (≤ 8) → 0
2. **Data Model Spread:** 0 (State managed via Git branch references) → 0
3. **UI Surface:** 0 (CLI/script only, no UI) → 0
4. **Cross-Domain:** 1 (Integrates with Git repository CLI) → 0
5. **Flow Complexity:** 1 (Branching, stashing, and rollback states) → 0
6. **Test Burden:** 1 (Testing rollback with simulated command failures) → 0
**Complexity Score (CS):** 0 (✅ OK — Proceed normally)

---

## 🔗 4. AC-to-Task Traceability Matrix
| ID  | Acceptance Criteria | Mapped Implementation Tasks | Status |
|-----|--------------------|-----------------------------|--------|
| AC1 | Sandbox Branching | Task 1: Add branch creation and checkout logic in `git-sandbox-wrapper.sh`. | ✅ Done |
| AC2 | Retaining Success | Task 2: Implement command runner and status code mapping for success states. | ✅ Done |
| AC3 | Failure Rollback | Task 3: Implement `git reset --hard` and checkout fallback logic on command failure. | ✅ Done |
| AC4 | Dirty State Handling | Task 4: Add dirty check and git stash/unstash wrapper around sandbox sessions. | ✅ Done |
| ALL | Skill Documentation | Task 5: Add detailed usage instructions for this sandbox wrapper in `SKILL.md`. | ✅ Done |

---

## 💬 5. Socratic Review Synthesis Summary
- **Sandbox Strategy**: Relying on Git's native tree state management is far more robust and faster than manually backing up files to temporary folders. It ensures that multi-file changes (like modifying both code and tests) are rolled back atomically.
- **Branch Naming**: Namespace prefix `evolve/` isolates evolution branches from typical feature branches, making it easy to prune or clean up old sandbox branches.
- **Stash Safety**: Using `git stash` ensures developer edits are not lost if the evolution loop starts while the workspace is dirty.

---

## 🛡️ 6. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---|---|
| Functional Correctness | 9 | Uses native git operations for rollback; atomic restoration of directory tree states. |
| Data Integrity & State | 10 | Git ensures absolute data integrity. Zero risk of leaving corrupted partial files. |
| Security & Validation | 9 | Runs locally, no network vectors. Validates shell injection risks in target inputs. |
| Performance & Scalability | 9 | Git branch switching takes less than 20ms on modern filesystems. |
| Error Handling & Recovery | 10 | The entire design is centered on robust error recovery and automated rollback. |
| Architectural Depth & Leverage | 9 | Lays down the foundation for the entire safe, autonomous learning cycle. |
| UX Empathy | 8 | Prevents developer workspace pollution. Safe to run in active projects. |

**TOTAL AVERAGE: 9.14/10 (PASS)**

### Architectural DNA Check:
- [x] **Tracer Bullet?** Yes (Wrapper script → branch switch → mock execution → rollback verification).
- [x] **Deletion Testable?** Yes (deleting sandbox wrapper leaves evolver exposed to uncommitted file corruptions).
- [x] **Interface vs Implementation?** Yes (script wrapper interface is simple command invocation).

---

**Status:** `DONE`
