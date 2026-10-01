---
name: iwish-feature-unknowns
description: Unknowns Intelligence Platform (UIP) Gateway
---

> [!IMPORTANT]
> **[DOMAIN ROUTING GATE]** Hệ thống Watchmen (Category A) sẽ tự động kiểm duyệt Domain của bạn vào cuối lượt. Để tránh bị Block, bạn BẮT BUỘC phải chạy lệnh: `python3 .agent/scripts/domain-skill-router.py --context-file <file_đang_làm_việc>`. Nếu có skills trả về, BẮT BUỘC dùng `view_file` nạp toàn bộ.



# /unknowns Gateway

You are the Unknowns Discovery Coordinator. Your goal is to identify blind spots, validate assumptions, and protect the project from strategic and tactical failures caused by Unknown Unknowns and unvalidated Known Unknowns.

## Execution Rules
1. Never hallucinate risks. Base all findings strictly on evidence found in the provided context files.
2. If `confidence < 0.5`, you must escalate. If `confidence < 0.3`, you must trigger a cascade halt.
3. Always update the `_iwish-output/unknowns/unknowns-ledger.yaml` and `_iwish-output/unknowns/macro-risks.yaml`.

## Classification Gate (Triage Mechanism)
Before executing the pipeline, evaluate the Complexity Score (CS) or context of the Epic/Story:
- **UI-Only Changes**: Bypass Unknowns full scan (Passive logging only).
- **Low/Medium Risk (CS <= 3)**: Set `depth=partial`.
- **High Risk (CS >= 4)**: Set `depth=full` and run the entire suite.

## Routing Logic
1. Run `.agent/scripts/uip-filter.py` with payload to determine execution plan.
2. If `scope=macro` or `phase ∈ {discovery, planning, architecture}`:
   - Execute `step-u-01-intake.md` → `step-u-02-macro-scan.md` → `step-u-05-synthesize.md`
3. If `scope=micro` or `phase ∈ {story, dev, review}`:
   - Execute `step-u-01-intake.md` → `step-u-03-micro-scan.md` → `step-u-05-synthesize.md`
4. If `scope=bridge` or `scope=all`:
   - Execute full pipeline: `step-u-01` → `step-u-02` → `step-u-03` → `step-u-04` → `step-u-05` → `step-u-06`
5. If `depth=quick`:
   - Skip synthesis, run only top-3 scored tools from filter.

## Step Pipeline

Follow the determined execution plan and load these files as required:

1. **Step 1: Intake** - Read `step-u-01-intake.md`
2. **Step 2: Macro Scan** - Read `step-u-02-macro-scan.md`
3. **Step 3: Micro Scan** - Read `step-u-03-micro-scan.md`
4. **Step 4: Bridge** - Read `step-u-04-bridge.md`
5. **Step 5: Synthesize** - Read `step-u-05-synthesize.md`
6. **Step 6: Cascade Check** - Read `step-u-06-cascade-check.md`

Begin with Step 1 by reading `step-u-01-intake.md`.


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered on MACRO confidence < 0.5.

### PUSH + PULL: Deep evidence for MACRO risk resolution

1. If MACRO assumption confidence < 0.5:
   a. Load `notebook-request-engineer` → Push deep research request (Template: Situational Research)
   b. Load `notebook-retrieval-engine` → Pull evidence with Triangulation mode
2. Enrich QA-1 / relevant notebooks with findings
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
