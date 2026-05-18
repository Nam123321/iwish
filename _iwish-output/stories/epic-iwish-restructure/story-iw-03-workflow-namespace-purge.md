---
story_id: "IW-STORY-03"
epic_id: "EPIC-IWISH-01"
title: "Workflow & Runtime Namespace Purge — iwish→iwish, bmm→framework"
status: "Draft"
assignee: "dev-agent"
priority: "P0"
depends_on: ["IW-STORY-01", "IW-STORY-02"]
phase: "forge"
tracer_bullet: "Filesystem Rename → Content Reference Update → Runtime Config Migration → Router/Constants Update → Validation"
---

# Story IW-03: Workflow & Runtime Namespace Purge

## 1. Objective

Purge all remaining `iwish` and `bmm` naming from the I-Wish repository (`/Desktop/AI Project/iwish/`), replacing them with the native `iwish` and `framework` namespace across all workflow files, runtime configs, and internal cross-references. After this story, zero files should contain `iwish-bmm-`, `iwish-agent-bmm-`, or `_iwish/bmm/` paths.

## 1.1 Context

Stories IW-01 and IW-02 completed the agent data migration and alias cleanup. However, 107 workflow files still reference `_iwish` paths, 43 files still carry `iwish-` prefixes in their filenames, and the runtime folder structure (`_iwish/bmm/workflows/`) remains unchanged. This story completes the decoupling.

**Source of Truth:**
- Previous session analysis: 107 workflow files reference `_iwish`, only 1 references `_iwish`
- Naming convention decision: `bmm` → `framework` (user-approved)
- 3-layer architecture preserved: `.agent/workflows/` → `_iwish/framework/workflows/`

**Scope Boundaries:**
- `step-*.md` files: **NOT renamed** (namespace-agnostic)
- Canonical short names (`code.md`, `make-story.md`, etc.): **filenames kept**, internal redirects updated
- Agent persona files (`.agent/agents/*.md`): **Already migrated** in IW-01, out of scope

## 2. User Story

As an I-Wish framework developer,
I want all workflow files, runtime configs, and cross-references to use the `iwish` and `framework` namespace instead of `iwish` and `bmm`,
So that the I-Wish repository is completely independent from I-Wish-DragonBall and has a clean, native identity.

## 3. Acceptance Criteria

### AC1: Fallback Manifest Generated
**Given** the current I-Wish repo state before any renames
**When** the migration begins
**Then** a `_iwish-output/migration/rename-manifest-iw03.yaml` file is generated listing every file to be renamed with its old path and new path
**And** this manifest can be used to rollback all renames if needed.

### AC2: Workflow Files Renamed (`.agent/workflows/`)
**Given** the `.agent/workflows/` directory contains `iwish-*` prefixed files
**When** the rename operation runs
**Then** files are renamed according to these rules:
- `iwish-agent-bmm-{anime-name}.md` → `iwish-agent-{native-name}.md` (e.g., `iwish-agent-bmm-vegeta.md` → `iwish-agent-dev.md`)
- `iwish-bmm-{workflow}.md` → `iwish-{workflow}.md` (e.g., `iwish-bmm-create-story.md` → `iwish-create-story.md`)
- `iwish-{utility}.md` → `iwish-{utility}.md` (e.g., `iwish-brainstorming.md` → `iwish-brainstorming.md`)
- `workflow-{name}.md` → `iwish-{name}.md` (e.g., `workflow-create-prd.md` → `iwish-create-prd.md`)
- `iwish-agent-grand-priest.md` → `iwish-agent-orch.md`
**And** `step-*.md` files remain untouched
**And** canonical short files (`code.md`, `make-story.md`, etc.) retain their filenames.

