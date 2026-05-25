---
name: 'setup-git-worktree'
description: 'Enables parallel agent execution by isolating feature branches into separate Git worktree directories. Prevents branch collision and allows concurrent development.'
---

# Git Worktree Isolation Workflow

**Goal:** Set up an isolated working directory for a feature task using `git worktree`, allowing multiple agents to work on different features simultaneously without interfering with each other's branches or files.

> [!IMPORTANT]
> This workflow is for **parallel execution scenarios only**. For standard single-agent development, use the normal branching workflow. This is most useful when Krillin's Pulse Supervisor needs to dispatch multiple Vegeta instances across different stories.

---

## Prerequisites

- Git version 2.15+ (supports `git worktree` natively)
- A clean `main` or `develop` branch as the base
- The target feature/story has been assigned a unique `task_id`

---

## Step 1: Verify Worktree Support

```bash
git worktree list
# Should show at least the main working tree
# If command not found, upgrade Git to 2.15+
```

---

## Step 2: Create Isolated Worktree

Create a new worktree in a sibling directory. The naming convention is `.worktrees/feature-{task_id}`.

```bash
# Variables (set by dispatcher)
TASK_ID="S-1.2"          # Story/task identifier
BRANCH_NAME="feature/${TASK_ID}"
WORKTREE_DIR="../.worktrees/feature-${TASK_ID}"

# Create the worktree with a new branch from the latest main
git fetch origin main
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}" origin/main
```

**Result:** A fully isolated directory at `../.worktrees/feature-S-1.2/` with its own branch, independent of the main working tree.

---

## Step 3: Agent Execution Boundary

The dispatched Agent (Vegeta) MUST operate **exclusively** within the worktree directory:

```bash
cd "${WORKTREE_DIR}"

# All file operations, builds, and tests happen HERE
# The agent's {project-root} for this session is ${WORKTREE_DIR}
```

**Hard Rules:**
- **DO NOT** modify files in the main working tree from within a worktree session.
- **DO NOT** run `git checkout` inside a worktree (it will corrupt state). Each worktree is locked to its branch.
- **DO** run `git pull --rebase origin main` before pushing to catch drift.

---

## Step 4: Commit, Push & Create PR

Once the Agent completes its task (or hits the 90/120 minute time budget):

```bash
cd "${WORKTREE_DIR}"
git add -A
git commit -m "feat(${TASK_ID}): <description>"
git push origin "${BRANCH_NAME}"

# Create PR targeting main
gh pr create --base main --head "${BRANCH_NAME}" \
  --title "feat(${TASK_ID}): <title>" \
  --body "Implements ${TASK_ID}. Created via parallel worktree execution."
```

---

## Step 5: Cleanup Worktree

After the PR is merged (or abandoned), remove the worktree to free disk space:

```bash
# From the MAIN working tree (not from inside the worktree)
git worktree remove "../.worktrees/feature-${TASK_ID}" --force
git branch -D "feature/${TASK_ID}"  # Delete local branch if merged
```

**Batch cleanup** (for Krillin/Pulse to run periodically):
```bash
# Remove all worktrees whose branches have been merged
git worktree list --porcelain | grep 'worktree' | while read -r _ dir; do
  branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
  if git branch --merged main | grep -q "$branch"; then
    git worktree remove "$dir" --force 2>/dev/null
    echo "Cleaned: $dir ($branch)"
  fi
done
```

---

## Integration with Krillin Pulse

When dispatching parallel tasks, the Pulse Supervisor in `SKILL-devops.md` should:

1. Check `AVAILABLE` worker slots (based on system resources or configured `MAX_WORKERS`).
2. For each dispatchable story, call this workflow to set up the worktree.
3. Launch the Agent session targeting the worktree directory.
4. Monitor progress via the 45-90-120 time budget gates.
5. After PR merge, trigger cleanup and the Continuous Learning scan (Section 5 of `SKILL-devops.md`).

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---|---|
| Run `git checkout` inside a worktree | Use separate worktrees for each branch |
| Share node_modules across worktrees | Run `npm install` / `pnpm install` per worktree |
| Forget to clean up after merge | Use batch cleanup script or Krillin automation |
| Create worktrees for sequential tasks | Use normal branching for single-agent work |
