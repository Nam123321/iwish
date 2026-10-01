---
name: "risk-registry-reconciler"
description: "Use when closing a sprint, after resolving unknowns, or when validating if macro risks are no longer applicable based on the codebase state. DO NOT put a workflow summary here."
inputs: ["macro_risks_path", "unknowns_ledger_path", "codebase_path"]
outputs: ["updated_macro_risks_path", "reconciliation_report_path"]
mcp_tools_required: ["grep_search", "view_file"]
subagent_triggers: ["review-agent"]
---

# Risk Registry Reconciler

## When to Use This Skill
- During Sprint Retrospectives or Sprint Closure.
- When an unknown in the unknowns ledger is marked as "resolved".
- When you need to verify if an open macro risk has become stale due to code implementations.

## Core Rules
1. **Always cross-reference before closing:** A risk MUST NOT be closed unless there is explicit evidence in the codebase (e.g., implemented mitigation) OR a mapped closed finding in the unknowns ledger.
2. **Never delete risks:** Stale risks MUST be marked with `status: closed` or `status: mitigated` along with a `mitigation_date` and `mitigation_evidence`, rather than deleted from the yaml.
3. **Traceability:** You MUST link the specific codebase file/commit or unknowns ledger entry in the `mitigation_evidence` field.

## Anti-Patterns
- ❌ Guessing a risk is mitigated without concrete file evidence.
- ❌ Deleting a risk from `macro-risks.yaml` instead of updating its status.
- ❌ Running generic bash commands to update YAML (use proper YAML tools or structured file editing).

## Best Practices
- ✅ Check the `status` of unknowns in `unknowns-ledger.yaml` first, then find corresponding risks in `macro-risks.yaml`.
- ✅ Verify the codebase state using `grep_search` to ensure the mitigation is actually checked in.
- ✅ Leave a short comment in the YAML above the mitigated risk explaining who closed it and why.

## Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-01 | File existence check for unknowns ledger | Category A | `view_file` or `grep_search` failure | File not found error |
| GATE-02 | Mitigation evidence evaluation | Category B | Agent reasoning against codebase | Tool calls `grep_search` |
| GATE-03 | Status update format check | Category A | YAML parser validation | YAML syntax correctness |

(Enforcement Maturity: 66%)
