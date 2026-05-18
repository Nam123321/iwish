---
stepsCompleted:
  - requirements-inventory
  - epic-design
  - story-breakdown
  - sprint-ready
inputDocuments:
  - ${IWISH_HOME}/repo-dna/hermes-agent-dna.md
  - ${IWISH_HOME}/gap-analysis/hermes-agent-gap-analysis.md
  - ${IWISH_HOME}/absorbed-repos/hermes-agent/self-evolution-analysis.md
  - ${IWISH_HOME}/absorbed-repos/hermes-agent/darwinian-evolver-research.md
  - ${IWISH_HOME}/absorbed-repos/hermes-agent/iwish-evolution-lab-trial-plan.md
phase: "origin"

---
# Hermes + Self-Evolution Absorption - Epic Breakdown

## Overview

This epic set converts the approved absorption research for Hermes Agent, Hermes Agent Self-Evolution, and Darwinian Evolver into I-Wish-DragonBall implementation stories.

The selected approach is **governed, project-centered, hybrid pattern absorption**:

- absorb Hermes' memory, skill authoring, curator, and background-review ideas selectively;
- adapt Hermes memory from assistant-user orientation to I-Wish project/process orientation;
- absorb Hermes Self-Evolution as an offline candidate-generation and benchmark pattern;
- absorb Darwinian Evolver at behavioral-pattern level, not source-code level;
- build a I-Wish-native Skill/Workflow Evolution Lab before any canonical `.agent/` asset promotion;
- approve `run-both-then-judge` as the preferred execution mode inside explicitly enabled Evolution Lab scope, with I-Wish native and Darwinian candidates evaluated side by side.

## Requirements Inventory

### Functional Requirements

- **FR1:** Define I-Wish memory layers with `PROJECT.md` as the primary project memory and `USER.md` as cross-project preference memory.
- **FR2:** Create governed skill/workflow authoring rules inspired by Hermes `SKILL.md`, curator, and background review patterns.
- **FR3:** Create a I-Wish-native Skill/Workflow Evolution Lab design that supports organisms, evaluators, mutators, failure cases, population, lineage, and learning logs.
- **FR4:** Define scoring, novelty, holdout, and regression policies for candidate evolution.
- **FR5:** Define external-reference criteria for Darwinian Evolver without copying AGPL source code.
- **FR6:** Run a structured trial on selected I-Wish skills/workflows before promotion.
- **FR7:** Add promotion, rollback, and governance gates so generated candidates cannot overwrite canonical `.agent/` assets automatically.
- **FR8:** Update I-Wish documentation/index surfaces so agents know when to use project memory and the evolution lab.
- **FR9:** Define project-scoped dual-run activation, Darwinian adapter install gating, degraded modes, and source-selection records for Evolution Lab execution.
- **FR10:** Extract structural bug lessons into project memory and increment graph bug metrics.

### Non-Functional Requirements

- **NFR1:** Do not vendor or copy AGPL Darwinian Evolver source code into I-Wish.
- **NFR2:** Keep all generated candidates outside canonical `.agent/` paths until human approval.
- **NFR3:** Preserve existing I-Wish workflow authority and human checkpoints.
- **NFR4:** Keep memory loading context-efficient and project-scoped.
- **NFR5:** Ensure evolution scoring rewards measurable improvement, not cosmetic rewrites.
- **NFR6:** Keep first implementation markdown/workflow-focused; defer production code evolution.

### Constraints

- Darwinian Evolver may be used as a sandboxed external reference for behavior, scoring, novelty, and population tuning.
- Darwinian Evolver must remain optional at I-Wish install time, but may become required when a project explicitly enables dual-run Evolution Lab scope.
- Hermes runtime, messaging gateway, provider adapters, and broad plugin runtime remain out of scope.
- Continuous unattended evolution is out of scope.
- Exact external-engine integration requires legal/product review.

## FR Coverage Map

- **FR1:** Epic 1
- **FR2:** Epic 1
- **FR3:** Epic 2
- **FR4:** Epic 2
- **FR5:** Epic 2
- **FR6:** Epic 3
- **FR7:** Epic 3
- **FR8:** Epic 1 and Epic 3
- **FR9:** Epic 2 and Epic 3
- **FR10:** Epic 1

## Epic List

### Epic 1: Project-Centered Hermes Absorption

I-Wish adapts Hermes' self-improving assistant ideas into project-centered process memory, skill authoring discipline, and curated learning records.

**Stories:**
- Story HSEA-1.1: Define I-Wish Project Memory Model
- Story HSEA-1.1b: Define Memory Admission Scoring and Trigger Routing
- Story HSEA-1.2: Add Hermes-Inspired Skill Authoring and Curator Rules
- Story HSEA-1.2b: Add Skill Provenance and Draft Creation Lineage
- Story HSEA-1.2c: Govern Draft Skill Creation from Session Feedback
- Story HSEA-1.3: Add Background Review and Learning Log Governance
- Story HSEA-1.4: Implement Auto-Immune System (Bug-Driven Knowledge Extraction)

### Epic 2: I-Wish Evolution Lab Foundation

