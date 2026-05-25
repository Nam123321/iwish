---
description: Index codebase into a knowledge graph using CodeGraphContext (CGC) or GitNexus for dependency analysis, impact analysis, and architectural understanding. Run this once per project (auto-updates on save). Gives AI agents deep codebase awareness.
---

# `/analyze-codebase` Workflow

**Persona:** Grand-Priest (Master Orchestrator) + Piccolo (Architect)

---

## Step 0: Choose Code Intelligence Backend

> [!IMPORTANT]
> Dự án PHẢI chọn 1 trong 2 backend bên dưới. Cả hai đều tạo knowledge graph cho codebase, nhưng dùng tool và cấu hình khác nhau.

| Tiêu chí | Option A: CodeGraphContext (CGC) | Option B: GitNexus |
|-----------|----------------------------------|---------------------|
| **Install** | `pip3 install codegraphcontext` | `npm install -g gitnexus` |
| **Backend** | FalkorDB (Docker) hoặc KùzuDB | LadybugDB (built-in) |
| **Index** | `cgc index .` | `npx gitnexus analyze` |
| **MCP Tools** | `find_callers`, `find_callees`, `find_call_chain`, `search`, `get_file_symbols`, `add_code_to_graph` | `context`, `impact`, `detect_changes`, `query`, `cypher` |
| **Auto-watch** | ✅ `ENABLE_AUTO_WATCH=true` (watchdog) | ❌ Manual re-index |
| **IGNORE_DIRS** | ⚠️ CRITICAL — phải sync với `.gitignore` | Tự động từ `.gitignore` |
| **Best for** | Python/TS/JS projects cần granular symbol tracking | Node.js projects cần cluster/process analysis |

---

## Option A: CodeGraphContext (CGC) + FalkorDB

### Prerequisites
- Python 3.9+: `python3 --version`
- CodeGraphContext: `pip3 install codegraphcontext`
- FalkorDB Docker (recommended over redislite):
  ```bash
  docker run -d --name falkordb -p 6379:6379 -v falkordb-data:/data falkor/falkordb:latest
  ```

> [!CAUTION]
> **Key Learning:** `redislite` bundles ARM-only redis binary → fails on Intel Macs ("Bad CPU type in executable"). Luôn dùng FalkorDB Docker cho cross-platform compatibility.

### Step A1: Index the Codebase
```bash
cgc index --force .
```

> [!WARNING]
> **IGNORE_DIRS MUST be comprehensive!** Lần index đầu tiên trên Light DMS đã index cả `.next/` → tạo 80,000+ garbage nodes. Chạy `scripts/sync-ignore-dirs.sh` TRƯỚC khi index.

Kiểm tra IGNORE_DIRS ở 3 nơi — TẤT CẢ phải sync:
1. `mcp.json` → `env.IGNORE_DIRS`
2. `.env` → `IGNORE_DIRS`
3. Tất cả `find` commands trong workflows

### Step A2: Verify the Index
```bash
# Check node count
docker exec <falkordb-container> redis-cli GRAPH.QUERY codegraph "MATCH (n) RETURN count(n)"

# Check file count
docker exec <falkordb-container> redis-cli GRAPH.QUERY codegraph "MATCH (n:File) RETURN count(n)"
```

### Step A3: Quick Test — Find Callers
```bash
cgc find callers OrderService.create
cgc find callees AuthGuard.canActivate
```

### Step A4: Setup MCP Server
```bash
cgc mcp setup
```
Hoặc cấu hình thủ công trong MCP config:
```json
{
  "mcpServers": {
    "codegraphcontext": {
      "command": "cgc",
      "args": ["mcp", "start"],
      "env": {
        "FALKORDB_HOST": "localhost",
        "FALKORDB_PORT": "6379",
        "ENABLE_AUTO_WATCH": "true",
        "IGNORE_DIRS": "node_modules,venv,.venv,env,.env,dist,build,target,out,.git,.idea,.vscode,__pycache__,.next,.turbo,.swc,.expo,.cache,.github,coverage,storybook-static"
      }
    }
  }
}
```

### Step A5: Enable Auto-Watch + IGNORE_DIRS Sync
```bash
# Tạo/copy script đồng bộ IGNORE_DIRS
chmod +x scripts/sync-ignore-dirs.sh

# Kiểm tra sync
./scripts/sync-ignore-dirs.sh --check

# Auto-update nếu lệch
./scripts/sync-ignore-dirs.sh --update-mcp
```

### Step A6: Validate Key Dependencies
```
find_callers("OrderService.create")
find_callees("CtkmEvaluationService.evaluate")
find_call_chain("AuthGuard.canActivate", depth=3)
```

