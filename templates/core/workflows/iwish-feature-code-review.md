---
name: 'code-review-internal'
description: 'Use when the user requests a code review or when validating an implemented story to find security, performance, or coverage issues.'
disable-model-invocation: true
---

# 🛡️ Code Review Front-Door

> [!IMPORTANT]
> To execute this workflow, you MUST read and rigidly obey the rules defined in:
> [3-Layer Code Review Protocol](file:///.agent/workflows/references/code-review-protocol.md)
> Do NOT attempt to run this review without loading and following the reference protocol first.

## Quick Execution Steps:
1. Load and execute the [3-Layer Code Review Protocol](file:///.agent/workflows/references/code-review-protocol.md).
2. Run mechanical checks: `node scripts/anti-cheat-linter.js`, `tsc --noEmit`, `prisma validate`.
3. Conduct adversarial auditing and cross-story alignment checks.
4. Render the Hybrid Scorecard, set Trust Score, and determine review status.
