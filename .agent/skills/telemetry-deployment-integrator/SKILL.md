---
name: "telemetry-deployment-integrator"
description: "Use when configuring CI/CD pipelines to block or rollback deployments based on real-time telemetry metrics."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# telemetry-deployment-integrator

## When to Use This Skill
- When setting up deployment pipelines.
- When configuring deployment observation gates.
- When integrating metrics (e.g., error rates, latency) to automatically fail deployments.

## Core Rules
1. ALL deployments MUST include a telemetry observation window.
2. The pipeline MUST automatically rollback if error rates exceed thresholds during the observation window.

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1 | Verify telemetry observation window exists | Category A | Pipeline script exit code | CI/CD config file check |
| GATE-2 | Determine if error rate is acceptable | Category B | Agent judgment based on log review | Log search results |

## Red Flags — STOP and Reconsider
- Skipping the observation window for "minor" changes.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "This is just a CSS change, it doesn't need telemetry." | UI bugs can cause severe regressions; all changes require observation. |

## Industry Standards & Best Practices
- Progressive delivery (Canary, Blue/Green) combined with automated metrics analysis.
- Service Level Objectives (SLOs) driving deployment decisions.

## Boilerplate / Snippets
```yaml
deploy:
  steps:
    - deploy_canary
    - observe_telemetry:
        duration: 5m
        error_threshold: 1%
```
