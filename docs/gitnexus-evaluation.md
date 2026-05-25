# 🐉 Hội đồng Đánh giá: GitNexus & Code Intelligence Solutions

> **Chủ toạ:** Grand-Priest (BMAD Master)  
> **Thành viên:** Piccolo (Architect), Bulma (Analyst), Vegeta (Dev), Tien-Shinhan (QA)  
> **Ngày:** 2026-03-18

---

## 1. GitNexus là gì? (Tóm tắt Bulma — Analyst)

GitNexus là **Code Intelligence Engine** biến codebase thành **Knowledge Graph** với các đặc điểm:

| Thuộc tính | Chi tiết |
|---|---|
| **Core tech** | Tree-sitter AST + LadybugDB (graph DB) + Vector embeddings |
| **Triết lý** | "Precomputed Relational Intelligence" — index sẵn dependency, cluster, call chain |
| **Deployment** | Zero-server (chạy client-side browser WASM, hoặc CLI local) |
| **MCP** | 7 tools: `query`, `context`, `impact`, `detect_changes`, `rename`, `cypher`, `list_repos` |
| **13 ngôn ngữ** | TypeScript, JS, Python, Java, Go, Rust, C/C++, C#, Ruby, PHP, Kotlin, Swift |
| **Key features** | Impact Analysis (blast radius), 360° Symbol View, Process-Grouped Search, Pre-commit Change Detection, Multi-file Rename, Wiki Generation |

### Pain Points GitNexus giải quyết
1. **AI agent không hiểu kiến trúc** — Cursor/Claude/Antigravity chỉ thấy file đang mở, không biết 47 function khác phụ thuộc vào function đang sửa.
2. **Breaking changes vô tình** — Sửa return type mà không biết downstream consumer.
3. **Token waste** — LLM phải hỏi 4-10 lần mới hiểu dependency graph. GitNexus trả về 1 lần.
4. **Model nhỏ cũng hiểu được** — Vì "heavy lifting" đã được precomputed.

---

## 2. Các Giải pháp Thay thế (Khảo sát Piccolo — Architect)

| Tool | Cách tiếp cận | MCP? | Ưu điểm | Nhược điểm |
|---|---|---|---|---|
| **GitNexus** | Graph DB local (LadybugDB), precomputed | ✅ | Nhanh, offline, 13 ngôn ngữ | Mới (v0.x), community nhỏ |
| **Code Graph (FalkorDB)** | FalkorDB graph DB, cloud-hosted | ✅ | Enterprise, team support | Cần server, phí cloud |
| **Code-Graph-RAG** | Memgraph + Tree-sitter | ✅ MCP | Multi-repo monorepo focus | Cần Memgraph server |
| **Augment Code** | Context Engine, large-scale | ❌ | Xử lý codebase cực lớn | SaaS đóng, không self-hosted |
| **Fondamenta ArchCode** | Static analysis → Markdown | ❌ | Nhẹ nhất, LLM-native | Không có graph query, limited |
| **Sourcegraph Cody** | Cross-repo search | ❌ | Enterprise, proven | Nặng, phí cao |
| **Neo4j + Custom** | Tự build graph pipeline | ❌ | Flexible nhất | Tốn effort tự build |

> **Kết luận Piccolo:** GitNexus là giải pháp **tốt nhất cho solo/small team** nhờ zero-server + MCP native. FalkorDB Code Graph là lựa chọn enterprise. Fondamenta ArchCode là fallback nhẹ nhất.

---

## 3. Phù hợp với DMS không? (Phân tích Vegeta — Dev)

### ✅ Phù hợp cao cho DMS
- **DMS là monorepo NestJS + Next.js** (TypeScript) → GitNexus hỗ trợ tốt TS/JS.
- **Codebase đang phình to** (API modules, Admin, Webstore, Sales App, Shared packages) → Càng lớn càng cần knowledge graph.
- **AI features (Epic 7)** đang thêm nhiều service mới → Impact analysis giúp tránh phá cascade.
- **Multi-dev scenario** — Nếu có thêm dev, ai cũng cần hiểu dependency nhanh.

