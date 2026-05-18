---
story_id: "STORY-UIUX-1.1"
epic_id: "EPIC-UIUX-01"
title: "Create Specialist Skill Wrapper"
status: "DONE"
assignee: "Vegeta"
priority: "P0"
depends_on: []
phase: "forge"

---
# Story UIUX-1.1: Create Specialist Skill Wrapper

## 1. Objective

Create a I-Wish-native `ui-ux-pro-max-specialist` wrapper that tells agents when to invoke UI/UX Pro Max and how to consume its recommendations without replacing existing I-Wish UX governance.

## 1.1 Context

This story is the first implementation slice for the UI/UX Pro Max Specialist Integration. It establishes the specialist capability as a `SKILL_ATTACHMENT` before any workflow patches are made.

**Source artifacts:**
- `_iwish-output/repo-dna/ui-ux-pro-max-skill-dna.md`
- `docs/ui-ux-pro-max-specialist-integration/gap-analysis.md`
- `docs/ui-ux-pro-max-specialist-integration/implementation-plan.md`
- `_iwish-output/epics/epic-uiux-pro-max-specialist.md`

**Classification decision:**
- Primary: `SKILL_ATTACHMENT`
- Later supporting changes: `WORKFLOW_PATCH`
- Rejected: `DEDICATED_WORKFLOW`, `NEW_PERSONA`, `COMPOUND_INTEGRATION`

## 2. User Story

As a I-Wish agent,  
I want a dedicated UI/UX Pro Max Specialist skill wrapper,  
So that I know when to invoke the external design-intelligence engine and what output to return.

## 3. Acceptance Criteria

### AC0: Capability Classification Gate
**Given** implementation has not started  
**When** Grand-Priest/Vegeta prepares this capability for development  
**Then** the capability is explicitly classified as `SKILL_ATTACHMENT`  
**And** the story documents that later workflow edits are `WORKFLOW_PATCH` changes, not a standalone replacement workflow  
**And** `DEDICATED_WORKFLOW`, `NEW_PERSONA`, and `COMPOUND_INTEGRATION` are rejected with reasons.

### AC1: Specialist Skill Exists
**Given** the I-Wish `.agent/skills/` directory  
**When** this story is complete  
**Then** `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` exists  
**And** it defines the specialist as a complement to I-Wish workflows, not a replacement.

### AC2: Trigger and Skip Rules
**Given** a task is visual, UX, UI, design-system, frontend styling, interaction, accessibility, animation, chart, or product design related  
**When** an agent evaluates the specialist trigger rules  
**Then** it knows UI/UX Pro Max may be invoked.

**Given** a task is pure backend, data, DevOps, security, or non-visual automation  
**When** an agent evaluates the trigger rules  
**Then** the specialist is skipped.

### AC3: Source References
**Given** the external repo artifacts exist  
**When** an agent reads the specialist skill  
**Then** it references the RAP DNA and gap analysis as source context  
**And** does not require copying the full external repo into I-Wish core.

### AC4: Output Contract Stub
**Given** an agent invokes the specialist  
**When** the skill provides guidance  
**Then** it points to the standard recommendation sections that future Story UIUX-1.3 will formalize  
**And** it warns that output must stay concise until the full contract story is implemented.

### AC5: Knowledge Graph Registration Prepared
**Given** the specialist skill file exists  
**When** this story is completed  
**Then** the implementation notes include the exact Knowledge Graph node metadata to register later  
**And** the story does not require manual YAML editing if the helper script is available.

## 4. Tasks

### T1: Create Specialist Skill Directory
- Create `.agent/skills/ui-ux-pro-max-specialist/`.
- Create `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`.
- Keep the skill self-contained and markdown-only for this story.

### T2: Write Specialist Purpose, Triggers, and Skip Rules
- Document when the skill must be considered.
- Document when it must be skipped.
- State that it complements existing I-Wish UX authorities.

### T3: Record Capability Classification
- Add a classification section in `SKILL.md`.
- Record `SKILL_ATTACHMENT` as primary.
- Record `WORKFLOW_PATCH` as later supporting work.
- Explain why `DEDICATED_WORKFLOW`, `NEW_PERSONA`, and `COMPOUND_INTEGRATION` are rejected.

### T4: Add Source References and Safety Boundaries
- Link to DNA and gap analysis.
- State that full repo copying is out of scope.
- State that approved I-Wish Design System and Stitch screens outrank recommendations.

