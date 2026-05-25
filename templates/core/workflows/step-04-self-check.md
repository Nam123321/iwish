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

### 2.5. Runtime Testing Gate (Mandatory — Critical Path Enforcement)

Classify the blast radius of your changes against the risk matrix below. ANY Critical-risk pattern detected in the diff → the **entire PR requires `runtime-verified`** status. Do NOT proceed to AC verification if a required gate is missing.

| Risk Level | Patterns (if your diff touches these) | Required Verification |
|---|---|---|
| **🔴 Critical** | Payment/billing logic, Auth/session/JWT, Data deletion/migration, Crypto/credentials handling | `runtime-verified` (e2e or integration test logs MUST exist) |
| **🟠 High** | Polling loops, WebSocket/SSE, State machines, Form handlers, API endpoints with side effects | `runtime-verified` (dev server must have been started and tested) |
| **🟡 Medium** | UI components, CSS/styling, Routes, Config/env vars, DB read queries | `runtime-verified` if dev env available; `self-assessed` otherwise |
| **🟢 Low** | Docs, comments, types-only changes, test files, linter config, agent prompts | `self-assessed` (unit tests sufficient) |

**Gate Logic:**
- [ ] Identified the highest risk level touched by this implementation
- [ ] If **Critical or High**: Verified that runtime test logs or e2e results exist. If missing → **BLOCK. Do NOT proceed.** Add a comment to the story: `⛔ BLOCKED: Runtime verification required for [pattern]. Run integration/e2e tests before marking complete.`
- [ ] If **Medium**: Checked if dev environment is available. If yes, ran runtime tests. If no, documented `self-assessed` justification.
- [ ] Recorded verification status in the Implementation Summary section below.


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

### 6. Instinct Logging (Whis Capability Enhancement)

If during self-check you discovered any mistakes, wrong patterns, or lessons learned:
- [ ] Append a Dense JSONL record to `.agent/memory/instincts.jsonl`:
  `{"ts":"YYYY-MM-DD","src":"self-check","ctx":"tags","bad":"mistake","good":"fix","sev":1-5,"file":"path"}`
- [ ] If FeatureGraph available: Create `(:Instinct)` node with `[:AFFECTS]` edge.

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
