---
description: 'Run comprehensive codebase health evaluation using CodeGraphContext — detect dead code, orphan files, circular dependencies, complexity hotspots, and duplicate symbols. Requires cgc index completed and FalkorDB running.'
---

# /codebase-health — Codebase Health Evaluation

> **Prerequisite:** CodeGraphContext đã được index (`FALKORDB_PORT=<PORT> cgc index`) và FalkorDB Docker đang chạy.
> **Persona:** architect-agent (Architect) + QA Guardian
> **Graph Profile Gate:** Load `.agent/fragments/graph-backend-selection-policy.md` before running. This workflow is fully trusted only when the CodebaseGraph surface is backed by `falkordb-full` or a custom adapter with `pass` for CodebaseGraph. In `lite-static` or unsupported custom modes, produce an advisory static-health report and label graph evidence unavailable.

---

## Step 1: Verify CodeGraph Ready

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n) RETURN count(n)"
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n:File) RETURN count(n)"
```

Nếu count = 0 → Chạy `FALKORDB_PORT=<PORT> cgc index --force .` trước.

---

## Step 2: Schema Discovery

Khám phá cấu trúc đồ thị hiện tại:

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n) RETURN DISTINCT labels(n) AS type, count(n) AS cnt ORDER BY cnt DESC"
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH ()-[r]->() RETURN DISTINCT type(r) AS rel, count(r) AS cnt ORDER BY cnt DESC"
```

Ghi kết quả vào report header.

---

## Step 2.5: Shell-Native Metrics (Supplements Graph DB)

Chạy các lệnh shell cơ bản để thu thập metric tĩnh bổ trợ cho Graph queries:

```bash
# Total file count by extension
echo "=== File Count by Extension ==="
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/dist/*' | sed 's/.*\.//' | sort | uniq -c | sort -rn

# Top 15 largest source files (likely god files / complexity hotspots)
echo "=== Top 15 Largest Files (by line count) ==="
find . -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/dist/*' -exec wc -l {} + | sort -rn | head -15

# Average lines per file
echo "=== Average Lines per File ==="
find . -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/dist/*' -exec wc -l {} + | awk 'END {if (NR>1) print "Total lines:", $1, "| Files:", NR-1, "| Avg:", int($1/(NR-1)); else print "No files found."}'
```

**Optional (if `cloc` is available):**
```bash
which cloc && cloc --json --exclude-dir=node_modules,.next,dist . | head -50
```

**Interpretation Guidelines:**
- Files > 500 lines → Flag as potential god files (cross-reference with Step 5 Graph hotspots).
- Average > 200 lines/file → Codebase may be under-modularized.
- Agent should use LLM estimation for cyclomatic complexity on top-5 flagged files (read the file and count branching paths mentally).

Ghi kết quả vào report dưới mục "Static Metrics".

---

## Step 3: Dead Code Detection

Tìm functions/classes không được gọi bởi bất kỳ ai:

```bash
# Dead Functions (không có ai CALLS)
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (f:Function) WHERE NOT ()-[:CALLS]->(f) AND f.name <> 'constructor' AND f.name <> 'default' RETURN f.name, f.path LIMIT 30"

# Dead Classes (không được IMPORTS)
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (c:Class) WHERE NOT ()-[:IMPORTS]->(c) AND NOT ()-[:CALLS]->(c) RETURN c.name, c.path LIMIT 20"
```

**Phân tích kết quả:**
- Functions chỉ exported nhưng không dùng → candidate xóa
- Classes chỉ defined nhưng không import → candidate xóa
- Loại trừ: entry points (main, handlers, controllers), test helpers

---

## Step 4: Orphan Files

Files không có relationship (import/export) với bất kỳ file nào khác:

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (f:File) WHERE NOT (f)-[:IMPORTS]->() AND NOT ()-[:IMPORTS]->(f) RETURN f.path LIMIT 30"
```

**Phân tích:**
- Standalone config files → bình thường
- `.ts`/`.tsx` files không import/export → likely dead code
- Test files không import production code → suspicious

---

## Step 5: Complexity Hotspots

Files có quá nhiều connections (high fan-in/fan-out → fragile code):

```bash
# Top 10 most connected files
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (f:File)-[r]-() RETURN f.path, count(r) AS connections ORDER BY connections DESC LIMIT 10"

