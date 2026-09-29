---
name: 'prototype'
description: 'Experimental workflow for testing ideas on throwaway branches'
---

# Workflow: /prototype

> [!WARNING]
> This workflow creates a throwaway branch. DO NOT use this for production features. All changes must be "promoted" to a proper story branch if they are successful.

<steps CRITICAL="TRUE">
1. **Dirty Check**: Run `git status --porcelain`. If there are changes, run `git stash -u` to save them.
2. **Branch Creation**: Create a new branch named `proto/[short-description]`.
3. **Task Initialization**: Create or update `task.md` (written strictly to the dynamic session artifact directory or a specific sub-folder, NEVER at the workspace root directory) with `[MODE: PROTOTYPE]`.
4. **Implementation**: Build your experiment.
5. **Evaluation**:
   - If SUCCESS: Use `git diff` to extract logic and prepare for promotion.
   - If FAILURE/DONE: Run `./.agent/scripts/cleanup-proto.sh` to backup and delete the branch.
</steps>
