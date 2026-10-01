---
name: make-story
description: Canonical short workflow for story creation
---

# /make-story

Canonical workflow name for story creation.

Read and execute: `iwish-feature-create-story.md`

> **Tri-Agent Lite Scan:** The create-story workflow includes a mandatory step (5.9) that loads `.agent/templates/featuregraph/featuregraph-template-appendix.md` and generates Tier 1 tags (`[DATA:]`, `[FLOW-OUT:]`, `[FLOW-IN:]`, `[SEED:]`) plus a `## Cross-Feature Dependencies` section. This step is required for FeatureGraph indexing.

> **Architecture Coherence Gate (Step 4.4b):** Before generating story content, the workflow runs `architecture-coherence-checker.py` to validate planned technologies against active ADRs in the TDR. CRITICAL/HIGH conflicts block story creation. This gate is **NON-SKIPPABLE** even in auto-approve mode.

> **AI-ML Workload Gate (Step 6f.5):** After story generation, `classify-ai-workload.py` evaluates the story across 4 taxonomy clusters and auto-tags `domain: AI-ML` if detected, enforcing downstream architecture evaluation gates.

> **Dual-Input Boundary (Anti-Drift V4):** When generating the implementation plan (`impl-plan.md`), use it strictly as the "Control Plane" (business logic). Do NOT merge `contract-context.json` constraints into it. Instead, the `contract-context.json` must be loaded dynamically as the "Data Plane" into the System Prompt to avoid Context Exhaustion.
