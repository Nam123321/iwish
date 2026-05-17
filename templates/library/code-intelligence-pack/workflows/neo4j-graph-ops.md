---
name: 'neo4j-graph-ops'
description: 'Default graph usage-pack skeleton for Neo4j-backed codebasegraph and graph orchestration surfaces.'
---

# Neo4j Graph Operations

## Purpose

Provide the default usage-pack skeleton for projects that select `neo4j` as the graph backend.

## Core Responsibilities

1. Validate Neo4j connectivity and database readiness.
2. Decide whether the requested operation targets:
   - codebasegraph
   - featuregraph
   - knowledgegraph
   - skillgraph
   - memorygraph
3. Produce a graph refresh or query plan without assuming FalkorDB-specific commands.
4. Capture surface-level support and degraded-mode notes.

## Expected Inputs

- selected graph tool profile = `neo4j`
- graph profile mapping
- requested graph surface
- query or indexing objective

## Expected Outputs

- Neo4j graph operations plan
- database/surface mapping
- update or query artifact
- fallback guidance if a surface is advisory-only

## Notes

- Default skeleton, not a full connector-specific implementation.
- Use when the team wants a mature multi-database graph platform.
