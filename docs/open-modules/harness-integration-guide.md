# Harness Integration Guide

## 1. Classification & Framework Placement
**Shape Classification:** `workflow` + `skill-attachment`
**Role Classification:** `process-primary` + `supportive`
**Framework Placement:** `SYSTEM_SKILL` (Direct integration into I-Wish system workflows such as `/create-architecture`, `/create-skill`, `/tournament`, and `qa-agent`).

## 2. Core Use Cases
- **Architecting Multi-Agent Teams:** When users use `/create-architecture`, I-Wish can leverage the 6-Pattern Architecture matrix from Harness to define exact multi-agent topologies (Pipeline, Fan-out, etc.).
- **Skill Generation:** When `/create-skill` is called, adopting the Progressive Disclosure (3-layer: Metadata -> Main -> References) pattern ensures skills remain under context limits.
- **A/B Skill Testing:** Injecting "With vs Without" testing into `/tournament` to definitively validate skill effectiveness before deployment.

## 3. Adjacent Use Cases
- **Incremental QA Validation:** Upgrading the `qa-agent` guide in I-Wish to perform boundary cross-checks incrementally during development rather than solely at the end of `make-story`.

## 4. Edge Cases
- **Compound Skill Explosion:** If a user requests a deeply complex domain, the 3-layer system might result in dozens of `references/` files. The integration must enforce a maximum count.
- **Tournament Token Limits:** Running parallel "With vs Without" agents consumes 2x tokens. If the prompt is massive, it might trigger rate limits.

## 5. Stress Cases
- Attempting to architect a 10+ agent team. Harness guidelines strongly advise 3-5 focused agents; I-Wish must adopt this hard limit.

## 6. Constraints
- **Do not adopt the CLAUDE.md pointer system:** I-Wish uses `project-context.md` and `FeatureGraph`.
- **Do not blindly force Agent Teams for simple tasks:** I-Wish maintains a bias for single-agent efficiency unless communication overhead is justified.

## 7. Agent / Workflow / Skill Coordination
- **architect-agent** -> Consumes the 6-Pattern Matrix.
- **capability-agent** -> Uses the 3-Layer Prompt Pattern and "With vs Without" testing.
- **qa-agent** -> Implements Incremental Boundary Checks.

## 8. Orch Routing Hints
- **Trigger keywords:** "design agent team", "multi-agent architecture", "test skill effectiveness", "split skill into references".
- When routing to `/create-skill`, Orch should explicitly append a hint: `"Ensure 3-layer progressive disclosure is used."`

## 9. Explicit Review Questions for User
1. Do you agree with the token tradeoff for the "With vs Without" parallel testing in `/create-skill`?
2. Should we strictly limit generated Agent Teams to a maximum of 5 members to prevent overhead?
3. Are you ready to proceed to Phase 6 (Integrate & Classify), where these modifications will be written to the live I-Wish `.agent/workflows/` files?
