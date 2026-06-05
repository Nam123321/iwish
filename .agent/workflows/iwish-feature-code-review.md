---
name: 'code-review-internal'
description: 'Use when the user requests a code review or when validating an implemented story to find security, performance, or coverage issues.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **ANTI-SYCOPHANCY PREAMBLE (MANDATORY):**
> Before ANY code review interaction, you MUST use `view_file` to load `/.agent/fragments/anti-sycophancy.md`. Constructive Skepticism is the mandatory posture. NEVER declare "looks good" without identifying at least 3 specific issues. Banned Phrases are STRICTLY FORBIDDEN.

> [!IMPORTANT]
> **FIX-FIRST REVIEW (MANDATORY):**
> Before conducting the review, you MUST use `view_file` to load `/.agent/fragments/fix-first-review.md`. Apply the Fix-First heuristic for mechanical issues and include Confidence Calibration [1-10] for all findings.

> [!IMPORTANT]
> **DON'T TRUST THE REPORT (MANDATORY):**
> KHÔNG đọc Summary của implementer. Đối chiếu trực tiếp Git Diff. Code reviewers MUST independently verify via Git Diff rather than reading the implementer's summary. You must demand actual Empirical Evidence as defined by the Pivot Guardian.

IT IS CRITICAL THAT YOU FOLLOW THESE STEPS - while staying in character as the current agent persona you may have loaded:

> [!NOTE]
> **I-Wish RUNTIME FALLBACK:** First run `./.agent/scripts/check-iwish-runtime.sh --mode project` or verify `_iwish/core/tasks/workflow.xml` and `_iwish/delivery/workflows/4-implementation/code-review/workflow.yaml` exist. If they are missing in source/template mode, load `.agent/workflows/workflow-engine.xml` as the source-mode engine and use this wrapper as the workflow-specific contract. If they are missing in project runtime mode, stop and run `./.agent/scripts/materialize-iwish-runtime.sh --apply` before continuing. Do not silently fallback in project runtime mode.

