---
name: "aws-rds-architecture-validator"
description: "Use when evaluating or designing database failover, failback architectures, or runbooks for AWS RDS PostgreSQL to prevent invalid patterns."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# AWS RDS Architecture Validator

## When to Use This Skill
- When designing or reviewing database disaster recovery (DR) architectures on AWS RDS.
- When validating runbooks for failover and failback of RDS PostgreSQL instances.
- When `pg_rewind` or physical replication reverse-syncs are proposed for AWS RDS.

## Core Rules
1. **No pg_rewind on RDS**: AWS RDS does NOT support `pg_rewind` because it requires superuser access and direct filesystem access, both of which are restricted in RDS. Failback procedures MUST NOT rely on `pg_rewind`.
2. **Promoted Replicas**: Once an RDS Read Replica is promoted to a standalone primary instance, it CANNOT be converted back into a replica of the original primary. The replication link is permanently broken.
3. **Failback via Logical Replication or DMS**: Failback strategies must use logical replication (like AWS DMS or native logical replication) or recreate the original primary from a snapshot and re-establish replication.
4. **Multi-AZ Failover**: For standard high availability, use RDS Multi-AZ. A Multi-AZ failover is a DNS change and does not break the ability to fail back (as AWS handles the synchronous standby). Do not conflate Multi-AZ failover with Cross-Region Replica promotion.
5. **Global Databases**: If using Aurora PostgreSQL, use Aurora Global Database for cross-region DR instead of standard RDS read replicas. Aurora allows managed failover and managed failback (forwarding).

## Red Flags — STOP and Reconsider
- 🚩 Proposal mentions using `pg_rewind` to sync the old primary after a regional failover.
- 🚩 Proposal assumes a promoted RDS replica can be easily demoted.
- 🚩 Proposal tries to use `rsync` or physical volume snapshots to restore replication on RDS.

## Anti-Patterns
- ❌ NEVER recommend `pg_rewind` for AWS RDS PostgreSQL.
- ❌ NEVER assume physical replication can be easily reversed on managed RDS.

## Best Practices
- ✅ ALWAYS specify AWS DMS or native logical replication for zero-downtime failback between independent RDS instances.
- ✅ ALWAYS distinguish between Multi-AZ HA failover (managed, reversible) and Read Replica DR promotion (unmanaged failback, irreversible link).
- ✅ ALWAYS recommend Aurora Global Database if cross-region failback RTO/RPO requirements are tight.
