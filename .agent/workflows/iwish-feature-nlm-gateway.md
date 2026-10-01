# NotebookLM Master Gateway Implementation

This document defines the implementation specifications for the `/nlm` Master Router. Do not execute this file linearly. Only execute the specific section requested by the `.agent/workflows/nlm.md` entrypoint.

---

## Section: PUSH
**Objective:** Safely validate and push new knowledge sources into the correct NotebookLM node.

1. **Initialize Registry Manager:** Load the `notebook-registry-manager` skill.
2. **Lookup Target:** Identify the target notebook for the push operation by querying `_iwish-output/notebooks/domain-taxonomy.yaml` and `notebook-registry.yaml`.
3. **Quality Gate Validation:**
   - Load `notebook-quality-gate`.
   - Validate the source document for readability, information density, and format compatibility.
   - If the source fails the gate, halt and request user clarification or format conversion.
4. **Request Engineering:**
   - Load `notebook-request-engineer`.
   - Select the appropriate push template based on the source type (e.g., Code, PRD, Technical Doc).
   - Format the payload.
5. **Execution:**
   - Invoke the `notebooklm-mcp` tools (e.g., `source_add` or equivalent) to push the data.
   - Verify success and log the new source ID in the local registry (if applicable).
6. **Completion:** Provide a brief success summary to the user.

---

## Section: PULL
**Objective:** Extract specific knowledge or insights from a target notebook or cross-notebook queries.

1. **Initialize Registry Manager:** Load the `notebook-registry-manager` skill.
2. **Lookup Target:** Identify the target notebook(s) relevant to the query.
3. **Retrieval Engine Setup:**
   - Load `notebook-retrieval-engine`.
   - Formulate the precise query prompt based on the user's intent.
4. **Execution & Cross-Query:**
   - Query the target notebook using `notebook_query` or `notebook_query_start`.
   - Load `notebook-cross-query-engine`.
   - If the request requires synthesis across domains (e.g., UI spec vs Data spec), execute a cross-query backbone request linking the primary notebook with its PC-1/PC-2 dependencies.
5. **Completion:** Format the extracted knowledge into a structured markdown report and present it to the user.

---

## Section: SYNC
**Objective:** Batch synchronize local files to their respective NotebookLM nodes to maintain parity.

1. **Initialize Lifecycle Manager:** Load the `notebook-lifecycle-manager` skill.
2. **Check Sync Sources:** Review the tracked files defined in `sync_sources` within the local registry.
3. **Batch Sync:**
   - Identify files that have been modified since the `last_synced` timestamp.
   - Use `notebook_share_batch` or a series of `source_sync_drive`/`source_add` calls to update the notebooks.
4. **Completion:** Update the `last_synced` timestamp in the registry and report the number of files synced.

---

## Section: STATUS
**Objective:** Provide a quick overview of the local NotebookLM registry and foundation health.

1. **Initialize Registry Manager:** Load the `notebook-registry-manager` skill.
2. **Registry Summary:** Parse and summarize `_iwish-output/notebooks/notebook-registry.yaml`.
   - Display total notebooks.
   - Display active domains.
3. **Foundation Status:**
   - Parse `_iwish-output/notebooks/foundation-checklist.yaml`.
   - Show the completion status of the core foundation notebooks.
4. **Completion:** Present the formatted summary to the user.

---

## Section: FOUNDATION
**Objective:** Validate that the required foundational notebooks exist and are properly configured.

1. **Initialize Lifecycle Manager:** Load the `notebook-lifecycle-manager` skill.
2. **Run Foundation Gate Check:**
   - Verify the presence of the 14 standard foundation notebooks listed in the foundation checklist.
   - Check if they are mapped correctly in the registry.
3. **Report:**
   - Generate a detailed compliance report.
   - Flag any missing foundation notebooks and recommend running `/nlm-setup` if significant gaps are found.

---

## Section: RECURSIVE
**Objective:** Execute a multi-turn deep dive into a notebook using Precision Mode for complex topics.

1. **Initialize Retrieval Engine:** Load the `notebook-retrieval-engine` skill.
2. **Activate Precision Mode (Notes Recursive):**
   - Execute Round 1: Broad query to identify key entities, sources, or citations.
   - Analyze Round 1 results to formulate a highly targeted Round 2 query.
   - Execute Round 2: Deep dive into the specific entities identified.
   - **Constraint:** Maximum 2 rounds to prevent context exhaustion and looping.
3. **Completion:** Synthesize the recursive findings into a final comprehensive report.
