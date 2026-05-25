# Code Intelligence Pack

**Powered by GitNexus** — Transform your codebase into a knowledge graph for AI-powered dependency analysis, impact assessment, and architectural understanding.

## What's Included

### Workflows
- **`/analyze-codebase`** — Index codebase with GitNexus, verify MCP setup, validate key dependencies

### Workflow Patches (applied to Core workflows)
When this pack is installed, the following Core workflows gain GitNexus superpowers:

| Workflow | Enhancement |
|----------|-------------|
| `/code-review` | Pre-review `detect_changes` blast radius scan + `impact` dependency validation |
| `/dev-story` | Pre-implementation `context` query for module dependencies and call chains |
| `/fix-bug` | Phase 2: `context` query, Phase 3: call-chain trace for RCA, Phase 4: blast radius analysis |

## Prerequisites
```bash
npm install -g gitnexus
# or use via npx
npx gitnexus analyze
```

## Quick Start
1. Run `/analyze-codebase` to index your project
2. The patched workflows will automatically use GitNexus MCP tools when `.gitnexus/` directory is detected
3. No additional configuration needed — all steps are **conditional** (`nếu .gitnexus/ tồn tại`)

## MCP Tools Used
- `context()` — 360° symbol view (callers, callees, processes)
- `impact()` — Blast radius analysis (upstream/downstream)
- `detect_changes()` — Pre-commit change detection with risk level
- `query()` — Process-grouped code search
- `cypher()` — Raw graph queries for advanced analysis
