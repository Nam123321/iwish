---
description: 'Step TC-02: Compliance Guard — Add friction to compliance downgrades'
---

# Step TC-02: Compliance Guard

## Objective
Prevent accidental or malicious downgrades of compliance levels (e.g., Level 2 to Level 1) when restricted data pipelines exist.

## Instructions
1. **Detect Change:** Compare the incoming compliance level with the existing `TenantConfig.compliance_level`.
2. **Upgrade Path:** If upgrading (Level 1 -> Level 2), allow smoothly.
3. **Downgrade Path (WARNING):** 
   - If downgrading, query the DB for active high-compliance data pipelines.
   - If active data exists, require explicit confirmation (`force=true`) or block entirely.
4. **Audit Trail:** Log all compliance state transitions (tenant_id, old_level, new_level, admin_id, timestamp) into the security audit table.
