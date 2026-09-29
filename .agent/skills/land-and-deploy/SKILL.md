---
name: "land-and-deploy"
description: "Structured checklist for safely merging code to main branch, confirming CI checks, and releasing to production. Prevents accidental broken merges."
---

# Land-and-Deploy Skill

The **Land-and-Deploy** skill provides a deterministic pre-merge and release checklist. It ensures that no code lands on the main branch without passing all quality gates. Adapted from Gstack's `land-and-deploy` and `ship` (Plan Completion Audit) patterns.

## Purpose

Prevent broken merges, incomplete features, and undocumented releases by enforcing a strict landing protocol before code enters the main branch.

## The Landing Protocol

### Step 1: Plan Completion Audit

Before attempting to merge, verify that the story/epic is truly complete:

**[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/validate-plan-completion.py <story_id>`.
If this fails, HALT. No merge allowed.

```markdown
## Plan Completion Audit

- [ ] All tasks/subtasks in the story are marked `[x]`
- [ ] All Acceptance Criteria are verified (manual or automated)
- [ ] No TODO/FIXME/HACK comments remain in changed files
- [ ] No `console.log` or debug statements in production code
- [ ] All new files are properly exported and imported

**Completion Score:** [X/Y items] = [percentage]%
**Rule:** Must be 100% to proceed. No exceptions.
```

### Step 2: Code Quality Gate

**[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/validate-code-quality.py <story_id>`. 
This script must pass before proceeding. It verifies:

| Check | Tool/Method | Required |
|-------|-------------|----------|
| **TypeScript Compilation** | `tsc --noEmit` or `pnpm build` | ✅ Must pass |
| **Linting** | `pnpm lint` | ✅ Must pass |
| **Unit Tests** | `pnpm test` | ✅ Must pass |
| **Integration Tests** | `pnpm test:integration` (if applicable) | ✅ Must pass |
| **Code Review** | `/review` workflow completed | ✅ Must pass |
| **Security Scan** | No new critical vulnerabilities | ✅ Must pass |

### Step 3: Documentation Check

| Item | Status |
|------|--------|
| **Story file** updated with final status | ☐ |
| **Sprint status** updated | ☐ |
| **Feature hierarchy** exists and is current (`2. Product Planning/2.5. feature-hierarchy.md`) | ☐ |
| **Changelog** entry added (if applicable) | ☐ |
| **API docs** updated (if API changed) | ☐ |
| **Migration notes** documented (if DB changed) | ☐ |

### Step 4: Merge Execution & Version Bump

1. **Rebase** on latest main (resolve conflicts if any).
2. **Final CI run** passes on the rebased branch.
3. **Version Bump**: Calculate the new semantic version by running:
   `python3 .agent/scripts/semver-bump.py --current $(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g') --type <major|minor|patch>`
   Update `package.json` or equivalent version tracking files.
4. **Squash merge** with a descriptive commit message following conventional commits:
   ```
   feat(module): short description (#PR-number)
   
   - Detailed change 1
   - Detailed change 2
   
   Closes: STORY-X.Y
   ```
5. **Delete** the feature branch after merge.

### Step 5: Post-Merge Verification & Changelog

1. Verify main branch CI is green after merge.
2. Deploy to staging (invoke `canary` skill if production deploy).
3. Smoke test the deployed changes.
4. **Update Changelog**: Generate the changelog by running:
   `python3 .agent/scripts/generate-changelog.py --since <LAST_TAG>`
   Append the output to `CHANGELOG.md`.
5. Update sprint-status.yaml: story → `done`, deployment → `deployed`.

## Landing Report Template

After a successful landing, produce this report:

```markdown
## Landing Report

| Field | Value |
|-------|-------|
| **Story** | [Story ID and title] |
| **Branch** | [branch name] |
| **Merged At** | [timestamp] |
| **Commit** | [hash] |
| **CI Status** | ✅ Green |
| **Deployed To** | [staging/production] |

### Changes Summary
- [Bullet list of key changes]

### Risks & Mitigations
- [Any known risks and how they were mitigated]

### Metrics Impact
- [Expected impact on key metrics, if applicable]
```

## When to Invoke

- When a story reaches `done` status and is ready to merge.
- Before any merge to the main/production branch.
- As the final step in `/dev-agent-story` before updating the walkthrough.

## Integration with Canary Skill

For production deployments, this skill hands off to the `canary` skill after Step 4 (Merge Execution). The flow is:

```
Land-and-Deploy (Steps 1-4) → Canary (Phases 1-4) → Landing Report (Step 5)
```
