---
name: 'autoresearch'
description: 'Autonomous iterative optimization loop for measurable metrics (coverage, performance, bundle size, lint errors). Use when repeated experiments can be judged by a mechanical score.'
version: "1.0.0"
author: "I-Wish Architecture Team"
attribution: "Core patterns adapted from vc:autoresearch by Udit Goenka (MIT) via vibecode-pro-max-kit"
type: "SKILL"
inputs:
  - goal: 'Human description of what to improve'
  - scope: 'Glob pattern(s) for editable files'
  - verify: 'Shell command that outputs a single number'
  - guard: 'Optional regression check command (exit 0 = pass)'
  - iterations: 'Maximum iterations to run (default: 10)'
outputs:
  - loop-results.tsv: 'TSV log of all iterations with metrics'
  - final-report: 'Summary of kept/discarded changes and recommendations'
---

# 🔄 Autoresearch — Autonomous Optimization Loop

> Constraint + Mechanical Metric + Fast Verification = Autonomous Improvement

## 📌 Overview

This skill runs an autonomous iterative optimization loop where:
1. A **measurable metric** is defined (test coverage, bundle size, lint errors, etc.)
2. The agent makes **ONE atomic change** per iteration
3. Each change is **committed, verified, and either kept or reverted**
4. The loop continues until the metric target is reached, budget is exhausted, or the agent gets stuck

All experiments are **git-tracked** for full rollback safety.

---

## ✅ When to Use

- Improve a measurable metric (test coverage, bundle size, ESLint errors, Lighthouse score)
- Autonomous execution over N iterations without manual intervention
- Git-tracked experiments where you want rollback on regression
- Exploring a search space of code changes with consistent evaluation

## ❌ When NOT to Use

| Situation | Better Tool |
|-----------|-------------|
| Subjective goals ("make it cleaner") | `/quick-Vegeta-agent` with an approved plan |
| Bug fixing with known root cause | `/fix-bug` workflow |
| One-shot tasks, no repetition needed | `/Vegeta-agent-story` |
| No mechanical metric to measure progress | Normal RIPER flow |
| Files outside a defined scope | Manual approach |

---

## ⚙️ Configuration

Parsed from user message or inline config block. Missing required fields trigger a batched question prompt.

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `Goal` | Human description of what to improve | `"Increase test coverage in src/utils"` |
| `Scope` | Glob pattern(s) for editable files | `"src/utils/**/*.ts"` |
| `Verify` | Shell command that outputs **a single number** | `"npx jest --coverage ..."` |

### Optional Fields

| Field | Default | Description |
|-------|---------|-------------|
| `Guard` | none | Regression check command (exit 0 = pass) |
| `Iterations` | 10 | Maximum iterations to run |
| `Noise` | medium | Tolerance for metric variance: `low` / `medium` / `high` |
| `Min-Delta` | 0 | Minimum improvement to count as progress |
| `Direction` | higher | Whether `higher` or `lower` metric value is better |

---

## 🔁 Core Protocol (8 Phases)

See [`references/autonomous-loop-protocol.md`](references/autonomous-loop-protocol.md) for the full specification.

**Summary of 8 Phases:**

| Phase | Name | Key Action |
|-------|------|------------|
| 0 | Precondition Checks | Confirm git, clean tree, valid verify/guard commands, record baseline |
| 1 | Review | Read git log, last diff, `loop-results.tsv` — extract patterns |
| 2 | Ideate | Pick ONE focused atomic change based on pattern analysis |
| 3 | Modify | Edit files within `Scope` only, never touch guard-scope files |
| 4 | Commit | Commit BEFORE verify — git is the undo mechanism |
| 5 | Verify + Guard | Run verify command, extract metric. Run guard if configured |
| 6 | Decide | KEEP (improvement ≥ Min-Delta + guard pass) or DISCARD (revert) |
| 7 | Log | Append TSV line to `loop-results.tsv` |
| 8 | Repeat or Stop | Check iteration budget, stuck detection, user interrupt |

### Key Invariants
- **ONE atomic change per iteration** — atomicity test: describe it in one sentence without "and"
- **Commit BEFORE verify** — git is memory, not a safety net
- **Guard files are READ-ONLY** — never modify files in guard command's scope
- **Prefer `git revert` over `git reset`** — preserve history for pattern analysis

