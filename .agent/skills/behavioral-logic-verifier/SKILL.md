---
name: behavioral-logic-verifier
status: draft
origin:
  created_by: create-skill
promotion_target: .agent/skills/behavioral-logic-verifier
path_policy: runtime
---
# behavioral-logic-verifier

## Purpose
Verifies that actual business logic and APIs are implemented to satisfy requirements, preventing metric gaming based solely on schema structures.

## Instructions
1. Analyze the core business requirements for a feature.
2. Trace the execution path, looking for hardcoded values, mock returns (e.g., unconditionally returning `true`), or empty conditionals.
3. Verify that data flow legitimately influences the outcome.
4. Flag "metric gaming" implementations and refactor them to include functional logic.
