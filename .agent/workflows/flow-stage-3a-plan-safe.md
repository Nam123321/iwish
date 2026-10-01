---
name: 'flow-stage-3a-plan-safe'
description: 'Stage 3A of the /flow pipeline: IMPLEMENTATION PLAN & APPROVAL (Dual-Condition Gate)'
---

# /flow-stage-3a-plan-safe

This is Stage 3A of the 6-stage decomposed SDLC pipeline.

## Structured Handoff Verification
Before proceeding, you MUST verify that Stage 2B completed successfully. Check for the existence of `<story_dir>/design-stage-evidence.json`. If missing, HALT and prompt the user to run `/flow-stage-2b-design-approve`.

## Workflow Guidelines
**CRITICAL RULE: INTERACTIVE MODE ONLY.**
This sub-stage contains a Dual-Condition Human Gate and MUST NEVER receive or obey the `--auto-approve` flag.
To complete a [Zero-Trust Gate], you MUST call `watchmen-mcp` Server and paste the `[x] {HMAC_SIGNATURE}` into `task.md`.

### Steps:

3.9. **Step 3.9: AI-ML Gate Entry (Zero-Trust Category A BLOCK)**
   - Run: `python3 .agent/scripts/validate-aiml-gate-entry.py --story-dir "<story_dir>" --story-id "<story_id>"`
   - If story has tag `domain: AI-ML` AND evidence file is MISSING → exit(1) → HALT.
   - Agent MUST run `/ai-system-architect --mode=evaluate` to generate evidence BEFORE proceeding.
   - Agent MUST cross-query research notebooks: `90198a20` (Core-Architecture), `0a1fa1b9` (Research-Infrastructure), `6e704ca7` (Research-AI-Models), and `655d181d` (AIML System Design).
   - If story has NO AI-ML tag → pass-through with zero overhead.

4.0. **Step 4.0: Implementation Plan Generation, Hardening & Approval (Dual-Condition Gate)**
   - Generate `{story_dir}/impl-plan.md`.
   - **[HARD GATE 1 - /plan-proven-safe Execution]**: You MUST execute `/plan-proven-safe` across all 4 pillars (`/deep-audit`, `/unknowns`, `/party-mode`, `/edge-case`) and update `impl-plan.md` with:
     - `## 1. Deep Codebase Drift & Contract Audit`
     - `## 2. Unknowns Discovery & Epistemic Audit`
     - `## 3. AI Socratic Debate & Consensus Report`
     - `## 4. Edge Case Guardian & 13-Pillar FMEA Scan`
     - `**VERDICT**: PROVEN_SAFE`
   - **[Worktree Pre-Initialized]**: Bỏ qua bước tạo `## Git Branching Strategy` trong `impl-plan.md` vì người dùng đã chủ động tạo và quản lý Worktree độc lập từ bước khởi tạo môi trường (/worktree-init).
   - **[Deterministic Validation]**: Run: `python3 .agent/scripts/validate-plan-proven-safe.py --file <story_dir>/impl-plan.md --story-id <story_id> --story-dir <story_dir>`. If it fails, auto-heal until exit code 0.
   - **[HARD GATE 2 - Explicit Human Review & Approval]**: STOP and present `impl-plan.md` to user. **CANNOT be auto-approved or bypassed.**
   - Only AFTER user explicitly approves in chat, call `sign_human_gate` MCP tool to cryptographically sign the plan into `impl-plan-approval.json.sig`.
   - Update `status: approved` in YAML frontmatter of `impl-plan.md`.
   - **[Machine Contract Compilation]**: Compile `impl-plan.md` into schema-validated machine contract:
     `python3 scripts/compile-impl-plan-json.py --input "<story_dir>/impl-plan.md" --output "<story_dir>/impl-plan.json"`

**Handoff to Stage 3B:**
Once Step 4.0 is completed, execute `echo '{"stage": "3A", "status": "completed"}' > <story_dir>/plan-approved-evidence.json`. Then, prompt the user to invoke `/flow-stage-3b-code`.
