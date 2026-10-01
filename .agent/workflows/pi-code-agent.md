---
name: pi-code-agent
description: Native Pi/OMP-inspired task executor with bounded working sets, deterministic validators, and redacted receipts
disable-model-invocation: true
---

# /pi-code-agent

Native iWish execution profile inspired by Pi and Oh My Pi. It runs inside the active IDE agent and does not require an OMP/Pi provider key.

This workflow is an execution option after a user-approved plan. Plan approval authorizes the approved scope only; it does not authorize a new engine, external API key, elevated tool, destructive merge, or skill activation.

## Platform Setup Gate

Before dispatch, run `platform_profile_manager.py detect --root .`. If the
current IDE has no `configured` profile, halt and show its platform-specific
Core 4 setup: `default`, `planner`, `worker`, and `reviewer`. The user selects
the available model identifiers and explicitly confirms setup. Optional roles
inherit deterministically: scout from planner, security from reviewer, cleanse
from worker, and learning from default. A configured Antigravity profile never
authorizes Codex or Claude Code, and model availability must be re-confirmed
when the current host reports drift.

## Entry gate

Use the governed dispatcher before the task loop:

```bash
python3 scripts/dispatch-code-engine.py \
  --engine pi-code-agent \
  --story-dir "<story_dir>" \
  --root . \
  --platform "<active_platform>" \
  --invocation-profile flow-story \
  --caller-capability flow-stage-3b-code \
  --caller-source .agent/workflows/flow-stage-3b-code.md \
  --output "<story_dir>/execution/pi-code-agent/handoff.json"
```

For a detected but unconfigured platform, use the setup manager only after the
user has chosen models:

```bash
python3 .agent/scripts/pi-code-agent/platform_profile_manager.py configure \
  --root . --platform "<codex|antigravity|claude-code>" --confirm \
  --model "default=<model>" --model "planner=<model>" \
  --model "worker=<model>" --model "reviewer=<model>"
```

The dispatcher creates the pinned capability catalog, bounded working set, and
per-task contracts. It does not fabricate accepted receipts; the active IDE
agent must perform the edits and validators below.

For direct manual use, first resolve `manual-approved-plan` or `manual-adhoc`
with `.agent/scripts/pi-code-agent/resolve_invocation_context.py`, a
project-local caller source, and a Watchmen-signed authorization receipt. For
`/fix-bug`, the same resolver requires the `fix-bug` profile and a signed
SBRP-derived authorization receipt. A global Codex bridge from another iWish
checkout is rejected as a caller; direct slash intent is never authorization.

1. Verify the Stage 3A handoff file `<story_dir>/plan-approved-evidence.json`.
2. Verify `<story_dir>/impl-plan.json` exists and is the machine contract for this run.
3. Assign a unique `run_id`, task lease, worktree scope, and artifact namespace.
4. Compile and hash the project capability catalog:
   `python3 .agent/scripts/pi-code-agent/compile_capability_catalog.py --root .`
5. Build a bounded working set from the approved plan, target task, declared files, diagnostics, and prior receipts. Do not load the full skill corpus.
   Use `python3 scripts/pi-code-agent/native-contract-loop.py prepare` with the approved plan hash and declared files; persist only the manifest and hashes.

## Per-task loop

For each task in dependency order:

1. Obtain the task-owned lease and immutable working set before any write:
   `python3 .agent/scripts/pi-code-agent/task_runner.py start --root . --ledger "<ledger>" --contract "<contract>" --worker-actor "<native-host-actor>" --model-binding "<story_dir>/execution/pi-code-agent/worker-model-binding.json" --output-lease "<lease.json>" --output-working-set "<task-working-set.json>"`
2. Resolve required skills through the pinned catalog. Explicit slash intent is additive and never grants authorization. High-risk routed skills require independent authorization.
3. Execute only declared tools and files. Preserve pre-existing dirty-worktree changes.
4. Submit the worker candidate only through the runner. It captures the bounded diff, truthful AST/LSP availability, and registry-owned checker results:
   `python3 .agent/scripts/pi-code-agent/task_runner.py collect --root . --ledger "<ledger>" --contract "<contract>" --lease "<lease.json>" --worker-actor "<native-host-actor>" --output "<worker-candidate.json>"`
5. A read-only reviewer binds its review to the exact candidate hash. The risk policy requires `same-ide-fresh-task` for medium work, `isolated-subagent` for high work, and `separate-host` for critical work:
   `python3 .agent/scripts/pi-code-agent/task_runner.py review --ledger "<ledger>" --contract "<contract>" --worker-receipt "<worker-candidate.json>" --review "<independent-review.json>" --reviewer-binding "<reviewer-model-binding.json>"`
6. An external validator signs the exact final attestation with the project Watchmen key. The worker and reviewer cannot mark the task accepted. The runner verifies the detached signature itself against the public-key hash pinned in the ledger; a socket response is never acceptance evidence:
   `python3 .agent/scripts/pi-code-agent/task_runner.py accept --root "<worktree_root>" --ledger "<ledger>" --contract "<contract>" --worker-receipt "<worker-candidate.json>" --review "<independent-review.json>" --attestation "<validator-attestation.json>" --attestation-signature "<validator-attestation.json.sig>"`
7. On rejection or blocker, create a new lease and retry within budget. Stop on budget exhaustion, scope drift, stale precondition, validator failure, or missing capability.

## Completion gate

The story may proceed only when every task is ledger-accepted and a separate externally signed Stage 4 attestation binds the final ledger hash. Invoke `task_runner.py story-gate --root "<worktree_root>" --attestation-signature "<stage-attestation.json.sig>"`; structural receipt validation alone never permits Stage 4.

## Non-goals

- Do not invoke the OMP runtime implicitly.
- Do not auto-promote learning candidates into active skills.
- After an accepted receipt, learning may emit a candidate through `native-contract-loop.py learn`; `/skill` evaluation and promotion remain separate.
- Do not treat semantic skill matching, model prose, or a user slash command as authorization.
- Do not write raw chain-of-thought, secrets, or unredacted provider traces.
