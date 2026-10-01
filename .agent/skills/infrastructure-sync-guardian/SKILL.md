---
name: 'infra-guardian'
description: Zero-Trust active interceptor that detects infrastructure and architectural drift during execution, enforces physical evidence generation, and routes to /infra-sync.
---

# Infrastructure Sync Guardian (Zero-Trust Interceptor)

## Purpose
This skill acts as a safeguard against infrastructure and architectural drift during story execution, bug fixing, and peer reviews. When an agent identifies a necessary infrastructure change (e.g., adding a new queue, moving validation boundaries, switching sandboxes) that is not reflected in `2.5. architecture.md`, this guardian intercepts the workflow and enforces the Zero-Trust Bottom-Up Sync process.

## Activation
This skill should be loaded and activated during the following workflows:
- `/make-story`
- `/dev-story`
- `/review`
- `/party-mode`
- `/fix-bug`

## Guardian Rules

<steps CRITICAL="TRUE">
1. DRIFT DETECTION (TDR Schema Parsing):
   - Continuously evaluate if the current implementation task or bug fix requires infrastructure changes (e.g., new databases, services, middleware, execution boundaries) that are missing from or contradict `_iwish-output/2. Product Planning/2.5. architecture.md`.
   - **TDR SCHEMA AWARENESS:** Do not just look at headings. You MUST actively scan the **Decision Log**, **Trade-offs**, and **Alternatives** tables/sections inside `2.5. architecture.md`. If a decision was made in code but not recorded in these TDR sections, it is considered a Drift.

2. ZERO-TRUST PHYSICAL EVIDENCE ENFORCEMENT:
   - If drift is detected, you MUST NOT proceed with code generation or silently ignore it.
   - You MUST generate a JSON evidence file documenting the drift. 
   - Write this file to: `_iwish-output/adhoc-workspace/scratch/infra-drift-evidence.json`
   - The JSON MUST contain: `detected_drift` (description), `affected_components`, `proposed_infrastructure_change`, and `justification`.
   - **BLOCKING GATE:** If this file is not created, you are forbidden from continuing the current workflow.

3. AUTO-SUGGEST PROMPT:
   - After writing the physical evidence, you MUST halt execution and explicitly prompt the user with the following exact message:
     *"Tôi phát hiện có sự thay đổi về hạ tầng/kiến trúc chưa được cập nhật trong architecture.md. Bạn có muốn chạy `/infra-sync` để cập nhật Decision Log và Trade-offs vào file architecture.md không?"*

4. ROUTING:
   - Wait for the user's response.
   - If the user confirms, pause the current workflow and initiate the `/infra-sync` workflow.
   - If the user declines, document their explicit waiver in the current task/PR and proceed with caution.
</steps>