### AC3: Runtime Folder Restructured
**Given** the `_iwish/` runtime directory
**When** the migration runs
**Then** the folder is restructured as:
```
_iwish/
├── core/
│   └── tasks/
│       └── workflow.xml
└── framework/
    ├── config.yaml
    └── workflows/
        └── 4-implementation/
            ├── create-story/workflow.yaml
            ├── dev-story/workflow.yaml
            ├── code-review/workflow.yaml
            ├── sprint-planning/workflow.yaml
            ├── sprint-status/workflow.yaml
            ├── correct-course/workflow.yaml
            └── retrospective/workflow.yaml
```
**And** the old `_iwish/` directory is removed after validation.

### AC4: Internal Cross-References Updated
**Given** renamed workflow files and restructured runtime directory
**When** the content of all `.md` and `.yaml` files is scanned
**Then** all internal references are updated:
- `_iwish/core/tasks/workflow.xml` → `_iwish/core/tasks/workflow.xml`
- `_iwish/bmm/workflows/` → `_iwish/framework/workflows/`
- `iwish-bmm-{name}.md` → `iwish-{name}.md` (in redirect targets and `source_wrapper` fields)
- `iwish-agent-bmm-{name}.md` → `iwish-agent-{name}.md`
- `iwish_version` → `iwish_version` in config.yaml
- `.iwish` fallback paths → `.iwish`
**And** the string `I-Wish RUNTIME FALLBACK` is replaced with `IWISH RUNTIME FALLBACK` in instruction blocks.

### AC5: Canonical Short Workflow Redirects Updated
**Given** canonical short files like `code.md`, `make-story.md`, `review.md`
**When** their content is checked
**Then** internal redirects point to the new names (e.g., `Read and execute: iwish-dev-story.md` instead of `iwish-bmm-dev-story.md`)
**And** routing-profile YAML files update their `source_wrapper` references accordingly.

### AC6: Zero I-Wish Residue Validation
**Given** all renames and content updates are complete
**When** a validation grep is run across the entire I-Wish repo
**Then** `grep -r "iwish-bmm-\|iwish-agent-bmm-\|_iwish/" .agent/ _iwish/` returns **zero results**
**And** `grep -r "iwish" .agent/ _iwish/ src/` returns only `LEGACY_AGENT_ALIASES` entries in `constants.ts` (which intentionally preserve legacy mapping).

## 4. Tasks

### T1: Generate Fallback Manifest
- Scan all `iwish-*` files in `.agent/workflows/`
- Scan `_iwish/` runtime directory
- Generate `_iwish-output/migration/rename-manifest-iw03.yaml` with old→new path mappings
- Include file checksums (md5) for integrity verification

### T2: Rename Workflow Files
- Execute batch rename of `.agent/workflows/iwish-*` files per AC2 rules
- Build and apply the anime→native name mapping table:
  - `vegeta` → `dev`, `songoku` → `ai`, `piccolo` → `architect`
  - `android-18` → `ux`, `tien-shinhan` → `qa`, `king-kai` → `pm`
  - `trunks` → `delivery-manager`, `bulma` → `analyst`
  - `hit` → `review` / `edge-guardian` → `review`
  - `whis` → `capability`, `shenron` → `data-architect`
  - `data-piccolo` → `data-architect`, `data-strategist` → `data-strategist`
  - `master-roshi` → `tech-writer`, `cell` → `cloner`
  - `quick-flow-solo-vegeta` → `quick-dev`
  - `grand-priest` → `orch`
  - `gotenks` → `creative`

### T3: Restructure Runtime Folder
- `mv _iwish _iwish_migration_temp` (safety)
- Create `_iwish/core/tasks/` and copy `workflow.xml`
- Create `_iwish/framework/workflows/4-implementation/` and migrate all workflow.yaml files
- Rename `Vegeta-story/` → `dev-story/`
- Update `config.yaml` to remove `iwish_version` → `iwish_version`
- Remove `_iwish_migration_temp` after validation

