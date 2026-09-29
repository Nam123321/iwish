---
name: 'design-settings-hierarchy'
description: 'Interactive workflow to design and structure the Settings Hierarchy (Global -> Middle -> Personal) for every portal in a SaaS application.'
disable-model-invocation: true
---

# /design-settings-hierarchy

## Overview
This workflow enforces the Universal SaaS Configuration Architecture: **Global -> Middle -> Personal**.
It prevents disjointed configuration experiences by ensuring that *every* portal (e.g., SuperAdmin Portal, Tenant Portal, Developer Portal) explicitly defines its own settings hierarchy top-down.

## Prerequisites
- A defined Feature Hierarchy mapping out all Portals in the project.
- A basic understanding of the access control rules (PBAC/RBAC) that dictate what is configurable.

## Execution Steps

### Step 1: Portal Identification
Identify all Portals defined in the system (e.g., SuperAdmin Portal, Workspace/Tenant Portal, Affiliate Portal, Developer Portal).
The following steps MUST be executed *for each portal individually*.

### Step 2: Define the Global Tier (Per Portal)
The Global Tier represents the highest level of configuration *within* that specific portal.
- **Action:** Identify all settings that apply globally to the entity owning the portal (e.g., The entire SaaS for SuperAdmin, the entire Workspace for a Tenant).
- **Security & Scope:** Define the RBAC/PBAC policies governing these settings.
- **Top-Down Impact:** Identify how these Global settings dictate the existence or default values of features in the Middle and Personal tiers.

### Step 3: Define the Middle Tier(s) (Per Portal)
The Middle Tier represents group-level configurations (e.g., Department, Team, Project, or Environment).
- **Action:** Identify if the portal requires a Middle Tier. If the SaaS is simple, this might be skipped, but the principle remains.
- **Inheritance:** Map out how Middle Tier settings inherit from or override Global Settings.

### Step 4: Define the Personal Tier (Per Portal)
The Personal Tier represents settings specific to the individual logged-in User *within the context of that portal*.
- **Action:** Identify user-specific preferences (e.g., Display preferences, Notification channels, Personal API Keys).
- **Conflict Resolution:** Define rules for when Personal Settings conflict with Global/Middle policies (e.g., A user wants Email Notifications, but the Global Policy disables external emails).

### Step 5: Output Settings Matrix
Generate the **Settings Hierarchy Matrix**. For every configuration item identified in the PRD, assign it to a specific Tier within a specific Portal. 
- *Anti-Pattern Check:* Ensure Workspace-level integrations are not placed inside User Profiles.
- *Anti-Pattern Check:* Ensure Personal Security settings (like 2FA setup) are not mixed with Workspace Security Policies (like enforcing 2FA).

### Step 6: Inject into Epics & Stories
1. Output injection references for `epics-and-stories.md`.
2. Ensure UI/UX specs downstream group these settings into logical navigation menus (e.g., `/settings/workspace` vs `/settings/personal`).
3. Apply the `SAAS:SETTINGS-HIERARCHY` tag to relevant stories.
