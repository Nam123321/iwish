---
name: fmea-risk-extractor
description: Analyzes epic stories, architecture documents, and code changes to extract implicit assumptions, failure modes, and edge cases to automatically populate the unknowns ledger.
inputs:
  - Epic stories
  - Architecture documents
  - Code changes
outputs:
  - Unknowns ledger entries
mcp_tools_required: []
subagent_triggers: []
---

# fmea-risk-extractor

## Overview
Analyzes epic stories, architecture documents, and code changes to extract implicit assumptions, failure modes, and edge cases to automatically populate the unknowns ledger.

## When to Use
- When a new epic or story is created.
- When architecture documents are updated.
- During code review of significant changes.

## Core Rules
1. Scan documents for assumptions.
2. Identify potential failure modes (FMEA).
3. Discover edge cases not explicitly handled.
4. Populate the unknowns ledger with these findings.

## Anti-Patterns
- Do not skip documenting assumptions.
- Do not ignore edge cases.

## Best Practices
- Cross-reference code changes with architecture documents.
- Categorize failure modes by severity.

## Anti-Fabrication
- Category A (Deterministic): Check if unknowns ledger is updated. (50%)
- Category B (Trust-Based): AI reviews assumptions. (50%)
Enforcement Maturity: 50%
