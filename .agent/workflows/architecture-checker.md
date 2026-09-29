---
name: architecture-checker
description: >
  Run Architecture Coherence Checker v2 — TDR-first ADR↔Story tech cross-reference.
  Detects infrastructure conflicts (e.g., Story uses Temporal but ADR-2.18 reserves it for Enterprise phase).
  Supports single story, entire epic, or sprint-wide scans.
---

# /architecture-checker

Kiểm tra tính nhất quán giữa quyết định kiến trúc (ADR/TDR) và công nghệ được sử dụng trong Story.
Phát hiện xung đột hạ tầng trước khi chúng đến production.

**Data Source Priority:**
1. `tech-decision-registry.yaml` (TDR) — deterministic SSOT, auto-discovered alongside `architecture.md`
2. `architecture.md` body-scan — heuristic fallback if TDR absent

## Cách sử dụng

```
/architecture-checker --story <story_id>     # Kiểm tra 1 story
/architecture-checker --epic <epic_id>       # Kiểm tra toàn bộ epic
/architecture-checker --sprint-wide          # Kiểm tra tất cả story trong sprint
```

## Workflow Steps

<steps CRITICAL="TRUE">
1. **Resolve Target:**
   - Parse arguments to determine scope: single story, epic, or sprint-wide.
   - Locate the physical directory path for the target story/epic.

1.5. **TDR Verification:**
   - Check if `tech-decision-registry.yaml` exists in the same directory as `architecture.md`.
   - If TDR exists: Script will use it as SSOT (deterministic mode, 128+ entries with rejected alternatives).
   - If TDR missing: Warn user and offer to generate it by running full architecture scan.
   - **NEVER proceed in body-scan fallback mode without explicitly warning the user.**

2. **Locate Architecture File:**
   - Search for `architecture.md` in standard locations (in priority order):
     - `_iwish-output/2. Product Planning/2.5. architecture.md`
     - `_iwish-output/architecture.md`
     - `_iwish-output/2. Architecture/architecture.md`
     - `docs/architecture.md`
   - If not found, HALT with error: "Architecture file not found."

3. **Execute Coherence Check (Watchmen v2.0 Enforced):**
   - **CRITICAL GATE:** Do NOT execute `architecture-coherence-checker.py` directly via bash. This is a Category B bypass and will be rejected.
   - You MUST run the check via the central integrity runner:
   ```bash
   python3 .agent/scripts/pipeline-integrity-runner.py --target "<story_or_epic_id>" --type "<story|epic>" --phase spec
   ```
   - The runner will execute `architecture-coherence-checker.py` within the `/tmp/iwish-oob-sandbox` directory to prevent TOCTOU tampering and will aggregate the findings.
   - The workflow may only proceed to Interpret Results once the runner generates the HMAC-signed `pipeline-evidence-spec.json` payload.

4. **Interpret Results:**
   - **`PASS`**: All technologies aligned with ADRs. Report summary and continue.
   - **`WARN`**: Unregistered technologies detected. Recommend adding ADR/TDR entries.
   - **`FAIL`**: CRITICAL/HIGH conflicts detected. HALT pipeline and present:
     - **Option A**: Update the ADR to officially adopt the technology (add to TDR)
     - **Option B**: Refactor the story to use the canonical technology per ADR
     - **Option C**: Create a phased migration plan with explicit trigger metrics

   Conflict types detected:
   - `premature-adoption`: Using a `future`-status technology in current phase
   - `deprecated-tech`: Using a technology explicitly deprecated by an ADR
   - `category-conflict`: Using a tech that conflicts with the active choice in its category
   - `unregistered-tech`: Using a tech not tracked in any ADR (potential ADR gap)

5. **Auto-Actions (on FAIL):**
   - Auto-create MACRO risk entry in `macro-risks.yaml` for each CRITICAL conflict.
   - Write conflict findings to `unknowns-ledger.yaml`.
   - If running inside `/flow`, `/retro`, or `/party-mode`: Return exit code 1 to halt the pipeline.

6. **Formatting & Output:**
   - Present results in a formatted table with severity, story, technology conflict, and recommendation.
   - Save full report as JSON artifact for audit trail.
</steps>

---

<Watchmen v2.0 Platform-Enforced Security>
**CRITICAL MANDATE: Zero-Trust Execution**
Agents are strictly prohibited from bypassing the `pipeline-integrity-runner.py`. Any attempt to run Python validation scripts standalone (e.g., `python3 validate-...`) is a Category B bypass violation.
The workflow is ONLY complete when the HMAC-signed `pipeline-evidence-spec.json` exists in `_iwish-output/`. If the file is missing, the agent MUST halt and escalate to the user.
</Watchmen v2.0 Platform-Enforced Security>
