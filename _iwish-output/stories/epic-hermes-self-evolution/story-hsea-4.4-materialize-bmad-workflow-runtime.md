---
story_id: "STORY-HSEA-4.4"
epic_id: "EPIC-HSEA"
title: "Materialize I-Wish Workflow Runtime from Templates"
status: "DONE"
assignee: "Whis"
priority: "P0"
depends_on: ["STORY-HSEA-4.2"]
phase: "forge"

---
# Story HSEA-4.4: Materialize I-Wish Workflow Runtime from Templates

## 1. Objective

Create a deterministic I-Wish runtime materialization policy so wrapper workflows that reference `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/**/workflow.yaml` either find real files or use an explicit, documented fallback.

## 1.1 Context

Current I-Wish wrapper files such as `.agent/workflows/iwish-bmm-create-story.md` and `.agent/workflows/iwish-bmm-code-review.md` instruct agents to load:

```text
_iwish/core/tasks/workflow.xml
_iwish/bmm/workflows/4-implementation/<workflow>/workflow.yaml
```

In this checkout, `_iwish/` currently contains only `_iwish/bmm/config.yaml`. The actual source assets live under `.agent/workflows/`, `templates/core/workflows/`, and `dragonball_distribution/templates/core/workflows/`. This causes repeated “missing workflow.xml / workflow.yaml” warnings during create-story, Vegeta, and code-review execution.

This is not a HSEA implementation bug. It is a runtime packaging/scaffolding gap: the wrapper contract assumes an installed project runtime that has not been materialized in the source/template repo.

**Source artifacts:**
- `.agent/workflows/iwish-bmm-create-story.md`
- `.agent/workflows/iwish-bmm-code-review.md`
- `.agent/workflows/iwish-bmm-dev-story.md`
- `.agent/workflows/iwish-bmm-sprint-planning.md`
- `templates/core/workflows/`
- `dragonball_distribution/templates/core/workflows/`
- `_iwish/bmm/config.yaml`

**Target integration surface:**
- Runtime materialization docs or workflow.
- Wrapper fallback policy.
- Optional scaffold script/checklist under `.agent/scripts/` or `.agent/workflows/`.

## 2. User Story

As a I-Wish project operator,  
I want required workflow runtime files materialized or explicitly resolved from templates,  
So that agents can execute wrapper workflows without repeated missing-file warnings or ad hoc fallback behavior.

## 3. Acceptance Criteria

### AC1: Runtime File Contract Is Defined
**Given** a wrapper references `_iwish/core/tasks/workflow.xml` or `_iwish/bmm/workflows/**/workflow.yaml`  
**When** I-Wish validates project readiness  
**Then** the required runtime file contract lists which files must exist in a fully materialized project.

### AC2: Source-to-Runtime Mapping Is Defined
**Given** runtime files are missing  
**When** materialization is run  
**Then** I-Wish knows which `.agent/`, `templates/`, or `dragonball_distribution/` source assets map to `_iwish/` runtime destinations.

### AC3: Wrapper Fallback Is Explicit
**Given** a source/template repo has not materialized `_iwish/` runtime files  
**When** an agent runs create-story, dev-story, code-review, or sprint-planning  
**Then** the wrapper provides an explicit fallback path instead of producing unexplained repeated warnings.

### AC4: Initialization Check Reports Runtime Health
**Given** a user starts I-Wish in a fresh project  
**When** the init/readiness check runs  
**Then** it reports `materialized`, `template-only`, or `missing` status for workflow engine files and implementation workflow configs.

### AC5: Materialization Does Not Overwrite User Changes
**Given** `_iwish/` already contains user-modified runtime files  
**When** materialization runs  
**Then** it does not overwrite them without explicit approval  
**And** it records any skipped, updated, or conflicting files.

### AC6: Validation Covers The Runtime Contract
**Given** the materialization policy is implemented  
**When** validation scripts run  
**Then** they can detect missing workflow runtime files and explain whether this is allowed for source/template mode or blocked for project runtime mode.