# Top 10 files với nhiều functions nhất (god files)
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (f:File)-[:CONTAINS]->(fn:Function) RETURN f.path, count(fn) AS fn_count ORDER BY fn_count DESC LIMIT 10"
```

**Ngưỡng cảnh báo:**
- connections > 50 → 🔴 CRITICAL hotspot
- connections 30-50 → 🟡 WARNING
- fn_count > 15 → 🔴 God file, cần tách

---

## Step 6: Circular Dependencies

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH path = (a:File)-[:IMPORTS*2..4]->(a) RETURN [n in nodes(path) | n.path] LIMIT 10"
```

**Nếu tìm thấy circular deps:**
- Liệt kê chuỗi phụ thuộc vòng
- Đánh giá mức độ risk
- Đề xuất refactor: extract shared interface/module

---

## Step 7: Duplicate Symbols

Symbols (functions/classes) cùng tên xuất hiện ở nhiều nơi:

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n) WHERE n.name IS NOT NULL WITH n.name AS name, collect(n.path) AS paths, count(n) AS cnt WHERE cnt > 3 RETURN name, cnt, paths[0..3] ORDER BY cnt DESC LIMIT 15"
```

**Phân tích:**
- Cùng tên, khác implementation → potential inconsistency
- Cùng tên, cùng logic → extract to shared utility

---

## Step 8: Neo4j Enrichment & Automated Reporting (Day 2 Operations)

Run the Day 2 Operations analytics scripts to parse AST complexity, Git history (churn & coupling), enrich the `CodebaseGraph`, and automatically generate a markdown snapshot.

```bash
# 1. AST Complexity & Structural Heuristics
node .agent/scripts/day2-ops/ast-health.js

# 2. GitTree Analytics (Churn & Implicit Coupling)
node .agent/scripts/day2-ops/git-tree.js

# 3. Generate Markdown Snapshot
node .agent/scripts/day2-ops/generate-snapshot.js
```

Report will be saved to: `_iwish-output/health-reports/YYYY-MM-DD/health-report.md`
Review the output report to identify high-risk files.
```

---

## Step 9: CodeGraph Freshness Check

Kiểm tra xem codegraph có cần re-index không:

```bash
# So sánh file count trong graph vs file system
# ⚠️ CRITICAL: Exclusion list MUST match IGNORE_DIRS in mcp.json and .env
find ./distro -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" \
  -not -path "*/.git/*" -not -path "*/.turbo/*" -not -path "*/.swc/*" \
  -not -path "*/.expo/*" -not -path "*/.cache/*" -not -path "*/.github/*" \
  -not -path "*/coverage/*" -not -path "*/storybook-static/*" \
  -not -path "*/build/*" -not -path "*/out/*" | wc -l
```

So sánh với `File` count trong graph. Nếu chênh lệch > 10% → khuyến nghị `FALKORDB_PORT=<PORT> cgc index --force .`

---

## When to Run

| Trigger | Khuyến nghị |
|---------|------------|
| Đầu mỗi sprint | ✅ Bắt buộc (via `/sprint-planning` Step 5b) |
| Sau epic lớn hoàn thành | ✅ Bắt buộc (via `/retrospective` Step 7c) |
| Code review > 5 files | ✅ Tự động (via `/code-review` Step 1) |
| Sau `git pull` với major changes | ✅ Nên chạy |
| Khi nghi ngờ code quality | ✅ Nên chạy |

---

## ⚠️ KEY LEARNING — IGNORE_DIRS Consistency

> [!CAUTION]
> **Incident:** Lần index đầu tiên (trước fix) đã index cả `.next` → tạo hàng chục ngàn "rác" nodes.
> **Root cause:** IGNORE_DIRS không bao gồm tất cả build artifact dirs.
> **Fix:** Đồng bộ IGNORE_DIRS giữa `mcp.json`, `.env`, và tất cả `find` commands trong workflows.

**Khi re-index hoặc sửa IGNORE_DIRS, PHẢI kiểm tra 3 nơi:**

1. `distro/mcp.json` → `env.IGNORE_DIRS`
2. `distro/.env` → `IGNORE_DIRS`
3. Tất cả `find` commands trong workflows (phải match danh sách trên)

**Danh sách IGNORE_DIRS hiện tại (20 dirs):**
```
node_modules, venv, .venv, env, .env, dist, build, target, out,
.git, .idea, .vscode, __pycache__, .next, .turbo, .swc, .expo,
.cache, .github, coverage, storybook-static
```