### T4: Update Internal Cross-References
- Run `sed` or scripted replacement across all `.md` and `.yaml` files in `.agent/workflows/` and `_iwish/`
- Replace patterns:
  - `_iwish/core/tasks/` → `_iwish/core/tasks/`
  - `_iwish/bmm/workflows/` → `_iwish/framework/workflows/`
  - `iwish-bmm-` → `iwish-` (in file content)
  - `iwish-agent-bmm-` → `iwish-agent-` (in file content)
  - `I-Wish RUNTIME FALLBACK` → `IWISH RUNTIME FALLBACK`
  - `materialize-iwish-runtime` → `materialize-iwish-runtime`
  - `check-iwish-runtime` → `check-iwish-runtime`
- Update canonical short files' redirect targets

### T5: Validation
- Run `grep -rn "iwish-bmm-\|iwish-agent-bmm-\|_iwish/" .agent/ _iwish/` — expect zero results
- Run `grep -rn "iwish" .agent/ _iwish/ src/` — expect results ONLY in `constants.ts` `LEGACY_AGENT_ALIASES`
- Verify `_iwish/framework/workflows/4-implementation/create-story/workflow.yaml` exists and parses correctly
- Verify at least 3 canonical short workflows resolve correctly (spot-check `code.md`, `make-story.md`, `review.md`)
- Compare file count before/after — no files should be lost

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Status |
|-------|-----------|------|--------|
| AC1 | Fallback manifest generated | T1 | ☐ |
| AC2 | Workflow files renamed | T2 | ☐ |
| AC3 | Runtime folder restructured | T3 | ☐ |
| AC4 | Internal cross-references updated | T4 | ☐ |
| AC5 | Canonical redirect targets updated | T4 | ☐ |
| AC6 | Zero I-Wish residue validation | T5 | ☐ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|-----------|--------|------:|
| AC Volume | 6 ACs | 0 |
| Data Model Spread | No DB, only filesystem | 0 |
| UI Surface | No UI | 0 |
| Cross-Domain | Single domain (framework config/naming) | 0 |
| Flow Complexity | Sequential rename+update, no async/state machine | 0 |
| Test Burden | 1 validation grep + 3 spot-checks | 0 |

**Complexity Score:** 0
**Verdict:** ✅ OK — story is well-scoped. Pure filesystem migration with clear validation.

## 7. Definition of Done

- [ ] Fallback manifest exists at `_iwish-output/migration/rename-manifest-iw03.yaml`
- [ ] All `iwish-agent-bmm-*.md` files renamed to `iwish-agent-*.md`
- [ ] All `iwish-bmm-*.md` files renamed to `iwish-*.md`
- [ ] All `iwish-*.md` (non-bmm) renamed to `iwish-*.md`
- [ ] All `workflow-*.md` renamed to `iwish-*.md`
- [ ] `_iwish/` folder migrated to `_iwish/` with `bmm/` → `framework/`
- [ ] All internal `_iwish` and `iwish-bmm-` references replaced
- [ ] Canonical short workflow redirects updated
- [ ] Validation grep returns zero `iwish-bmm-` or `_iwish/` references
- [ ] `step-*.md` files remain unchanged

## 8. Rename Mapping Reference (Agent Notes)

### Workflow File Rename Map

