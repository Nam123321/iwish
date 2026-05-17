---
name: 'lite-static-graph-ops'
description: 'Default fallback workflow for graph-lite projects where graph evidence is advisory and some surfaces remain static.'
---

# Lite Static Graph Operations

## Purpose

Provide the fallback usage pack when the project selects `lite-static`.

## Core Responsibilities

1. Treat graph surfaces as partial/advisory unless explicitly refreshed.
2. Run lightweight indexing or static graph regeneration.
3. Warn Orch when graph evidence is insufficient for strong dependency claims.
4. Produce a reconciliation plan instead of overstating graph confidence.

## Expected Inputs

- selected graph tool profile = `lite-static`
- requested graph surface
- source-of-truth context

## Expected Outputs

- advisory graph status
- lightweight refresh plan
- explicit degraded-mode evidence

## Notes

- Default fallback pack for low-setup environments.
- Never treat missing graph evidence as proof of no impact.
