---
name: economics-ledger-auditor
description: Validates that all workload adapters correctly attribute costs, emit canonical evidence, and that the economics ledger maintains non-overlapping savings waterfall calculations with TCO, unit cost, and confidence metrics.
inputs: [workload_adapters, economics_ledger]
outputs: [audit_report, economics_ledger_updates]
mcp_tools_required: []
subagent_triggers: []
---

# Economics Ledger Auditor

## Purpose
Validates that all workload adapters correctly attribute costs and emit canonical evidence. Ensures the economics ledger maintains non-overlapping savings waterfall calculations, including TCO, unit cost, and confidence metrics.

## Execution Rules
1. **Adapter Validation**: Scan workload adapters to verify proper cost attribution and the presence of canonical evidence emission logic.
2. **Ledger Consistency**: Analyze the economics ledger to ensure savings waterfall calculations are non-overlapping.
3. **Waterfall Verification**: Verify the savings waterfall calculation accuracy including TCO, unit cost, and confidence metrics.
4. **Reporting & Synchronization**: Generate an audit report containing the findings, flag any overlapping or missing metrics, and output the required corrective synchronization updates.
