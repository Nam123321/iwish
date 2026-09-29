---
description: 'Run 1st-Principle user simulation on a feature or UI spec using the REAL-USER Protocol with DMS-specific personas and scenarios.'
---

# /simulate-user — 1st-Principle User Simulation

> **Purpose:** Force non-linear, real-world user thinking on any feature before it ships.
> **Owner:** ai-engineer-agent (AI Engineer) — via User Simulation Guardian SKILL
> **Gate Integration:** `/create-ui-spec`, `/dev-agent-story`, `/code-review`

---

## Step 1: Load Context

// turbo-all

1. Load SKILL: `{project-root}/.agent/skills/user-simulation-guardian/SKILL.md`
2. Identify the **target users / customers** for the current project:
   - **Scan Project Documentation**: Read project files to extract the actual target users, target customers, focus groups, customer personas, and roles. Look specifically under:
     - `📄 2. Product Planning/2.1. product-brief-or-prd.md` (or `prd.md`/`product-brief.md`) -> Look for `## Target Users`, `## Target Customers`, `## Focus Groups`, or `## Customer Persona` sections.
     - `📄 1. Idea Discovery/` files (e.g., `idea-discovery.md`, `product-strategy.md`) or `📄 project-context.md`.
     - Check `{project-root}/.agent/skills/user-simulation-guardian/personas/` or `{project-root}/docs/personas/` for any project-specific persona files.
   - **Identify target portals and actors**: Read the story file or UI spec being reviewed, identify which portals are involved (e.g., Member Web, Manager App, Admin Portal), and map the corresponding target users who will use each portal.
   - **Resolve the simulation persona group**: Select a minimum of 3 personas. Must include at least 1 persona representing the main target customer/user segment for each portal involved.
   - *Note on Fallbacks*: If no project-specific target users are defined yet in the documentation, perform a zero-shot estimation of the personas based on the project description and portals, and ask the user for confirmation. Do NOT fallback to DMS/grocery roles unless the project is actually a B2B/B2C retail/grocery distribution project.

3. Select **scenarios** (MINIMUM 2):
   - MUST include at least 1 stress scenario (e.g., rush-hour, high-concurrency, or low-connectivity) relevant to the project's environment.
   - Load scenario files from `{project-root}/.agent/skills/user-simulation-guardian/scenarios/` if they exist.

4. Load selected persona and scenario files.

---

## Step 2: Run REAL-USER Protocol

For EACH selected persona × scenario combination:

1. **Walk through ALL 8 dimensions** of REAL-USER Protocol:
   ```
   R — Reality Context: Where is this user? What device? What business context? (ngành hàng, kênh phân phối, vai trò thực tế)
   E — Emotion & Motivation: Why are they using the app RIGHT NOW?
   A — Action Pattern: How do they ACTUALLY interact? (NOT the designed flow - JUMP, ABANDON, VOICE, COPY-PASTE)
   L — Language & Literacy: What words/abbreviations do they use? (regional terms, abbreviations)
   U — Unexpected Paths: What breaks? What's weird?
   S — Social Context: Who's watching? What pressure?
   E — Edge Behaviors: Extremes (very large, very small, interrupted)
   R — Repeat Patterns: What's repeated? What's muscle memory?
   ```

2. **For each dimension, identify:**
   - ✅ What the current design handles well
   - ❌ What the current design MISSES
   - 💡 Specific improvement suggestion

3. **Focus areas based on persona (adapt dynamically to the project's domain):**
   - Translate user habits to the project's actual industry (e.g., Coworking space: member multitasking on mobile, manager dealing with quick approvals).
   - *B2B Retail Reference Examples (Do not apply directly to non-retail projects)*:
     - **Chủ tiệm:** Reorder flow, viết tắt, 3G performance
     - **NVBH-Offline:** Multitask, route-based, voice
     - **CTV-Online:** Batch order, livestream, copy-paste
     - **Admin:** Form fatigue, keyboard nav, session timeout
     - **Supervisor:** Quick glance, batch approve, anomaly drill-down
     - **Consumer:** Meal planning, diet, budget, recipe-to-order

---

## Step 3: Output & Gate Check

1. **Generate User Simulation Report** (format from SKILL §5)

2. **Run Feature Validation Gate:**
   > [!IMPORTANT]
   > **DOUBLE-LOCK CONTEXT INJECTION:**
   > You MUST use the `view_file` tool to load:
   > - `/.agent/fragments/feature-validation.md`

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
