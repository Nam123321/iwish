# Git as Long-Term Memory

Git history is the loop's only persistent memory across iterations. Read it every time.

> **Source:** Adapted from `vc:autoresearch` (vibecode-pro-max-kit, MIT)

## Required Reads — Every Iteration

Run at the start of Phase 1 (Review) without exception:

```bash
git log --oneline -20              # what changed and in what order
git diff HEAD~1                    # exact diff of last iteration
cat loop-results.tsv               # metric trend + keep/discard record
```

## Pattern Recognition

### Exploit Successful Patterns
- Same file category that improved → try adjacent files
- Same technique (e.g. adding edge-case tests) → apply to untouched functions
- Larger delta correlates with specific module → prioritize that module

### Avoid Failed Patterns
- File + technique combination that was discarded → do not retry
- Zero-delta changes → skip unless required by guard
- Oscillating metric on a file → leave it, move elsewhere

### Detect Diminishing Returns
If last 5 kept iterations all have `delta < Min-Delta * 2`, the low-hanging fruit is gone.

## Commit Message Convention

```
loop(iter-N): <one-line description>
```

## Revert vs Reset

| Command | Preserves history | Use when |
|---------|------------------|----------|
| `git revert HEAD --no-edit` | Yes | Default discard path |
| `git reset --hard HEAD~1` | No | Revert conflicts only |

Always prefer `git revert`. History preservation enables pattern analysis.
