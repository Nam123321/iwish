---
name: "algorithm-consultant"
description: "Use when evaluating time/space complexity, data structures, recursion, dynamic programming, or implementing algorithmic challenges. Enforces Tri-Source RAG."
inputs: ["query"]
outputs: ["rag_evidence", "cross_validation_matrix"]
mcp_tools_required: ["notebooklm-mcp"]
subagent_triggers: ["notebook-retrieval-engine"]
---

# Algorithm Consultant

## When to Use This Skill
Trigger this skill whenever you need to implement complex algorithms, evaluate time/space complexity (Big O), or design data structures (Trees, Graphs, DP, Linked Lists) based on the Interactive Coding Challenges DNA.

## Tri-Source Retrieval Matrix (MANDATORY EXECUTION)
You must NOT answer questions purely based on your internal training data. To provide advice that is both canonically accurate AND tailored to the project's constraints, you MUST execute the following 3 steps:

### Source A: Canonical Topology (The Map)
Execute `cat _iwish-output/adhoc-workspace/scratch/icc-8888-repo-topology.json` (or the equivalent topology file) to gain spatial awareness of the Algorithm book/repo structure and locate relevant solution files.

### Source B: Canonical Deep Dive (The Theory)
Execute `notebook_query` to retrieve actual content, frameworks, and decision trees from the exact files identified in Source A:
`call_mcp_tool` with ServerName: `notebooklm-mcp`, ToolName: `notebook_query`
Arguments: `{"notebook_id": "347f1dc1-5381-4ff7-bfda-cc4c23126d44", "query": "<exact_file_path_or_concept>"}`

### Source C: Codebase Reality & Constraints (The Execution Context)
Before recommending an algorithm, you MUST understand the actual codebase environment. Do NOT default to checking high-level architecture documents unless explicitly requested.
1. **Target Module Check:** Use `view_file` or `grep_search` on the specific source code files where the algorithm will be implemented to understand the current data structures in use (e.g. are they using Prisma objects, raw arrays, or Maps?).
2. **AST / Dependency Check:** If the algorithm spans multiple files, use `grep_search` on `.agent/graph_cache.json` (or read the AST) to ensure you don't introduce circular dependencies or break existing interfaces.
3. **Performance Budget:** Check `unknowns-ledger.yaml` (Performance/Macro Risks) or `sprint-status.yaml` to ensure your Big O (Time/Space) recommendation aligns with the project's current thresholds.

## Zero-Trust Physical Evidence Gate (Category A)
To prove you have not hallucinated or skipped the retrieval steps, you MUST generate physical evidence and pass the validator BEFORE providing any consultation.
1. Create a JSON file at `_iwish-output/adhoc-workspace/scratch/{uuid}-tri-source-evidence.json` containing the raw extracts you found.
2. Run the Category A Validator (which includes XSS protection and Greenfield checks):
   `python3 .agent/scripts/validate-tri-source-evidence.py --conversation-id "<YOUR_CONVERSATION_ID>" --file "_iwish-output/adhoc-workspace/scratch/{uuid}-tri-source-evidence.json"`
3. If the script exits with `1` (FAIL), you MUST HALT and fix your evidence. Do not output the final matrix.

## Mandatory Output Format: Cross-Validation Matrix
Once the Zero-Trust Gate passes, your final consultation output MUST include a markdown table that strictly maps Source B (Theory) against Source C (Codebase Reality).
