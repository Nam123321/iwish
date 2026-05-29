# Implementation Plan — {{Title}}

Provide a brief description of the problem, any background context, and what the change accomplishes.

## User Review Required

Document anything that requires user review or feedback, for example, breaking changes or significant design decisions. Use GitHub alerts (IMPORTANT/WARNING/CAUTION) to highlight critical items.

## Open Questions

Any clarifying or design questions for the user that will impact the implementation plan. Use GitHub alerts (IMPORTANT/WARNING/CAUTION) to highlight critical items.

## Complexity & Gate Justification

Evaluate this plan against the 5 Constitutional Gates (Library-First, CLI Interface, Test-First, Simplicity Gate, Anti-Abstraction).

{{ComplexityTableOrNoViolations}}

---

## Proposed Changes

Group files by component (e.g., package, feature area, dependency layer) and order logically (dependencies first). Separate components with horizontal rules for visual clarity.

### {{Component Name}}

Summary of what will change in this component, separated by files. For specific files, Use [NEW] and [DELETE] to demarcate new and deleted files, for example:

#### [MODIFY] [file basename](file:///absolute/path/to/modifiedfile)
#### [NEW] [file basename](file:///absolute/path/to/newfile)
#### [DELETE] [file basename](file:///absolute/path/to/deletedfile)

---

## Verification Plan

Summary of how you will verify that your changes have the desired effects.

### Automated Tests
- Exact commands you'll run, browser tests, unit tests, etc.

### Manual Verification
- Testing steps, UI checks, platform-specific verification, etc.
