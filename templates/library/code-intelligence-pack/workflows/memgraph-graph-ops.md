---
name: 'memgraph-graph-ops'
description: 'Default graph usage-pack skeleton for Memgraph-backed graph operations and graph-plus-vector retrieval flows.'
---

# Memgraph Graph Operations

## Purpose

Provide the default usage-pack skeleton for projects that select `memgraph` as the graph backend.

## Core Responsibilities

1. Validate Memgraph connectivity and graph readiness.
2. Distinguish between traversal-driven and vector-assisted retrieval flows.
3. Build an operations plan for:
   - codebasegraph refresh
   - feature or knowledge graph update
   - skillgraph or memorygraph sync
4. Record caveats when graph support is partial or provisional.

## Expected Inputs

- selected graph tool profile = `memgraph`
- graph profile mapping
- requested graph surface
- query or indexing objective

## Expected Outputs

- Memgraph graph operations plan
- graph/vector coordination note when relevant
- degraded-mode or evidence note if needed

## Notes

- Default skeleton, not a full connector-specific implementation.
- Useful when teams want graph retrieval plus vector-style lookup in one backend.