<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_iwish/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_iwish/delivery/workflows/4-implementation/code-review/workflow.yaml
3. Pass the yaml path @{project-root}/_iwish/delivery/workflows/4-implementation/code-review/workflow.yaml as 'workflow-config' parameter to the workflow.xml instructions
4. Follow workflow.xml instructions EXACTLY as written to process and follow the specific workflow config and its instructions
5. Save outputs after EACH section when generating any documents from templates
6. CRITICAL — PROJECT MEMORY REVIEW GATE. Before reviewing implementation context, check for `@{project-root}/.agent/memory/PROJECT.md`. If present, load only sections relevant to the reviewed story/change and treat them as primary project memory. Check `@{project-root}/.agent/memory/USER.md` only for stable collaboration/review preferences. `USER.md` MUST NOT override project constraints, approved architecture, story ACs, code-review rules, or the current user request. Resolve memory conflicts in this order: system/safety rules → project instructions/artifacts → workflow/story instructions → current user request → user preferences → historical session notes.
7. CRITICAL — MEMORY-BASED FINDING CALIBRATION. If a review finding relies on memory, cite the exact project-memory section or learning-log source. Do not create a blocking finding from stale or uncited memory when fresher story, PRD, architecture, or code evidence disagrees.
8. CRITICAL: I-Wish Master decrees that you MUST conclude the review with a deterministic compiler check. You must run a terminal command to verify project compilation (e.g., `pnpm build`, `nest build`, or `tsc --noEmit`) before finalizing the review and updating the walkthrough. If compilation fails, HALT and flag as a CRITICAL finding.
9. CRITICAL — VISUAL ENFORCEMENT GATE: For frontend UI changes, you MUST enforce DOM-driven layout by verifying against the Approved Master Design Source. Reference `.agent/skills/visual-fidelity-gate/SKILL.md`. If the component structure relies on backend schemas rather than the Master Design's DOM outputs, you MUST flag it as a CRITICAL 'Schema-Driven Layout' failure and order a refactor.
10. CRITICAL — DATA-SPEC VALIDATION via FeatureGraph (ADR-002): After completing the standard code review, you MUST perform data-spec compliance checks using FeatureGraph MCP tools.

   PREREQUISITE: Check if FeatureGraph MCP tools are available (feature_impact, cross_feature, add_data_entity).
   → If NOT available → log "⚠️ WARNING: FeatureGraph unavailable, skipping data-spec validation" and SKIP steps 10-11.
   → If available → proceed:

   **10a. Query story's declared data entities:**
   ```
   Query: MATCH (s:Story {id: $storyId})-[:USES_ENTITY]->(de:DataEntity) RETURN de.name, de.key_fields, de.prisma_model
   ```
   For each DataEntity returned:
   ☐ **Schema Compliance:** Does the Prisma model in code match `de.key_fields`? Check field names, types, constraints.
   ☐ **DB Guardian:** Are required indexes present? Are `tenantId` compound indexes defined?

   **10b. Query story's declared events:**
   ```
   Query: MATCH (s:Story {id: $storyId})-[:PRODUCES]->(e:Event) RETURN e.name, e.type
   Query: MATCH (s:Story {id: $storyId})-[:CONSUMES]->(e:Event) RETURN e.name, e.type
   ```
   ☐ **Event Compliance:** Does code emit/consume ALL declared events?

   **10c. Query story's seed data:**
   ```
   Query: MATCH (s:Story {id: $storyId})-[:USES_ENTITY]->(de:DataEntity)-[:HAS_SEED]->(sd:SeedData) RETURN sd.model, sd.values
   ```
   ☐ **Seed Data:** If SeedData nodes exist → verify seed script matches `sd.values`.

    **10d. Deviation Detection:**
    ☐ Does the code introduce ANY model, field, enum, or event NOT declared in FeatureGraph?
    If deviations are detected → flag as 🛑 **DATA-SPEC DEVIATION** finding (CRITICAL severity).

    **10e. System Design Drift & Efficiency Checks:**
    ☐ **Database Queries:** Scan all newly introduced or modified database queries (e.g. Prisma, raw SQL). Verify they do not perform unindexed lookups or trigger N+1 query patterns.
    ☐ **Caching Integration:** Scan all repetitive database read calls in high-scale paths. Verify if they are wrapped with caching logic (e.g. Redis, memory cache) where appropriate.
    ☐ **API Idempotency:** Scan newly added API write routes (POST/PUT/PATCH). Verify if they implement or accept idempotency key validations.
    If violations are detected:
    - If the developer has provided an explicit inline/commit comment justification: log the warning and justification to `bug-tracker.yaml` and allow the build/review to pass.
    - Otherwise, flag as 🛑 **SYSTEM DESIGN DRIFT** finding (CRITICAL severity) and block story approval.

11. CRITICAL — BACKWARD UPDATE BLOCKER via FeatureGraph (ADR-002): If step 10 detected any DATA-SPEC DEVIATION:
   - Story review is BLOCKED — do NOT mark as approved
   - List all deviations clearly with: field/model name, what code has, what FeatureGraph expects
   - Instruct developer to update FeatureGraph using MCP tools:
     a. New/changed model → call `add_data_entity(name, prisma_model, key_fields, story_id)`
     b. New event → call `add_event(name, type, producer_story, consumer_stories)`
     c. New seed data → call `add_seed_data(model, values, source_story)`
     d. New FR dependency → call `add_feature_relationship(fr_id1, relationship, fr_id2, reason, confidence)`
   - After developer completes backward update → re-run step 10 ONLY (max 1 re-check)
   - If deviations STILL exist after 1 re-check → ESCALATE to user with full deviation report, do NOT auto-fix

