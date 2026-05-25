---
name: 'sprint-runner'
description: 'Execute the Golden Auto-Chain for a specific story through the 5-Agent Phase 3 Dev Pipeline.'
---

# Sprint Runner: Golden Auto-Chain Execution

## STEP GOAL
To orchestrate the autonomous implementation of an approved user story from end to end using the `<auto-chain>` layer for agent handoffs.

## MANDATORY RULES
- 🛑 This is the entry point for the **Phase 3 Golden Auto-Chain**.
- 📖 Load the story requested by the user.
- 🔄 Pass execution to **Trunks** with the target story.
- ✅ Rely on the `auto-chain` architecture for the remaining execution loop (Trunks → Android-18 → Songoku → Vegeta → Hit → Tien-Shinhan).

## PIPELINE PHASES
1. **Trunks**: Identifies story constraints and pre-requisites.
2. **[FE] Android-18**: UI Spec & User Simulation (REAL-USER validation).
3. **[AI] Songoku**: Generates prompts, evaluates models, budget constraints.
4. **Vegeta**: Development & automated compilation/typing.
5. **Hit**: Adversarial Code Review (Security & Logic edges).
6. **Tien-Shinhan**: E2E & Unit Test automation.

## EXECUTION
1. Request the Epic and Story Identifier from the user (e.g. Epic 1, Story 1.1).
2. Load the specified story from the artifact store.
3. Automatically invoke the `Trunks/create-story` workflow.
4. Conclude your instruction loop and watch Trunks chain it forward.