## 4. Tasks

### T1: Inventory Runtime References
- Search wrappers and agents for `_iwish/core/tasks/workflow.xml`.
- Search wrappers and agents for `_iwish/bmm/workflows/4-implementation/**`.
- Produce a required runtime file list and classify each as core engine, workflow config, workflow entry, or optional pack workflow.

### T2: Define Source-to-Runtime Mapping
- Map existing `.agent/workflows/` wrappers and `templates/core/workflows/` assets to their expected `_iwish/` runtime destinations.
- Define which files are copied, generated, symlinked, or intentionally left template-only.
- Include `dragonball_distribution/` as a packaged source, not an active runtime source.

### T3: Add Runtime Materialization Policy
- Create a docs/workflow artifact describing source mode vs project runtime mode.
- Define materialization preconditions, dry-run output, conflict behavior, and approval requirements.
- Preserve user changes and avoid destructive overwrites.

### T4: Add Wrapper Fallback Guidance
- Patch critical wrappers such as create-story and code-review so missing `_iwish/` runtime files produce a clear fallback instruction.
- State which local wrapper/fragments are authoritative in source/template mode.
- Avoid silent fallback in deployed project runtime mode unless explicitly configured.

### T5: Add Validation/Readiness Check
- Extend or add a validation script/checklist that reports materialization health.
- Report `materialized`, `template-only`, or `missing`.
- Keep validation non-blocking in source/template mode and blocking in project runtime mode.

### T6: Validate and Update Story Record
- Run `./.agent/scripts/validate-kg.sh`.
- Run `./.agent/scripts/validate-portability.sh`.
- Run `npm run build`.
- Update File List and Agent Record.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC1 | Runtime file contract defined | T1 | Core engine and workflow config inventory | ✅ |
| AC2 | Source-to-runtime mapping defined | T2 | `.agent`, `templates`, distribution mapping | ✅ |
| AC3 | Wrapper fallback explicit | T4 | create-story/code-review/dev-story/sprint-planning fallback guidance | ✅ |
| AC4 | Init/readiness reports runtime health | T5 | `materialized/template-only/missing` report | ✅ |
| AC5 | No overwrite of user changes | T3 | dry-run, conflict report, approval gate | ✅ |
| AC6 | Validation covers runtime contract | T5, T6 | validation script/checklist and build checks | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | No DB models | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Runtime packaging, workflow wrappers, validation | 3 |
| Flow Complexity | Materialization modes, conflict handling, validation states | 2 |
| Test Burden | Script/build validation only | 0 |

**Complexity Score:** 5  
**Verdict:** WARN - keep implementation focused on runtime contract, fallback policy, and validation. Defer full installer UX and package manager integration unless separately approved.

## 7. Dev Notes

- This story exists because wrapper instructions currently assume a fully installed `_iwish/` runtime while this repo is operating in source/template mode.
- Do not treat missing `_iwish/core/tasks/workflow.xml` as a story implementation defect when running in source/template mode.
- Project runtime mode should be stricter than source/template mode.
- Materialization must be reversible and must not overwrite user-edited `_iwish/` files without approval.
- This story should reduce repeated agent warnings by giving wrappers a clear source-mode fallback.
- The follow-up graph-backend selection policy can be handled separately; this story is about workflow runtime files, not graph storage.
- Create-story source-mode execution note: `.agent/workflows/iwish-bmm-create-story.md` requires `_iwish/core/tasks/workflow.xml` and `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml`, but those runtime files are currently absent. Because this story is specifically about materializing those missing runtime files, the create-story pass used source-mode fallback: wrapper contract plus local `plan-tune-heuristic` and `qa-simulator-guardian` checks.

## 8. Definition of Done

