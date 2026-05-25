---
description: 'Run 1st-Principle user simulation on a feature or UI spec using the REAL-USER Protocol with DMS-specific personas and scenarios.'
---

# /simulate-user — 1st-Principle User Simulation

> **Purpose:** Force non-linear, real-world user thinking on any feature before it ships.
> **Owner:** Songoku (AI Engineer) — via User Simulation Guardian SKILL
> **Gate Integration:** `/create-ui-spec`, `/Vegeta-story`, `/code-review`

---

## Step 1: Load Context

// turbo-all

1. Load SKILL: `{project-root}/.agent/skills/user-simulation-guardian/SKILL.md`
2. Identify the **feature/UI spec** to simulate:
   - Read the story file or UI spec being reviewed
   - Identify which portals are involved (Webstore, Sales Web, Admin Portal)

3. Select **personas** (MINIMUM 3):
   - MUST include at least 1 persona per portal involved
   - For Webstore → MUST include P1 (Chủ tiệm) AND/OR P5 (Consumer)
   - For Sales Web → MUST include P2 (NVBH — pick relevant sub-type)
   - For Admin Portal → MUST include P3 (Admin) AND/OR P4 (Supervisor)
   
4. Select **scenarios** (MINIMUM 2):
   - MUST include at least 1 stress scenario (rush-hour OR low-connectivity)
   - If food industry features → MUST include meal-planning scenario

5. Load selected persona and scenario files from:
   - `{project-root}/.agent/skills/user-simulation-guardian/personas/`
   - `{project-root}/.agent/skills/user-simulation-guardian/scenarios/`

---

## Step 2: Run REAL-USER Protocol

For EACH selected persona × scenario combination:

1. **Walk through ALL 8 dimensions** of REAL-USER Protocol:
   ```
   R — Reality Context: Where is this user? What device? What business context?
   E — Emotion & Motivation: Why are they using the app RIGHT NOW?
   A — Action Pattern: How do they ACTUALLY interact? (NOT the designed flow)
   L — Language & Literacy: What words/abbreviations do they use?
   U — Unexpected Paths: What breaks? What's weird?
   S — Social Context: Who's watching? What pressure?
   E — Edge Behaviors: Extremes (very large, very small, interrupted)
   R — Repeat Patterns: What's repeated? What's muscle memory?
   ```

2. **For each dimension, identify:**
   - ✅ What the current design handles well
   - ❌ What the current design MISSES
   - 💡 Specific improvement suggestion

3. **Focus areas based on persona:**
   - **Chủ tiệm (P1):** Reorder flow, viết tắt, 3G performance
   - **NVBH-Offline (P2a):** Multitask, route-based, voice
   - **CTV-Online (P2b):** Batch order, livestream, copy-paste
   - **MLM (P2c):** Context-switch sell↔manage, commission check
   - **Admin (P3):** Form fatigue, keyboard nav, session timeout
   - **Supervisor (P4):** Quick glance, batch approve, anomaly drill-down
   - **Consumer (P5):** Meal planning, diet, budget, recipe-to-order

---

## Step 3: Output & Gate Check

1. **Generate User Simulation Report** (format from SKILL §5)

2. **Run Feature Validation Gate:**
   - Load `{project-root}/.agent/skills/user-simulation-guardian/checklists/feature-validation.md`
   - Run ALL 7 check steps
   - Determine: ✅ PASS or ❌ FAIL

3. **If FAIL:**
   - List all failing items
   - Provide specific fixes for each
   - DO NOT approve the feature/UI spec
   - Return to designer/developer for revision

4. **If PASS:**
   - Append report to UI spec or story file
   - Mark gate as passed in story: `user_simulation_gate: PASS`
   - Proceed with next workflow step

---

## Quick Mode (30-second assessment)

For inline use during code review or quick checks:

```
1. □ Was it designed for a REAL person in a REAL context?
2. □ Is there a non-click path? (paste, voice, reorder)
3. □ Does it handle interruption? (app kill → resume)
4. □ Can a first-timer figure it out without training?

ALL ✅ → PASS | ANY ❌ → Full simulation required
```
