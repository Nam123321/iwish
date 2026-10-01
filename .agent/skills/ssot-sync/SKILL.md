---
name: ssot-sync
description: >
  Manual SSOT & GitHub synchronization skill. Use when the user invokes `/sync` to 
  save all SSOT documentation files and/or push code to GitHub. Acts as a safety net 
  when automated checkpoints (in /review or /approve-qa) are missed or when the user 
  wants to manually trigger a data preservation checkpoint.
---

# 🔄 SSOT Sync Skill

One-command data preservation for both SSOT documentation and source code.

## When to Use
- User explicitly invokes `/sync`
- User says "save", "đồng bộ", "commit", "push"
- Agent detects it forgot to run a checkpoint
- Before ending a long session with many file changes

## Execution Steps

### Step 1: SSOT Nested Repo Sync
Run the SSOT Sync Guard to commit all `_iwish-output/` changes to the nested repo:

```bash
python3 .agent/scripts/ssot-sync-guard.py --auto-commit
```

**Interpret exit codes:**
- `0` = Clean (nothing to commit) or auto-committed successfully
- `1` = Changes detected but not committed (should not happen with `--auto-commit`)
- `2` = FATAL: nested repo not initialized → Run: `cd _iwish-output && git init && git add . && git commit -m "init"`

Report the result to the user with counts of new/modified/deleted files.

### Step 2: Code Repo Status Check
Show the user what code changes exist in the main (parent) Git repo:

```bash
git status --short
```

Categorize the output:
- **Staged changes** (ready to commit)
- **Unstaged changes** (modified but not staged)
- **Untracked files** (new files not yet added)

### Step 3: User Decision Gate
Present the user with a summary and ask what to do:

```
🔄 Sync Report:
  SSOT Repo: ✅ X files committed
  Code Repo: Y staged, Z modified, W untracked

What would you like to do?
1. Commit & Push code to GitHub
2. Commit code locally only (no push)
3. Skip code sync (SSOT already saved)
```

### Step 4: Execute Code Sync (if user chooses 1 or 2)

**4a. Scope-based staging** (prevent Cross-Contamination):
- The agent MUST NOT use `git add .`
- Instead, use `git status --porcelain` to list changed files
- Filter to only files in `src/`, `__tests__/`, `prisma/`, `scripts/`, `.agent/`, and story-specific paths
- Exclude: `node_modules/`, `.env`, `_iwish-output/` (already in .gitignore), temp files

**4b. Commit:**
```bash
git add <filtered-files>
git commit -m "chore(sync): manual checkpoint - <brief description>"
```

**4c. Push (only if user chose option 1):**
```bash
git push origin HEAD
```

### Step 5: Verification
After sync, display a final status:

```bash
echo "=== SSOT Repo ==="
cd _iwish-output && git log --oneline -1 && echo "Tracked files: $(git ls-files | wc -l)"
echo ""
echo "=== Code Repo ==="
cd .. && git log --oneline -1 && git status --short | head -5
```

## Error Handling

| Error | Action |
|-------|--------|
| Nested repo not found | Prompt user to initialize: `cd _iwish-output && git init && git add . && git commit -m "init"` |
| No remote origin | Skip push, commit locally only. Warn user. |
| Merge conflicts | HALT. Show conflict files. User must resolve manually. |
| Permission denied | Warn user that `.agent/` files may need `sudo`. |

## Anti-Patterns (DO NOT)
- ❌ Never `git add .` in the code repo
- ❌ Never `git add _iwish-output/` in the code repo (it's in .gitignore)
- ❌ Never `git clean -fdx` (destroys nested repo)
- ❌ Never push without user explicit consent