- [x] Runtime file contract is documented.
- [x] Source-to-runtime mapping is documented.
- [x] Source/template mode vs project runtime mode is documented.
- [x] Critical wrappers have explicit fallback guidance.
- [x] Materialization conflict/no-overwrite policy exists.
- [x] Runtime readiness/validation check exists.
- [x] `validate-kg.sh` passes.
- [x] `validate-portability.sh` passes.
- [x] `npm run build` passes.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The story directly addresses repeated missing runtime workflow warnings with a contract and materialization path. |
| Data Integrity & State | 9 | No-overwrite and conflict-report rules protect user-modified runtime files. |
| Security & Validation | 9 | Explicit runtime health checks avoid hidden fallback in deployed projects. |
| Performance & Scalability | 9 | Materialized runtime paths reduce repeated file discovery and warning noise. |
| Error Handling & Recovery | 9 | Source/template mode, project runtime mode, and conflict states give clear recovery paths. |
| Code Quality & Maintainability | 9 | Centralizing runtime contract prevents wrapper drift. |
| UX Empathy | 9 | Users get understandable readiness output instead of repeated unexplained missing-file notices. |

**Total Average:** 9.00 / 10 - PASS

## 10. File List

- `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.4-materialize-iwish-workflow-runtime.md`
- `_iwish-output/stories/sprint-status.yaml`
- `_iwish-output/epics/epic-hermes-self-evolution-absorption.md`
- `docs/iwish-workflow-runtime-materialization.md`
- `.agent/workflows/workflow-engine.xml`
- `.agent/scripts/iwish-runtime-lib.sh`
- `.agent/scripts/check-iwish-runtime.sh`
- `.agent/scripts/materialize-iwish-runtime.sh`
- `.agent/workflows/iwish-bmm-create-story.md`
- `.agent/workflows/iwish-bmm-code-review.md`
- `.agent/workflows/iwish-bmm-dev-story.md`
- `.agent/workflows/iwish-bmm-sprint-planning.md`
- `templates/core/workflows/iwish-bmm-create-story.md`
- `templates/core/workflows/iwish-bmm-code-review.md`
- `templates/core/workflows/iwish-bmm-dev-story.md`
- `templates/core/workflows/iwish-bmm-sprint-planning.md`
- `_iwish/core/tasks/workflow.xml`
- `_iwish/bmm/workflows/4-implementation/create-story/workflow.yaml`
- `_iwish/bmm/workflows/4-implementation/code-review/workflow.yaml`
- `_iwish/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml`
- `_iwish/bmm/workflows/4-implementation/sprint-planning/workflow.yaml`
- `_iwish/bmm/workflows/4-implementation/sprint-status/workflow.yaml`
- `_iwish/bmm/workflows/4-implementation/correct-course/workflow.yaml`
- `_iwish/bmm/workflows/4-implementation/retrospective/workflow.yaml`

## 11. Agent Record

### Planned

- Define runtime materialization contract.
- Map source/template assets to `_iwish/` runtime destinations.
- Add explicit fallback guidance to critical wrappers.
- Add runtime readiness validation.

### Implementation Status

- Added `docs/iwish-workflow-runtime-materialization.md` with source mode vs project runtime mode, required runtime file contract, source-to-runtime mapping, fallback policy, no-overwrite rule, and readiness statuses.
- Added `.agent/scripts/check-iwish-runtime.sh` to report `materialized`, `template-only`, and `missing` states for required I-Wish runtime files.
- Added `.agent/scripts/materialize-iwish-runtime.sh` with dry-run default, `--apply`, conflict detection, and explicit `--force` overwrite approval.
- Materialized `_iwish/core/tasks/workflow.xml` from `.agent/workflows/workflow-engine.xml`.
- Materialized runtime workflow manifests under `_iwish/bmm/workflows/4-implementation/` for create-story, code-review, Vegeta-story, sprint-planning, sprint-status, correct-course, and retrospective.
- Patched active critical wrappers with explicit source-mode fallback and project-mode stop/materialize guidance.
- Patched template mirror wrappers for create-story, code-review, dev-story, and sprint-planning so future scaffolds preserve the fallback policy.
- Updated this story to `DONE` after implementation and validation.

