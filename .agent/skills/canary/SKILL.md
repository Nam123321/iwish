---
name: "canary"
description: "Canary Deployment skill for validating safe rollouts to staging/production. Provides structured pre-deploy checks, traffic routing rules, and rollback criteria."
---

# Canary Deployment Skill

The **Canary** skill provides a structured CI/CD safety protocol for validating releases before full production deployment. Adapted from Gstack's `canary` playbook for the I-Wish agent ecosystem.

## Purpose

Prevent regressions and incidents by enforcing a phased rollout with explicit go/no-go gates at each stage. Agents use this skill when orchestrating deployments via `/party-mode` or `/sprint-status`.

## Canary Deployment Protocol

### Phase 1: Pre-Deploy Validation

Before any code leaves the development branch, verify:

| Check | Criteria | Blocker? |
|-------|----------|----------|
| **Build Status** | All CI checks green (lint, typecheck, unit tests) | 🔴 YES |
| **Test Coverage** | No decrease in coverage % from baseline | 🟡 WARN |
| **Migration Safety** | All DB migrations are reversible or have a rollback plan | 🔴 YES |
| **Dependency Audit** | No new critical/high CVEs introduced | 🔴 YES |
| **Bundle Size** | No increase > 5% without justification | 🟡 WARN |
| **Feature Flags** | New features behind feature flags if applicable | 🟡 WARN |
| **Resiliency Check** | All external integrations use Circuit Breakers and retries, APIs have Rate Limiting | 🔴 YES |

### Phase 2: Staging Deploy

1. Deploy to staging environment.
2. Run smoke tests (critical user paths).
3. Run integration tests against staging APIs.
4. Manual QA checkpoint (if UI changes are involved).

**Go/No-Go Gate:** All smoke tests pass AND no P0/P1 bugs found.

### Phase 3: Canary Rollout (Production)

1. Deploy to canary slice (5-10% of traffic).
2. Monitor for 15-30 minutes:
   - Error rate (must be ≤ baseline + 0.1%)
   - P95 latency (must be ≤ baseline + 10%)
   - Business metrics (conversion, checkout, key flows)
3. If metrics are healthy → proceed to full rollout.
4. If metrics degrade → **automatic rollback**.

### Phase 4: Full Rollout

1. Gradually increase traffic: 10% → 25% → 50% → 100%.
2. Continue monitoring for 1 hour after 100%.
3. Mark release as stable.

## Rollback Criteria

**Immediate rollback** is triggered if ANY of these occur:
- Error rate spikes > 2x baseline
- P95 latency spikes > 2x baseline
- Any P0 bug reported in production
- Data integrity issue detected

## Agent Responsibilities

| Agent | Role |
|-------|------|
| **dev-agent** | Ensures code is production-ready before handoff |
| **qa-agent** | Validates test coverage and smoke tests |
| **review-agent** | Performs security and edge-case audit pre-deploy |
| **Krillin (DevOps)** | Executes the actual deployment pipeline |
| **orch-agent** | Orchestrates the go/no-go decisions |

## Output Format

When invoked, produce a **Canary Readiness Report**:

```markdown
## Canary Readiness Report

| Phase | Status | Notes |
|-------|--------|-------|
| Pre-Deploy Validation | ✅/❌ | [Details] |
| Staging Deploy | ✅/❌ | [Details] |
| Canary Rollout | ✅/❌/⏳ | [Details] |
| Full Rollout | ✅/❌/⏳ | [Details] |

### Blockers
- [List any 🔴 blockers]

### Decision: [GO / NO-GO / CONDITIONAL]
```

## When to Invoke

- Before any production deployment.
- During `/sprint-status` reviews when stories are marked `done` and ready to ship.
- During `/party-mode` sessions discussing release readiness.
