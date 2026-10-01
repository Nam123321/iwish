---
name: evaluate_regional_retrieval
description: Runs a versioned corpus-to-answer vertical tracer against defined regional language golden datasets to assess retrieval accuracy and fallback behaviors.
inputs:
  - golden_dataset: Path or identifier to regional language golden dataset.
  - corpus_version: The version identifier of the target corpus.
  - target_language: The target regional language code.
outputs:
  - accuracy_report: JSON report of accuracy metrics.
  - fallback_metrics: Analysis of fallback behaviors.
mcp_tools_required: []
subagent_triggers: []
---
# Evaluate Regional Retrieval Skill

## Purpose
This skill performs a deterministic assessment of a regional language corpus by tracing corpus-to-answer retrieval against predefined golden datasets. It quantifies retrieval accuracy and analyzes fallback behaviors when regional content is insufficient.

## Trigger
Use this skill when evaluating a new corpus version for regional language support, when assessing RAG accuracy in a specific language, or during CI/CD checks for localized knowledge updates.

## Execution
1. Ingest the specified `golden_dataset` and `corpus_version`.
2. For each query in the golden dataset, perform a retrieval against the corpus.
3. Compare the retrieved answers and documents against the golden standard.
4. Record occurrences of fallback behavior (e.g., falling back to English or base language when regional content is missing).
5. Compile precision, recall, and fallback trigger rates into an `accuracy_report`.

<agent-activation>
  <!-- Active agent capabilities go here -->
</agent-activation>
