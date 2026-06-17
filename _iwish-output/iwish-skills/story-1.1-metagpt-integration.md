# Story 1.1: Sequential Turn Fragment Draft

## Goal
Create a system fragment `sop-sequential-execution` in draft form under `${IWISH_HOME}/generated-skills/` (or `.agent/fragments/`) that defines the rules for sequential turn routing.

## Context
Integration of MetaGPT extracted features into I-Wish system skills. Epic 1: MetaGPT SOP Sequential Execution Pattern.

## Tracer Bullet
The vertical slice for this story is drafting the markdown fragment `.agent/fragments/sop-sequential-execution.md` that dictates sequential turn routing rules (`BY_ORDER` react mode) and state tracking, ensuring an agent can read and follow these rules.

## Acceptance Criteria
- **AC1**: Define the `BY_ORDER` react mode frontmatter.
- **AC2**: Map sequential step progress tracking (`rc.state` equivalents).
- **AC3**: Include the "Error Handling & Healing" rule that invokes the `fast-track-self-healing` loop on failure.

## Tasks
- [ ] Task 1: Create the `.agent/fragments/sop-sequential-execution.md` file.
- [ ] Task 2: Write the `BY_ORDER` react mode rules in the fragment.
- [ ] Task 3: Write the progress tracking rules (`rc.state` equivalent) in the fragment.
- [ ] Task 4: Add the "Error Handling & Healing" section linking to the `fast-track-self-healing` loop.

## AC-to-Task Traceability Matrix
| Acceptance Criteria | Task(s) | Status |
|---|---|---|
| AC1: Define the `BY_ORDER` react mode | Task 2 | Ready |
| AC2: Map sequential step progress tracking | Task 3 | Ready |
| AC3: Error Handling & Healing rule | Task 4 | Ready |

## Socratic Review Mode (Gate 1: business)
**Outcome**: Approved.
- **UX Flow**: As a system fragment, UX flow is agent-facing. Readability and clarity for LLM parsing is verified.
- **Tracer Bullet Integrity**: The slice represents a complete functional guideline for sequential execution.
- **Edge Cases Checked**: Agent fails mid-sequence (addressed by AC3 Error Handling), Agent skips a step (addressed by progress tracking AC2).

## Plan Tune Complexity Check
- Tasks: 4 tasks.
- Complexity Score (CS): 3 (Low complexity).
- Recommendation: Proceed.

## QA Simulator Scorecard
| Metric | Score | Justification |
|---|---|---|
| 1. Clear Setup | 9/10 | The required file path and format are clearly defined. |
| 2. Action Executable | 9/10 | LLM can easily generate a markdown document following these specs. |
| 3. Expected Result Verifiable | 10/10 | The presence of specific sections (BY_ORDER, tracking, error loop) can be statically checked. |
| 4. Edge Cases Handled | 9/10 | Error handling and step recovery are explicitly modeled. |
| 5. Impact Safe | 10/10 | It's a draft document, no risk of breaking existing runtime. |
| 6. Traceability Clear | 10/10 | Directly linked to Epic 1 and MetaGPT integration PRD. |
| 7. UX Empathy (Agent) | 9/10 | The fragment structure targets optimal LLM comprehension. |
| **TOTAL AVERAGE** | **9.4/10** | **PASS** |
