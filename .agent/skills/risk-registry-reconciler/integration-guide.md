# Integration Guide: risk-registry-reconciler

## Use Cases
- Reconciling macro risks with the unknowns ledger to close stale risks.
- Validating physical codebase mitigations against documented risks.

## Constraints
- Does not automatically create new risks (only reconciles/closes).
- Requires properly formatted `macro-risks.yaml` and `unknowns-ledger.yaml`.

## Routing Hints
Route to this skill when the user asks to "clean up risks", "verify mitigations", or "update the risk registry based on recent work".
