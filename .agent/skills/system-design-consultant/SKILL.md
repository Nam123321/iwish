---
name: "system-design-consultant"
description: "Use when evaluating system architecture, SQL vs NoSQL trade-offs, scaling web tiers, and reviewing system design solutions. Enforces Tri-Source RAG (Primer + NotebookLM + Project Reality)."
inputs: ["query"]
outputs: ["rag_evidence", "cross_validation_matrix"]
mcp_tools_required: ["notebooklm-mcp"]
subagent_triggers: ["notebook-retrieval-engine"]
---

# System Design Consultant

## When to Use This Skill
Trigger this skill whenever you need to architect a new system, choose between database types, design caching layers, evaluate latency/throughput trade-offs, or consult best practices from the canonical System Design Primer.

## Tri-Source Retrieval Matrix (MANDATORY EXECUTION)
You must NOT answer questions purely based on your internal training data. To provide advice that is both canonically accurate AND tailored to the project's constraints, you MUST execute the following 3 steps:

### Source A: Canonical Topology (The Map)
Execute `cat _iwish-output/adhoc-workspace/scratch/sdp-9999-repo-topology.json` to gain spatial awareness of the System Design Primer book structure and locate relevant solution files.

### Source B: Canonical Deep Dive (The Theory)
Execute `notebook_query` to retrieve actual content, frameworks, and decision trees from the exact files identified in Source A:
`notebook_query --notebook_id "deb09203-0b1e-4037-becb-51983c8b5dfc" --query "<exact_file_path_or_concept>"`

### Source C: Project Reality & Constraints (The Context)
Before giving advice, you MUST understand what the current project is actually using.
**Warning:** DO NOT blindly `cat .agent/graph_cache.json` as it is extremely large (164KB) and will exhaust token budgets.
1. **Primary Constraint Check:** Read the active architecture and macro risks:
   `cat "_iwish-output/2. Product Planning/2.5. architecture.md"`
   `cat "_iwish-output/2. Product Planning/tech-decision-registry.yaml"` (if it exists).
   `cat "unknowns-ledger.yaml"` (Mandatory MACRO Risk check).
2. **Targeted Graph Check (Optional):** Only if feature-level dependencies are needed, use `grep_search` on `.agent/graph_cache.json` with specific keywords.

## Zero-Trust Physical Evidence Gate (Category A)
To prove you have not hallucinated or skipped the retrieval steps, you MUST generate physical evidence and pass the validator BEFORE providing any consultation.
1. Create a JSON file at `_iwish-output/adhoc-workspace/scratch/{uuid}-tri-source-evidence.json` containing the raw extracts you found.
2. Run the Category A Validator (which includes XSS protection and Greenfield checks):
   `python3 .agent/scripts/validate-tri-source-evidence.py --conversation-id "<YOUR_CONVERSATION_ID>" --file "_iwish-output/adhoc-workspace/scratch/{uuid}-tri-source-evidence.json"`
3. If the script exits with `1` (FAIL), you MUST HALT and fix your evidence. Do not output the final matrix.

## Mandatory Output Format: Cross-Validation Matrix
Once the Zero-Trust Gate passes, your final consultation output MUST include a markdown table that strictly maps Source B (Theory) against Source C (Reality).

| Dimension / Component | Primer Recommendation (Source B) | Cowok.ai Reality (Source C) | Evaluation (Delta / Trade-off) |
|-----------------------|----------------------------------|-----------------------------|--------------------------------|
| e.g. Cache Layer      | Redis with LRU eviction          | Redis Cluster (Transient)   | Aligned. Prevents PG WAL bloat.|

## High-Fidelity Visual Generation (Archify in Sandbox)
When the user requests visual diagrams, you MUST generate an HTML diagram using the `archify` toolkit via the secure sandbox.

### 1. Generate JSON Schema
Formulate the architecture into an `archify` compatible JSON file.
- **Storage:** `_iwish-output/2. Product Planning/system-design-visuals/{pattern-name}-{uuid}-schema.json`
- **UUID is MANDATORY** in the filename to prevent Git collisions.

### 2. Validation Gate (MicroVM)
Validate the JSON through the secure wrapper:
`python3 .agent/scripts/run-archify-sandbox.py validate architecture <json_path>`

### 3. Deliver HTML (MicroVM)
Generate the HTML file through the secure wrapper:
`python3 .agent/scripts/run-archify-sandbox.py deliver architecture <json_path> <html_path> --quality showcase`

### 4. Contextual Dual-Linking & SSOT Sync
- Link BOTH the HTML and JSON files side-by-side into `2.5. architecture.md` using an Auto-Merge mechanism.
- **SSOT DRIFT ALERT:** Immediately after modifying the architecture file, you MUST trigger `/reconcile-change` to run `SSOT-RECONCILIATION-AUTO-SYNC`.
