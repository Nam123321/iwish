---
name: 'create-architecture'
description: 'Collaborative architectural decision facilitation for AI-agent consistency. Replaces template-driven architecture with intelligent, adaptive conversation that produces a decision-focused architecture document optimized for preventing agent conflicts.'
disable-model-invocation: true
---

> [!IMPORTANT]
> **[DOMAIN ROUTING GATE]** Hệ thống Watchmen (Category A) sẽ tự động kiểm duyệt Domain của bạn vào cuối lượt. Để tránh bị Block, bạn BẮT BUỘC phải chạy lệnh: `python3 .agent/scripts/domain-skill-router.py --context-file <file_đang_làm_việc>`. Nếu có skills trả về, BẮT BUỘC dùng `view_file` nạp toàn bộ.



IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @{project-root}/.agent/workflows/step-03-starter.md, READ its entire contents and follow its directions exactly!

<steps CRITICAL="TRUE">
1. MULTI-AGENT TOPOLOGY DEFINITION: If the project involves AI agents, you MUST explicitly select and document one or more of the following 6-Pattern Architecture topologies in `architecture.md` (e.g. under an 'AI Agent Architecture' heading):
   - **Pipeline:** Sequential task execution.
   - **Fan-out/Fan-in:** Parallel execution aggregating into a single result.
   - **Expert Pool:** Routing tasks to specialized domain agents.
   - **Producer-Reviewer:** Execution paired with adversarial validation.
   - **Supervisor:** Central orchestrator managing dynamic sub-tasks.
   - **Hierarchical Delegation:** Multi-level breakdown for massive scopes.
   *Guideline:* Use `invoke_subagent` (Sub-agents) for isolated parallel/sequential tasks with no communication overhead. Use `send_message` (Agent Teams) ONLY when 2+ agents require direct conversational coordination.
1.5. AI/ML ARCHITECTURE AUTO-DETECT GATE:
   - Run `python3 .agent/scripts/domain-skill-router.py --text "<architecture_draft>"`
   - If AI domains match (AI Architecture / AI Engineering / AI Ops), you MUST execute `/ai-system-architect --mode=full` to evaluate and integrate the 9 MLSD axes and produce verified evidence before finalizing.
2. PRE-COMPUTATION RESEARCH (NLM & AE) + ZERO-TRUST GATE: Before drafting the infrastructure map, you MUST explicitly trigger `/ae-notebook-orchestrator` (or `/nlm` pull) to cross-query NotebookLM (`PC-1` or `RL` notebooks) for existing domain constraints, architectural patterns, and execution boundaries. You MUST save the aggregated analysis to a physical evidence file `_iwish-output/adhoc-workspace/scratch/ae_pull_architecture_evidence.json`. The generated infrastructure map MUST cite data directly from this evidence file. No hallucination allowed.
3. INFRASTRUCTURE MAP GENERATION: Enforce a new mandatory step to generate the `Global Infrastructure & Execution Boundaries` map directly into `2.5. architecture.md` using the synthesized research from NotebookLM.
4. FOLLOW THE COMMAND IN LINE 7 FIRST to draft the traditional software Architecture document. Be sure to append your Multi-Agent Topology decisions into the final `architecture.md`.
5. CRITICAL — EM REVIEW CHECKLIST GATE. Before finalizing the Architecture, run `python3 .agent/scripts/validate-em-checklist.py <path_to_architecture_doc>`. Ensure all 15 cognitive patterns are addressed. If exit code 1 -> HALT and fix the document.
6. CRITICAL — SOCRATIC REVIEW GATE 0 (Party Mode). Before finalizing the Architecture, you MUST execute the Socratic Review Mode (Gate 0: `discovery`) between the `architect-agent` and `devops-agent` to stress-test the payload boundaries, latency, and sandbox limits against PRD NFRs.
7. CRITICAL — ARCHITECTURE UNKNOWNS GATE.
   - Load the `unknowns-scanner` skill (`.agent/skills/unknowns-scanner/SKILL.md`)
   - Run with: phase=architecture, scope=macro, depth=full
   - Explicitly target `scope=infrastructure` to log MACRO risks regarding core components (e.g., Redis, Centrifugo, E2B).
   - Tools: tech-stack-audit, wardley-position, pre-mortem
   - If any MACRO risk with confidence < 0.5 → HALT, present alternatives
8. CRITICAL — TDR FORMAT GATE (Zero-Trust).
   - Every ADR section (### X.Y.) in the architecture document MUST follow the Trade-off Decision Record (TDR) format: `#### Decision`, `#### Options Evaluated` (table with ≥2 options), `#### Trade-off Analysis`, `#### Scale-Phase Roadmap` (with quantitative trigger metrics per phase), `#### Evidence & References`, and `#### Change Log`.
   - Run: `python3 .agent/scripts/validate-tdr-format.py <path_to_architecture_doc> --evidence-output _iwish-output/adhoc-workspace/scratch/tdr_validation_evidence.json`
   - If TDR Compliance Score < 70% → HALT and fix non-compliant sections.
   - **[ZERO-TRUST]**: The script MUST output a physical evidence JSON file. If the evidence file does not exist after execution, the gate is considered FAILED regardless of exit code.
</steps>

> **NAVIGATOR GUARDIAN SYNC (CRITICAL)**
> Upon completing the workflow and saving the output files, you MUST explicitly run `bash .agent/scripts/navigator-guardian.sh` via the terminal to synchronize the Idea Navigator dashboard.


---

## 📘 NotebookLM Integration Hook

> This hook is auto-triggered when this workflow executes. Agent MUST read `notebook-registry-manager` skill before proceeding.
> **CENS Gate**: Before executing this hook, load and evaluate `.agent/fragments/nlm-context-enrichment-gate.md` to determine enrichment level.
> Auto-triggered after architecture creation.

### PUSH + FOUNDATION: Create PC-2 + RL-4

1. Load `notebook-lifecycle-manager` → Create `{Project}/Core-Architecture` (PC-2)
2. **Architecture Docs Sync**: Scan `_iwish-output/2. Product Planning/` for files matching `*architecture*`, `*database*`, `*data-spec*` → Push to PC-2 (Replace mode). **Do NOT hardcode filenames** — files may have numbered prefixes (e.g., `2.5. architecture.md`).
3. **Design System Sync**: Scan `_iwish-output/2. Product Planning/design-system/` for `*.md` files → Push to PC-2 (Replace mode)
4. **ADR Sync**: Scan `_iwish-output/2. Product Planning/ADRs/` for all `ADR-*.md` files → Push each as source to PC-2 (Append mode)
5. **AE Sync**: Scan `_iwish-output/2. Product Planning/advanced-elicitation/` for all `AE-R*.md` files → Push each as source to PC-2 (Append mode)
6. **Epic ADR Sync**: Scan `_iwish-output/3. Development/1. Epic & Story/*/Epic-*/ADR-*.md` → Push to relevant OP-1 notebook
7. Create RL-4 folder with 3-4 specialized notebooks (Messaging, Data, API, Infra)
8. Load `notebook-cross-query-engine` → Cross-query PC-2 ↔ RL-3 + PC-1
9. Update `foundation-checklist.yaml`: set `PC-2.status = created`, `RL-4.status = created`
> **[ZERO-TRUST GATE]** You MUST save the raw MCP JSON output to a file (e.g. `_iwish-output/adhoc-workspace/scratch/nlm_evidence.json`) and run: `python3 .agent/scripts/pipeline-integrity-runner.py --target "project" --type project --phase discovery`. If it fails, HALT immediately and do not proceed.