12. CRITICAL — CONTRACT DRIFT CHECK FOR GOVERNANCE / DOC STORIES:
   - If the reviewed story introduces or changes a machine-readable enum, authority hierarchy, output contract, or review taxonomy:
     ☐ Every distinct authority in the hierarchy that needs downstream branching MUST have its own enum/status value.
     ☐ The structured output shape MUST include every newly required machine-readable field.
     ☐ Prose rules and structured output sections MUST use the same field names and exact enum values.
     ☐ If page overrides are introduced, the review MUST verify whether they can shape future outputs only, or can override already-approved page artifacts. This precedence must be explicit.
   - If any of the checks above fail, flag a P1 `CONTRACT_DRIFT` finding and do not mark the story as clean.

13. CRITICAL — UI-UX ORCHESTRATOR FRONTEND REVIEW INVOCATION:
   - If the reviewed change affects layout, styling, spacing, typography, color, charts, responsiveness, interaction behavior, motion, accessibility, or other meaningful user-facing UI behavior:
     ☐ The reviewer MAY invoke `@{project-root}/.agent/skills/ui-ux/SKILL.md` for stack/domain guidance.
     ☐ The specialist guidance is supporting evidence only, not final review authority.
     ☐ Every resulting finding MUST still be grounded in actual code, DOM structure, screenshot evidence, approved Stitch screens, or extracted CSS/HTML visual contract.
     ☐ If specialist guidance is cited in the final review, the reviewer MUST label the evidence disposition as `ACCEPTED`, `CONSTRAINED`, `REJECTED`, or `DOWNGRADED_TO_RECOMMENDATION`.
     ☐ If specialist guidance is cited in the final review, the reviewer MUST state that final severity remains owned by the I-Wish code review workflow, not by the specialist.
     ☐ If specialist guidance conflicts with Design Consultation, UX Guardian, User Simulation Guardian, approved Design System, or approved Stitch visual contract, the stronger I-Wish authority wins and the specialist guidance is downgraded to supporting context only.
   - If the reviewed change does NOT materially affect user-facing UI behavior:
     ☐ Do NOT force UI/UX Pro Max invocation.
     ☐ Keep the review proportionate to the actual change surface.

14. CRITICAL — TWO-PHASE STITCH ENRICHMENT VALIDATION:
   - If the reviewed story has `Enrichment_Required: true` in its UI Spec, you MUST verify that the dynamic logic defined in section `10. [POST_STITCH_ENRICHMENT_LOGIC]` of the UI Spec has been explicitly implemented in the codebase (e.g. GSAP animations, intersection observers, complex states).
   - If the implementation only contains static layouts from the Stitch phase and is missing the defined enrichment logic, you MUST flag this as a P1 `ENRICHMENT_MISSING` finding and reject the review.

15. CRITICAL — SPECIALIST QUALITY CHECKLIST:
   - If the reviewed artifact includes `ui-ux` guidance, the reviewer SHOULD consult `docs/ui-ux-integration/quality-checklist.md`.
   - The reviewer SHOULD use the checklist to judge whether the guidance is specific, source-of-truth compliant, persona-aware, implementable, accessible, and concise.
   - The reviewer MAY record one of these dispositions for the guidance:
     ☐ `Discard`
     ☐ `Use as critique`
     ☐ `Promote to I-Wish rule`

16. CRITICAL — OVER-ENGINEERING SCAN:
   - Actively search for code "extra" (over-engineering) beyond the spec.
   - Actively search for missing requirements from the story/spec or undocumented side effects.
   - If found, flag as a finding.

17. CRITICAL — TRUST SCORE OUTPUT:
   - Your final output MUST include a `Trust Score: Low/Medium/High` based on the diff-vs-spec alignment.
   - If the Trust Score is Low, you MUST reject the review.

18. CRITICAL — QA SIMULATOR GUARDIAN AUDIT. Before concluding the code review, you MUST execute the Fat-Guardian Simulator mental run. Load the skill from `@{project-root}/.agent/skills/qa-simulator-guardian/SKILL.md`. You must calculate the EXACT 7-row Hybrid Scorecard (6 Core Axes + 1 UX Empathy) based on the classified domain. Produce the Scorecard directly into your review output.
</steps>
