# BMAD Workflow Runtime Materialization

## Purpose

BMAD wrapper commands in `.agent/workflows/` are source assets. Installed BMAD projects are expected to have a materialized runtime under `_bmad/`, especially:

- `_bmad/core/tasks/workflow.xml`
- `_bmad/bmm/workflows/4-implementation/<workflow>/workflow.yaml`

When these files are missing in this source/template repository, that is a packaging state, not a story implementation defect. Source mode may use explicit fallback. Project runtime mode must materialize or repair the files before running workflow commands.

## Runtime Modes

| Mode | Meaning | Missing Runtime Files |
|---|---|---|
| `source` | Developer is working in the BMAD source/template repo. | Allowed when a source fallback exists; report `template-only`. |
| `project` | User project expects installed BMAD runtime files. | Block workflow execution if required files are missing. |

## Required Runtime Contract

### Core Engine

| Runtime Path | Source Path | Class | Materialization |
|---|---|---|---|
| `_bmad/core/tasks/workflow.xml` | `.agent/workflows/workflow-engine.xml` | core engine | copy |

### Implementation Workflow Configs

| Runtime Path | Source Path | Class | Materialization |
|---|---|---|---|
| `_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml` | `.agent/workflows/bmad-bmm-create-story.md` | workflow config | generated manifest |
| `_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml` | `.agent/workflows/bmad-bmm-code-review.md` | workflow config | generated manifest |
| `_bmad/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml` | `.agent/workflows/bmad-bmm-dev-story.md` | workflow config | generated manifest |
| `_bmad/bmm/workflows/4-implementation/sprint-planning/workflow.yaml` | `.agent/workflows/bmad-bmm-sprint-planning.md` | workflow config | generated manifest |
| `_bmad/bmm/workflows/4-implementation/sprint-status/workflow.yaml` | `.agent/workflows/bmad-bmm-sprint-status.md` | workflow config | generated manifest |
| `_bmad/bmm/workflows/4-implementation/correct-course/workflow.yaml` | `.agent/workflows/bmad-bmm-correct-course.md` | workflow config | generated manifest |
| `_bmad/bmm/workflows/4-implementation/retrospective/workflow.yaml` | `.agent/workflows/bmad-bmm-retrospective.md` | workflow config | generated manifest |

`dragonball_distribution/` is a packaged source mirror. It is not the active runtime source for this checkout.

## Fallback Policy

Wrapper commands must behave deterministically:

1. If `_bmad/core/tasks/workflow.xml` and the requested workflow config exist, use them.
2. If they are missing and the repo is in source mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and the active wrapper as the workflow-specific contract.
3. If they are missing and the repo is in project runtime mode, stop with a runtime readiness error.
4. Missing graph or workflow evidence must be reported as unavailable evidence, not interpreted as proof that no dependencies or impacts exist.

## No-Overwrite Rule

Materialization must not overwrite user-modified `_bmad/` files by default.

- Existing identical files may be skipped.
- Existing different files must be reported as conflicts.
- Overwrite requires an explicit `--force` run.
- Dry-run/check mode must be available before writes.

## Readiness States

`check-bmad-runtime.sh` reports:

- `materialized`: destination exists.
- `template-only`: destination is missing but a source asset exists.
- `missing`: neither destination nor source asset exists.
- `conflict`: destination exists but differs from generated materialization output.

## Commands

```bash
./.agent/scripts/check-bmad-runtime.sh
./.agent/scripts/check-bmad-runtime.sh --mode project
./.agent/scripts/materialize-bmad-runtime.sh --dry-run
./.agent/scripts/materialize-bmad-runtime.sh --apply
```