I-Wish defines a clean-room skill/workflow evolution capability based on Hermes Self-Evolution and Darwinian Evolver behavioral patterns.

**Stories:**
- Story HSEA-2.1: Specify Evolution Lab Core Model
- Story HSEA-2.2: Define Scoring, Novelty, Holdout, and Population Policy
- Story HSEA-2.3: Define Darwinian External Reference Boundaries
- Story HSEA-2.4: Define Dual-Run Scope Activation and Darwin Adapter Gate

### Epic 3: Trial, Promotion, and Validation

I-Wish validates the evolution lab against real skills/workflows and creates safe promotion/rollback gates before canonical integration.

**Stories:**
- Story HSEA-3.1: Create Evolution Lab Trial Fixtures
- Story HSEA-3.2: Run Trial and Produce Scorecard
- Story HSEA-3.2b: Add Human Trial Review Packet and Decision UX
- Story HSEA-3.3: Add Promotion and Rollback Governance

### Epic 4: Routing, Runtime, and Diagnostics Hardening

I-Wish absorbs the non-evolution Hermes patterns that were approved in gap analysis but not yet represented by implementation stories.

**Stories:**
- Story HSEA-4.1: Add Command Registry Consistency Check
- Story HSEA-4.2: Define Profile-Aware Runtime Home Policy
- Story HSEA-4.3: Add Turn-Exit Diagnostics for I-Wish Workflows
- Story HSEA-4.4: Materialize I-Wish Workflow Runtime from Templates
- Story HSEA-4.5: Define Graph Backend Selection and Adapter Contract
- Story HSEA-4.6: Operation Report & Health Dashboard Integration


## Gap Coverage Review

Covered by this epic set:

- Project-centered memory and `USER.md`/`PROJECT.md` split.
- Memory admission scoring and trigger routing.
- Governed self-create draft skills from session feedback.
- Skill authoring, curator rules, provenance, and lineage.
- Background review as recommendation-only.
- Offline/evolutionary skill-workflow improvement loop.
- Darwinian Evolver external-reference boundaries.
- Dual-run scope activation, Darwin adapter install gate, and degraded-mode policy.
- Trial fixtures, scorecards, promotion, and rollback gates.
- Human review packet and decision UX for comparing native, Darwinian, and merged candidates.

Previously missing and now added as Epic 4:

- Central command registry consistency.
- Profile-aware runtime home policy.
- Turn-exit diagnostics.
- Workflow runtime materialization from source/templates into `_iwish/`.
- Explicit graph backend selection and adapter contract for CodebaseGraph, FeatureGraph, and MemoryGraph.

Intentionally not covered:

- Messaging gateway/platform adapters.
- Full Hermes skill library.
- Full provider/plugin runtime.
- TUI/dashboard PTY embedding.
- Continuous unattended evolution.
- Production source-code evolution.

Deferred/inspiration-only:

- DSPy/GEPA exact implementation.
- Plugin manifest taxonomy.
- Optional Darwinian Evolver external engine adapter after legal/product review.
- Exact rollout thresholds for expanding dual-run scope beyond approved asset classes.

## Sprint Entry Recommendation

Start with Epic 1, Story HSEA-1.1. Memory model decisions should precede evolution lab implementation because candidate scoring must know which context belongs to the user, project, workflow, and current session.

Recommended initial sprint sequence:

1. `HSEA-1.1` - Define I-Wish Project Memory Model
2. `HSEA-1.1b` - Define memory admission scoring and trigger routing
3. `HSEA-1.2` - Add skill authoring and curator rules
4. `HSEA-1.2b` - Add skill provenance and draft creation lineage
5. `HSEA-1.2c` - Govern draft skill creation from session feedback
6. `HSEA-2.1` - Specify Evolution Lab Core Model
7. `HSEA-2.2` - Define scoring and population policy
8. `HSEA-2.3` - Define Darwinian external-reference boundaries
9. `HSEA-2.4` - Define dual-run scope activation and Darwin adapter gate
10. `HSEA-3.1` - Create trial fixtures

Keep `HSEA-3.2` and `HSEA-3.3` in backlog until the trial fixture structure exists.

## QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | The epic turns approved absorption research into implementable I-Wish increments with clear coverage across memory, evolution, scoring, and governance. |
| Data Integrity & State | 9 | Project memory, workflow memory, and learning logs are separated so state does not collapse into one global assistant memory. |
| Security & Validation | 9 | AGPL source import is blocked; external reference use is bounded; human promotion gates remain required. |
| Performance & Scalability | 9 | Project-scoped memory and trial-first evolution avoid context bloat and uncontrolled candidate growth. |
| Error Handling & Recovery | 9 | Holdouts, regression penalties, rollback, and promotion gates address overfitting and bad mutations. |
| Code Quality & Maintainability | 9 | Stories are decomposed into narrow docs/spec/governance increments before any runner implementation. |
| UX Empathy | 9 | The plan respects real project/user feedback loops and avoids turning self-improvement into invisible automation. |

**Total Average:** 9.00 / 10 - PASS
