# Knowledge: CodeGraphContext Integration — Key Learnings & Best Practices

> **Date:** 2026-03-21  
> **Context:** Light DMS project — First production deployment of CodeGraphContext (CGC) with I-Wish framework  
> **Status:** Active — apply to all future projects using CGC

---

## 1. Architecture Decision

**Tool:** CodeGraphContext (`cgc`) via `pip install codegraphcontext`  
**Backend:** FalkorDB (Docker) — chosen over `redislite` due to Intel Mac architecture incompatibility  
**Graph:** `codegraph` — stores Functions, Classes, Imports, Variables, Files and their relationships  

### Why FalkorDB Docker?
- `redislite` bundles ARM-only redis binary → fails on Intel Macs ("Bad CPU type in executable")
- FalkorDB Docker works on all architectures
- Persistent volume (`falkordb-data`) survives container restarts

---

## 2. Critical Key Learnings

### KL-1: IGNORE_DIRS Must Be Comprehensive

> [!CAUTION]
> **Incident:** First index on Light DMS indexed `.next/` build output → created 80,000+ garbage nodes (vs 28,420 real nodes).  
> **Root cause:** IGNORE_DIRS only had default list, missing project-specific artifact dirs.  
> **Impact:** Graph queries returned noise, dead code detection was meaningless.

**Fix applied:** Created `scripts/sync-ignore-dirs.sh` that automatically extracts directory patterns from `.gitignore` → syncs to `IGNORE_DIRS` in `mcp.json` and `.env`.

**Rule:** `.gitignore` is the single source of truth for artifact dirs. IGNORE_DIRS must be derived from it, not maintained separately.

### KL-2: IGNORE_DIRS Lives in 3 Places — All Must Sync

| Source | Purpose | Format |
|--------|---------|--------|
| `mcp.json` → `env.IGNORE_DIRS` | CGC MCP server config | Comma-separated |
| `.env` → `IGNORE_DIRS` | CGC CLI config | Comma-separated |
| `find` commands in workflows | Freshness check comparison | `-not -path "*/dir/*"` |

**If any of these 3 are out of sync, either re-index will ingest garbage or freshness checks will report false positives.**

### KL-3: ENABLE_AUTO_WATCH Is Not Enough

`ENABLE_AUTO_WATCH=true` in `mcp.json` enables real-time file watching via `watchdog`. However:
- If Antigravity crashes/restarts → watchdog process dies → no more updates
- `watchdog` only watches while MCP server is running — gaps between sessions
- Large refactors (rename files, move dirs) may confuse incremental updates

**Rule:** Auto-watch is Layer 1 only. Must combine with:
- Layer 2: Workflow-triggered `add_code_to_graph` after every dev-story/fix-bug
- Layer 3: Scheduled full re-index (`cgc index --force .`) at sprint boundaries

### KL-4: Re-index After Antigravity Crash

> [!WARNING]
> If Antigravity crashes mid-session, `cgc index` progress is lost — indexing does NOT resume from where it stopped.

**Fix:** Use `nohup` for long-running indexes:
```bash
nohup /path/to/cgc index --force . > /tmp/cgc-index.log 2>&1 &
```
Monitor: `docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n) RETURN count(n)"`

### KL-5: Graph Freshness Check Formula

```
freshness_ratio = graph_file_count / filesystem_file_count
if ratio < 0.9 or ratio > 1.1 → STALE, needs re-index
```

The filesystem count **MUST** use the same exclusion list as IGNORE_DIRS, or the comparison is meaningless.

---

## 3. Workflow Integration Map

### Workflows That USE CodeGraph (Read):

| Workflow | What It Uses | Step |
|----------|-------------|------|
| `/code-review` | `find_callers` blast radius | Step 1 |
| `/code-review` | `/codebase-health` for >5 file PRs | Step 1 (nested) |
| `/dev-story` | `find_callers`/`find_callees` context | Step 2 |
| `/fix-bug` | `find_callers`/`find_callees`/`find_call_chain` for RCA | Phase 2 (8d), Phase 3 (9b), Phase 4 (14c) |

### Workflows That UPDATE CodeGraph (Write):