### Tests / Validation Run

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS.
- `./.agent/scripts/materialize-iwish-runtime.sh --dry-run` - PASS.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.

### Decisions

- Added this as HSEA-4.4 because the issue is runtime/routing hardening.
- Kept graph backend selection out of this story to avoid mixing workflow runtime materialization with graph infrastructure policy.
- Marked ready for Vegeta without frontend/UI gate because this is a workflow/runtime hardening story with no UI surface.
- CodebaseGraph/FeatureGraph MCP tools were not available in this execution context, so blast-radius discovery used `rg` over `.agent`, `templates`, `dragonball_distribution`, docs, and HSEA story artifacts.
- Generated workflow manifests are intentionally lightweight wrapper configs. If a richer distributed `workflow.yaml` becomes available later, it should replace the generated manifest only through explicit materialization approval.
- Code-review follow-ups were addressed by adding a generic workflow engine, making wrapper-backed runtime configs executable by contract, adding shared runtime generation logic, and aligning dry-run/check conflict behavior.

## 12. Senior Developer Review (AI)

**Review Date:** 2026-05-10  
**Reviewer:** Codex / I-Wish Code Review  
**Outcome:** Changes Requested - Fixed

### Findings

1. **P0 - Materialized core engine is the dev-story instruction file, not a generic workflow executor.**  
   Evidence: `_iwish/core/tasks/workflow.xml` begins with dev-story execution semantics, including story discovery and UI-spec gates, while code-review/create-story wrappers call it as the generic workflow OS. See `_iwish/core/tasks/workflow.xml:1-3` and workflow-specific dev-story logic around `_iwish/core/tasks/workflow.xml:220-320`. This can route `code-review` or `create-story` through dev-story behavior instead of the intended workflow.  
   Confidence: 10/10.

2. **P0 - Generated `workflow.yaml` manifests do not satisfy the runtime engine contract.**  
   Evidence: `_iwish/core/tasks/workflow.xml:3` says the engine expects `{installed_path}/workflow.yaml` to have been loaded/processed, but generated manifests such as `_iwish/bmm/workflows/4-implementation/code-review/workflow.yaml:1-10` only contain `name`, `runtime_kind`, `source_wrapper`, engines, and notes. They lack `installed_path`, instructions/checklist/template/default output variables, or executable workflow steps. The files exist, so readiness passes, but actual workflow execution is still under-specified.  
   Confidence: 9/10.

3. **P1 - Dry-run does not detect conflicts, so AC5 is only partially satisfied.**  
   Evidence: `.agent/scripts/materialize-iwish-runtime.sh:44-50` reports any existing destination as `DRY-RUN materialized` without comparing it to the generated output. A user-modified runtime file would appear healthy in dry-run even when `--apply` would later conflict at `.agent/scripts/materialize-iwish-runtime.sh:55-64`. AC5 requires skipped/updated/conflicting files to be recorded.  
   Confidence: 9/10.

4. **P2 - Documented `conflict` readiness state is not implemented by the readiness checker.**  
   Evidence: `docs/iwish-workflow-runtime-materialization.md:61-66` says `check-iwish-runtime.sh` reports `conflict`, but `.agent/scripts/check-iwish-runtime.sh:57-63` can only emit `materialized`, `template-only`, or `missing`. This is contract drift between docs and tooling.  
   Confidence: 10/10.

5. **P2 - Source-mode fallback guidance references `.agent/workflows/instructions.xml` as a generic source-mode engine, but that file is dev-story scoped.**  
   Evidence: wrapper guidance in `.agent/workflows/iwish-bmm-code-review.md:17-24` tells agents to use `.agent/workflows/instructions.xml` as the source-mode engine. That engine is the same dev-story-scoped content copied to `_iwish/core/tasks/workflow.xml`, so fallback mode repeats the same behavior mismatch as project mode.  
   Confidence: 9/10.

