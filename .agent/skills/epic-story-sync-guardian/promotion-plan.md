# Promotion Plan: epic-story-sync-guardian

## Overview
This skill acts as a hard gate to prevent directory structure drift from breaking the `sprint-status.yaml` compiled index. It is designed to be injected into the pre-flight checks of planning and reconciliation workflows.

## Validation Strategy
- Run the skill locally in the current Cowok-ai project.
- Force a drift by artificially altering the YAML file, then verify the skill HALTs.
- Verify that running the remediation script (`sync_all_statuses.py`) fixes the drift.

## Integration Targets
- Integrate into `.agent/workflows/iwish-feature-reconcile-change.md`
- Integrate into `.agent/workflows/iwish-feature-sprint-planning.md`
- Integrate into `step-04-final-validation.md`
