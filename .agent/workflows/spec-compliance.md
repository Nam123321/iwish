---
name: spec-compliance
description: Run Spec Compliance Guardian to detect spec-code drift for a story. Use when suspecting implementation doesn't match UI Spec, Data Spec, or Story ACs.
---

# /spec-compliance — Spec Compliance Check

> Canonical short workflow for on-demand spec-code drift detection.

## Overview
Performs a structured comparison between specification documents (UI Spec, Data Spec, Story ACs/Tasks) and actual implemented code, producing a Spec Compliance Score (SCS).

## Steps

### 1. Identify Target Story
- If user specified a story ID (e.g., `/spec-compliance story-17.1`), resolve the story file path using Layout Mode rules from AGENTS.md.
- If no story specified, ask the user which story to check.

### 2. Load and Execute Spec Compliance Guardian
Read and execute: `.agent/skills/spec-compliance-guardian/SKILL.md`

Follow these phases in order:
1. **§1 Spec Loading Protocol** — Load all applicable spec files
2. **§2 Structural Diff Checks** — Run UI, Data, and AC checks
3. **§3 SCS Calculation** — Calculate weighted compliance score
4. **§8 Anti-Fabrication** — Follow evidence trail requirements

### 3. Run Automated Pre-Flight
Execute the deterministic script check:
```bash
python3 .agent/scripts/spec-compliance-checker.py <path-to-story.md> [--ui-spec <path>] [--data-spec <path>]
```
Paste the COMPLETE raw output including the `[JSON]` line.

### 4. Present Results
Output the full compliance report following SKILL.md §6 format, including:
- SCS score per dimension
- Overall SCS and disposition
- Drift items with file:line references
- Recommendations for remediation

### 5. Remediation Routing
Based on disposition:
- **🟢 COMPLIANT** (SCS ≥ 90%): No action needed
- **🟡 MINOR DRIFT** (75-89%): List fixes, offer to auto-fix
- **🟠 SIGNIFICANT DRIFT** (50-74%): Recommend `/dev-story` re-implementation
- **🔴 CRITICAL DRIFT** (< 50%): Recommend spec re-read and major rework
