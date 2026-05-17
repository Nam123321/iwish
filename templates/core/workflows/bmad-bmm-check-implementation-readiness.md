---
name: 'check-implementation-readiness'
description: 'Critical validation workflow that assesses PRD, Architecture, and Epics & Stories for completeness and alignment before implementation. Uses adversarial review approach to find gaps and issues.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **GRAPH PROFILE READINESS GATE (HSEA-4.5):**
> Before assessing implementation readiness, load `/.agent/fragments/graph-backend-selection-policy.md`. Verify the project has a project-scoped `graph_profile` and `graph_surfaces` decision in project configuration or project memory. If missing, ask the user to choose `falkordb-full`, `lite-static`, or `custom-adapter`, then record the selected profile as a readiness action item. For HSEA, FeatureGraph validation, MemoryGraph, multi-agent implementation, or evolution-lab projects, recommend `falkordb-full` unless the user explicitly chooses a lower-setup profile.

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/_bmad/bmm/workflows/3-solutioning/check-implementation-readiness/workflow.md, READ its entire contents and follow its directions exactly!
