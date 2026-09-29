---
name: 'code-graph'
description: 'Run the Semantic Code Intelligence pipeline: scan files, analyze with LLM, merge graph, and update dashboard'
---

# /code-graph

Canonical workflow name for executing the Semantic Code Intelligence pipeline.

## Tiered Semantic Architecture

This workflow runs the multi-stage I-Wish Code Graph pipeline based on a dual-layer strategy:

### Tier 1: Bulk-Scan (Heuristic Engine)
Designed for massive initial ingestions without API costs or rate-limiting.
- **File Scanner**: Computes SHA-256 hashes to detect added/modified/deleted files.
- **Heuristic Analyzer (No API)**: Infers structural metadata (layer, complexity, basic tags) instantly using path-based and regex heuristics.

### Tier 2: Incremental & Targeted Update (LLM API)
Triggered to inject deep semantic understanding or resolve heuristic failures.
- **Semantic Analyzer (LLM)**: Analyzes files marked as `layer: unknown` or newly modified files (incremental updates) to generate rich, natural-language summaries and deep tags.

### Merging & Visualization
- **Graph Merger**: Resolves the graph adapter (FalkorDB, Neo4j, Memgraph, or lite-static) and merges technical structure with semantic metadata.
- **Dashboard Compilation**: Re-compiles the interactive `user-guide-dashboard.html` with the newly merged graph.

## Execution

To execute the standard incremental pipeline (Tier 2 enabled for changed files):
```bash
iwish code-graph
```

Options:
- `--fast`: **Tier 1 Mode**. Forces the Heuristic Engine for all files, bypassing the LLM API completely (ideal for initial bulk ingest).
- `--scan-only`: Runs the file scanner only, skipping both LLM analysis and merger.
- `--batch-size <size>`: Configures the batch size for LLM analysis (default is 10).

## Tier 1 Hybrid Update (Single Node Injection)

Đối với các node đơn lẻ, đặc biệt là các tài liệu sinh ra từ agent (Epics, Stories, PRDs, Review), **BẮT BUỘC** sử dụng Tier 1 Hybrid Update thay vì chạy toàn bộ pipeline. Lệnh này sẽ bypass `Semantic Analyzer` (LLM) và ghi trực tiếp vào metadata cache, sau đó trigger tự động Graph Merger:

```bash
iwish inject-node --file "<file_path>" --metadata '{"summary": "...", "tags": ["..."], "layer": "...", "complexity": "..."}'
```