### Action Items

- [x] [AI-Review][P0] Replace `_iwish/core/tasks/workflow.xml` materialization source with a true generic workflow executor, or explicitly change wrappers to stop treating it as generic.
- [x] [AI-Review][P0] Replace placeholder runtime `workflow.yaml` manifests with executable workflow configs or change the wrapper/runtime contract so these manifests are valid by design.
- [x] [AI-Review][P1] Update `materialize-iwish-runtime.sh --dry-run` to compare generated output against existing destinations and report `would-create`, `identical`, `conflict`, and forced-overwrite behavior.
- [x] [AI-Review][P2] Align `check-iwish-runtime.sh` with documented readiness states, including `conflict`, or remove `conflict` from the checker's documented report contract.
- [x] [AI-Review][P2] Fix source-mode fallback guidance so it points to a real generic engine or to the workflow wrapper as the explicit executable contract, without calling dev-story instructions generic.

### Fix Resolution

- Added `.agent/workflows/workflow-engine.xml` as a workflow-agnostic runtime engine and rematerialized `_iwish/core/tasks/workflow.xml` from it.
- Added `.agent/scripts/iwish-runtime-lib.sh` so check and materialize use the same source-to-runtime mapping and expected-output generator.
- Updated generated runtime configs with `installed_path`, `instructions`, `execution.mode`, and explicit wrapper-backed execution contract.
- Updated source-mode fallback guidance to reference `.agent/workflows/workflow-engine.xml`.
- Updated dry-run output to report `would-create`, `identical`, `conflict`, and `conflict-would-overwrite`.
- Updated readiness checks to detect and fail on `conflict` in project mode.

### Validation (Pre-Fix, Superseded by Fix Validation Below)

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS, but does not validate semantic executability.
- `./.agent/scripts/materialize-iwish-runtime.sh --dry-run` - PASS, but does not detect conflicts.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `npm run build` - PASS.
- FeatureGraph validation was skipped because FeatureGraph MCP tools were not available in this execution context. This story introduces no DataEntity/Event/SeedData contract changes.

### Fix Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS with all files `materialized`.
- `./.agent/scripts/materialize-iwish-runtime.sh --dry-run` - PASS with all files `identical`.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.

### QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 5 | Runtime files exist, but the materialized engine/configs are not proven to execute the intended workflows. |
| Data Integrity & State | 7 | No-overwrite is enforced on apply, but dry-run masks conflicts. |
| Security & Validation | 7 | Project-mode check exists, but it validates existence rather than semantic contract compatibility. |
| Performance & Scalability | 8 | Runtime checks are lightweight. |
| Error Handling & Recovery | 6 | Conflict recovery exists during apply, but preflight/dry-run reporting is incomplete. |
| Code Quality & Maintainability | 6 | The source-to-runtime mapping is centralized, but generic vs workflow-specific engine semantics are blurred. |
| UX Empathy | 7 | The warning noise is reduced, but users can now see green runtime checks while workflows remain semantically broken. |

**Total Average:** 6.57 / 10 - CHANGES REQUESTED

## 13. Senior Developer Review Round 2 (AI)

**Review Date:** 2026-05-10  
**Reviewer:** Codex / I-Wish Code Review  
**Outcome:** Changes Requested - Fixed

### Findings

1. **P1 - Wrapper-backed workflows can execute the same wrapper twice.**  
   Evidence: `.agent/workflows/workflow-engine.xml:13-24` has two independent checks: one executes `source_wrapper` when `runtime_kind: wrapper-config` is present, and the next executes `instructions` when present. Generated configs include both fields (`_iwish/bmm/workflows/4-implementation/Vegeta-story/workflow.yaml:3-8`), and `instructions` points to the same wrapper as `source_wrapper`. A naive engine following this XML will execute the wrapper steps once via `source_wrapper` and once again via `instructions`, duplicating side effects such as writing story sections, changing statuses, or running checks.  
   Confidence: 9/10.

