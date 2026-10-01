---
name: sensitivity-auditor
description: Evaluates and calibrates the sensitivity of automated gating tools to prevent silent failures in architectural boundary validation.
---

# /sensitivity-auditor

## Purpose
Evaluates and calibrates the sensitivity of automated gating tools to prevent silent failures in architectural boundary validation.

## Triggers
- When configuring or troubleshooting architectural linters or gating tools.
- When continuous integration pipelines pass but architectural boundaries are found to be violated.
- When an automated gating tool silently fails to detect a known boundary violation.

## Rules
- MUST verify that the automated gating tools actually trigger on known bad inputs (holdout testing).
- MUST ensure boundary validation includes checks for both structural (AST) and runtime dependencies.
- SHOULD output a scorecard tracking the detection rate of various boundary violation types.
- NEVER assume a green build means boundaries are intact without periodic sensitivity calibration.
