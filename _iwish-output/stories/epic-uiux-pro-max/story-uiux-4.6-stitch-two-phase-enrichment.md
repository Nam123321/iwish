---
epic: epic-uiux-pro-max-specialist
story_id: STORY-UIUX-4.6
title: "Implement Two-Phase Stitch Enrichment Strategy (Pre & Post-Flight)"
status: todo
complexity_score: 5
phase: "forge"

---
# Story UIUX-4.6: Implement Two-Phase Stitch Enrichment Strategy

## 1. Context & Objective
The UI/UX Pro Max library contains a massive, highly structured dataset covering everything from high-level UX reasoning down to framework-specific code snippets. Currently, Stitch (as a static design generator) cannot natively leverage or implement all of these rules—especially complex micro-interactions, animations, and JS-based observers.

The objective of this story is to build a Two-Phase Strategy to bridge the gap between the Pro Max library and Stitch's output capabilities.

### Library Structure Analysis
The `ui-ux-pro-max/data/` library is structured as follows:
- **Core Theming (`styles.csv`, `colors.csv`, `typography.csv`)**: Defines macro-styles (Minimalism, Glassmorphism), AI Prompt Keywords, CSS/Technical Keywords, and specific Design System Variables (e.g., `--spacing`, `--border-radius`).
- **Domain & Layout (`landing.csv`, `products.csv`, `ui-reasoning.csv`)**: Dictates section ordering, CTA placements, key effects, and product-specific decision rules.
- **Micro UX & Behavior (`ux-guidelines.csv`, `web-interface.csv`, `charts.csv`)**: Contains granular "Do/Don't" rules and code examples (Good/Bad) for things like smooth scrolling, form validation, and data visualization.
- **Tech Stacks (`stacks/*.csv`)**: Contains framework-specific syntax (Astro, HTML-Tailwind, React, Next.js). For example, `html-tailwind.csv` enforces the use of specific Tailwind animation utility classes over raw `@keyframes`.

## 2. Workflow Integration Plan

To ensure the Two-Phase Strategy seamlessly integrates into the I-Wish-Dragonball lifecycle without being ignored by dev agents, the workflow must be updated as follows:

### Phase 1 Integration: `create-ui-spec`
- **Handled By:** `Bulma` (or designated UX Specialist Agent).
- **Process:** During the generation of the per-story UI Spec, the agent queries the Pro Max library (styles, stacks, UI reasoning).
- **Spec Recording:** The agent injects a mandatory section at the very bottom of the UI Spec called `## 5. [STITCH_PROMPT_INJECTION]`. This contains the exact string the user must paste into Stitch. 

### Phase 2 Integration: `enrich-ui-spec` (New Workflow Step)
- **Handled By:** `Piccolo` or `Gotenks` (Creative Intelligence).
- **Process:** After the user completes `stitch-first-dev` and approves the static Stitch layout, they trigger `/enrich-ui-spec`. The agent reads the Stitch HTML/CSS and queries the Pro Max micro-UX library.
- **Spec Recording:** The agent appends a new section to the UI Spec: `## 6. [POST_STITCH_ENRICHMENT_LOGIC]`. This section contains explicit JavaScript (e.g., GSAP, IntersectionObservers) or complex CSS keyframes required to bring the component to "Pro Max" level.

### Enforcement: `vegeta-story` & `code-review`
- **Handled By:** `Vegeta` (Execution) and `Tien-Shinhan` / `Code-Reviewer`.
- **Compliance:** `Vegeta` is bound by the UI Spec contract. When scaffolding the frontend, `Vegeta` must implement the `[POST_STITCH_ENRICHMENT_LOGIC]`. 
- **Validation:** The `code-review` workflow is updated to explicitly check: *"Did the dev agent implement all micro-interactions and observers listed in section 6 of the UI Spec?"* If not, the PR is rejected.

## 3. Acceptance Criteria (AC)

### Phase 1: Pre-Stitch Prompt Injection
- **AC1 (Data Extraction):** The `ui-ux-pro-max-specialist` skill must be updated to query `styles.csv`, `stacks/[stack].csv`, and `ui-reasoning.csv` based on the user's current project context.
- **AC2 (Prompt Payload):** The skill must output a strict, high-density `[STITCH_PROMPT_INJECTION]` block. This payload will forcefully inject "AI Prompt Keywords" and "CSS/Technical Keywords" directly into the Stitch prompt to ensure Stitch outputs the correct base Tailwind classes (e.g., `animate-pulse`, `transition-all duration-300`).

### Phase 2: Post-Stitch Enrichment Mapper
- **AC3 (Enrichment Workflow):** Create a new workflow (e.g., `/enrich-stitch-output` or an agent skill) designed to run *after* a Stitch design is approved.
- **AC4 (Behavioral Injection):** This post-flight workflow must query `ux-guidelines.csv` and `styles.csv` (Effects & Animation column) to surgically inject complex behaviors that Stitch cannot generate. This includes:
  - JavaScript `IntersectionObserver` scripts for scroll reveals.
  - Complex CSS keyframes (if Tailwind utilities are insufficient).
  - Advanced glassmorphism or hover-state logic.
- **AC5 (Agent Collaboration):** The workflow must allow other agents (e.g., `Songoku` for JS implementation, `UX Guardian` for final behavior check) to review and contribute to the enriched code.

## 4. Implementation Tasks
- **Task 1:** Modify `create-ui-spec` workflow to invoke `Bulma` to query Pro Max library and append `## 5. [STITCH_PROMPT_INJECTION]` to the UI Spec.
- **Task 2:** Create a new orchestrator workflow `.agent/workflows/iwish-bmm-enrich-ui-spec.md` for Phase 2, handled by `Piccolo` or `Gotenks`. It will append `## 6. [POST_STITCH_ENRICHMENT_LOGIC]` to the UI Spec.
- **Task 3:** Update the `code-review` workflow and `Vegeta`'s execution guidelines to enforce the implementation of the Enrichment Logic (rejecting PRs that ignore section 6 of the UI Spec).
- **Task 4:** Run a test case (e.g., Landing Page) through Phase 1 (Stitch Gen) and Phase 2 (Enrichment) to validate the pipeline end-to-end.

## 5. Traceability Matrix
| AC | Mapped Tasks | Status |
|---|---|---|
| AC1 | Task 1 | ⏳ TODO |
| AC2 | Task 1 | ⏳ TODO |
| AC3 | Task 2, Task 3 | ⏳ TODO |
| AC4 | Task 3, Task 4 | ⏳ TODO |
| AC5 | Task 2 | ⏳ TODO |

## 6. Dev Notes (Project Memory)
- **Token Efficiency:** Do not dump the entire CSV into the LLM context. The workflow must use tools (like `grep_search` or Python scripts) to query only the relevant rows based on the requested Style or Stack.
- **Stitch Limitations:** Always assume Stitch will produce a "flat" layout. Phase 2 is where the "Pro Max" magic happens (animations, scroll listeners).
