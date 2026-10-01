---
name: knowledge-fact-lifecycle-validator
description: Statically and dynamically validates the lifecycle, provenance, and revocation of canonical knowledge facts in the production retrieval tracer.
---

# `knowledge-fact-lifecycle-validator`

## 1. Objective
To statically and dynamically validate the lifecycle, provenance, and revocation of canonical knowledge facts in the production retrieval tracer, ensuring that knowledge facts are not fabricated, orphaned, or inappropriately persisted.

## 2. Triggers
- When canonical knowledge facts are introduced or updated.
- During CI/CD pipelines for the production retrieval tracer.
- When knowledge facts are revoked or expired.

## 3. Workflow Steps
1. **Provenance Verification:** Check that every knowledge fact has an explicit lineage and source document reference.
2. **Lifecycle State Machine Validation:** Validate that facts transition properly through [Draft -> Canonical -> Revoked/Expired].
3. **Revocation Testing:** Dynamically inject revoked facts and verify that the retrieval tracer successfully suppresses them.
4. **Static Traceability:** Run static analysis to map all fact IDs to their implementation or usage paths in the codebase.

## 4. Anti-Fabrication Gates (Maturity > 70%)

### Gate 1: Provenance Link Check [Category A - Deterministic]
- **Enforcement:** The skill MUST run a script to parse all knowledge facts and assert that `provenance_url` or `source_id` exists and resolves to a known asset.
- **Action:** Reject facts with broken or missing provenance.

### Gate 2: Revocation Suppression Test [Category A - Deterministic]
- **Enforcement:** The skill MUST execute a dynamic test by querying the retrieval tracer for a known-revoked fact ID.
- **Action:** If the tracer returns the revoked fact, the gate fails and the build/commit is rejected.

### Gate 3: State Machine Linter [Category A - Deterministic]
- **Enforcement:** The skill MUST statically analyze the fact ledger JSON/DB to ensure no fact jumps from `Draft` to `Revoked` without being `Canonical`, and no fact is `Active` if its expiration date has passed.
- **Action:** Generate an error report and block deployment if invalid transitions exist.

### Gate 4: Domain Expert Review [Category B - Trust-Based]
- **Enforcement:** Domain expert manually reviews the semantics of canonical facts.
- **Action:** Acknowledge review sign-off.
