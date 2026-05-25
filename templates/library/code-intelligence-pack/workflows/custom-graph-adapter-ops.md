---
name: 'custom-graph-adapter-ops'
description: 'Open Tool skeleton for project-supplied graph backends that must declare supported graph surfaces and operating rules.'
---

# Custom Graph Adapter Operations

## Purpose

Provide the Open Tool usage-pack skeleton for a custom graph backend.

## Core Responsibilities

1. Research the custom backend and verify supported graph surfaces.
2. Define the project-specific graph surface contract.
3. Produce an adapter-specific graph operations plan.
4. Register constraints, evidence semantics, and degraded-mode rules for Orch.

## Expected Inputs

- selected graph tool profile = `custom-adapter`
- backend description
- supported graph surfaces
- query/indexing requirements

## Expected Outputs

- graph surface support matrix
- custom operations plan
- Orch routing notes

## Notes

- Must be paired with `create-tool-usage-pack` before being treated as orchestration-ready.