| Old Name | New Name |
|----------|----------|
| `iwish-agent-bmm-vegeta.md` | `iwish-agent-dev.md` |
| `iwish-agent-bmm-songoku.md` | `iwish-agent-ai.md` |
| `iwish-agent-bmm-piccolo.md` | `iwish-agent-architect.md` |
| `iwish-agent-bmm-android-18.md` | `iwish-agent-ux.md` |
| `iwish-agent-bmm-tien-shinhan.md` | `iwish-agent-qa.md` |
| `iwish-agent-bmm-king-kai.md` | `iwish-agent-pm.md` |
| `iwish-agent-bmm-trunks.md` | `iwish-agent-delivery-manager.md` |
| `iwish-agent-bmm-bulma.md` | `iwish-agent-analyst.md` |
| `iwish-agent-bmm-edge-guardian.md` | `iwish-agent-review.md` |
| `iwish-agent-bmm-shenron.md` | `iwish-agent-data-architect.md` |
| `iwish-agent-bmm-data-piccolo.md` | `iwish-agent-data-architect-2.md` |
| `iwish-agent-bmm-data-strategist.md` | `iwish-agent-data-strategist.md` |
| `iwish-agent-bmm-master-roshi.md` | `iwish-agent-tech-writer.md` |
| `iwish-agent-bmm-cell.md` | `iwish-agent-cloner.md` |
| `iwish-agent-bmm-quick-flow-solo-vegeta.md` | `iwish-agent-quick-dev.md` |
| `iwish-agent-grand-priest.md` | `iwish-agent-orch.md` |
| `iwish-bmm-create-story.md` | `iwish-create-story.md` |
| `iwish-bmm-dev-story.md` | `iwish-dev-story.md` |
| `iwish-bmm-code-review.md` | `iwish-code-review.md` |
| `iwish-bmm-create-prd.md` | `iwish-create-prd.md` |
| `iwish-bmm-create-architecture.md` | `iwish-create-architecture.md` |
| `iwish-bmm-create-epics-and-stories.md` | `iwish-create-epics-and-stories.md` |
| `iwish-bmm-create-product-brief.md` | `iwish-create-product-brief.md` |
| `iwish-bmm-create-ui-spec.md` | `iwish-create-ui-spec.md` |
| `iwish-bmm-create-ux-design.md` | `iwish-create-ux-design.md` |
| `iwish-bmm-edit-prd.md` | `iwish-edit-prd.md` |
| `iwish-bmm-validate-prd.md` | `iwish-validate-prd.md` |
| `iwish-bmm-sprint-planning.md` | `iwish-sprint-planning.md` |
| `iwish-bmm-sprint-status.md` | `iwish-sprint-status.md` |
| `iwish-bmm-retrospective.md` | `iwish-retrospective.md` |
| `iwish-bmm-correct-course.md` | `iwish-correct-course.md` |
| `iwish-bmm-clone-website.md` | `iwish-clone-website.md` |
| `iwish-bmm-document-project.md` | `iwish-document-project.md` |
| `iwish-bmm-generate-project-context.md` | `iwish-generate-project-context.md` |
| `iwish-bmm-domain-research.md` | `iwish-domain-research.md` |
| `iwish-bmm-market-research.md` | `iwish-market-research.md` |
| `iwish-bmm-technical-research.md` | `iwish-technical-research.md` |
| `iwish-bmm-quick-dev.md` | `iwish-quick-dev.md` |
| `iwish-bmm-quick-spec.md` | `iwish-quick-spec.md` |
| `iwish-bmm-qa-automate.md` | `iwish-qa-automate.md` |
| `iwish-bmm-enrich-ux.md` | `iwish-enrich-ux.md` |
| `iwish-bmm-check-implementation-readiness.md` | `iwish-check-implementation-readiness.md` |
| `iwish-bmm-check-registry.md` | `iwish-check-registry.md` |
| `iwish-bmm-sync-stitch-design.md` | `iwish-sync-stitch-design.md` |
| `iwish-brainstorming.md` | `iwish-brainstorming.md` |
| `iwish-editorial-review-prose.md` | `iwish-editorial-review-prose.md` |
| `iwish-editorial-review-structure.md` | `iwish-editorial-review-structure.md` |
| `iwish-help.md` | `iwish-help.md` |
| `iwish-index-docs.md` | `iwish-index-docs.md` |
| `iwish-party-mode.md` | `iwish-party-mode.md` |
| `iwish-review-adversarial-general.md` | `iwish-review-adversarial-general.md` |
| `iwish-shard-doc.md` | `iwish-shard-doc.md` |
| `workflow-create-prd.md` | `iwish-create-prd-orchestrator.md` |
| `workflow-domain-research.md` | `iwish-domain-research-orchestrator.md` |
| `workflow-edit-prd.md` | `iwish-edit-prd-orchestrator.md` |
| `workflow-entry.md` | `iwish-ui-spec-entry.md` |
| `workflow-market-research.md` | `iwish-market-research-orchestrator.md` |
| `workflow-technical-research.md` | `iwish-technical-research-orchestrator.md` |
| `workflow-validate-prd.md` | `iwish-validate-prd-orchestrator.md` |

