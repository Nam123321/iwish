---
name: 'step-02.5-system-integrity-mapping'
description: 'Analyze system layers, domain boundaries, and conceptual integrity, proposing 5 options for user evaluation.'

# Path Definitions
workflow_path: '{project-root}/.agent/workflows'

# File References
thisStepFile: './step-02.5-system-integrity-mapping.md'
nextStepFile: './step-03-create-stories.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/2. Product Planning/2.3.5. system-integrity-map.md'
---

# Step 2.5: System Integrity Mapping (SIM)

## STEP GOAL:

To establish a clear structural mapping of the application's layers, platform engines, and boundary contracts, ensuring conceptual integrity and preventing integration mismatches (Orphaned components, FE-only fragments, Reusable engines, Coverage gaps) before story breakdown.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style

### Step-Specific Rules (5-Option Standard):
1. **At Least 5 Options Required:** You MUST generate at least **5 distinct architectural layer/topology options** tailored to the project.
2. **Required Dimensions for Options:** These options must be grounded in:
   - *Project Specifics* (e.g., real-time features, sync constraints, multi-portals)
   - *Industry Practices* (e.g., Clean Architecture, Feature-Folder, Hexagonal/Ports & Adapters, Serverless, Event-Driven)
   - *Academic Frameworks* (e.g., Domain-Driven Design Context Mapping, C4 Model Container/Component layers)
3. **Comparative Analysis:** For each option, analyze:
   - **Pros (Ưu điểm)**
   - **Cons (Nhược điểm)**
   - **Domain Boundaries & Layer Mappings**
4. **Recommendation:** Provide a clear recommended option with detailed justification.
5. **[User Gate - Selection]** Halt and wait for the user to approve or select one of the 5 options (or define a custom one).

## EXECUTION PROTOCOLS:

1. **Prerequisite Check:** Verify that the PRD and Epics List (`2.4. epics-and-stories.md`) exist. If not, halt and warn the user.
2. **Propose 5 Options:** Conduct Socratic research and present the 5 architectural layer options in the chat interface.
3. **Wait for Approval:** Halt and wait for user selection.
4. **Save approved SIM:** Once the user selects or approves an option, generate the final SIM and save it to `{outputFile}`.
5. **Chain to Next Step:** Transition to `{nextStepFile}`.

---

## SIM DOCUMENT STRUCTURE:

When the user selects an option, save it in the following format:

```markdown
---
type: I-Wish SIM Map
title: "System Integrity Map (SIM)"
description: "Approved logical layers, boundaries, and reusable platform engines."
resource: "file:///Users/hatrang20061988/Desktop/AI Project/iwish/_iwish-output/2. Product Planning/2.3.5. system-integrity-map.md"
tags: ["sim", "planning"]
timestamp: "{current_date}"
links_to: ["file:///Users/hatrang20061988/Desktop/AI Project/iwish/_iwish-output/2. Product Planning/2.4. epics-and-stories.md"]
---

# System Integrity Map (SIM)

## 1. Approved Architectural Topology
[Name and description of the selected option]

## 2. Layer Definitions & Contracts
- **Presentation Layer (UI/UX):** [Definitions, assets, components]
- **Orchestration Layer (API/Routing):** [API routes, controller structures, request validators]
- **Domain Layer (Core Business Engines):** [State machines, calculators, business rules]
- **Infrastructure Layer (Data & Cache):** [Prisma schemas, Redis caches, external APIs]

## 3. Platform & Reusable Engines
[Explicitly list components/engines serving multiple features and their reusable interfaces]

## 4. Integrity Validation Matrix
| Feature / Portal | UI Component | API Endpoint | Domain Engine | Database Entity | Status |
|---|---|---|---|---|---|
| [Feature 1] | [Component] | [Endpoint] | [Engine] | [Entity] | Aligned |
```

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:
- At least 5 distinct options proposed with pros/cons.
- Grounded in project specifics, industry practice, and academic theory.
- User selects an option and it is written to the output file.
- YAML frontmatter of the SIM file is valid.

### ❌ SYSTEM FAILURE:
- Proposing fewer than 5 options.
- Saving SIM without user selection.
- Skipping step 2.5 and proceeding directly to story creation.
