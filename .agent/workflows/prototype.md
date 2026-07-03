---
name: 'prototype'
description: 'Experimental workflow for generating State-driven UI mockups at the end of the Project Planning phase for user review.'
---

# Workflow: /prototype

> [!WARNING]
> This workflow creates a throwaway branch. DO NOT use this for production features. All changes must be "promoted" to a proper story branch if they are successful.

**Goal:** Transform the abstract project planning documents (PRD, Feature Hierarchy, UI Specs) into a tangible, state-driven visual mockup (prototype) that users can review interactively.

<steps CRITICAL="TRUE">
1. **Dirty Check**: Run `git status --porcelain`. If there are changes, run `git stash -u` to save them.
2. **Branch Creation**: Create a new branch named `proto/[short-description]`.
3. **Task Initialization**: Create or update `task.md` (written strictly to the dynamic session artifact directory or a specific sub-folder, NEVER at the workspace root directory) with `[MODE: PROTOTYPE]`.
4. **Context Absorption**:
   - Locate and parse `feature-hierarchy.md` (to understand the global architecture and cross-dependencies).
   - Locate and parse `Design.md` (to extract Design Tokens and Component System guidelines).
5. **Requirement to UI Mapping**:
   - For the chosen feature, summarize the FRs from the PRD into the specific User Story context.
   - Extract or generate the `ui-spec-*.md` for this story, detailing all required UI states (Idle, Loading, Success, Error, Empty).
6. **Visual Design Synthesis (Stitch)**:
   - Call the Stitch MCP server (or external design platform equivalent) to generate the structural UI layout based strictly on the `ui-spec`.
7. **Prototype Scaffold & Packaging**:
   - **File Storage Structure**: You MUST create a dedicated directory for the prototype inside the planning folder: `{_iwish-output}/2. Product Planning/2.8. prototypes/[scope-or-story-name]/`.
   - **Spec Inclusion**: Copy or generate the `story.md` and `ui-spec.md` used for this prototype directly into this `2.8` directory to keep the inputs and outputs tightly packaged.
   - **HTML Output**: The final prototype output MUST be a standalone `index.html` file (with accompanying CSS/JS if needed) inside this directory.
   - **End-to-End Routing**: This HTML prototype must act as a holistic map. It must include the global navigation flow from the **Landing Page** routing into the various internal **Portals** (e.g., SuperAdmin, Tenant, Developer) as defined in the SaaS standards, simulating a real user journey.
8. **Evaluation**:
   - If SUCCESS: Use `git diff` to extract logic and prepare for promotion.
   - If FAILURE/DONE: Run `./.agent/scripts/cleanup-proto.sh` to backup and delete the branch.
</steps>
