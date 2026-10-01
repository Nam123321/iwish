# Zero Trust Integrity Verifier - Integration Guide

This guide describes how to adopt and integrate the `zero-trust-integrity-verifier` skill into your workflows.

## Use Cases
- Verifying the SHA-256 checksum of downloaded models or libraries.
- Confirming that a payload from another agent is unmodified.

## Edge Cases
- **Missing checksums**: The skill must fail closed. If the upstream provider does not supply a known-good hash, the artifact cannot be trusted.
- **Large files**: When verifying multi-gigabyte files, ensure the hashing process has sufficient time and memory.

## Stress Cases
- Attempting to verify thousands of small files (consider batching).

## Constraints
- The skill does not perform malware scanning; it only verifies integrity against a known good state.

## Routing Hints
- Trigger this skill using "verify integrity", "checksum check", or "zero trust validation".

## Review Questions
- Has the caller securely obtained the known-good hash?
- Is the verification happening before the artifact is parsed or executed?
