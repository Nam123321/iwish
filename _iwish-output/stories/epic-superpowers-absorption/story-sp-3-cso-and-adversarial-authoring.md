# Story SP-3: CSO & Adversarial Authoring — Nâng Cấp Capability Forging

## Story ID: SP-3
## Epic: SP-ABSORB (Superpowers Absorption)
## Status: Draft
## Priority: P1 (High — Systemic quality improvement)
## Estimated Effort: Large

---

## User Story

> **As a** I-Wish ecosystem maintainer,
> **I want** the skill/workflow creation process to include TDD-for-Prompts and CSO (Claude Search Optimization) principles,
> **So that** newly created skills are bulletproof against LLM rationalization and are discoverable by agents without hardcoded routing.

---

## Background & Rationale

**Source:** Superpowers `writing-skills` (TDD for Documentation + CSO).

Two key insights from Superpowers:
1. **TDD-for-Prompts:** Never write a skill without first observing the agent fail (Pressure Scenario → baseline rationalizations → write skill to block those exact rationalizations → verify).
2. **CSO:** If a skill's `description` contains a workflow summary, LLMs will shortcut by following the description instead of reading the full SKILL.md. Description MUST only contain triggering conditions.

I-Wish currently creates skills via `/create-capability` (Whis) based on best practices but without adversarial testing. Descriptions across `.agent/skills/` and `.agent/workflows/` have not been audited for CSO compliance.

---

## Acceptance Criteria

### AC-1: Adversarial Authoring Step in `/create-capability`
- [ ] `/create-capability` workflow includes new step after spec generation: "RED Phase — Pressure Test"
  - Agent creates 2-3 pressure scenarios simulating conditions where LLM would violate the skill's rules
  - Agent runs scenarios WITHOUT the skill and documents baseline rationalizations
  - Agent writes skill to counter those specific rationalizations
- [ ] Skill template updated to include mandatory sections:
  - `## Red Flags — STOP and Reconsider` (list of known rationalization patterns)
  - `## Common Rationalizations` (table: Excuse → Reality)

### AC-2: CSO Compliance for New Skills
- [ ] All new skills created via `/create-capability` MUST have `description` starting with "Use when..."
- [ ] Description MUST NOT contain workflow summary or process steps
- [ ] Description MUST contain specific triggering conditions, symptoms, and keywords
- [ ] Validation gate added: if description contains verbs like "generates", "creates", "produces" → warning flag

### AC-3: CSO Audit of Existing I-Wish Skills/Workflows (Top 20)
- [ ] Audit the top 20 most-referenced skills and workflows
- [ ] For each, verify description follows CSO rules
- [ ] Fix any descriptions that contain workflow summaries
- [ ] Document audit results in `gap-analysis/cso-audit-results.md`
- [ ] Priority audit targets:
  - `.agent/skills/pivot-guardian/SKILL.md`
  - `.agent/skills/socratic-review/SKILL.md`
  - `.agent/skills/caveman-mode/SKILL.md`
  - `.agent/skills/clone-website/SKILL.md`
  - `.agent/skills/design-consultation/SKILL.md`
  - `.agent/skills/qa-simulator-guardian/SKILL.md`
  - `.agent/workflows/iwish-brainstorming.md`
  - `.agent/workflows/iwish-bmm-code-review.md`
  - `.agent/workflows/fix-bug.md`
  - `.agent/workflows/iwish-bmm-create-epics-and-stories.md`

### AC-4: `/enhance-capability` Workflow Update
- [ ] `/enhance-capability` workflow includes CSO validation step before finalizing changes
- [ ] Any description edit triggers CSO compliance check

---

## Technical Tasks

1. **Edit** `.agent/workflows/create-capability.md` (or its core counterpart)
   - Add "RED Phase — Pressure Test" step
   - Add CSO validation gate for description field

2. **Edit** `.agent/workflows/enhance-capability.md`
   - Add CSO compliance check step

3. **Create** `gap-analysis/cso-audit-results.md`
   - Audit top 20 skills/workflows
   - Fix descriptions that violate CSO

4. **Update** skill template (if one exists) to include Red Flags and Rationalizations sections

---

## Dependencies
- None (can run in parallel with SP-1 and SP-2)

## Notes
- CSO Audit (AC-3) is the largest task. Consider doing it in batches of 5-7 files.
- The "RED Phase" in Adversarial Authoring is intentionally lightweight for I-Wish — not the full 3-iteration Superpowers TDD cycle, which is too token-intensive.
