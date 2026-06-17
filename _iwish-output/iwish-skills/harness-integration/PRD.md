# Product Requirements Document (PRD): Harness Protocol Integration

## 1. Vision & Problem Statement
**Vision:** Elevate I-Wish's multi-agent orchestration and skill creation capabilities by absorbing battle-tested patterns from the Harness meta-skill, specifically focusing on architectural topologies, progressive disclosure, empirical testing, and incremental QA.
**Problem Statement:** Currently, I-Wish lacks structured templates for complex multi-agent topologies (like Pipeline, Fan-out, Supervisor). Skill creation can lead to token bloat due to a lack of enforced separation between instructions and references. Validation testing is linear and subjective, lacking empirical A/B proofs.

## 2. Target Audience
I-Wish system agents (architect, capability, qa) and advanced users engineering complex workflows.

## 3. Scope & Dependencies
- **In Scope:** 
  - Updating `/create-architecture` with 6 topology patterns.
  - Updating `/create-skill` with 3-Layer Progressive Disclosure.
  - Updating skill validation (`/tournament` or `step-w-04`) with "With vs Without" testing.
  - Updating `qa-agent` documentation with Boundary Cross-Check patterns.
- **Out of Scope:** Replacing I-Wish's `project-context.md` with `CLAUDE.md`.

## 4. Functional Requirements (FRs)
- **FR-1:** The `/create-architecture` workflow MUST provide templates for Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, and Hierarchical Delegation.
- **FR-2:** The `/create-skill` workflow MUST mandate a 3-layer structure (Metadata, Main SKILL.md < 500 lines, references/).
- **FR-3:** Skill validation MUST perform parallel A/B testing (With Skill vs Without Skill) to measure empirical delta.
- **FR-4:** QA agent workflows MUST instruct the agent to perform "Incremental Boundary Cross-Checks" between modules.

## 5. Non-Functional Requirements (NFRs)
- **NFR-1:** Backward Compatibility: Existing I-Wish skills and workflows must not be broken by these updates.
- **NFR-2:** Token Efficiency: The new 3-layer pattern must demonstrably reduce token consumption for complex skills.
