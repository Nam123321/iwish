# Promotion Plan: Data Privacy & Compliance Skill

## Current Status: Draft

## Criteria for Promotion to Core
To move this skill from `draft` to `core`, the following validation steps must be met:
1. **PII Detection Accuracy**: Successfully identify a test schema with mock PII fields without false positives.
2. **Masking Generation Validated**: Generated tokenization/redaction rules must successfully mask data in a staging environment.
3. **Edge Case Safety Verification**:
   - Verify that output logs/reports contain zero quoted real PII.
   - Verify that RTBF logic generated respects an active `financial_transactions` table mock (business conflict check).
   - Verify that PK/FK identifiers are flagged for format-preserving tokenization rather than destructive redaction.
4. **JSONB Handling**: Verify that chunking is correctly applied to large JSONB column schemas and unstructured payloads.

## Next Steps
- Execute a dry run against a sample dummy database schema.
- Agent self-review of generated SQL/Prisma masking logic against the ACs.
