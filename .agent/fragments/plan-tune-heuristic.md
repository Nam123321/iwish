---
name: 'Plan Tune Heuristic'
description: 'Story complexity scoring, split/merge protocol, and AC-to-Task traceability matrix. Scavenged from Gstack Plan Tune skill and adapted for I-Wish story generation.'
---

# Plan Tune Heuristic — Story Complexity Governance

> **Trigger:** This fragment is loaded by `/create-epics-and-stories` (Step 3.5) and `/create-story` (Step 5.5) AFTER generating a Story's Acceptance Criteria and BEFORE finalizing the Story.

---

## Part A: Heuristic Scoring Table (Complexity Score — CS)

For each newly generated Story, evaluate ALL 6 dimensions and sum the scores:

| # | Dimension | What to Measure | Threshold | Score if Exceeded |
|---|---|---|---|---|
| 1 | **AC Volume** | Total number of ACs (including `[EDGE-CASE]` tagged) | > 8 ACs | +2 |
| 2 | **Data Model Spread** | Number of DB models touched (CREATE or ALTER) | > 3 models | +3 |
| 3 | **UI Surface** | Number of NEW UI components to build from scratch | > 4 components | +2 |
| 4 | **Cross-Domain** | Story crosses more than 1 bounded context (e.g., Auth + Payment + Inventory) | > 1 domain | +3 |
| 5 | **Flow Complexity** | Story involves async events, webhooks, multi-step state machines, or saga patterns | Present | +2 |
| 6 | **Test Burden** | Number of ACs tagged `[E2E-TEST]` or `[MANUAL-TEST]` | > 3 tagged ACs | +1 |

### Verdict Logic

| Complexity Score (CS) | Verdict | Agent Action |
|---|---|---|
| **CS ≤ 3** | ✅ **OK** | Proceed normally. Story is well-scoped. |
| **CS 4–6** | ⚠️ `[PLAN-TUNE WARNING]` | Alert the User. Recommend splitting but do not force. Present the scoring breakdown and let User decide. |
| **CS ≥ 7** | 🛑 `[PLAN-TUNE HALT]` | **MANDATORY SPLIT.** Workflow HALTS. Agent MUST present a split proposal using Part B criteria. User must approve the split before proceeding. |

### Scoring Example

```
Story: "Create Full Inbound Stock Management"
- AC Volume: 12 ACs → +2
- Data Model: InboundOrder, InboundItem, LotBatch, Supplier, PO → 5 models → +3
- UI Surface: InboundSheet, SplitPanel, BulkBar, LotModal, ScanDialog → 5 components → +2
- Cross-Domain: Inventory + Purchasing → +3
- Flow: Webhook from supplier system → +2
- Test: 4 E2E tests → +1
CS = 2+3+2+3+2+1 = 13 → 🛑 HALT — MANDATORY SPLIT
```

> [!NOTE]
> **V1 Scoring Design:** The current heuristic uses binary thresholds per dimension (all-or-nothing). A story with 9 ACs scores the same (+2) as one with 20 ACs. This is intentional to reduce cognitive overhead during calculation. If this causes boundary case issues, future iterations may adopt graduated/tiered scoring (e.g., >8 ACs = +2, >12 ACs = +4).

---

## Part B: Story Split Protocol (HOW to Split)

When CS triggers WARN or HALT, apply these **6 criteria in priority order**:

### 1. 🎯 Vertical Slice First (Highest Priority)

- ❌ **NEVER** split by technical layer (e.g., "Story A = Backend API", "Story B = Frontend UI").
- ✅ **ALWAYS** split by **user value** (e.g., "Story A = View list", "Story B = Create new item", "Story C = Edit existing item").
- **Rationale:** Agent dev-agent needs to see the complete user flow (API → Service → UI) within a single story to maintain development context.

### 2. 🔗 Context Boundary Rule

Each sub-story MUST be self-contained. Agent MUST be able to execute it **WITHOUT reading other sub-stories**.

Every sub-story created from a split MUST include this block:

```markdown
## Context Inheritance
- **Parent Story:** [story_id] — [original story title]
- **Shared Models:** [list of models already created by prior stories]
- **Assumed State:** [system state this story assumes exists]
- **Output Contract:** [interface/API/schema this story produces for future stories]
```

### 3. 📦 Data Migration Ordering

