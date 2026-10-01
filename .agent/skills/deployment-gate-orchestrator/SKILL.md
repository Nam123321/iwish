---
name: deployment-gate-orchestrator
description: Orchestrates and verifies real immutable artifact deployment, rollback, and production observation, replacing simulated release scripts.
---

<agent-activation>
Activate when user requests real immutable artifact deployment, rollback, and production observation.
</agent-activation>

# deployment-gate-orchestrator

## Purpose
Orchestrates and verifies real immutable artifact deployment, rollback, and production observation, replacing simulated release scripts.

## Context
Deploying immutable artifacts requires strict gating, verification, and observation. Simulated scripts lack the rigorous checks needed for safe production deployments. This skill provides the concrete steps to enforce staging deployments, canary releases, abort conditions, rollback procedures, and production monitoring.

## Workflow

### 1. Staging Deployment & Verification
- Retrieve the immutable artifact (e.g., container image) by its exact SHA/digest.
- Deploy to the staging environment.
- Run integration tests and health checks against the staging endpoint.
- Verify that no manual modifications are made to the artifact.

### 2. Canary Release
- Deploy the artifact to a small subset of production traffic (canary).
- Monitor error rates, latency, and system metrics for the canary instances.
- Define explicit abort conditions (e.g., >1% error rate increase).

### 3. Production Observation
- Continuously observe production metrics during the rollout.
- Escalate any anomalies or breaches of Service Level Objectives (SLOs).
- Require explicit sign-off or automated metric thresholds to proceed to full rollout.

### 4. Rollback Gating
- If abort conditions are met, immediately halt the rollout.
- Revert traffic routing to the previous stable artifact.
- Log the rollback reason and notify the deployment owner.

## Best Practices
- **Immutable Artifacts Only:** Never rebuild code during a deployment phase; always promote the exact artifact built in CI.
- **Fail Closed:** If observation metrics are unavailable, halt the deployment rather than proceeding blindly.
- **Automated Rollback:** Rollbacks should be fast, automated, and tested regularly.
