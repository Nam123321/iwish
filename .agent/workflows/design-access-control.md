---
name: 'design-access-control'
description: 'Interactive workflow to design, simulate, and generate PBAC/RBAC access control matrices using the pbac-architect skill.'
disable-model-invocation: true
---

# /design-access-control

## Overview
This workflow is used to design the Hybrid RBAC/PBAC architecture. It invokes the `pbac-architect` skill to analyze domains, presents a User Gate for selecting the access control structure, runs a Threat Matrix Simulation, and outputs a centralized Single Source of Truth (SSOT) `access-control-spec.md`.

## Prerequisites
- A target domain or feature set that requires access control.
- Existing PRD or Architecture docs (optional but recommended).

## Execution Steps

### Step 1: Load Context and Skill
1. Use `view_file` to load `.agent/skills/pbac-architect/SKILL.md`.
2. Analyze the domain/features that require authorization.

### Step 2: Define Portal Topology
1. Identify and document all system Portals (e.g., Tenant Portal, SuperAdmin Portal, Affiliate/Developer Portal) based on PRD requirements.
2. Map which user types and personas access which portals to establish isolated access boundaries before designing roles.

### Step 3: Present User Gate (5 Options)
**[CRITICAL USER GATE] MUST STOP AND WAIT FOR EXPLICIT APPROVAL.**
First, analyze the project requirements and output a strong recommendation for one of the options below (or a hybrid). Justify your recommendation clearly.
Then, present the following 5 options to the user and wait for their choice:
1. **Flat RBAC (Simple):** Basic roles (Admin/User), no complex policies.
2. **Hierarchical RBAC:** Roles inherit permissions (e.g. SuperAdmin > Admin).
3. **Hybrid RBAC + PBAC (Enterprise Standard):** Roles for job function + Contextual policies (Time, IP, Status).
4. **Decoupled Policy Engine:** Externalized policy (OPA / AWS Cedar).
5. **ReBAC (Relationship-Based):** Graph-based permissions (Creator, Shared-With).

### Step 4: PBAC Tree Design & Threat Simulation
Once the user selects an option:
1. Design the Access Control Tree (Main Feature -> Sub Features) explicitly mapped per Portal.
2. Assign Default Roles and Policies based on the user's selected option.
3. Run the **Threat Matrix Simulation** (Happy Path, Escalation, Context Violation) as defined in `pbac-architect` skill.

### Step 5: Generate Output (Global YAML Setting)
1. Write the finalized access control structure to `_iwish-output/2. Product Planning/2.7. access-control-policy.yaml`.
2. Generate reference injection snippets that can be embedded into `feature-hierarchy.md` and Epic documents so that Epics correctly follow this global planning.
