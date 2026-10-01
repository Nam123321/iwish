---
name: "workload-economics-validator"
description: "Provisions staging resources and measures canary telemetry against baseline cost thresholds before production deployment."
inputs: ["workload_manifest", "baseline_cost_thresholds", "canary_telemetry"]
outputs: ["economics_validation_report", "deployment_decision"]
---

# workload-economics-validator

## Overview
This skill provisions staging resources and measures canary telemetry against baseline cost thresholds before allowing a production deployment. It prevents regressions where new deployments significantly inflate infrastructure costs without corresponding value or explicit approval.

## Execution Workflow
1. **Baseline Ingestion:** Retrieve the baseline cost thresholds for the target workload.
2. **Staging Provisioning:** Provision an isolated staging environment matching the canary slice profile.
3. **Canary Telemetry Gathering:** Execute the workload in staging and capture telemetry (compute usage, memory footprint, I/O rates).
4. **Economic Validation:** Compare the telemetry-extrapolated run rate against the baseline cost thresholds.
5. **Decision Emission:** Emit a passing validation report if costs are within threshold, or fail the deployment if the threshold is breached.

## Gate Classification (Anti-Fabrication Policy)
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-01 | Baseline Cost Verification | Category A | Schema validation of threshold config | Config output |
| G-02 | Staging Isolation | Category A | Sub-account/Namespace bounding | Cloud resource IDs |
| G-03 | Telemetry vs Threshold | Category A | Automated arithmetic comparison | Validation metrics |
| G-04 | Cost Exception Approval | Category B | Human-in-the-loop review | Approval log |

*Enforcement Maturity: 75% (3/4 Category A)*
