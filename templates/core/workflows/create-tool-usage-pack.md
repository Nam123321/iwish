---
name: create-tool-usage-pack
description: Research a tool platform, define its operational fit, and scaffold
  the usage pack required for Orch-first execution
---

# /create-tool-usage-pack

## Purpose

Build the missing layer between a raw tool adapter and a truly usable Orch-facing capability.

This workflow exists for cases like:

- `Canva` instead of Figma
- a new browser automation tool
- a new graph/index backend
- a new design platform

## Inputs

- tool name
- tool family:
  - `design`
  - `browser`
  - `graph`
  - future supported family
- source repo / docs / connector / plugin reference
- intended user outcomes
- current parent workflows that may need the tool

## Workflow

1. **Tool Research**
   - Understand the tool's real surfaces:
     - create
     - inspect
     - edit
     - export
     - automate
     - sync
   - Identify what it can and cannot do compared with the current default tool in the same family.

2. **Capability Fit Analysis**
   - Determine:
     - whether the tool only needs an adapter
     - whether the tool needs a dedicated usage pack
     - whether a generic gate such as `visual-fidelity-gate` is enough
     - whether new platform-specific workflows are required

3. **Usage Pack Design**
   - For design tools, consider:
     - `<tool>-first-Vegeta`
     - `<tool>-to-code`
     - optional specialized gate
   - For browser tools, consider:
     - `<tool>-first-Tien-Shinhan`
     - `<tool>-flow-debug`
     - extraction or visual verification helpers
   - For graph tools, consider:
     - `<tool>-graph-ops`
     - validation / evidence / fallback helpers

4. **Scaffold Required Assets**
   - Create workflows / skills / fragments as needed
   - Create `routing-profile.yaml`
   - Create review pack:
     - `integration-guide.md`
     - `integration-guide.html`

5. **Register Into Orch Surface**
   - Register the tool adapter if missing
   - Register the usage pack into catalog/routing surfaces
   - Link it to the relevant parent agents/workflows

6. **Human Review Gate**
   - Present:
     - supported use cases
     - unsupported cases
     - constraints
     - recommended parent workflows
     - migration impact from current default tool

## Output

- Usage pack skeleton or implementation
- Routing profiles
- Review pack
- Orch-facing registration recommendation
