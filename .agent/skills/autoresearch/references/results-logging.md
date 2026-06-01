# Results Logging

## TSV Format

One row per iteration. Tab-separated. Header row required.

```
iteration	commit	metric	delta	status	description
```

### Column Definitions

| Column | Type | Notes |
|--------|------|-------|
| iteration | integer | 0-indexed. 0 = baseline. |
| commit | string | Short SHA (7 chars) or `-` if discarded/crashed |
| metric | float | Measured value from verify command |
| delta | float | Signed change from previous best. `-` for baseline. |
| status | enum | See status values below |
| description | string | One sentence: what was attempted |

### Status Values

| Status | Meaning |
|--------|---------|
| `baseline` | Initial measurement before any changes |
| `keep` | Improvement passed guard, committed |
| `keep (reworked)` | Failed guard first, reworked, then passed |
| `discard` | No improvement or below min-delta |
| `guard-failed` | Metric improved but guard failed; reverted |
| `crash` | Verify command errored or timed out |
| `no-op` | Below min-delta threshold |

### Progressive Summaries

**Every 5 iterations:**
```
--- Progress @ iteration 5 ---
Best so far: 751 (baseline: 842, -10.8%)
Kept: 3  |  Discarded: 1  |  Crashed: 1
```

**Final Summary:**
```
--- Final Summary ---
Baseline → Final: 842 → 741 (-11.9%, -101 units)
Iterations: 7 total  |  Kept: 4  |  Discarded: 1  |  Crashed: 1
Best single iteration: #7 lazy-load admin chunk (-20)
Key insight: Dependency replacement yielded most gains
```
