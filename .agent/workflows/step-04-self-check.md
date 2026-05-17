---
name: 'step-04-self-check'
description: 'Self-audit implementation against tasks, tests, AC, and patterns'

nextStepFile: './step-05-adversarial-review.md'
---

# Step 4: Self-Check

**Goal:** Audit completed work against tasks, tests, AC, and patterns before external review.

---

## AVAILABLE STATE

From previous steps:

- `{baseline_commit}` - Git HEAD at workflow start
- `{execution_mode}` - "tech-spec" or "direct"
- `{tech_spec_path}` - Tech-spec file (if Mode A)
- `{project_context}` - Project patterns (if exists)

---

## SELF-CHECK AUDIT

### 0. Compilation Check

- [ ] Run the project's build command (`pnpm build`, `nest build`, or `tsc --noEmit`)
- [ ] Ensure NO `MODULE_NOT_FOUND` or type errors exist
- [ ] If compilation fails, HALT and fix before continuing

### 0.1. Linting & Auto-Repair

- [ ] Run `npm run lint:fix` to ensure all files follow the project's style guide.
- [ ] **Auto-Repair Protocol**: If linter finds errors, you MUST attempt to fix them using `lint:fix` at least twice.
- [ ] If errors persist, HALT and inform the user.

### 1. Tasks Complete

Verify all tasks are marked complete:

- [ ] All tasks from tech-spec or mental plan marked `[x]`
- [ ] No tasks skipped without documented reason
- [ ] Any blocked tasks have clear explanation

### 2. Tests Passing

Verify test status:

- [ ] All existing tests still pass
- [ ] New tests written for new functionality
- [ ] No test warnings or skipped tests without reason

### 3. Acceptance Criteria Satisfied

For each AC:

- [ ] AC is demonstrably met
- [ ] Can explain how implementation satisfies AC
- [ ] Edge cases considered

### 4. Patterns Followed

Verify code quality:

- [ ] Follows existing code patterns in codebase
- [ ] Tuân thủ tuyệt đối hành vi UX/UI quy định trong `ux-patterns.yaml` (nếu là UI Feature). KHÔNG lạm dụng/vi phạm hoặc tự chế Animation/Behavior.
- [ ] Follows project-context rules (if exists)
- [ ] Error handling consistent with codebase
- [ ] No obvious code smells introduced

### 5. Intelligence Graph Refresh (MANDATORY IF AVAILABLE)

Verify knowledge graphs are updated with your changes:
- [ ] **FeatureGraph**: If `add_feature_relationship` MCP tool is available, did you explicitly add any newly discovered dependencies?
- [ ] **CodeGraphContext**: If `add_code_to_graph` MCP tool is available, did you refresh the graph with ALL files modified or created during this execution?

### 6. Code-to-Spec Parity Check (Hybrid Drift Trigger)

Verify that the implemented code aligns with the original tech-spec or Acceptance Criteria.
- [ ] Check if significant drift occurred during coding (e.g., new tables, new APIs, changed logic not in spec).
- [ ] Calculate the Drift Score using the Two-Stage Scoring Engine (Stage 1: FeatureGraph Gate, Stage 2: Point-Matrix).
- [ ] Present the Drift Score to the User and explicitly STOP execution (e.g., using `request_feedback` tool flag) to allow User Override.
- [ ] **Pause & Spawn (Option D):** If the final Drift Score > 7, you MUST update `task.md` with `[PAUSED - WAITING FOR DRIFT SYNC]`, run `git stash -u` to protect local changes, then PAUSE execution. Output a clear instruction to the User: "Drift detected. Please open a NEW CHAT SESSION to update the PRD/Story/FeatureGraph. When done, return here and type 'continue'".
- [ ] **Context Refresh (Resume):** When the User types 'continue', first read `task.md` to recover your execution state. Then you MUST run `git stash pop`, instruct the user to resolve any conflicts, and CRITICALLY use `git diff --name-only stash@{0}^!` or `git status` to identify EXACTLY which files were modified in the other session, then run `view_file` on them to refresh your Context Window before continuing.

---

## UPDATE TECH-SPEC (Mode A only)

If `{execution_mode}` is "tech-spec":

1. Load `{tech_spec_path}`
2. Mark all tasks as `[x]` complete
3. Update status to "Implementation Complete"
4. Save changes

---

## IMPLEMENTATION SUMMARY

Present summary to transition to review:

```
**Implementation Complete!**

**Summary:** {what was implemented}
**Files Modified:** {list of files}
**Tests:** {test summary - passed/added/etc}
**AC Status:** {all satisfied / issues noted}

Proceeding to adversarial code review...
```

---

## NEXT STEP

Proceed immediately to `step-05-adversarial-review.md`.

---

## SUCCESS METRICS

- All tasks verified complete
- All tests passing
- All AC satisfied
- Patterns followed
- Tech-spec updated (if Mode A)
- Summary presented

## FAILURE MODES

- Claiming tasks complete when they're not
- Not running tests before proceeding
- Missing AC verification
- Ignoring pattern violations
- Not updating tech-spec status (Mode A)
