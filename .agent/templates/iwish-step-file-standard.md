# I-Wish Step-File Standard

## Intent

Use step-files as an optional core execution standard for long-form, stateful, or self-improving capabilities without forcing every small skill into a heavyweight workflow shell.

## When Step-Files Are Required

Use step-files when a capability is:

- multi-stage and checkpoint-driven
- orchestration-heavy across multiple assets or agents
- graph-dependent and likely to run in degraded mode
- absorb/research/evolution oriented
- expected to support self-improvement or dual-run comparison at the step level

## When Step-Files Are Optional

Do not require step-files for:

- utility skills
- lightweight adapters
- small callable fragments
- reference-only assets

## Standard Rules

1. Load one step at a time.
2. Each step must declare its purpose, inputs, outputs, and handoff expectation.
3. Each step must state degraded-mode behavior when a graph, tool, or artifact dependency is unavailable.
4. Each step should be individually improvable without rewriting the entire workflow.
5. Reverse-sync obligations must be explicit when the workflow can start from ad-hoc code, bugfix, or design changes.

## Canonical Step Metadata

Each step file should make the following clear:

- step intent
- required artifacts
- optional artifacts
- expected outputs
- validation or checkpoint rule
- next-step handoff
- degraded-mode fallback

## Compatibility Notes

- Legacy BMAD step-files remain valid if they preserve one-step-at-a-time execution and explicit handoffs.
- New I-Wish capability packages should prefer this standard for workflow-shaped or compound capabilities.
