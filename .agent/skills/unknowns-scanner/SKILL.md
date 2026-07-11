---
name: "Unknowns Scanner"
description: >
  Systematically discovers and mitigates unknown-unknowns and known-unknowns
  across the software development lifecycle using the Unknowns Intelligence Platform (UIP).
---

# Unknowns Scanner Skill

## Purpose
The Unknowns Scanner executes the UIP (Unknowns Intelligence Platform) pipeline to scan for blind spots, assumption drifts, and unvalidated hypotheses across the SDLC.

## Tool Classification System

UIP tools follow a 3-tier classification:

| Type | Description | Anti-Fabrication | Example |
|------|-------------|-----------------|---------|
| **A** | Deterministic — parseable input → structured JSON output | Category A (reproducible) | `uip-drift-detector.py` |
| **B** | LLM Prompt Template — structured prompt framework for agent reasoning | Category B (trust-based, requires guardrails) | `uip-risk-scanner.py` |
| **A+B** | Hybrid — deterministic Phase 1 + optional LLM Phase 2 (`--deep`) | Category A+B (Phase 1 reproducible, Phase 2 bounded) | `uip-fmea-scanner.py` |

## Tool Inventory (7 Production Tools)

### Type A+B (Deterministic + Deep LLM Analysis)

| Tool | Phases | Modes | Co-registers With |
|------|--------|-------|-------------------|
| `uip-fmea-scanner.py` | story, dev, review | — | Edge Case Guardian |
| `uip-tech-stack-audit.py` | planning, architecture | — | — |
| `uip-review-challenger.py` | review, dev | `--mode quiz\|debias\|both` | — |
| `uip-confidence-scorer.py` | discovery, planning, review | — | — |

### Type B (LLM Prompt Templates)

| Tool | Phases | Modes | Co-registers With |
|------|--------|-------|-------------------|
| `uip-risk-scanner.py` | planning, discovery | `--mode pre-mortem\|assumptions\|both` | Idea Hardening |
| `uip-market-audit.py` | discovery | `--mode pmf\|blindspot\|both` | Unique Advantage Evaluator |
| `uip-ux-blindspot-scanner.py` | planning, design | — | Party-Mode Debate Trigger |

### Type A (Pure Deterministic)

| Tool | Phases | Extra Flags | Co-registers With |
|------|--------|-------------|-------------------|
| `uip-drift-detector.py` | dev, review | `--log-deviations` | Spec Compliance Guardian |
| `uip-ux-compliance-matrix.py` | planning, design | — | Zero-Trust UX Gate |

## Execution

### Standard Invocation (Phase 1 only — fast, deterministic)
```bash
python3 .agent/scripts/uip-<tool>.py --context <file_path>
```

### Deep Analysis (Phase 1 + Phase 2 LLM — thorough, costs tokens)
```bash
python3 .agent/scripts/uip-<tool>.py --context <file_path> --deep
```

### Multi-mode Tools
```bash
python3 .agent/scripts/uip-risk-scanner.py --context <file> --mode pre-mortem
python3 .agent/scripts/uip-review-challenger.py --context <diff_file> --mode quiz
```

### Deviation Logging (absorbed from uip-deviation-logger)
```bash
python3 .agent/scripts/uip-drift-detector.py <story_file> --log-deviations
```

## Output Format

- **Type A / Phase 1:** JSON to stdout. Exit codes: 0=success, 1=error, 2=partial.
- **Type B / Phase 2:** YAML block containing `prompt_template`, `required_context_keys`, `output_schema`, and `guardrails`.

## Anti-Fabrication Guardrails

- **Bounded Adjustment:** Confidence scorer LLM adjustment is clamped to ±0.10 of the deterministic base score.
- **Evidence Grounding:** All Type B prompts require findings to cite specific artifacts/decisions from input context.
- **Counter-Signal Forcing:** Risk scanner and market audit prompts mandate devil's advocate counter-arguments.
- **Scoring Rubrics:** FMEA prompts include explicit severity/occurrence/detection rubrics with examples per level.

## Killed Tools

| Tool | Reason | Alternative |
|------|--------|-------------|
| `socratic-drill` | SOI ~0.80 overlap | Use Socratic Review skill directly with `--lens` parameter |
| `code-archaeology` | Insufficient ROI | Deferred — may revisit if git log analysis proves valuable |

## Knowledge Bus

All findings are written to:
- `_iwish-output/unknowns/unknowns-ledger.yaml` — Individual findings
- `_iwish-output/unknowns/macro-risks.yaml` — Aggregated macro risks

*For the full workflow interface, see `/unknowns`.*
