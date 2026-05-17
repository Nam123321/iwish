# I-Wish Routing and Reconciliation

## Purpose

This document defines the first operational slice of the Orch routing stack and reverse-waterfall reconciliation loop for I-Wish.

## Implemented Surfaces

- `iwish route <request>`
- `iwish reconcile-change`
- `iwish reconcile-status`
- `iwish select-tool <group> <adapter>`
- `iwish show-tool-profile`
- `iwish register-module --class --mode --trigger --tool`
- canonical capability workflows: `/create-skill` and `/enhance-skill`

## Routing Model

The current runtime resolves requests through three evidence layers:

1. alias and command normalization from the runtime catalog
2. semantic intent heuristics over natural-language requests
3. graph-awareness from `_iwish/graphs/graph-profile.yaml` and `.agent/knowledge-graph.yaml`

Route decisions are persisted to:

- `_iwish/runtime/route-decisions/*.json`

Each decision includes:

- canonical command
- target agent
- graph status
- candidate catalog entries
- whether reconciliation is recommended

## Reverse-Waterfall Reconciliation

Ad-hoc work must not drift outside the source of truth.

Use `iwish reconcile-change` to queue back-propagation work for:

- story/spec updates
- epic linkage
- featuregraph refresh
- knowledge summary refresh

Queue records are persisted to:

- `_iwish/runtime/reconciliation-queue/*.json`

Actionable work items are also materialized to:

- `_iwish/runtime/reconciliation-workitems/*.md`

Source-of-truth sidecars are written to:

- `_bmad-output/reconciliation/*.md`

Use `iwish reconcile-status` to inspect the current queue, work item count, and source-of-truth artifact count.

## Tool Profile Selection

Runtime tool preferences are project-scoped and stored in:

- `_iwish/runtime/tool-profile.json`

This supports open tool selection without hardwiring the runtime to a single browser, design, or graph backend.

## External Module Registration

External or absorbed modules are registered into:

- `_iwish/catalog/external-modules/*.json`

Each record can carry:

- module class
- registration mode
- trigger hints
- tool dependencies

This is the first slice of the open module ecosystem and is intended to be expanded by deeper absorb-repo integration.
