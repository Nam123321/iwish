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

# Create the worktree with a new branch from the latest master
git fetch origin master
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}" origin/master
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

## Step 4: Mandatory SSOT Hydration & Dependency Setup (Post-Setup)

Ngay sau khi worktree được tạo, Agent BẮT BUỘC phải chạy quy trình `/worktree-init` (hoặc `/sync-ssot-worktree` và cài đặt dependencies) để chuẩn bị môi trường:

```bash
# Thực thi worktree-init để symlink SSOT và cài đặt dependencies:
# Hoặc chạy trực tiếp:
pnpm install --frozen-lockfile --prefer-offline
```
> [!IMPORTANT]
> Bước này là sống còn! Nếu bỏ qua, worktree sẽ không thể đọc được Story AC, Data Spec, UI Spec và môi trường `node_modules` sẽ bị thiếu khiến quá trình build/test bị gián đoạn.

---

## Step 5: Bàn giao (Handoff) cho quy trình `/approve-qa`

Quá trình Push code, tạo PR (gh pr create) và dọn dẹp Worktree (Cleanup) KHÔNG ĐƯỢC PHÉP thực hiện ở đây. 
Mọi tác vụ đóng gói, lưu trữ và đẩy code lên Github được bàn giao độc quyền cho quy trình **`/approve-qa`** sau khi tính năng đã hoàn thiện và vượt qua các bài test.

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