### T5: Prepare Knowledge Graph Registration
- Prepare metadata for `skill-ui-ux-pro-max-specialist`.
- If `.agent/scripts/add-to-kg.sh` is usable, register the skill through the helper.
- If the helper is unavailable or unsuitable, leave a clear follow-up note rather than manually corrupting YAML.

## 5. AC-Task Traceability

| AC ID | AC Summary | Task | Sub-tasks | Status |
|---|---|---|---|---|
| AC0 | Capability classified before implementation | T3 | Classification section, rejected classifications | ✅ |
| AC1 | Specialist skill exists | T1 | Directory, `SKILL.md` | ✅ |
| AC2 | Trigger and skip rules documented | T2 | Trigger list, skip list, complement statement | ✅ |
| AC3 | Source references included without copying repo | T4 | DNA link, gap link, out-of-scope boundary | ✅ |
| AC4 | Output contract stub included | T2, T4 | Recommendation sections, concision warning | ✅ |
| AC5 | KG registration prepared | T5 | Node metadata, helper-script check | ✅ |

## 6. Plan Tune Complexity Check

| Dimension | Result | Score |
|---|---|---:|
| AC Volume | 6 ACs, below >8 threshold | 0 |
| Data Model Spread | 0 DB models touched | 0 |
| UI Surface | 0 UI components | 0 |
| Cross-Domain | 1 bounded context: I-Wish skill governance | 0 |
| Flow Complexity | No async events/state machines | 0 |
| Test Burden | No E2E/manual-test AC tags | 0 |

**Complexity Score:** 0  
**Verdict:** OK — story is well-scoped and can proceed.

## 7. Implementation Notes

- Start with a lightweight wrapper only.
- Do not copy external scripts or large CSV data in this story.
- Include pointers to:
  - `_iwish-output/repo-dna/ui-ux-pro-max-skill-dna.md`
  - `docs/ui-ux-pro-max-specialist-integration/gap-analysis.md`
- Do not patch `workflow-entry.md`, `step-00b-design-system-gate.md`, or review workflows in this story.
- Do not create an agent persona.
- Do not import the external CLI installer.

## 8. Definition of Done

- [x] Classification decision recorded before file creation.
- [x] Skill directory created.
- [x] `SKILL.md` documents purpose, triggers, skip cases, and source references.
- [x] Existing I-Wish UX authorities are named as higher-level governance.
- [x] No workflow files are patched in this story.

## 9. QA Simulator Guardian Scorecard

| Axis | Score (1-10) | Justification / Finding |
|---|---:|---|
| Functional Correctness | 9 | Scope is precise: create one specialist wrapper and prepare classification, without workflow patches. |
| Data Integrity & State | 9 | No database or persistent app state touched; KG registration is prepared cautiously. |
| Security & Validation | 9 | No external executable import or network call required; source repo already passed RAP Phase 0. |
| Performance & Scalability | 9 | Markdown-only wrapper avoids context/data bloat and defers heavy datasets. |
| Error Handling & Recovery | 8 | Helper-script fallback is specified; future stories handle workflow conflicts. |
| Code Quality & Maintainability | 9 | Clear separation between skill wrapper, workflow patches, and future output-contract work. |
| UX Empathy | 9 | Protects existing I-Wish UX gates while enabling better design-intelligence guidance. |

**Total Average:** 8.86 / 10 — PASS

## 10. File List

- `.agent/skills/ui-ux-pro-max-specialist/SKILL.md`
- `.agent/knowledge-graph.yaml`
- `_iwish-output/stories/epic-uiux-pro-max/story-uiux-1.1-specialist-wrapper.md`
- `_iwish-output/stories/sprint-status.yaml`

## 11. Vegeta Agent Record

### Implemented

- Created `.agent/skills/ui-ux-pro-max-specialist/SKILL.md` as a lightweight I-Wish wrapper.
- Recorded the primary classification as `SKILL_ATTACHMENT` and supporting future work as `WORKFLOW_PATCH`.
- Documented trigger rules, skip rules, I-Wish authority order, non-override rule, source references, and concise output stub.
- Registered the skill in `/.agent/knowledge-graph.yaml` using `./.agent/scripts/add-to-kg.sh`.

### Tests / Validation Run

- Ran `./.agent/scripts/validate-kg.sh` → pass.
- Verified the new skill node and file path exist via text search.

### Decisions

- Executed AC5 fully instead of leaving KG registration as a future preparation step because the helper script was available and the story scope remained low-risk.
- Kept workflow integration out of scope for this story; later stories will patch workflow entry points.
