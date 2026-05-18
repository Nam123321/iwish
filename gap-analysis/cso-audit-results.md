# CSO Audit Results

This report documents the rewrite of `description` fields across top BMAD capabilities to enforce Claude Search Optimization (CSO) rules.
CSO Rule: Descriptions MUST NOT contain workflow summaries. They MUST ONLY contain triggering conditions (symptoms, keywords).

## File: `.agent/skills/pivot-guardian/SKILL.md`
**Old Description:**
> Enforces the PIV (Plan, Implement, Validate) loop, Convergence Detection, and Zoom-Out heuristic to prevent agents from cascading errors or tunnel vision.
**New Description (CSO Compliant):**
> 'Use when an agent edits the same file for 3+ consecutive calls, or gets stuck in a loop without validation.'

## File: `.agent/skills/socratic-review/SKILL.md`
**Old Description:**
> "Progressive Socratic Loop for adversarial design review and feature drift detection"
**New Description (CSO Compliant):**
> 'Use when generating an implementation plan to evaluate architectural drift, database migrations, and backward compatibility before execution.'

## File: `.agent/skills/caveman-mode/SKILL.md`
**Old Description:**
> "Compressed communication mode for high-efficiency development"
**New Description (CSO Compliant):**
> 'Use when requested by user to suppress conversational output and execute instructions with maximum brevity and raw code.'

## File: `.agent/skills/clone-website/SKILL.md`
**Old Description:**
> 'Suite of skills for reverse-engineering websites. Includes DOM extraction, design token extraction, and interaction analysis. Used by Cell agent and available as sub-skills for Piccolo, Vegeta, and Tien-Shinhan.'
**New Description (CSO Compliant):**
> 'Use when instructed to extract DOM structure, design tokens, or interaction specs from a provided URL.'

## File: `.agent/skills/design-consultation/SKILL.md`
**Old Description:**
> "Design Consultation specialist for adversarial UX/UI review using the Design Army pattern. Dispatches parallel specialist lenses (Typography, Color, Layout, Interaction, IA) to review UI components."
**New Description (CSO Compliant):**
> 'Use when validating UI component implementations against design principles (typography, color, layout) to detect UX regressions.'

## File: `.agent/skills/qa-simulator-guardian/SKILL.md`
**Old Description:**
> "QA Simulator Guardian for conducting the Fat-Guardian Simulator mental run and calculating the 7-row Hybrid Scorecard."
**New Description (CSO Compliant):**
> "Use when validating a story's completeness by mentally simulating edge cases, state integrity, and generating the 7-row Hybrid Scorecard."

## File: `.agent/workflows/bmad-brainstorming.md`
**Old Description:**
> 'Facilitate interactive brainstorming sessions using diverse creative techniques and ideation methods'
**New Description (CSO Compliant):**
> 'Use when the user wants to generate new ideas, explore product directions, or structure a brainstorming session.'

## File: `.agent/workflows/bmad-bmm-code-review.md`
**Old Description:**
> 'Perform an ADVERSARIAL Senior Developer code review that finds 3-10 specific problems in every story. Challenges everything: code quality, test coverage, architecture compliance, security, performance. NEVER accepts `looks good` - must find minimum issues and can auto-fix with user approval.'
**New Description (CSO Compliant):**
> 'Use when the user requests a code review or when validating an implemented story to find security, performance, or coverage issues.'

## File: `.agent/workflows/fix-bug.md`
**Old Description:**
> 'Structured Bug Resolution Process (SBRP) v2.0 — 8-phase tiered workflow for fixing bugs with RCA, impact analysis, edge-case + data-integrity checks, regression testing, scoring/tracking, and process governance.'
**New Description (CSO Compliant):**
> 'Use when a bug is reported to perform root cause analysis, impact analysis, and regression testing before fixing.'

## File: `.agent/workflows/bmad-bmm-create-epics-and-stories.md`
**Old Description:**
> 'Transform PRD requirements and Architecture decisions into comprehensive stories organized by user value. This workflow requires completed PRD + Architecture documents (UX recommended if UI exists) and breaks down requirements into implementation-ready epics and user stories that incorporate all available technical and design context. Creates detailed, actionable stories with complete acceptance criteria for development teams.'
**New Description (CSO Compliant):**
> 'Use when PRD and Architecture documents are complete and need to be broken down into implementation-ready user stories.'