### Runtime Folder Rename Map

| Old Path | New Path |
|----------|----------|
| `_iwish/core/tasks/workflow.xml` | `_iwish/core/tasks/workflow.xml` |
| `_iwish/bmm/config.yaml` | `_iwish/framework/config.yaml` |
| `_iwish/bmm/workflows/4-implementation/Vegeta-story/` | `_iwish/framework/workflows/4-implementation/dev-story/` |
| `_iwish/bmm/workflows/4-implementation/create-story/` | `_iwish/framework/workflows/4-implementation/create-story/` |
| `_iwish/bmm/workflows/4-implementation/code-review/` | `_iwish/framework/workflows/4-implementation/code-review/` |
| `_iwish/bmm/workflows/4-implementation/sprint-planning/` | `_iwish/framework/workflows/4-implementation/sprint-planning/` |
| `_iwish/bmm/workflows/4-implementation/sprint-status/` | `_iwish/framework/workflows/4-implementation/sprint-status/` |
| `_iwish/bmm/workflows/4-implementation/correct-course/` | `_iwish/framework/workflows/4-implementation/correct-course/` |
| `_iwish/bmm/workflows/4-implementation/retrospective/` | `_iwish/framework/workflows/4-implementation/retrospective/` |

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|------|---:|---|
| Functional Correctness | 9 | Clear 1:1 rename mapping with no logic changes. Pure namespace swap. |
| Data Integrity & State | 9 | Fallback manifest (AC1) ensures full rollback capability. Checksums prevent silent data loss. |
| Security & Validation | 9 | No external code execution. Grep validation ensures zero residue. Only `constants.ts` LEGACY_AGENT_ALIASES intentionally retains `iwish` strings. |
| Performance & Scalability | 10 | No runtime performance impact — this is a static file rename operation. |
| Error Handling & Recovery | 9 | T1 generates manifest before any destructive operations. T3 uses temp directory for safe folder migration. |
| Architectural Depth & Leverage | 9 | Preserves the proven 3-layer architecture (canonical → wrapper → runtime) while swapping namespace. No architectural drift. |
| UX Empathy | 9 | Developers working with I-Wish will see a clean, native namespace with no confusing I-Wish residue. Legacy users can still use old command names via `LEGACY_COMMAND_ALIASES`. |

**Total Average:** 9.14 / 10 — **PASS** (>= 8.5)

### Architectural DNA Check
- [x] **Tracer Bullet?** Yes — complete vertical slice: filesystem → content → runtime → validation
- [x] **Deletion Testable?** Yes — the old `_iwish/` folder can be deleted after migration and the system should function entirely from `_iwish/`
- [x] **Interface vs Implementation?** N/A — this is a naming migration, not a module design

## 10. File List

- `_iwish-output/migration/rename-manifest-iw03.yaml` (NEW)
- `.agent/workflows/iwish-*.md` (RENAMED from `iwish-*`)
- `_iwish/core/tasks/workflow.xml` (MOVED from `_iwish/`)
- `_iwish/framework/config.yaml` (MOVED from `_iwish/bmm/`)
- `_iwish/framework/workflows/4-implementation/*/workflow.yaml` (MOVED+UPDATED)
- Canonical short files: `code.md`, `make-story.md`, `review.md`, etc. (CONTENT UPDATED)
