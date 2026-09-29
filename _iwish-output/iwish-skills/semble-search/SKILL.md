---
name: 'semble-search'
description: 'Local semantic and lexical hybrid code-search utility for agents using Semble.'
inputs:
  - query: 'Natural language or code query string'
  - path: 'Local directory path to index and search'
  - top_k: 'Number of results to return (default: 5)'
outputs:
  - chunks: 'JSON list of relevant code chunks containing content, file_path, start_line, and end_line'
mcp_tools_required:
  - 'semble/search'
  - 'semble/find_related'
subagent_triggers: []
---

# 🔍 Semble Search Skill

## 📌 Overview
This skill implements the **Semble Hybrid Search** utility. It allows agents to perform token-efficient, local, high-precision codebase searches on CPU using vector embeddings (Model2Vec) and BM25.

---

## 🛠️ Usage Guidelines

### CLI Mode
If the `semble` CLI is installed on the host machine:
```bash
semble search "<query>" <path> --top-k <top_k>
```
If not installed, fall back to running it via `uvx`:
```bash
uvx --from "semble[mcp]" semble search "<query>" <path> --top-k <top_k>
```

### MCP Mode
If `semble` is registered as an MCP server, query the server directly:
```json
// Tool: search
{
  "query": "authentication handling",
  "repo": "/Users/.../my-project",
  "top_k": 5
}
```

---

## 🚦 Verification Checklist
- [ ] Verify `semble` or `uvx` is available on shell.
- [ ] Run a test query: `semble search "save model" .` or check MCP server logs.
- [ ] Ensure results are returned as a JSON array of snippets.
