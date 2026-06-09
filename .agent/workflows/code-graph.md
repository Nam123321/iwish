---
name: 'code-graph'
description: 'Run the Semantic Code Intelligence pipeline: scan files, analyze with LLM, merge graph, and update dashboard'
---

# /code-graph

Canonical workflow name for executing the Semantic Code Intelligence pipeline.

## Execution

This workflow runs the multi-stage I-Wish Code Graph pipeline:
1. **File Scanner**: Computes SHA-256 hashes and detects added/modified/deleted/renamed files.
2. **Semantic Analyzer**: Extracts high-level summary, layer, complexity, and tags using the cheap LLM.
3. **Graph Merger**: Resolves the graph adapter (FalkorDB, Neo4j, Memgraph, or lite-static) and merges technical structure with semantic metadata.
4. **Dashboard Compilation**: Re-compiles the interactive `user-guide-dashboard.html` with the newly merged graph.

To execute this pipeline manually, run:
```bash
iwish code-graph
```

Options:
- `--scan-only`: Runs the file scanner only, skipping LLM analysis and merger.
- `--batch-size <size>`: Configures the batch size for LLM analysis (default is 10).

## Tier 1 Hybrid Update (Single Node Injection)

Đối với các node đơn lẻ, đặc biệt là các tài liệu sinh ra từ agent (Epics, Stories, PRDs, Review), **BẮT BUỘC** sử dụng Tier 1 Hybrid Update thay vì chạy toàn bộ pipeline. Lệnh này sẽ bypass `Semantic Analyzer` (LLM) và ghi trực tiếp vào metadata cache, sau đó trigger tự động Graph Merger:

```bash
iwish inject-node --file "<file_path>" --metadata '{"summary": "...", "tags": ["..."], "layer": "...", "complexity": "..."}'
```
