# I-Wish Open Tool Usage Pack Standard

Generated: 2026-05-16

## Purpose

In I-Wish, `Open Tool` does **not** stop at a raw tool adapter entry.

Each serious tool integration should be treated as:

1. `Tool Adapter`
2. `Usage Skill Pack`
3. `Routing + orchestration registration`

This is the only way Orch can reliably choose the correct tool and execution pattern for the user's request.

## Core Rule

For any user-facing tool family such as:

- design tools
- browser tools
- graph/index tools

I-Wish should model the integration as:

```text
Tool Adapter + Usage Workflows + Supporting Skills + Routing Profiles + Review Pack
```

## Why This Exists

A tool adapter alone only answers:

- what tool exists
- how to select it

It does **not** answer:

- when to use it
- which workflow should invoke it
- what artifacts it expects
- how handoff/extraction/validation should work
- what edge cases the tool introduces

That missing layer is what the Usage Skill Pack provides.

## Required Layers

### 1. Tool Adapter

Examples:

- `stitch`
- `figma`
- `claude-design`
- `playwright`
- `chrome-devtools-mcp`
- `falkordb-full`

The adapter lives in the runtime registry and is chosen by tool profile.

### 2. Usage Skill Pack

For each major tool, create a pack that can include:

- platform-first workflow
- tool-to-code workflow
- design/verification gate if needed
- support fragments/templates

Examples:

- `stitch-first-dev`
- `stitch-to-code`
- `visual-fidelity-gate`

Equivalent packs should exist for other tools when the tool is expected to become a first-class workflow option.

### 3. Routing Profiles

Every usage workflow/skill should expose:

- phase
- stage
- triggers
- anti-triggers
- primary agents
- primary workflows
- tool dependencies

### 4. Review Pack

Every serious tool pack should also have:

- `integration-guide.md`
- `integration-guide.html`

so humans and Orch can review:

- use cases
- constraints
- edge cases
- approval boundaries

## Design Tool Default Pack

I-Wish should ship with a default design-tool usage pack family:

- `stitch-first-dev`
- `stitch-to-code`
- `figma-first-dev`
- `figma-to-code`
- `claude-design-first-dev`
- `claude-design-to-code`
- `visual-fidelity-gate`

Rules:

- `visual-fidelity-gate` is the canonical platform-agnostic validation gate
- `stitch-design-taste` is legacy/specialized, not the preferred generic name
- each design platform can add a platform-specific first-dev and to-code flow

## Browser Tool Pack

For browser tools, the same pattern should apply:

- `playwright-first-qa`
- `chrome-devtools-first-qa`
- `browser-use-first-qa`

plus any extraction or verification skills if needed.

## Graph Tool Pack

For graph/index tools, the same pattern should apply:

- `falkordb-graph-ops`
- `neo4j-graph-ops`
- `memgraph-graph-ops`
- `lite-static-graph-ops`
- `custom-graph-adapter-ops`

plus diagnostics, validation, and evidence-handling rules.

Rules:

- `falkordb-full` remains the recommended default when the project wants the richest combined support for codebasegraph and graph-backed GenAI surfaces.
- `neo4j` and `memgraph` are first-class user-selectable options, not hidden/internal options.
- if the user chooses a graph backend that is not already modeled, I-Wish should treat it exactly like any other Open Tool intake:
  - adapter research
  - usage-pack draft
  - routing registration
  - review pack
  - graph surface declaration

This means graph solutions follow the same rule as design or browser tools:

```text
Graph Adapter + Graph Usage Pack + Routing Registration
```

## Open Tool Intake Mechanism

When the user wants a tool not already modeled, such as Canva:

1. Research the tool and verify what surfaces it supports.
2. Classify its tool family:
   - design
   - browser
   - graph
   - other supported future group
3. Create a Usage Skill Pack draft:
   - `canva-first-dev`
   - `canva-to-code`
   - `canva-design-gate` or reuse `visual-fidelity-gate` if sufficient
4. Create routing profiles for those capabilities.
5. Register the tool adapter and usage pack into Orch-facing routing/catalog.
6. Create review pack for human approval.

## Required Workflow

This standard expects a dedicated workflow for building open-tool usage packs:

- `create-tool-usage-pack`

That workflow should:

- research the tool
- identify core use cases and edge cases
- decide whether existing generic skills cover it
- scaffold the necessary workflows/skills
- register them into orchestration surfaces

## Governance Rule

Tool adapters should not be presented as “fully supported” unless the corresponding usage pack exists.

In other words:

```text
Adapter-only = selectable, but not production-ready orchestration
Adapter + Usage Pack = orchestratable capability
```
