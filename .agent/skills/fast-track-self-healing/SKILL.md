---
name: fast-track-self-healing
description: Automates compilation checks and retries for agent-generated code with a strict 3-retry limit.
---

# Fast-Track Self-Healing Loop

This skill is **enforced by executable scripts**, not by agent text interpretation.

## Executable Entry Points

| Script | Location | Purpose |
|--------|----------|---------|
| `self-healing-runner.py` | `.agent/scripts/self-healing-runner.py` | Test execution wrapper with retry tracking, failure classification, and hard-block enforcement |
| `validate-qa-evidence.py` | `.agent/scripts/validate-qa-evidence.py` | Evidence validator with Gate 0 (Loop Integrity) that checks `qa-loop.json` |

## Usage (from target project root)

### 1. Gate Check (before running tests)
```bash
python3 ../iwish/.agent/scripts/self-healing-runner.py check <epic_id> <story_id>
# Exit 0 = GATE OPEN, ready to run
# Exit 1 = GATE BLOCKED, retries exhausted
```

### 2. Run Tests with Tracking
```bash
python3 ../iwish/.agent/scripts/self-healing-runner.py run <epic_id> <story_id> -- npx playwright test <test_files>
```
The script:
- Increments `attempts` in `.agent/cache/qa-loop.json` BEFORE running
- Executes the test command
- If PASS: sets status to `Pending_Approval`, exits 0
- If FAIL: classifies failure (Type1_ScriptFailure or Type2_AppBug), outputs HEALING REPORT JSON, exits 1
- If attempts >= 3: sets status to `Exhausted`, exits 1 with `action: HALT`

### 3. Reset State (after user decision)
```bash
python3 ../iwish/.agent/scripts/self-healing-runner.py reset <epic_id> <story_id>
```

### 4. Check Status
```bash
python3 ../iwish/.agent/scripts/self-healing-runner.py status <epic_id> <story_id>
```

## Failure Classification

The runner classifies failures automatically:

| Type | Patterns Detected | Agent Action |
|------|-------------------|--------------|
| `Type1_ScriptFailure` | Timeout, selector not found, strict mode violation, assertion mismatch | Fix test script, re-run |
| `Type2_AppBug` | HTTP 5xx, ECONNREFUSED, TypeError in app, Prisma error | Invoke `/fix-bug`, re-run |

## State Machine

```
Initialized → Running → Pending_Approval (PASS)
                     ↘ Healing (FAIL, retries left) → Running → ...
                     ↘ Exhausted (FAIL, no retries) → HALT
```

## Anti-Bypass Enforcement

The `validate-qa-evidence.py` Gate 0 checks:
- If `qa-loop.json` exists and matches the current story
- If status is `Exhausted`, validation is **blocked** (hard fail)
- This prevents agents from bypassing the retry system by skipping `self-healing-runner.py`
