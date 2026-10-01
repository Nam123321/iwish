---
name: 'flow-stage-2b-design-approve'
description: 'Stage 2B of the /flow pipeline: DESIGN APPROVAL (Human Gate, Baseline Lock)'
---

# /flow-stage-2b-design-approve

This is Stage 2B of the 6-stage decomposed SDLC pipeline.

## Structured Handoff Verification
Before proceeding, you MUST verify that Stage 2A completed successfully. Check for the existence of `<story_dir>/design-gen-evidence.json`. If missing, HALT and prompt the user to run `/flow-stage-2a-design-gen`.

## Workflow Guidelines
**CRITICAL RULE: INTERACTIVE MODE ONLY.**
This sub-stage contains a Human Gate and MUST NEVER receive or obey the `--auto-approve` flag.
To complete a [Zero-Trust Gate], you MUST call `watchmen-mcp` Server and paste the `[x] {HMAC_SIGNATURE}` into `task.md`.

### Steps:

3.0. **Step 3.0: [CRITICAL] [User Gate - Approval]**
   - STOP and present the HTML Preview and Mockup for human approval of the design.
   - After explicit approval in chat, call `sign_human_gate` MCP tool.

3.1. **Step 3.1: Validate Spec Format**
   - Handled dynamically by Step 3.5.

3.2. **Step 3.2: Component Library Registration**
   - Extract Tier 1 Global Library components to `DESIGN.md`.

3.4. **Step 3.4: Zero-Trust Design Checkpoint**
   - Run: `python3 .agent/scripts/validate-design-approval.py <story_dir>`

3.5. **Step 3.5: Establish Baseline & Pre-Code Validation**
   - Run: `OOB_SIGNING_KEY=dummy python3 .agent/scripts/auto-traceability-linker.py --story <path_to_story>`
   - **[ZERO-TRUST GATE]** Run: `python3 .agent/scripts/pipeline-integrity-runner.py --story <story_id> --phase pre-code`
   - This creates the Cryptographic Spec Lock (SHA-256 hashes of spec files).

**Handoff to Stage 3A:**
Once Step 3.5 is completed, execute `echo '{"stage": "2B", "status": "completed"}' > <story_dir>/design-stage-evidence.json`. Then, prompt the user to invoke `/flow-stage-3a-plan-safe`.
