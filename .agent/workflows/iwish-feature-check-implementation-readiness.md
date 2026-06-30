---
name: 'check-implementation-readiness'
description: 'Critical validation workflow that assesses PRD, Architecture, and Epics & Stories for completeness and alignment before implementation. Uses adversarial review approach to find gaps and issues.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **ANTI-SYCOPHANCY PREAMBLE (MANDATORY):**
> Before ANY readiness assessment, you MUST use `view_file` to load `/.agent/fragments/anti-sycophancy.md`. Constructive Skepticism is the mandatory posture. Actively challenge alignment claims — find the gaps. Banned Phrases are STRICTLY FORBIDDEN.

> [!IMPORTANT]
> **GRAPH PROFILE READINESS GATE (HSEA-4.5):**
> Before assessing implementation readiness, load `/.agent/fragments/graph-backend-selection-policy.md`. Verify the project has a project-scoped `graph_profile` and `graph_surfaces` decision in project configuration or project memory. If missing, ask the user to choose `falkordb-full`, `lite-static`, or `custom-adapter`, then record the selected profile as a readiness action item. For HSEA, FeatureGraph validation, MemoryGraph, multi-agent implementation, or evolution-lab projects, recommend `falkordb-full` unless the user explicitly chooses a lower-setup profile.

<steps CRITICAL="TRUE">
1. FOLLOW THIS COMMAND FIRST: LOAD the FULL @{project-root}/.agent/workflows/step-01-document-discovery.md, READ its entire contents and follow its directions exactly to complete the readiness assessment!
2. If the readiness check PASSES (no blocking gaps found and user is ready to proceed to development):
   a. You MUST run the `python3 .agent/scripts/populate_development.py` script. This script will parse `2.4. epics-and-stories.md` and mass-generate physical Epic and Story stub files in the Development tracking folders.
   b. Explain to the user that the physical stubs have been generated in `status: backlog`. Remind them that they still need to run `/make-story` or `/flow` on a story before developing it to generate the full ACs and FMEA edge cases.
   c. Suggest the user to run `/sprint-planning` now. This will allow them to activate the generated stub stories into `ready-for-dev` status, compile the `sprint-status.yaml`, and index the feature graph.
</steps>
