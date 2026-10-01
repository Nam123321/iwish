---
name: absorb-stage-2-analysis
description: Stage 2 of the Repo Absorption Protocol (Dissect & Document). Covers Deep Reading, DNA Extraction, and Community Audit.
---

# 🌀 `/absorb-stage-2-analysis` (Stage 2: Analysis & Tracing)

## 📌 OVERVIEW
This stage dissects the Code/Behavioral layers based on Stage 1's map, documents the findings into the Repo DNA, and audits community feedback to validate empirical real-world usage.

---

## 🛠️ THE PIPELINE

### Phase 3: DISSECT 🔬 (Agent: capability-agent)
- **Action:** Graph-Directed Dual-Layer Deep Reading.
- **Steps:**
  1. **Tech Layer (Graph-Directed):** Read files ordered by Hub Node rank (highest connectivity first) from Stage 1. Use `view_file` in chunks.
  2. **Behavioral Layer:**
     - Read ALL `[P0.5 - Linked Behavioral Asset]` files entirely.
     - Read ALL `[P1.5 - Dynamically Linked Asset]` files entirely.
     - For `[P4 - Orphan Asset]`, read only the first 50 lines. Skip if irrelevant.
  3. **Traceability Matrix (Zero-Trust):** EVERY extracted pattern MUST include physical coordinates (File Path + Line Number). Patterns without coordinates are invalid. Save this matrix to `02-deep-dive/trace-matrix.json`.
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/02-deep-dive/trace-matrix.json`.

### Phase 4: DOCUMENT 📑 (Agent: capability-agent)
- **Action:** Extract findings into the standard DNA template.
- **Steps:**
  1. Compile all findings into the 11-section `repo-dna-template.md`.
  2. **Single Source of Truth (Symlink):**
     - Save the runtime source of truth to: `${IWISH_HOME}/repo-dna/{repo-name}-dna.md`
     - Create a symlink in sandbox: `ln -s ${IWISH_HOME}/repo-dna/{repo-name}-dna.md ${IWISH_HOME}/sandbox/{repo-name}/repo-dna.md`
- **Gate:** MUST run structural validation: `python3 .agent/scripts/validate-repo-dna.py "${IWISH_HOME}/repo-dna/{repo-name}-dna.md"` before proceeding.

### Phase 4.5: COMMUNITY AUDIT & RECENT UPDATES 🌐 (Agent: research-agent / analyst-agent)
- **Action:** Research empirical user feedback, release history, and repository health signals.
- **Steps:**
  1. **Web Search & Issue Scan:** Extract pros/cons, security vulnerability reports, and design debates.
  2. **Release History Analysis:** Fetch tags/releases via GitHub API. Identify major updates, breaking changes, and deprecations.
     - **[Mitigation EC-P5-001 - 403 Rate Limit]:** If GitHub API returns 403 Rate Limit, DO NOT crash. Fallback to reading `CHANGELOG.md` directly from the cloned sandbox or doing a Google Search `site:github.com {repo} releases`.
  3. **GitHub Engagement & Health Signals:** Analyze Issue Response Time, PR Review Quality, Bus Factor, Stale Ratio, and Commit Frequency.
  4. **Core Value & Best Practices Synthesis:**
     - **Design Philosophy:** Why is this repo famous?
     - **Game Changers:** 1-3 most breakthrough features.
     - **Real-World Usage:** How professionals *actually* use it.
     - **Architectural Mapping:** Map to I-Wish Shape and Role Axes.
- **Gate:** MUST save raw API/search responses to `03-community/raw-api-responses.json`. MUST run script `python3 .agent/scripts/validate-file-exists.py "${IWISH_HOME}/absorbed-repos/{repo-name}/03-community/community-report.md"`.
- **Output:** `${IWISH_HOME}/absorbed-repos/{repo-name}/03-community/community-report.md`.

---

## 🚫 ZERO-TRUST PHYSICAL GATE
To prove completion of Stage 2 and transition to Stage 3, you MUST run:
```bash
python3 .agent/scripts/pipeline-integrity-runner.py --target "{repo-name}" --type absorb --phase analysis
```
**If the script returns an error, you MUST NOT proceed to Stage 3.**

> **Next Step:** If the gate passes, invoke `/absorb-stage-3-evaluation` passing the `{repo-name}`.
