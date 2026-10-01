---
name: 'figma-first-dev'
description: 'Design-platform workflow skeleton for Figma-first development. Aligns implementation with approved Figma handoff before coding.'
---

# Figma-First Development Workflow

## Purpose

Provide the Figma equivalent of `stitch-first-dev` for projects that use Figma as the approved master design source.

## Core Responsibilities

1. Load the approved Figma project, file, frames, or exported handoff artifact.
2. Determine whether the current story requires:
   - no design refresh
   - variant/update
   - full Figma screen creation/update
3. Produce a handoff package for implementation.
4. Trigger the paired `figma-to-code` flow when code extraction or implementation mapping is required.

## Expected Inputs

- story
- UI spec
- approved master design source in Figma
- selected design tool profile = `figma`

## Expected Outputs

- Figma screen inventory
- approved target frames/screens
- handoff mapping for implementation
- updated review artifacts if needed

## Notes

- This is a default skeleton, not yet a full execution-specific adapter.
- Use together with `visual-fidelity-gate`.