| Workflow | What It Does | Step |
|----------|-------------|------|
| `/dev-story` | `add_code_to_graph` for changed files | Step 10 (end) |
| `/fix-bug` | `add_code_to_graph` for fixed files | Phase 7 (23b) |
| `/sprint-planning` | IGNORE_DIRS sync + freshness check + full re-index | Step 5b |
| `/retrospective` | Full health check + re-index if stale | Step 7c |

### Ownership:

| Layer | Mechanism | Owner |
|-------|-----------|-------|
| Layer 1: Auto-watch | `ENABLE_AUTO_WATCH=true` | System (automatic) |
| Layer 2: Workflow-trigger | `add_code_to_graph` per file | Dev agent |
| Layer 3: Scheduled re-index | `cgc index --force .` at sprint boundaries | SM agent |
| IGNORE_DIRS sync | `sync-ignore-dirs.sh --check` | SM agent (sprint start) |

---

## 4. I-Wish-DragonBall: New Artifacts Created

### New Workflow:
- **`/codebase-health`** — 9-step codebase health evaluation (dead code, orphan files, hotspots, circular deps, duplicates)

### New Script:
- **`scripts/sync-ignore-dirs.sh`** — Auto-sync IGNORE_DIRS from .gitignore

### Modified Workflows:
- `/dev-story` — Added CGC refresh step (Layer 2)
- `/fix-bug` — Added CGC refresh step (Layer 2)
- `/sprint-planning` — Added Step 5b: IGNORE_DIRS sync + CGC health gate (Layer 3)
- `/retrospective` — Added Step 7c: Codebase health check + re-index (Layer 3)
- `/code-review` — Added large-change gate (>5 files → orphan/dead code check)

### Modified Config:
- `mcp.json` — `ENABLE_AUTO_WATCH=true`, expanded IGNORE_DIRS
- `.env` — Synced IGNORE_DIRS

---

## 5. Research Recommendations for I-Wish-DragonBall

> [!IMPORTANT]
> The key learnings from CodeGraph integration with Antigravity should be evaluated for applicability with other AI tools and IDEs.

### 5.1 Cross-Tool IGNORE_DIRS Consistency
Different AI tools may have different mechanisms for excluding dirs:
- **Cursor AI** — `.cursorignore` file
- **GitHub Copilot** — respects `.gitignore` natively
- **Windsurf** — `.windsurfignore` file
- **Cline** — `.clineignore` file

**Research question:** Can `sync-ignore-dirs.sh` be extended to sync across ALL ignore files? Should I-Wish standardize on `.gitignore` as the single source, with tool-specific files auto-generated?

### 5.2 CodeGraph Portability
- Does CGC graph export/import work across machines? (Team sharing)
- Can the FalkorDB Docker be included in the project's `docker-compose.yml` as standard?
- Should I-Wish mandate CodeGraph as part of project scaffolding?

### 5.3 Alternative Graph Tools
- **Sourcegraph SCIP** — CGC supports `SCIP_INDEXER=true` for richer indexing
- **Tree-sitter** — Used by Cursor/Copilot internally for code understanding
- **Language Server Protocol (LSP)** — Provides similar call hierarchy info

**Research question:** Should I-Wish integrate with multiple code intelligence backends, or standardize on CGC?

### 5.4 CI/CD Integration
- Run `cgc index --force .` in CI pipeline after merge to main
- Share FalkorDB graph via cloud-hosted instance for team access
- Gate PRs on codebase-health metrics (no new dead code, no new circular deps)

---

## 6. Checklist for New Projects Using CodeGraph

- [ ] Add FalkorDB to `docker-compose.yml`
- [ ] Configure `mcp.json` with `FALKORDB_HOST`, `FALKORDB_PORT`
- [ ] Run initial `cgc index --force .`
- [ ] Verify IGNORE_DIRS covers all artifact dirs
- [ ] Create/copy `scripts/sync-ignore-dirs.sh`
- [ ] Verify `/codebase-health` workflow is available
- [ ] Enable `ENABLE_AUTO_WATCH=true`
- [ ] Run first `/codebase-health` to establish baseline
