# Guard Pattern & Noise-Aware Verification

> **Source:** Adapted from `vc:autoresearch` (vibecode-pro-max-kit, MIT)

## Guard Pattern (Regression Prevention)

The verify command measures improvement. The guard command confirms nothing else broke.

**Separation of concerns:**
- Verify = "did the target metric improve?"
- Guard = "did anything else break?"

### How It Works

1. Baseline run: guard command must exit 0 before loop starts
2. After verify succeeds (Phase 5.5), run guard command — BEFORE the keep/discard decision
3. If guard exits non-zero: trigger recovery flow

### Guard Recovery Flow

```
Guard fails →
  revert to previous commit →
  rework attempt 1 (different approach) →
    if guard fails again →
  rework attempt 2 (minimal change) →
    if guard fails again →
  discard (log status: guard-failed)
```

**Rules:**
- Guard files are **READ-ONLY**. Never modify test files, spec files, or guard scripts.
- Guard failure means the optimization is wrong, not that the guard is wrong.
- Never relax the guard — fix it before starting the loop.

### Common Guard Commands

| Stack | Guard Command |
|-------|--------------|
| Node.js | `npm test` |
| Python | `pytest` |
| Go | `go test ./...` |
| Rust | `cargo test` |
| TypeScript | `tsc --noEmit && npm test` |

---

## Noise-Aware Verification

### Noise Levels

| Level | Description | Strategy |
|-------|-------------|----------|
| Low | Deterministic (LOC, lint count) | Single run, trust result |
| Medium | Slight variance (build time ±5%) | 2 runs, use worse result |
| High | High variance (API latency, ML) | 3-5 runs, use median |

### Default Min-Delta Thresholds
- Low noise: 0 (any improvement counts)
- Medium noise: 1-2% of baseline
- High noise: 3-5% of baseline
