# PRD: Selective Absorption of Microsoft Agent Governance Toolkit
**Date:** 2026-06-17

## 1. Functional Requirements
- **FR-1**: Integrate regular-expression based credential redaction to sanitize JWTs, API keys, and private keys.
- **FR-2**: Enforce tool execution constraints based on Cedar/Rego policies (deny, warn, transform).
- **FR-3**: Track token and cost budgets dynamically per agent task.

## 2. Non-Functional Requirements
- **NFR-1**: Performance overhead of policy checks must remain < 5ms.
- **NFR-2**: Complete project isolation (all draft assets live in `_iwish-output/iwish-skills/`).
