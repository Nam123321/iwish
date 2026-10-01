# NotebookLM Deep Research Implementation

This document defines the implementation specifications for the `/nlm-research` workflow. Execute these steps sequentially to conduct deep research using NotebookLM.

---

## Step 1: Topic Analysis
- Parse the user's explicit request.
- Extract the core research topic, key constraints (e.g., timeline, specific technologies), and desired output format.

## Step 2: Registry Lookup
- Load the `notebook-registry-manager` skill.
- Search `_iwish-output/notebooks/domain-taxonomy.yaml` and `notebook-registry.yaml` to find an existing target notebook that aligns with the research topic.

## Step 3: Enrich vs Create Decision
Evaluate the findings from Step 2:
- **ENRICH:** If an existing notebook is found with **>60% overlap** to the new topic, select it for enrichment (adding new sources).
- **CREATE:** If the topic breadth is substantial (e.g., breadth score ≥ 3, representing a new major domain) or overlap is low, decide to create a **NEW** notebook.
- **User Confirmation:** Explicitly ask the user to confirm whether to ENRICH the existing notebook `[Name]` or CREATE a new one. Wait for their response before proceeding.

<steps CRITICAL="TRUE">
## Step 4: [ZERO-TRUST PRE-PUSH]
Once the target notebook is established:
- Load the `notebook-quality-gate` skill to validate any new sources.
- Load the `notebook-request-engineer` skill to select the optimal template.
- Send the push intent and save the response to `_iwish-output/adhoc-workspace/scratch/ae_push_intent.json`.
- **CRITICAL GATE**: Run `python3 .agent/scripts/pipeline-integrity-runner.py --target "_iwish-output/adhoc-workspace/scratch/ae_push_intent.json" --type project --phase discovery`.
- **HALT** if the script fails.

## Step 5: [BUILD LAYER 2]
- Request NotebookLM to process the sources and compile the Layer 2 Research Notebook based on the pushed intent.
- If cross-domain context is needed, load `notebook-cross-query-engine` to link with Principal Component dependencies.

## Step 6: [PULL & AE ORCHESTRATOR]
- Execute the query against the target notebook using `notebook-retrieval-engine`.
- **Sufficiency Protocol Check**: Ensure Citation Density, Dimension Coverage, and Triangulation are satisfied. (Max 2 recursive rounds for Precision Mode).
- **MANDATORY**: Save the final pulled evidence to `_iwish-output/adhoc-workspace/scratch/ae_pull_evidence.json`.

## Step 7: [GENERATE RESEARCH RECORD]
- Load the `knowledge-collector` skill.
- Generate a comprehensive Research Record file (e.g., `_iwish-output/research/research-record-{topic}.md`). This file MUST include:
  1. **Command & Intent:** The original query and command used.
  2. **Notebook Details:** The notebook(s) used and the decision (ENRICHED vs CREATED).
  3. **Extracted Evidence:** The raw extraction results pulled from each notebook (from `ae_pull_evidence.json`).
  4. **Final Synthesis:** The final research report.
- **Constraint**: The final synthesis MUST strictly rely on the extracted evidence. No LLM hallucination is permitted.

## Step 8: [ZERO-TRUST POST-PUSH]
- Push the finalized Research Record file back to NotebookLM to serve as a future canonical source.
- Save the push response to `_iwish-output/adhoc-workspace/scratch/ae_post_push.json`.
- **CRITICAL GATE**: Run `python3 .agent/scripts/pipeline-integrity-runner.py --target "_iwish-output/adhoc-workspace/scratch/ae_post_push.json" --type project --phase discovery` to close the Zero-Trust loop.
- **HARD-GATE ANTI-CHEATING**: Run `python3 .agent/scripts/validate-nlm-research.py --topic "{topic}"`. You MUST pass this script to verify physical file generation before finishing. If it fails, you MUST fix the missing files.
- **Knowledge Graph Injection**:
  - Generate a metadata file at `_iwish-output/adhoc-workspace/scratch/kg-metadata.json` with content: `{"summary": "<brief summary>", "tags": ["research", "ukp"], "layer": "strategic"}`.
  - Run command: `iwish inject-node --file "_iwish-output/research/research-record-{topic}.md" --metadata-file "_iwish-output/adhoc-workspace/scratch/kg-metadata.json"`
- Update `notebook-registry.yaml` (e.g., updating `last_synced`).
- Output the generated Research Record file path and summary to the user, advising that they can reference this file for future deeper research.
</steps>