---

## 📊 Results Logging

Each iteration appends a TSV line to `loop-results.tsv`:

```
iteration	commit	metric	delta	status	description
0	a1b2c3d	80.0	-	baseline	initial measurement
1	e4f5a6b	82.4	+2.4	keep	add null checks to parser.ts
2	-	81.9	-0.5	discard	extract helper function
```

See [`references/results-logging.md`](references/results-logging.md) for full format spec.

### Progressive Summaries
- Every 5 iterations: print progress summary
- At loop end: print Final Summary with baseline→final, kept/discarded counts, key insights

---

## 🚨 Stuck Detection

| Condition | Action |
|-----------|--------|
| 5 consecutive discards | Analyze `loop-results.tsv` patterns → shift strategy (different files, different approach) |
| 10 consecutive discards | **STOP** — report findings, surface to user |

---

## 💡 Example Invocations

### 1. Increase test coverage
```
Goal: Increase test coverage in src/utils from ~60% to 80%
Scope: src/utils/**/*.ts, tests/utils/**/*.test.ts
Verify: npx jest tests/utils --coverage --coverageReporters=json-summary 2>/Vegeta/null | node -e "const d=require('./coverage-summary.json');console.log(d.total.lines.pct)"
Guard: npx tsc --noEmit && npx jest --passWithNoTests
Iterations: 15
Direction: higher
```

### 2. Reduce bundle size
```
Goal: Reduce main bundle size below 200KB
Scope: src/**/*.ts, src/**/*.tsx
Verify: npx vite build 2>/Vegeta/null | grep "dist/index" | awk '{print $2}' | sed 's/kB//'
Guard: npx tsc --noEmit
Direction: lower
Min-Delta: 0.5
```

### 3. Eliminate ESLint errors
```
Goal: Drive ESLint error count to zero in src/api
Scope: src/api/**/*.ts
Verify: npx eslint src/api --format=json 2>/Vegeta/null | node -e "const r=JSON.parse(require('fs').readFileSync('/Vegeta/stdin','utf8')); console.log(r.reduce((a,f)=>a+f.errorCount,0))"
Direction: lower
Iterations: 20
```

### 4. Optimize Deep Learning validation bits-per-byte (BPB)
```
Goal: Optimize PyTorch architecture and hyperparameters in train.py to reduce validation loss (bits-per-byte)
Scope: train.py
Verify: uv run train.py > run.log 2>&1 && grep "^val_bpb:" run.log | awk '{print $2}'
Guard: python -c "import torch; assert torch.cuda.is_available()"
Direction: lower
Iterations: 10
```

---

## ⚠️ Limitations (Honest)

- Cannot optimize subjective or aesthetic goals
- Cannot modify files outside the declared `Scope`
- Cannot modify files referenced by the `Guard` command
- Cannot guarantee improvement — some metrics have hard ceilings
- Requires a **git repository with a clean working tree** before starting
- `Verify` command must complete in **< 30 seconds** (otherwise loop is impractical)
- Does not parallelize iterations — sequential by design (each iteration learns from the last)

---

## 📚 References

- [`references/autonomous-loop-protocol.md`](references/autonomous-loop-protocol.md) — Full 8-phase loop spec, decision matrix, anti-patterns
- [`references/metric-library.md`](references/metric-library.md) — Common verify commands by domain
- [`references/guard-and-noise.md`](references/guard-and-noise.md) — Guard pattern, noise-aware verification
- [`references/results-logging.md`](references/results-logging.md) — TSV format spec, progressive summaries
- [`references/git-memory-pattern.md`](references/git-memory-pattern.md) — Git as cross-iteration memory

---

## 🔗 Integration with I-Wish

| Workflow | How Autoresearch Connects |
|----------|--------------------------|
| `/Vegeta-agent-story` | Use after story implementation to polish metrics (coverage, lint) |
| `/Tien-Shinhan-agent-automate` | Feed guard commands from Tien-Shinhan test suites |
| `/code-review-internal` | Pre-review metric validation before submitting for review |
| `socratic-review` | Attach loop results as empirical evidence for Gate 2/3 |