- Story that **CREATES** a table → MUST come **BEFORE** story that **ALTERS** it.
- If 2 sub-stories both need to ALTER the **same model** → **MERGE them** (see Part C).
- Migrations MUST be independently runnable. No migration may reference a table/column created in a later story's migration.

### 4. 🔄 Single State Machine Rule

- A state machine (e.g., Order: `draft → confirmed → shipped → delivered`) **MUST NOT** be split across 2 stories.
- **Rationale:** Agent needs the complete state transition graph to write correct guard conditions, transition logic, and rollback handlers.
- **Exception:** If the state machine has > 6 states, split by lifecycle phases (e.g., "Creation & Confirmation" vs. "Fulfillment & Delivery").

### 5. 🧪 Test Isolation

- Each sub-story MUST be **independently testable** — its ACs can be verified without running code from a later story.
- If Story A creates an API but can only be verified through UI in Story B → Story A MUST include a direct API test (e.g., curl command, API test case, or Postman collection).

### 6. 📐 Max 2 Levels Deep

- Only **1 level** of splitting is allowed: `Story → Sub-stories`.
- **Sub-sub-stories are FORBIDDEN.** If a sub-story is still too complex → promote it to a full independent Story within the Epic.

---

## Part C: Story Merge Criteria (When to COMBINE)

The opposite problem: stories that are too granular. Agent MUST detect and propose merges when these signals appear:

| # | Signal | Trigger Condition | Action |
|---|---|---|---|
| 1 | **Tiny Story** | Story has ≤ 2 ACs, all are config/setup/boilerplate | Merge into the nearest story that has direct user value |
| 2 | **Tight Coupling** | 2 stories MUST be deployed simultaneously to function | Merge into 1 story |
| 3 | **Same Model Lock** | 2 stories both ALTER the exact same table(s) | Merge to prevent migration conflicts |
| 4 | **No User Value** | Story is purely technical (setup DB, configure env, install deps) with no user-facing outcome | Merge into the first story that delivers user value |
| 5 | **Sequential Dependency** | Story B will fail 100% if Story A is not done first AND both are small (≤ 4 ACs each) | Consider merging if combined CS ≤ 6 |

---

## Part D: AC-to-Task Traceability Matrix

After finalizing a Story's ACs, Agent MUST generate this mapping table:

```markdown
## AC-Task Traceability
| AC ID | AC Summary | Task | Sub-tasks | Status |
|-------|------------|------|-----------|--------|
| AC1 | [brief] | T1: [task name] | ST1.1, ST1.2 | ☐ |
| AC2 | [brief] | T2: [task name] | — | ☐ |
| AC3 | [brief] | — | — | ⚠️ MISSING |
```

### Traceability Rules

1. **Every AC MUST map to at least 1 Task.** If any AC shows `⚠️ MISSING` → Workflow **HALTS** until a task is assigned.
2. **Every Task MUST trace back to an AC.** Tasks without an AC parent are flagged as `⚠️ ORPHAN TASK` — they add scope without adding value. Remove or justify.
3. **Sub-tasks are optional** but recommended for Tasks touching > 1 file or requiring both backend and frontend work.
4. **Status column** is updated by dev-agent during execution: `☐` → `🔄` → `✅`.

---

## Part E: Architectural & Constitutional Gates

Whenever a plan or tech-spec is drafted, evaluate the proposed changes against the following 5 Constitutional Gates:

1. **Library-First:** Is the implementation structured as a standalone, decoupled library/module before integrating with the application or CLI?
2. **CLI Interface:** Does the module expose a clean text-based CLI (input/output/arguments) interface for scriptability and testability?
3. **Test-First:** Is there a planned test suite or dry-run validation protocol to verify the feature's core logic before it is deployed?
4. **Simplicity Gate:** Does the feature avoid unnecessary modular sprawl (strictly ≤ 3 sub-projects/directories created)?
5. **Anti-Abstraction:** Does the code use direct framework/platform features instead of custom wrappers or abstraction layers?

### Complexity Tracking & Justification Table

If any gate is violated, you MUST document it by filling in the table below:

```markdown
### Complexity & Gate Justification
| Gate Violated | Rationale for Violation | Simpler Alternative Rejected Because |
|---|---|---|
| [Gate Name] | [Explain why this violation is architectural required] | [Explain what simpler option was considered and why it failed] |
```

If the plan fully complies with all 5 gates without any violations, output exactly:

```markdown
### Complexity & Gate Justification
No Violations — Compliant with Constitution
```