2. **P2 - Story implementation record still contradicts the fixed runtime source.**  
   Evidence: the current File List includes `.agent/workflows/workflow-engine.xml`, and fix resolution says `_iwish/core/tasks/workflow.xml` was rematerialized from it, but the Implementation Status still says it was materialized from `.agent/workflows/instructions.xml` at `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.4-materialize-iwish-workflow-runtime.md:218`. This creates stale handoff context for future maintainers and reviewers.  
   Confidence: 10/10.

3. **P2 - The old round-1 validation text remains stale after fixes.**  
   Evidence: round-1 Validation still says `materialize-iwish-runtime.sh --dry-run` passes but does not detect conflicts at `_iwish-output/stories/epic-hermes-self-evolution/story-hsea-4.4-materialize-iwish-workflow-runtime.md:289`, while the Fix Validation below says dry-run now reports `identical`. Historical findings can remain, but the Validation subsection should be clearly labeled as pre-fix or superseded to avoid downstream agents treating it as current.  
   Confidence: 9/10.

### Action Items

- [x] [AI-Review-R2][P1] Make wrapper-backed execution mutually exclusive: either remove `instructions` from generated wrapper-backed configs, or change `workflow-engine.xml` so the `instructions` branch only runs when `runtime_kind != wrapper-config`.
- [x] [AI-Review-R2][P2] Update the HSEA-4.4 Implementation Status to say `_iwish/core/tasks/workflow.xml` is materialized from `.agent/workflows/workflow-engine.xml`.
- [x] [AI-Review-R2][P2] Mark round-1 Validation as pre-fix/superseded or replace stale validation notes with the current Fix Validation.

### Fix Resolution

- Updated `.agent/workflows/workflow-engine.xml` so wrapper-backed configs are mutually exclusive: when `runtime_kind: wrapper-config` is present, the engine executes `source_wrapper` and explicitly skips the generic `instructions` branch.
- Kept `instructions` in generated runtime configs as metadata/handoff, but it is no longer an execution branch for wrapper-backed configs.
- Updated stale Implementation Status and marked round-1 validation as pre-fix/superseded.

### Fix Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS with all files `materialized`.
- `./.agent/scripts/materialize-iwish-runtime.sh --dry-run` - PASS with all files `identical`.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.

### Validation

- `./.agent/scripts/check-iwish-runtime.sh --mode project` - PASS.
- `./.agent/scripts/materialize-iwish-runtime.sh --dry-run` - PASS, all runtime files reported `identical`.
- `./.agent/scripts/validate-kg.sh` - PASS.
- `./.agent/scripts/validate-portability.sh` - PASS.
- `npm run build` - PASS.
- FeatureGraph validation was skipped because FeatureGraph MCP tools were not available in this execution context. This story introduces no DataEntity/Event/SeedData contract changes.

### QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 7 | The generic engine and runtime manifests are substantially improved, but duplicate wrapper execution remains a real workflow correctness risk. |
| Data Integrity & State | 8 | Conflict detection and no-overwrite behavior now work, but duplicate execution can still duplicate story/status writes. |
| Security & Validation | 8 | Runtime checks pass and conflict state is implemented. |
| Performance & Scalability | 8 | Runtime scripts remain lightweight, though duplicate wrapper execution can waste cycles. |
| Error Handling & Recovery | 8 | Conflict handling is clear; stale story validation text weakens recovery guidance. |
| Code Quality & Maintainability | 7 | Shared runtime lib improves maintainability, but engine branch exclusivity needs tightening. |
| UX Empathy | 8 | Warning noise is reduced, but stale story notes can confuse the next operator. |

**Total Average:** 7.71 / 10 - CHANGES REQUESTED