### Step A7: Run First Codebase Health Check
```
Chạy /codebase-health để thiết lập baseline metrics.
```

---

## Option B: GitNexus

### Prerequisites
- Node.js 18+
- GitNexus CLI: `npm install -g gitnexus` hoặc dùng `npx`

### Step B1: Index the Codebase
```bash
npx gitnexus analyze
```
Tạo thư mục `.gitnexus/` chứa knowledge graph (LadybugDB).

### Step B2: Verify the Index
```bash
npx gitnexus list
```

### Step B3: Setup MCP Server
```bash
npx gitnexus setup
```
Hoặc cấu hình thủ công:
```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus", "serve", "--mcp"]
    }
  }
}
```

### Step B4: Quick Architectural Overview
```
gitnexus://repo/{name}/clusters
gitnexus://repo/{name}/processes
gitnexus://repo/{name}/schema
```

### Step B5: Validate Key Dependencies
```
impact({target: "OrderService", direction: "upstream", maxDepth: 3})
impact({target: "AuthGuard", direction: "downstream", maxDepth: 2})
```

---

## Auto-Update Strategy (CGC only)

> [!IMPORTANT]
> Auto-watch là Layer 1 only. PHẢI kết hợp với Layer 2 và Layer 3.

| Layer | Cơ chế | Owner | Khi nào |
|-------|--------|-------|---------|
| Layer 1 | `ENABLE_AUTO_WATCH=true` (watchdog) | System (automatic) | Realtime — khi file thay đổi |
| Layer 2 | `add_code_to_graph("<file>")` per file | **Vegeta** (Dev Agent) | Cuối `/dev-story` và `/fix-bug` |
| Layer 3 | `cgc index --force .` full re-index | **Master Roshi** (SM) | Đầu sprint (`/sprint-planning`) và cuối epic (`/retrospective`) |
| IGNORE_DIRS sync | `sync-ignore-dirs.sh --check` | **Master Roshi** (SM) | Đầu mỗi sprint |

---

## When to Re-run Full Index

| Trigger | Backend | Khuyến nghị |
|---------|---------|-------------|
| Sau `git pull` với major changes | Both | ✅ Nên chạy |
| Sau thêm modules/packages mới | Both | ✅ Nên chạy |
| Đầu mỗi sprint | CGC | ✅ Bắt buộc (via `/sprint-planning` Step 5b) |
| Sau epic hoàn thành | CGC | ✅ Bắt buộc (via `/retrospective` Step 7c) |
| Graph DB bị corrupt | CGC | `cgc clean` rồi `cgc index` |
| `.gitnexus/` bị xóa | GitNexus | `npx gitnexus analyze` |

---

## Integration with Other Workflows

Workflow này là **prerequisite** cho tất cả các capabilities sau:

| Workflow | Enhancement | Backend |
|----------|-------------|---------|
| `/code-review` | Pre-review blast radius scan (>5 files → auto `/codebase-health`) | Both |
| `/dev-story` | Context-aware development + auto graph refresh (Layer 2) | Both |
| `/fix-bug` | RCA call-chain trace + blast radius analysis + auto refresh | Both |
| `/sprint-planning` | IGNORE_DIRS sync + freshness check + re-index gate | CGC only |
| `/retrospective` | Full health check + re-index at epic boundary | CGC only |
| `/codebase-health` | 9-step health evaluation (dead code, orphans, hotspots, circular deps) | CGC only |

---

## CGC MCP Tools Reference

| Tool | Purpose | Example |
|------|---------|---------|
| `find_callers(symbol)` | Who calls this? | `find_callers("AuthGuard")` |
| `find_callees(symbol)` | What does this call? | `find_callees("OrderService.create")` |
| `find_call_chain(symbol, depth)` | Full upstream/downstream | `find_call_chain("validate", 3)` |
| `search(pattern)` | Search across graph | `search("payment")` |
| `get_file_symbols(path)` | Symbols in a file | `get_file_symbols("order.service.ts")` |
| `add_code_to_graph(path)` | Update graph for 1 file | `add_code_to_graph("src/order.ts")` |

## GitNexus MCP Tools Reference

| Tool | Purpose | Example |
|------|---------|---------|
| `context()` | 360° symbol view | `context({symbol: "AuthGuard"})` |
| `impact()` | Blast radius analysis | `impact({target: "OrderService"})` |
| `detect_changes()` | Pre-commit change detection | `detect_changes()` |
| `query()` | Process-grouped search | `query({text: "payment"})` |
| `cypher()` | Raw graph queries | `cypher({query: "MATCH ..."})` |
