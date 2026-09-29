---
name: tournament
description: Parallel A/B Tournament orchestrator workflow. Solves the task by launching multiple candidate plugins in parallel branched workspaces, grading their output, and merging the user's choice.
---

# ⚔️ `/tournament` A/B Tournament Orchestrator Workflow

## 📌 OVERVIEW
The `/tournament` workflow allows parallel execution of identical coding, debugging, or design tasks using multiple candidate plugins/workflows (e.g., `Superpower`, `vibecode-pro-max`, `native`). Candidates compete under isolated conditions, and their results are automatically evaluated by a validation gate before final human selection and merging.

**Usage (CLI Style):** `/tournament --task "Task description" --candidates "plugin1, plugin2, native"`
**Usage (Natural Language Style):** `/tournament [Task Description] với các module [plugin1, plugin2, và native]` (e.g., `/tournament Thiết kế trang Login với các module ui-ux-pro-max, taste-skill, và native`)

---

## 🚦 INITIALIZATION
1. **Validate Input:** Ensure the target task instruction is provided and candidates list is specified (default includes `native` if unspecified).
2. **Retrieve Current State:** Verify the git working directory is clean. Ensure `git status` reports no untracked or uncommitted changes.
3. **Workspace Configuration:** Establish the baseline branch/commit from which candidate branches will diverge.

---

## ⚔️ THE 5-PHASE TOURNAMENT PIPELINE

### Phase 1: ARENA SETUP (Git Isolation)
- **Objective:** Create clean, isolated sandbox environments for each candidate.
- **Action:**
  1. For each candidate in `{candidates}`:
     - Generate a safe branch name: `tournament/{task-slug}/{candidate-name}`.
     - Create and switch to the new branch: `git checkout -b tournament/{task-slug}/{candidate-name}`.
     - Record starting commit hash.
  2. Return to the baseline branch.
- **Gate:** All tournament branches must be successfully created from the same base commit.

### Phase 2: AGENT DISPATCH (Parallel Subagents)
- **Objective:** Run candidates in parallel without interfering with each other.
- **Action:**
  1. Invoke `invoke_subagent` for each candidate:
     - **TypeName:** `self` (or designated subagent type).
     - **Role:** `{candidate-name} Competitor`.
     - **Workspace:** `branch` (Instruct the subagent to run on its isolated `tournament/{task-slug}/{candidate-name}` branch).
     - **Prompt:** Provide the task description, and inject candidate-specific prompt templates, skills, or guidelines.
  2. Subagents execute the task in parallel.
- **Gate:** Subagents must complete execution or reach the maximum configured execution timeout.
- **State Check:** Check the status of each subagent conversation. Capture output logs.

### Phase 3: RESOLUTION GATE (Validation & Grading)
- **Objective:** Evaluate each candidate's outputs using automated tools and a dedicated grading agent.
- **Action:**
  1. For each completed candidate branch:
     - Collect git diff: `git diff baseline...tournament/{task-slug}/{candidate-name}`.
     - Run the test suite: `npm test` or specified validation command.
     - Scan for lint errors and compiler warnings.
  2. Invoke `review-agent` (using `.agent/skills/qa-simulator-guardian`) to evaluate each candidate based on a standardized 4-metric system:
     - **Adherence to Requirements (30%)**: Did the candidate satisfy all prompt instructions?
     - **Code Quality & Design (30%)**: Cleanliness, consistency with existing codebase, comments.
     - **Performance & Security (20%)**: Adherence to security guidelines (no external leaking, minimal overhead).
     - **Automated Validation PASS (20%)**: Test suite completion, compilation validation.
  3. Generate the **Tournament Scorecard** (detailed matrix of candidates, grades, pros/cons, and test statuses).
- **Output:** Save the scorecard to `_iwish-output/tournaments/{task-slug}-scorecard.md`.

### Phase 4: HUMAN CHECKPOINT (Selection)
- **Objective:** Allow the user to review findings and select the final codebase modifications.
- **Action:**
  1. Present the Tournament Scorecard to the user. Include:
     - Grade / Score for each candidate.
     - Code diff highlights.
     - Test run output links.
  2. 🛑 **HUMAN CHECKPOINT:** Ask the user to choose:
     - `[Option 1]` Approve & Merge Candidate A.
     - `[Option 2]` Approve & Merge Candidate B.
     - `[Option 3]` Keep native (baseline) execution / Abort tournament.
- **Wait for Input:** The workflow halts until the user makes a selection.

### Phase 5: MERGE & CLEANUP
- **Objective:** Apply the approved candidate's code and clean up the arena.
- **Action:**
  1. Switch to the baseline branch.
  2. Merge the winning branch: `git merge tournament/{task-slug}/{winning-candidate-name} --no-ff`.
  3. Resolve any unexpected merge conflicts (should be minimal due to isolated baseline).
  4. Delete the tournament branches: `git branch -D tournament/{task-slug}/{candidate-name}` for all candidates.
  5. Close all subagent conversation contexts.
- **Gate:** Git merge completes cleanly and all tournament branches are deleted.

---

## 🚫 ERROR HANDLING & GATES
- If a candidate subagent fails or times out, it receives a score of `0` for validation, but its partial changes (if any) can still be audited if the user desires.
- If no subagents complete successfully, the tournament reverts to baseline, emitting a warning.
