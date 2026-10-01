---
name: "epic_baseline_scanner"
description: "Use when an Epic is newly created or updated and requires automated scanning to extract architectural risks, edge cases, and unknown findings. DO NOT put a workflow summary here."
inputs: ["epic_id"]
outputs: ["strict JSON array of unknowns"]
mcp_tools_required: []
subagent_triggers: []
---

# Epic Baseline Scanner

## When to Use This Skill
You must use this skill immediately after generating or significantly modifying an Epic (e.g., in `/iwish-feature-create-epics-and-stories.md`), or when the `Unknowns Analyst` flags an Epic as missing baseline unknowns.

## Core Rules
1. **Zero-Trust Input**: Never attempt to manually extract unknowns using open-ended LLM context. You must run the `runner.py` script to perform the extraction deterministically.
2. **Schema Enforcement**: The output of this skill is a rigid JSON schema of new Unknowns. Do not alter the JSON schema; it is designed to be directly consumed by `unknowns-ledger-sync`.
3. **Generative Constraints**: The skill relies on LLM heuristics to evaluate architectural gaps, edge cases, and ambiguous requirements in the Epic's Markdown structure.

## Execution Guide (Tier 1 Only)
To execute this skill, you MUST NOT run generic bash commands (like `grep`, `cat`, or `sed`). You MUST run the included Python runner:
`python3 ${IWISH_HOME}/generated-skills/epic_baseline_scanner/scripts/runner.py --epic <epic_id>`

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| GATE-1  | File Existence & Validation | Category A | `os.path.exists()` check in `runner.py` | Exit Code 1 if Epic file missing |
| GATE-2  | JSON Output Schema Validation | Category A | Schema validation in `runner.py` | Script stdout or Exit Code 1 on mismatch |
| GATE-3  | Architectural Risk Detection | Category B | LLM evaluates structural risks in Epic text | LLM generated `description` and `remediation_type` fields |

*Enforcement Maturity*: 66% (Passes >= 30% threshold).

## Red Flags — STOP and Reconsider
- ❌ **Direct Ledger Updates**: The scanner MUST NEVER directly modify `unknowns-ledger.yaml`. Its sole job is to produce JSON.
- ❌ **Bypassing the Runner**: If you find yourself thinking "I can just read the Epic file and list the unknowns myself", STOP. This is a Silent Bypass rationalization.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just read the Epic and write directly to the ledger." | You will violate Separation of Concerns. The ledger is exclusively managed by `unknowns-ledger-sync`. |
| "I don't need to use the Python script, I'll just use a prompt." | You will violate the Zero-Trust Capability Standard. Tier 1 execution must occur through the explicit runner. |

## Industry Standards & Best Practices
- **Data-First Architecture**: Validate models and schemas before application logic.
- **Single Responsibility**: Generative tasks (scanning) must be isolated from state-management tasks (syncing).
