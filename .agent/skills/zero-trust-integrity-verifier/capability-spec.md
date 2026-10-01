# Capability Spec: zero-trust-integrity-verifier

## Type: SKILL
## Status: Draft
## Created: 2026-07-31

### Problem Statement
In a distributed agentic workflow, external data sources and internal artifacts must be continuously validated to ensure they have not been tampered with or fabricated. This skill enforces a Zero Trust verification model, confirming integrity and provenance before data is accepted into the main processing pipeline.

### Knowledge Sources
- Source 1: Local Knowledge - Standard Zero Trust Architecture principles.
- Source 2: Local Knowledge - Cryptographic hashing and digital signature verification best practices.

### Core Concepts
1. **Never Trust, Always Verify:** All artifacts, regardless of their source or previous status, must be verified before use.
2. **Provenance Tracing:** Track and confirm the origin of every piece of data.
3. **Cryptographic Integrity:** Use strong hashing (e.g., SHA-256) to detect tampering.
4. **Immutable Audit Trail:** Log all verification attempts and outcomes without allowing modifications to past logs.

### Anti-Patterns
- ❌ Trusting an artifact because it comes from an internal component.
- ❌ Failing to log a failed verification attempt.
- ❌ Proceeding with execution when an integrity check fails.
- ❌ Using weak hashing algorithms like MD5 or SHA-1.

### Best Practices  
- ✅ Fail closed: If verification status is unknown, reject the artifact.
- ✅ Maintain clear separation of duties between the component generating the artifact and the verifier.
- ✅ Continuously update verification rules based on new threat intelligence.

### Deliverables
- [ ] File 1: `.agent/skills/zero-trust-integrity-verifier/SKILL.md`
- [ ] File 2: `.agent/skills/zero-trust-integrity-verifier/routing-profile.yaml`
