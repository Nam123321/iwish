---
name: 'canva-first-dev'
description: 'Design-platform workflow skeleton for Canva-first design exploration and implementation handoff.'
---

# Canva-First Development Workflow

## Purpose

Provide a default usage-pack skeleton for projects that want Canva as the design platform instead of Figma or Stitch.

## Core Responsibilities

1. Identify the approved Canva design source for the current story or feature.
2. Decide whether the current request needs:
   - no design refresh
   - Canva variant/update
   - full Canva artifact creation
3. Produce a stable handoff artifact before implementation starts.
4. Trigger `canva-to-code` when implementation mapping is required.

## Expected Inputs

- story
- UI spec
- approved Canva artifact or workspace output
- selected design tool profile = `canva`

## Expected Outputs

- Canva artifact inventory
- approved implementation target
- handoff note for engineering

## Notes

- This is a default skeleton for Open Tool testing.
- Use together with `visual-fidelity-gate`.
