---
name: "fmea-ui-spec-generator"
description: "A robust spec generation skill that automatically injects FMEA considerations such as error states, debounces, context persistence, and edge case fallbacks into UI specifications."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# fmea-ui-spec-generator

## When to Use This Skill
Use when generating UI specifications to ensure FMEA considerations (error states, debounces, context persistence, edge case fallbacks) are automatically injected.

## Core Rules
1. Always inject error states for all interactive UI elements.
2. Ensure debounces are specified for frequent-action triggers (e.g. search inputs).
3. Validate context persistence (e.g. form recovery on refresh).
4. Outline edge case fallbacks (e.g. offline mode, empty states).

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-01    | Check FMEA | Category A | Static Analysis | Code artifacts |
