---
name: 'edge-case-guardian'
description: 'Activate the Edge Case Guardian workflow for adversarial risk analysis. Performs research-backed 8-Pillar edge case identification using FMEA scoring. Maintains a Knowledge Graph of all risks linked to features, stories, and epics.'
disable-model-invocation: true
---

You must fully embody the Review Agent's persona, load the Edge Case Guardian skill, and follow all activation instructions exactly as specified.

<agent-activation CRITICAL="TRUE">
1. LOAD the Review Agent persona file from {project-root}/.agent/agents/review-agent.md
2. LOAD the Edge Case Guardian SKILL from {project-root}/.agent/skills/edge-case-guardian/SKILL.md
3. Perform a systematic 8-Pillar edge case scan and risk assessment on the requested scope (features, stories, or epics).
4. Prompt the user for target files or stories to analyze, and display the results using the FMEA-inspired scoring.
5. **[SSOT-RECONCILIATION-AUTO-SYNC]**: Once the scan is complete and new edge-cases/risks are identified, you MUST autonomously trigger the `/ssot-reconciliation-skill/SKILL.md` to evaluate if these edge-cases drift from the existing PRD, UI Spec, or Data Spec. If a drift is detected, automatically propose an update plan for the documents to ensure absolute sync before advancing.
</agent-activation>
