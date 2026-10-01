---
name: 'flow-stage-5-manual-test'
description: 'Stage 5 of the /flow pipeline: LIVE MANUAL TEST & VISUAL FIDELITY GATE (For UI Stories)'
---

# /flow-stage-5-manual-test

This is Stage 5 of the SDLC pipeline, exclusively mandatory for **UI Stories** to guarantee live browser test execution and pixel-level visual fidelity before final delivery.

## Structured Handoff Verification
Before proceeding, verify that Stage 4 (Review) completed successfully. Check for `<story_dir>/review-stage-evidence.json` or verify that dual review agents approved the implementation. If missing, HALT and prompt the user to run `/flow-stage-4-review`.

---

## Workflow Guidelines

**CRITICAL RULE: ONE STEP PER TURN.**
Do NOT attempt to execute multiple steps in a single response unless `--auto-approve` is set.
To complete a [Zero-Trust Gate], you MUST call `watchmen-mcp` Server and record cryptographic trace evidence.

---

### Step-by-Step Execution Protocol (Category A End-to-End):

1. **Step 1: Dynamic Worktree Port Allocation (Zero Collision Gate)**
   - Pre-allocate a dedicated port in range 3100–3200:
     ```bash
     python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py assign "<story_id>" "<worktree_path>"
     ```
   - Validate port assignment:
     ```bash
     python3 .agent/skills/worktree-port-allocator/scripts/validate-port-lifecycle.py --phase assign --port <ALLOCATED_PORT>
     ```

2. **Step 2: Auto-Generation & Cryptographic Sealing of QA Spec (Gate ZT-01A)**
   - Check if `manual-test-guide.md` exists in `<story_dir>/qa/`.
   - If missing, auto-generate from story ACs and risk matrix:
     ```bash
     python3 .agent/scripts/generate-qa-scenario.py --epic-id "<epic_id>" --story-id "<story_id>" --story-dir "<story_dir>" --output "<story_dir>/qa/manual-test-guide.md"
     ```
   - Calculate checksum and request Out-of-Band HMAC Cryptographic Signature:
     `call_mcp_tool("watchmen-mcp", "sign_pipeline_gate", {"artifact_path": "<story_dir>/qa/manual-test-guide.md", "gate_name": "qa-scenario-spec"})`
   - Lock physical permissions to Read-Only (`chmod 444 "<story_dir>/qa/manual-test-guide.md"`).

3. **Step 3: Live Dev Server Startup & IPv4 Liveness Probe**
   - Explicitly launch dev server with host and port overriding Next.js/Vite defaults:
     ```bash
     HOST=127.0.0.1 npm run dev -- -p <ALLOCATED_PORT> &
     SERVER_PID=$!
     ```
   - Probe liveness with progressive backoff (up to 45s):
     ```bash
     python3 scripts/validate-live-browser-qa.py <epic_id> <story_id> --check-liveness --port <ALLOCATED_PORT>
     ```

4. **Step 4: Scenario Adherence Enforcement**
   - Run: `python3 scripts/validate-scenario-adherence.py <epic_id> <story_id>`
   - *Requirement:* 100% of defined Test Cases (`TC-*`) and numbered steps must be implemented.

5. **Step 5: Playwright Live Browser Execution (Anti-Mock & WebGL Safe)**
   - Run headless Playwright tests targeting `http://127.0.0.1:<ALLOCATED_PORT>`.
   - Run with WebGL software flags and dynamic UUID test prefixes:
     ```bash
     TARGET_PORT=<ALLOCATED_PORT> npx playwright test tests/e2e/Story-<story_id>.spec.ts --chromium-sandbox=false --timeout=30000
     ```
   - **ZERO-TOLERANCE ANTI-PREVIEW RULE:**
     - Using `file://`, navigating to `preview.html`, or taking screenshots of static mockups is STRICTLY FORBIDDEN.

6. **Step 6: Live Browser Anti-Cheat & Target Grounding Audit**
   - Run: `python3 scripts/validate-live-browser-qa.py <epic_id> <story_id>`
   - Run Guardian verifier to check hydration root, non-empty DOM, and screenshot hash deltas:
     ```bash
     python3 .agent/skills/live-target-grounding-guardian/scripts/verify-live-evidence.py --evidence-dir "<story_dir>/qa/evidence" --target-url "http://127.0.0.1:<ALLOCATED_PORT>" --dom-root "#root"
     ```

7. **Step 7: Visual Fidelity & Mockup Cross-Check**
   - Run: `python3 scripts/visual-fidelity-comparator.py <epic_id> <story_id> --min-score 8.5`
   - Validates that:
     - Captured screenshots are not blank, solid-color, or error screens (`Application error`).
     - Live DOM computed styles match design tokens in `ui-spec.md`.
     - Structural similarity against Stage 2B approved design mockup (`stitch_preview.png`) clears $\ge 8.5/10$.
   - Generates `qa/evidence/visual-fidelity-report.md`.

8. **Step 8: Evidence Packaging & Sanitization (Gate ZT-01B)**
   - Package all evidence into a manifest, sanitizing sensitive tokens (`Authorization`, `Cookie` in HAR):
     ```bash
     python3 .agent/scripts/package-qa-acceptance.py --story-dir "<story_dir>" --sanitize-headers --output "<story_dir>/qa-acceptance-evidence.json"
     ```
   - Request Out-of-Band HMAC Cryptographic Signature:
     `call_mcp_tool("watchmen-mcp", "sign_pipeline_gate", {"artifact_path": "<story_dir>/qa-acceptance-evidence.json", "gate_name": "qa-acceptance-gate"})`

9. **Step 9: Worktree Port Release & Process Cleanup (Finally Block)**
   - Release the allocated port from SQLite registry:
     ```bash
     python3 .agent/skills/worktree-port-allocator/scripts/worktree-port-manager.py release "<story_id>"
     python3 .agent/skills/worktree-port-allocator/scripts/validate-port-lifecycle.py --phase release --port <ALLOCATED_PORT>
     ```

10. **Stage 5b: Dual-Condition Completion Gate (Human Gate)**
    - **HARD STOP:** Present the complete **UI Acceptance Package** to the user in chat:
      1. Side-by-side comparison: Stage 2B Approved Mockup vs Live Browser Capture.
      2. Dimensional scorecard from `visual-fidelity-report.md`.
      3. Scenario adherence confirmation (100% TCs passed).
      4. Watchmen cryptographic evidence signature.
    - Invoke `ask_question` with 3 options:
      - `Option 1: Deep Evaluation & Autonomous Self-Healing`: Triggers background loop (`runtime-realism-guardian` + `visual-fidelity-gate`, Max 3 retries) until 10/10, then halts and re-presents Stage 5b.
      - `Option 2: Approve & Complete Story`: Calls `watchmen-mcp:sign_human_gate` for Stage 5b, updates `status: completed` in `sprint-status.yaml` and `story.md`, runs `python3 scripts/validate-story-completion-gate.py <epic_id> <story_id>`, commits git changes, syncs Knowledge Graph.
      - `Option 3: Audit Log & Hold in Backlog`: Writes audit report to `_iwish-output/audits/audit-log-story-{story_id}.md` and retains story in `backlog`/`in-progress`.
    - If User provides direct text feedback, execute requested refinements and re-present Stage 5b.

**Handoff to Done:**
Upon User selecting Option 2 and validation passing, execute:
`echo '{"stage": 5, "status": "completed"}' > <story_dir>/manual-test-stage-evidence.json`.
Story is fully complete and sealed!

