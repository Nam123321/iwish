# Capability Spec: tenant-workflow-auditor

## Type: SKILL
## Status: Draft
## Created: 2026-07-30

### Problem Statement
We need a capability that performs data-driven historical audits of existing tenant workflows to verify expected node coverage for Zero-IT templates.

### Knowledge Sources
- Source 1: User Request — Performs data-driven historical audits of existing tenant workflows to verify expected node coverage for Zero-IT templates.

### Core Concepts
1. Tenant Workflow Audit: Analyzing historical execution records of tenant workflows.
2. Node Coverage Verification: Ensuring that the workflow executions cover the required nodes as defined by Zero-IT templates.
3. Data-Driven Approach: Relying on empirical execution data rather than static definitions.

### Anti-Patterns
- ❌ Do not perform static code analysis; rely on historical execution data.
- ❌ Do not apply standard non-tenant IT templates; strictly use Zero-IT template definitions.

### Best Practices  
- ✅ Extract and aggregate node coverage statistics systematically.
- ✅ Compare empirical coverage against the expected Zero-IT baseline.

### Deliverables
- [ ] File 1: `.agent/skills/tenant-workflow-auditor/SKILL.md`
