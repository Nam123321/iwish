# Epics & Stories: Agent Governance Integration
**Date:** 2026-06-17

## Epic 1: Credential Redaction Skill
- **Story 1.1**: Port Python regex rules to I-Wish to identify OpenAI, AWS, and JWT keys.
- **Story 1.2**: Implement recursive dictionary/list traverser to redact nested values.

## Epic 2: Policy Interception Skill
- **Story 2.1**: Implement JSON-based mock Cedar engine to check tool call allowances.
- **Story 2.2**: Wire parameter transformations (verdict: transform) to rewrite tool arguments.
