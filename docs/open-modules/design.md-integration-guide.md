# Adoption Review Pack: design.md

## 1. Classification
- **Shape:** `fragment` (Design Format), `skill` (TDD / DX Scale), `skill-attachment` (Linter).
- **Role:** `foundational` (Format/Skills), `supportive` (Linter).

## 2. Framework Placement
- `DESIGN.md` Format -> `USER_SPACE` (Used as standard for UI specs).
- `tdd-red-green-refactor` -> `SYSTEM_SKILL` (Workflow).
- `agent-dx-cli-scale` -> `SYSTEM_SKILL` (Passive Knowledge).
- `packages/cli` (Linter) -> `SYSTEM_SKILL` as a `TOURNAMENT_PLUGIN` (Run via sandboxed MCP/CLI).

## 3. Core Use Cases
- Generating precise visual identity specifications that AI agents can consume reliably.
- Validating design tokens and checking for contrast ratios/orphaned tokens.
- Strict TDD enforcement for agent coding tasks.

## 4. Adjacent Use Cases
- Evaluating external CLI tools before absorbing them (using DX Scale).

## 5. Edge Cases & Stress Cases
- Nested YAML tokens parsing edge cases (addressed in v0.3.0).
- Dynamically executed linter rules (sandboxing required to avoid RCE).

## 6. Constraints
- The linter must not be run directly within the agent's main environment without a sandbox due to `new Function(...)` usage.
- `Ink` renderer is skipped as it diverges from I-Wish's primary web-based DOM/Stitch design governance.

## 7. Coordination & Orch Routing Hints
- **`ux-agent`**: Should generate `DESIGN.md` following this specification when building UI specs.
- **`qa-agent` / `review-agent`**: Should trigger the sandboxed CLI linter after `DESIGN.md` is updated.
- **`dev-agent`**: Trigger TDD skill on complex logic implementation.

## 8. Review Questions for User
1. Do you agree with integrating the format to `USER_SPACE` while bringing the TDD workflow and CLI rules into `SYSTEM_SKILL`?
2. Should we deploy the CLI linter as an isolated MCP plugin to mitigate the dynamic code execution risk, or just use it as a shell script?
