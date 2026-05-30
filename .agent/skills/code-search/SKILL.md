---
name: 'code-search'
description: 'Local hybrid semantic+lexical code search for agents using Semble (Model2Vec + BM25 + RRF). Provides search and find-related capabilities with 3-tier fallback: CLI → uvx → grep_search.'
inputs:
  - query: 'Natural language or code query string'
  - path: 'Local directory path to index and search (default: project root)'
  - top_k: 'Number of results to return (default: 5)'
  - content: 'Content types to index: code, docs, config, all (default: code)'
outputs:
  - results: 'JSON list of relevant code chunks containing file_path, start_line, end_line, content, and score'
mcp_tools_required: []
subagent_triggers: []
---

# 🔍 Code Search Skill

## 📌 Overview
This skill provides **high-precision, local, hybrid code search** for I-Wish agents using [Semble](https://github.com/MinishLab/semble). It combines:
- **Model2Vec** (semantic vector search) — understands intent and meaning
- **BM25** (lexical keyword search) — exact term matching
- **RRF** (Reciprocal Rank Fusion) — combines both for optimal recall
- **Code-aware reranking** — boosts definitions, penalizes tests/legacy

All processing runs **locally on CPU** with no external API calls required.

---

## 🛠️ Usage Guidelines

### When to Use This Skill
- When an agent needs to find relevant code for a story or task
- When searching for implementations of a concept described in natural language
- When looking for all call-sites of a function/class (use `find-related`)
- When building context for a dev-agent prompt

### When NOT to Use
- For simple filename searches → use `list_dir` or `find`
- For exact string matching → use `grep_search`
- For AST-level analysis → use `analyze-codebase` / CGC

---

## 🚀 Execution Modes (3-Tier Fallback)

### Tier 1: Direct CLI (Preferred)
If `semble` is installed globally or in the project venv:
```bash
# Search
semble search "<query>" <path> --top-k <top_k> --content code

# Find related code
semble find-related <file_path> <line_number> <path> --top-k <top_k>
```

### Tier 2: uvx Fallback
If `semble` is not installed but `uvx` is available:
```bash
# Search via uvx
uvx --from semble semble search "<query>" <path> --top-k <top_k>

# Find related via uvx
uvx --from semble semble find-related <file_path> <line_number> <path> --top-k <top_k>
```

### Tier 3: grep_search Fallback
If neither `semble` nor `uvx`/Python is available:
```
⚠️ WARNING: Semantic search unavailable. Using lexical grep_search as fallback.
Results will be less relevant for natural-language queries.
```
Use the built-in `grep_search` tool with the query string. Format results to match the standard output contract.

---

## 📋 Output Contract
All tiers return a unified JSON structure:
```json
{
  "query": "<original query>",
  "engine": "semble|uvx|grep_search",
  "results": [
    {
      "file_path": "src/auth/handler.ts",
      "start_line": 42,
      "end_line": 68,
      "content": "// code content here...",
      "score": 0.85
    }
  ]
}
```

---

## 🔧 Scripts

### Shell Wrapper
Use `scripts/code-search-wrapper.sh` for direct CLI invocation:
```bash
# Usage
bash .agent/skills/code-search/scripts/code-search-wrapper.sh search "<query>" <path> [--top-k 5]
bash .agent/skills/code-search/scripts/code-search-wrapper.sh find-related <file> <line> <path> [--top-k 5]
```

### Python Bridge
Use `scripts/code-search.py` for programmatic access:
```bash
python3 .agent/skills/code-search/scripts/code-search.py --query "<query>" --path <path> --top-k 5
python3 .agent/skills/code-search/scripts/code-search.py --find-related --file <file> --line <line> --path <path>
```

---

## 🚦 Agent Instructions

### For dev-agent:
1. Before implementing a task, use this skill to find relevant existing code.
2. Include the top 3-5 results as context in your working memory.
3. Prefer `search` for concept-level queries, `find-related` for call-site discovery.

### For orch-agent:
1. Use this skill via the `cross-story-scanner` to detect parallel conflicts.
2. Feed results into `story-chunk-injector` for dev-agent context enrichment.

### For review-agent:
1. Use `find-related` to verify all call-sites are updated after a refactor.
2. Feed results into `merge-audit-hook` for pre-merge validation.

---

## 🧪 Verification Checklist
- [ ] Run: `bash scripts/code-search-wrapper.sh search "authentication" .` → JSON output
- [ ] Run: `python3 scripts/code-search.py --query "save model" --path .` → JSON output
- [ ] Test Tier 2: Rename `semble` binary, verify uvx fallback activates
- [ ] Test Tier 3: In a no-Python env, verify grep_search fallback with WARNING
- [ ] Verify output schema matches the Output Contract above

---

## 📊 Performance Characteristics
| Metric | Value |
|--------|-------|
| First-run indexing | ~2-5s (medium repo, ~1000 files) |
| Cached search | ~200-500ms |
| Memory usage | ~50-100MB (Model2Vec is lightweight) |
| CPU only | ✅ No GPU required |
| Token savings | ~90% vs reading entire files |
