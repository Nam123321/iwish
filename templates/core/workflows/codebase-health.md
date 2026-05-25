---
description: 'Run comprehensive codebase health evaluation using CodeGraphContext — detect dead code, orphan files, circular dependencies, complexity hotspots, and duplicate symbols. Requires cgc index completed and FalkorDB running.'
---

# /codebase-health — Codebase Health Evaluation

> **Prerequisite:** CodeGraphContext đã được index (`cgc index`) và FalkorDB Docker đang chạy.
> **Persona:** Piccolo (Architect) + QA Guardian

---

## Step 1: Verify CodeGraph Ready

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n) RETURN count(n)"
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n:File) RETURN count(n)"
```

Nếu count = 0 → Chạy `cgc index --force .` trước.

---

## Step 2: Schema Discovery

Khám phá cấu trúc đồ thị hiện tại:

```bash
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH (n) RETURN DISTINCT labels(n) AS type, count(n) AS cnt ORDER BY cnt DESC"
docker exec distro-falkordb redis-cli GRAPH.QUERY codegraph "MATCH ()-[r]->() RETURN DISTINCT type(r) AS rel, count(r) AS cnt ORDER BY cnt DESC"
```

Ghi kết quả vào report header.

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

## Step 8: Generate Report

Tạo file report tại: `_bmad-output/codebase-health-report.md`

**Template:**
```markdown
# Codebase Health Report — [Date]

## Summary
| Metric | Value | Status |
|--------|-------|--------|
| Total Nodes | X | — |
| Total Files | X | — |
| Dead Functions | X | 🟢/🟡/🔴 |
| Orphan Files | X | 🟢/🟡/🔴 |
| Circular Deps | X | 🟢/🟡/🔴 |
| Hotspot Files (>50 connections) | X | 🟢/🟡/🔴 |
| God Files (>15 functions) | X | 🟢/🟡/🔴 |
| Duplicate Symbols (>3 occurrences) | X | 🟢/🟡/🔴 |

## Details
### Dead Code (Top 20)
[list]

### Orphan Files
[list]

### Hotspots
[list]

### Circular Dependencies
[list]

### Duplicate Symbols
[list]

## Recommendations
[based on findings]
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

So sánh với `File` count trong graph. Nếu chênh lệch > 10% → khuyến nghị `cgc index --force .`

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
