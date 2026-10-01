---
name: runtime-realism-audit
description: >
  Independent workflow executing a Single-Pass Comprehensive Hardening Audit across 
  the 7 Core Runtime Realism Dimensions on implementation plans or codebase changes.
version: 1.0.0
---

# /runtime-realism (`/runtime-audit`)

This workflow executes an exhaustive, single-pass inspection against the **7 Core Hardening Dimensions** defined in the `runtime-realism-guardian` skill. It guarantees that code changes or technical plans are physically executable, resilient, secure, and compliant with enterprise standards.

---

## ⚡ Execution Workflow

1. **Pre-Flight Healthcheck (EC-05):**
   - Ensure environment dependencies (Node.js, pnpm, Python3) are present.
   - Verify that target file (`impl-plan.md` or git diff) exists.

2. **Single-Pass Evaluation Grid:**
   - The reviewing agent evaluates the target against ALL 7 dimensions in one single scan:
     - Dimension 1: Clean Code & Architecture (SOLID, Cyclomatic Complexity ≤ 10, DRY)
     - Dimension 2: Runtime Realism & Cloud-Native (Dynamic Ports, Stateless, Graceful Shutdown, JSON Logs)
     - Dimension 3: Monorepo & Packaging (Pnpm Workspace Manifests, Multi-Stage `--prod`, ESM Flags, Prisma Compile)
     - Dimension 4: Security & Zero-Trust (Non-root `USER node`, Workdir Chown, In-layer Permissions, Tool-Agnostic Context Isolation)
     - Dimension 5: Data & Persistence (Expand/Contract Phasing, Connection Pool Cleanup)
     - Dimension 6: Resilience & SRE Diagnostics (Dynamic Health Probes, Actionable `if: failure()` Diagnostics, Concurrency Shield)
     - Dimension 7: Traceability & DX Automation (Physical `# @implements` Anchors, Standalone CLI Scripts)

3. **Atomic Report Generation (EC-04):**
   - Collect findings into a structured report JSON.
   - Write output to a temporary file (`_iwish-output/audits/.tmp.{story_id}.json`) and atomically rename to `_iwish-output/audits/runtime-realism-{story_id}.json`.

4. **Exit Codes & Disposition:**
   - `Exit 0 (PASS)`: All 7 dimensions scored ≥ 8.5/10 with zero critical blockers.
   - `Exit 1 (FAIL)`: One or more dimensions violated. Return actionable remediation table.