### ⚠️ Giới hạn cần lưu ý
- GitNexus focus vào **code-level dependency** (function calls, imports). Nó **KHÔNG** quản lý:
  - **Feature-level mapping** (Epic → Story → Task)
  - **Business logic dependency** (Order depends on Inventory depends on Product)
  - **Data flow** (API → Service → Prisma → DB)
- Nghĩa là: GitNexus bổ sung cho BMAD, **không thay thế** BMAD's feature management.

### 🎯 Điểm mạnh cụ thể cho DMS

```
# Ví dụ thực tế: Đang sửa OrderService
gitnexus impact --target OrderService --direction upstream

→ Trả về:
  - 12 controllers phụ thuộc
  - 3 scheduled jobs gọi tới
  - 2 Zalo message templates dùng order data
  - Risk level: HIGH
```

---

## 4. Nên đưa vào BMAD-DragonBall không? (Quyết định Grand-Priest)

### ✅ CÓ, nhưng đưa vào **Library** (không phải Core)

| Quyết định | Chi tiết |
|---|---|
| **Vị trí** | `library/code-intelligence-pack/` |
| **Lý do không vào Core** | Không phải project nào cũng cần graph indexing. Project nhỏ dưới 20 file không cần. |
| **Tích hợp vào workflow nào** | `/code-review`, `/dev-story`, `/fix-bug`, `/create-architecture` |
| **Dạng tích hợp** | Thêm MCP server config + 1 workflow mới `/analyze-codebase` |

### Đề xuất Workflow mới: `/analyze-codebase`

```
Bước 1: Chạy `gitnexus analyze` trên project
Bước 2: Agent dùng MCP tools (impact, context, detect_changes)
Bước 3: Trước khi code-review → tự động chạy detect_changes
Bước 4: Trước khi dev-story → agent query context cho module liên quan
```

### Đề xuất tích hợp vào workflow hiện có

| Workflow | Tích hợp GitNexus |
|---|---|
| `/code-review` (Tien-Shinhan) | Tự động chạy `detect_changes` trước review, check blast radius |
| `/dev-story` (Vegeta) | Trước khi code, query `context` cho module đang sửa |
| `/fix-bug` (SBRP) | Phase RCA: dùng `impact` để trace root cause qua call chain |
| `/create-architecture` (Piccolo) | Dùng `cypher` queries để map current architecture |

---

## 5. Đánh giá Tien-Shinhan (QA) — Rủi ro

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| GitNexus còn mới (v0.x) | 🟡 Medium | Dùng song song, không phụ thuộc hoàn toàn |
| Index time cho repo lớn | 🟢 Low | Incremental indexing đang được build |
| Privacy — code có rời máy không? | 🟢 None | Zero-server, 100% local |
| Lock-in | 🟢 None | Open-source MIT |

---

## 6. Phán quyết Hội đồng

| Tiêu chí | Kết quả |
|---|---|
| **Giải quyết pain point thực?** | ✅ Có — AI agent thiếu context kiến trúc là vấn đề thực |
| **Phù hợp DMS?** | ✅ Cao — TypeScript monorepo, đang scale |
| **Đưa vào BMAD Core?** | ❌ Không — Nên là Library pack |
| **Đưa vào BMAD Library?** | ✅ Có — Tạo `code-intelligence-pack` |
| **Ưu tiên so với task khác?** | 🟡 Medium — Pilot trước, không blocking |
| **Giải pháp thay thế tốt hơn?** | ❌ GitNexus hiện tại là best-in-class cho solo/small team |

### 🎬 Next Action
1. Cài `npm install -g gitnexus` và chạy `gitnexus analyze` trên DMS repo để pilot.
2. Nếu hiệu quả → tạo `library/code-intelligence-pack/` trong BMAD-DragonBall.
3. Viết workflow `/analyze-codebase` và patch `/code-review`, `/dev-story`.
