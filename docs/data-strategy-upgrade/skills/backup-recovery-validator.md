---
name: "Backup Recovery Validator"
description: "Validates backup policies — point-in-time recovery, disaster recovery SLA, backup integrity testing."
---

# Backup Recovery Validator SKILL

## Purpose
Audit backup and disaster recovery to ensure:
1. Automated backups are scheduled and running
2. Point-in-time recovery (PITR) is enabled
3. Backup restoration has been tested
4. Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are defined and achievable
5. Cross-region backup exists for disaster recovery

## Validation Checks

### BR1: Backup Schedule
**Question:** Are automated backups running on schedule?
**Checks:** Daily DB backup exists, Redis RDB/AOF persistence configured, log retention defined.
**Verdict:** ✅ Automated and verified · ❌ No automated backup

### BR2: Point-in-Time Recovery
**Question:** Can we restore to any point in the last 7 days?
**Checks:** WAL archiving enabled (PostgreSQL), PITR window ≥ 7 days.
**Verdict:** ✅ PITR enabled · ❌ Only full backups (data loss risk)

### BR3: Restoration Testing
**Question:** Has backup restoration been tested in the last quarter?
**Checks:** Restoration test log exists, restoration completed within RTO.
**Verdict:** ✅ Tested within 90 days · ⚠️ Tested >90 days ago · ❌ Never tested

### BR4: RTO/RPO Compliance
**Question:** Can we meet recovery SLAs?
| Metric | Target | Current |
|--------|--------|---------|
| RPO (max data loss) | < 1 hour | [value] |
| RTO (max downtime) | < 4 hours | [value] |
**Verdict:** ✅ Within targets · ❌ Exceeds targets

### BR5: Disaster Recovery
**Question:** Is there a cross-region or cross-provider backup?
**Checks:** Backup stored in separate region/account, tested failover procedure.
**Verdict:** ✅ DR plan tested · ⚠️ DR plan exists untested · ❌ No DR plan

## Output Format
Standard SKILL report with BR1-BR5 verdicts and Recovery Readiness Score [X/5].
