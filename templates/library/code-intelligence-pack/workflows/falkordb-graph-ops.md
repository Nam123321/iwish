---
name: 'falkordb-graph-ops'
description: 'Default graph usage-pack workflow for FalkorDB-backed codebasegraph, featuregraph, and graph-aware orchestration surfaces.'
---

# FalkorDB Graph Operations

## Purpose

Provide the default graph-ops usage workflow when the project selects `falkordb-full`.

## Core Responsibilities

1. Verify FalkorDB availability and connectivity.
2. Prepare or refresh graph-backed project surfaces.
3. Distinguish between:
   - codebasegraph indexing
   - featuregraph or delivery-trace updates
   - knowledgegraph or skillgraph refresh
4. Record degraded-mode evidence if one graph surface is stale or unavailable.

## Expected Inputs

- selected graph tool profile = `falkordb-full`
- project graph profile
- requested graph surface
- source-of-truth context if the graph update is story-driven

## Expected Outputs

- graph readiness verdict
- updated graph/index plan
- refresh or reconciliation notes
- explicit evidence when some surfaces are partial

## Notes

- Default pack for rich graph-backed orchestration.
- Use together with Orch routing, reconciliation, and graph-profile rules.
