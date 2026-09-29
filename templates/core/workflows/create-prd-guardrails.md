# PRD Creation Guardrails

When executing the PRD Creation workflow, you MUST follow these guardrails exactly:

1. **INITIAL DRAFT:** First, load and follow `@{project-root}/.agent/workflows/workflow-create-prd.md` to draft the PRD.
2. **CRITICAL — SOCRATIC REVIEW GATE 0:** Before finalizing the PRD, execute the Socratic Review Mode (Gate 0: `discovery`). Load `.agent/skills/socratic-review/SKILL.md` to stress-test the core scope, tech stack, and non-functional requirements.
3. **CRITICAL — PRODUCT STRATEGY ALIGNMENT CHECK:** After Socratic Review, cross-reference the drafted PRD against `product-strategy.md` to verify:
   (a) Every PRD Functional Requirement traces back to a Hero Feature or validated need in product-strategy.
   (b) PRD Success Criteria align with the Top 5 Key Success Metrics from product-strategy Pillar 7.
   (c) No PRD feature relies on a hypothesis flagged ❌ Unverified + Critical in the Hypothesis Registry (Pillar 5) without explicitly acknowledging the risk.
   (d) PRD scope (MVP/Growth/Vision) is consistent with the Business Model Canvas (Pillar 3) and GTM strategy (Pillar 4).
   (e) Blue Ocean ERRC Grid factors are reflected in feature prioritization.
   If misalignment is found, HALT and present the discrepancies to the user for resolution before continuing.
4. **CRITICAL — TECH STACK RESEARCH PASS:** For Platform or Enterprise Platform products (>60 FRs or >5 user journeys), conduct a GitHub/web tech stack research round BEFORE the Tien-Shinhan audit. Ensure FRs are validated against available open-source solutions and no capability domains are missed. Research should cover: agent frameworks, model serving, security tools, integration frameworks, etc.
5. **CRITICAL — FR ADEQUACY CHECK:** After Socratic Review and Tech Stack Research, validate that the FR count is appropriate for the product complexity class. If Platform-class but <60 FRs, HALT and perform a Deep Dive pass to discover missing capability domains.
6. **CRITICAL — Tien-Shinhan SIMULATOR GUARDIAN AUDIT:** Before concluding the PRD generation, execute the Fat-Guardian Simulator mental run. Load `@{project-root}/.agent/skills/Tien-Shinhan-simulator-guardian/SKILL.md`. Calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy). Produce the Scorecard directly at the bottom of the PRD document output. `TOTAL AVERAGE` MUST be `>= 8.5/10`. If lower, HALT workflow and loop back to rewrite the gaps.
7. **CRITICAL — NAVIGATOR GUARDIAN SYNC:** Upon completing all steps above, explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.
