# Epic 6 & 7: AI Database & Knowledge Base Upgrade — Reference Document

**Authors:** Shinji 📊 (Data Strategist) · Kira++ 🗄️ (Data Architect)  
**Reviewed by:** BMad Master 🧙  
**Date:** 2026-03-20 · **Version:** 2.0

---

## 1. Tại Sao Phải Nâng Cấp?

### 1.1 Vấn Đề Gốc

Qua audit toàn diện, chúng tôi phát hiện **3 nhóm vấn đề cốt lõi:**

| # | Vấn đề | Phát hiện từ | Mức nghiêm trọng |
|---|--------|-------------|-------------------|
| **P1** | 2 hệ thống KB **tách biệt hoàn toàn** (Cognee KG vs NotebookLM) | kb-touchpoint-analysis — Gap G1 (`kb-touchpoint-analysis.md`) | 🔴 Critical |
| **P2** | 5 AI consumer modules **không kết nối KB** (chat-to-order, social-content, recommendations, pdp-companion, zalo-message) | kb-touchpoint-analysis — Gap G2 (`kb-touchpoint-analysis.md`) | 🔴 Critical |
| **P3** | Product catalog + CTKM **chưa bao giờ được index** vào KB (Gap G3, G7) | kb-touchpoint-analysis — Gap G3 (`kb-touchpoint-analysis.md`) | 🔴 Critical |
| **P4** | Schema có **6 bugs** cấu trúc (thiếu FK, thiếu onDelete, dùng raw String thay enum) | Schema audit 2026-03-20 | ⚠️ High |
| **P5** | Không có **pgvector semantic search** → AI chỉ match text thuần, không hiểu ngữ nghĩa | data-agent-toolkit-research — Pillar 5 (`data-agent-toolkit-research.md`) | ⚠️ High |
| **P6** | **Dữ liệu khách hàng** (debt, order history, wallet, payment) **không được AI truy cập** — no cache, thiếu composite indexes | Schema audit 2026-03-20 | ⚠️ High |

### 1.2 Nguồn Research Dẫn Đến Quyết Định

| Research | Nội dung chính | Kết luận → Hành động |
|----------|---------------|---------------------|
| KB Touchpoint Analysis (`kb-touchpoint-analysis.md`) | Phân tích 8 lỗ hổng (G1-G8) trong kiến trúc KB | → Cần KnowledgeOrchestrator, Product-to-KB sync, PromptAssembly global |
| Data Agent Toolkit Research (`data-agent-toolkit-research.md`) | 7 domains (Data Strategy, Governance, Quality, BI, CQRS, Mesh, MLOps) → 5 Pillars | → 27 assets mới cho Data toolkit (workflows + SKILLs) |
| BMAD Council Assessment (`bmad-council-data-strategy-assessment.md`) | Cross-team đánh giá gaps giữa hiện tại vs cần thiết | → Upgrade plan 4 waves |
| Data Strategy Upgrade Plan (`data-strategy-upgrade-plan.md`) | Roadmap triển khai 27 assets (workflows + SKILLs) | → Đã deploy 27/27 assets |
| Epic 6 & 7 Stories scan | Phân tích 17 stories, status, và schema requirements | → Phát hiện schema đã complete hơn expected |

---

## 2. Cấu Trúc TRƯỚC Nâng Cấp

### 2.1 Database Schema (AI Models)

```
40+ models đã tồn tại, bao phủ:
├── Chat & Ordering:  ChatSession, ChatMessage, RecommendedPo, RecommendedPoItem
├── Content:          AiSocialContent, ContentLibraryEntry, ContentScheduleSlot,
│                     HashtagEntry, ContentImage, ContentFilterPreset, GreetingPreset
├── KB & Training:    KnowledgeDocument, KbTrainingRule, AiChatAuditLog,
│                     ProductKnowledge, Recipe, RecipeIngredient, CustomerPreference
├── NLM Factory:      KnowledgeSource, ContentAsset
├── Performance:      AiFeatureMetricsDaily, AiActionItem, AiFeatureHealthScore,
│                     AiExperiment, AiStrategyConfig
├── Social Funnel:    SocialContentClick, SocialContentAttribution,
│                     SocialFunnelDaily, CustomerSocialProfile
├── Sidebar:          AiSidebarSession, AiTouchpointState
├── Supervisor:       AiSupervisorAlert (5 enums)
├── Messaging:        AiMessageLog, AiCatalogShareLog
└── Templates:        CatalogTemplate
```

### 2.2 Bugs Phát Hiện

| Bug | Mô tả | Impact |
|-----|-------|--------|
| BUG-1 | `ChatSession.userId` có field nhưng **thiếu FK relation** với User | Không eager-load user trong queries |
| BUG-2 | `KnowledgeDocument.uploadedById` **thiếu FK relation** | Không join user info cho admin UI |
| BUG-3 | 5 models thiếu `onDelete` → block user deletion | `ContentFilterPreset`, `GreetingPreset`, `AiMessageLog`, `AiCatalogShareLog`, `RecommendedPo` |
| BUG-5 | `AiExperiment.status` dùng raw String | Typo risk |
| BUG-6 | `AiActionItem.status/type` dùng raw String | Typo risk |

### 2.3 KB Architecture — 2 Hệ Thống Tách Biệt

```
┌─────────────────┐        ┌──────────────┐
│  Cognee KG      │  ❌    │ NotebookLM   │
│  (Story 7.5)    │ NO     │ (Story 7.4c) │
│                 │ SYNC   │              │
│ ↑ Documents     │        │ ↑ Sources    │
│ ↑ Training Rules│        │ ↑ Content    │
└──────┬──────────┘        └──────┬───────┘
       │ ✅ Roleplay only         │ ✅ NLM UI only
       ↓                          ↓
  PromptAssembly          ContentAsset UI
       ↓ ❌                      ↓ ❌
  [5 AI consumers          [Product catalog
   DISCONNECTED]            NOT INDEXED]
```

### 2.4 Không Có pgvector

Chỉ 1 model duy nhất có embedding column (`KbTrainingRule.embedding vector(768)`) — nhưng **không có BE code** implement similarity search.

---

## 3. Cấu Trúc SAU Nâng Cấp

### 3.1 Bug Fixes Applied ✅

| Bug | Fix | File | Lines |
|-----|-----|------|-------|
| BUG-1 | Added `ChatSession → User` FK relation | `schema.prisma` | L1055-1056 |
| BUG-2 | Added `KnowledgeDocument → User` FK relation | `schema.prisma` | L4834-4835 |
| BUG-3 | Added `onDelete: Cascade` to 5 models | `schema.prisma` | Multiple |
| BUG-5 | Created `AiExperimentStatus` enum (4 values) | `schema.prisma` | L5007-5015 |
| BUG-6 | Created `AiActionItemStatus` (6 values) + `AiActionItemType` (6 values) enums | `schema.prisma` | L5018-5042 |

### 3.2 pgvector Embedding Layers (5 models)

| Model | Field | Dimension | Index Type | Purpose |
|-------|-------|-----------|------------|---------|
| `Product` | `nameEmbedding` | 768 | HNSW | Chat-to-Order semantic product search (6.2) |
| `ProductKnowledge` | `embedding` | 768 | HNSW | Pharma/cosmetics RAG retrieval (7.5) |
| `KnowledgeDocument` | `contentEmbedding` | 768 | HNSW | Document semantic search for RAG (7.5) |
| `ContentLibraryEntry` | `captionEmbedding` | 768 | HNSW | Content similarity matching (7.4) |
| `KbTrainingRule` | `embedding` | 768 | HNSW | Training rule semantic match (7.5, đã có) |

### 3.3 Kiến Trúc pgvector Search

```
User Query
    ↓
EmbeddingService.embed(query)  ←── Gemini text-embedding-004 (768d)
    ↓                               Fallback: OpenAI text-embedding-3-small
    ↓                               Cache: Redis (TTL 24h)
$queryRaw(cosine_similarity)
    ↓
┌──────────────────────────────────────────────────────┐
│ SELECT id, 1 - (embedding <=> $1) AS score           │
│ FROM products WHERE tenant_id = $2                    │
│ ORDER BY embedding <=> $1 LIMIT 5                     │
│ -- Uses HNSW index for O(log n) ANN search            │
└──────────────────────────────────────────────────────┘
    ↓
Top-K results → LLM Context
```

### 3.4 Trước vs Sau — Tóm Tắt

| Khía cạnh | TRƯỚC | SAU |
|-----------|-------|-----|
| **Product search** | Text-only (`LIKE '%keyword%'`) | pgvector semantic + pg_trgm fuzzy |
| **KB search** | Cognee REST API only | pgvector + Cognee hybrid |
| **Schema integrity** | 6 bugs (missing FKs, no onDelete) | All fixed, validated |
| **Status fields** | Raw strings (typo-prone) | Enums defined (migration-ready) |
| **Embedding models** | 1 (KbTrainingRule only) | 5 models with HNSW indexes |
| **Content similarity** | None | ContentLibraryEntry cosine search |
| **Customer data for AI** | Not accessible (no cache, no aggregation) | Redis L2 CustomerProfileCache |

### 3.5 Customer 360 Data Layer (NEW — P6 Fix)

> [!IMPORTANT]
> Customer data (debts, orders, payments, wallet, visits) là structured data — không cần pgvector nhưng cần aggregation + Redis cache để AI access trong <50ms.

**Customer Data Map:**

| Data Source | Models | AI Consumer | Existing Index | Gap |
|-------------|--------|-------------|----------------|-----|
| **Order History** | `Order`, `OrderItem` | 6.3 PurchaseAnalyzer, 7.9 Supervisor | `idx_orders_customer_id` | ❌ Missing composite `(customer_id, created_at)` |
| **Debt** | `DebtAccount`, `DebtTransaction` | 7.9 Supervisor (debt alert), 6.2 (order block) | `idx_debt_account_user` | ✅ OK, no AI cache |
| **Payment** | `OrderPayment` | 7.9 payment behavior, 6.3 payment pref | `idx_order_payments_order` | ❌ Missing customer aggregate |
| **Wallet** | `Wallet`, `WalletTransaction` | 7.9 balance check, 6.2 suggest wallet | `idx_wallet_tenant_user` | ✅ OK, no AI cache |
| **CTKM** | `CtkmRedemption` | 6.1b promo history | `idx_ctkm_redemption_customer_id` | ⚠️ Only Redis snapshot |
| **Notes** | `CustomerNote` | 7.3 relationship context | `idx_customer_notes_customer_id` | ❌ Not in AI context |
| **Visits** | `SalesVisit` | 6.3 visit frequency | `idx_visit_customer` | ❌ Not aggregated |
| **Address** | `CustomerAddress` | 6.2 delivery context | `idx_customer_addresses_user_id` | ✅ OK |

### 3.6 CustomerProfileCache (Redis L2)

```
Key: tenant:{tenantId}:customer360:{customerId}
TTL: 15 min (invalidate on Order/Debt/Wallet write)

{
  "name": "Nhà Thuốc ABC", "accountType": "dealer",
  "totalOrders": 47, "totalRevenue": 125000000,
  "avgOrderValue": 2659574, "lastOrderDate": "2026-03-15",
  "orderFrequencyDays": 12,
  "topProducts": [{"name": "Paracetamol 500mg", "totalQty": 240}],
  "currentDebt": 15000000, "creditLimit": 50000000,
  "debtUtilization": 0.30, "isOverdue": false,
  "walletBalance": 500000,
  "activePromosCount": 2, "totalPromosUsed": 15,
  "lastVisitDate": "2026-03-18", "totalVisits": 23,
  "preferences": {"preferred_brand": "Organic brands"}
}
```

### 3.7 Missing Indexes

```sql
CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at DESC);
CREATE INDEX idx_order_items_product_tenant ON order_items (product_id, tenant_id);
CREATE INDEX idx_order_payments_tenant_customer ON order_payments (tenant_id, created_at DESC);
CREATE INDEX idx_visits_customer_date ON sales_visits (customer_id, visited_at DESC);
```

### 3.8 Cache Invalidation

| Event | Source | Cache Action |
|-------|--------|-------------|
| `order.created` | Order Service | Rebuild orders + revenue |
| `debt.transaction_created` | Debt Service | Update debt snapshot |
| `wallet.balance_changed` | Wallet Service | Update balance |
| `ctkm.redeemed` | CTKM Service | Update promo stats |
| `visit.completed` | Visit Service | Update visit stats |

---

## 4. Giải Quyết Được Gì?

### Trực tiếp (ngay khi implement)

| # | Vấn đề giải quyết | Story | Metric |
|---|-------------------|-------|--------|
| 1 | AI Chat-to-Order tìm sản phẩm chính xác hơn bằng semantic search | 6.2 | Product match accuracy ↑ |
| 2 | RAG pipeline dùng product knowledge thay vì blind prompt | 7.5 → 6.2, 7.3 | Answer relevance ↑ |
| 3 | Content similarity giúp AI tìm mẫu content tương tự (few-shot) | 7.4 | Content quality ↑ |
| 4 | Schema bugs không còn block user deletion workflows | All | Zero FK errors |
| 5 | Document search cho KB — admin tải lên, AI tìm và dùng | 7.5 | KB utilization ↑ |
| 6 | **AI có context khách hàng đầy đủ** (debt, orders, wallet, visits) trong <50ms | 6.2, 6.3, 7.9 | Customer context injection ↑ |

### Gián tiếp (foundation cho tương lai)

| # | Capability mở ra | Cần thêm |
|---|-----------------|---------|
| 1 | Product recommendation bằng embedding similarity | Trigger backfill + API endpoint |
| 2 | Cross-sell suggestions dựa trên product embedding clusters | Clustering algorithm |
| 3 | Customer preference matching (pgvector on CustomerPreference) | Add embedding column |
| 4 | Real-time KB freshness monitoring | KB Sync Validator + cron |
| 5 | **Predictive ordering** — dự đoán thời điểm + mặt hàng khách sẽ mua lại | ML model trên Customer 360 |

---

## 5. Khi Nào Nên Nâng Cấp Lần Tiếp?

> [!IMPORTANT]
> Đây là điều kiện trigger cho lần nâng cấp tiếp theo.

### Trigger 1: Scale — Khi vượt 100K products per tenant
- Chuyển từ HNSW sang IVFFlat index (better for >1M rows)
- Xem xét pgvector quantization (`halfvec` thay `vector`)
- Implement approximate KNN with reranking

### Trigger 2: Multi-Modal — Khi cần search hình ảnh
- Thêm `imageEmbedding vector(512)` cho Product + ContentImage
- Dùng CLIP embedding model (image → vector)
- Hybrid search: text embedding + image embedding

### Trigger 3: Real-Time — Khi cần streaming embeddings
- Chuyển từ batch BullMQ sang event-driven embedding
- Prisma middleware trigger → instant embedding generation
- Consider pgvector streaming replication

### Trigger 4: Cost — Khi token cost > $500/month
- Evaluate local embedding models (all-MiniLM-L6-v2, 384d)
- Reduce dimension from 768 → 384 + Matryoshka
- Implement semantic caching (Redis + embedding dedup)

### Trigger 5: Architecture — Khi cần dedicated vector DB
- Evaluate Pinecone / Qdrant / Weaviate nếu pgvector bottleneck
- Khi cần metadata filtering + vector search combo
- Khi multiple tenants share embedding space

---

## 6. Related Documents

| Document | Location | Content |
|----------|----------|---------|
| KB Touchpoint Analysis | kb-touchpoint-analysis.md (`kb-touchpoint-analysis.md`) | 8 gaps (G1-G8), KB sync status matrix |
| Data Agent Toolkit Research | data-agent-toolkit-research.md (`data-agent-toolkit-research.md`) | 5 Pillars, 27 assets roadmap |
| Unified KB Sync Strategy | 7-5-unified-kb-sync-strategy.md (`7-5-unified-kb-sync-strategy.md`) | Sync pipeline design |
| Chat-to-Order AI Context | 7-4-chat-to-order-ai-context-pipeline.md (`7-4-chat-to-order-ai-context-pipeline.md`) | Context assembly budget |
| Chat-to-Order Cache Strategy | 7-4-chat-to-order-cache-strategy.md (`7-4-chat-to-order-cache-strategy.md`) | Redis L2 cache design |
| Full Prisma Schema | schema.prisma (`schema.prisma`) | Source of truth |

---

## 7. Schema Model Registry (Quick Reference)

### Epic 6 Models

| Model | Table | Purpose | State Machine |
|-------|-------|---------|---------------|
| `ChatSession` | `chat_sessions` | Chat container (order/promo/supervisor) | active → resolved \| expired \| abandoned |
| `ChatMessage` | `chat_messages` | Individual messages | — |
| `RecommendedPo` | `recommended_pos` | AI PO suggestions | GENERATED → VIEWED → MODIFIED → CONFIRMED \| DISMISSED |
| `RecommendedPoItem` | `recommended_po_items` | PO line items | — |
| `ProductRecommendation` | `product_recommendations` | Product rec engine | — |

### Epic 7 Models

| Model | Table | Purpose | State Machine |
|-------|-------|---------|---------------|
| `AiSocialContent` | `ai_social_content` | Social content (FB/IG/Thread) | draft → pending_review → approved → shared |
| `ContentScheduleSlot` | `content_schedule_slots` | Weekly content calendar | empty → pending → confirmed → generating → generated → posted \| skipped |
| `KnowledgeDocument` | `knowledge_documents` | KB uploaded docs | pending → processing → completed \| failed |
| `KnowledgeSource` | `knowledge_sources` | NLM sources | queued → processing → completed \| failed |
| `ContentAsset` | `content_assets` | NLM-generated content | — (approval flag) |
| `KbTrainingRule` | `kb_training_rules` | Behavioral rules (pgvector) | — (is_active flag) |
| `AiFeatureMetricsDaily` | `ai_feature_metrics_daily` | Daily AI metrics | — |
| `AiExperiment` | `ai_experiments` | A/B testing | running → paused → completed \| rolled_back |
| `AiSupervisorAlert` | `ai_supervisor_alerts` | Cross-function alerts | active → read \| dismissed |
| `ProductKnowledge` | `product_knowledge` | Pharma/cosmetics KB | — |
| `CustomerPreference` | `customer_preferences` | AI-extracted prefs | — |

### pgvector Columns

| Model | Column | Map | Type | Index |
|-------|--------|-----|------|-------|
| `Product` | `nameEmbedding` | `name_embedding` | `vector(768)` | HNSW (cosine) |
| `ProductKnowledge` | `embedding` | `embedding` | `vector(768)` | HNSW (cosine) |
| `KnowledgeDocument` | `contentEmbedding` | `content_embedding` | `vector(768)` | HNSW (cosine) |
| `ContentLibraryEntry` | `captionEmbedding` | `caption_embedding` | `vector(768)` | HNSW (cosine) |
| `KbTrainingRule` | `embedding` | `embedding` | `vector(768)` | HNSW (cosine) |

---

*Document generated by Shinji 📊 & Kira++ 🗄️ — reviewed by BMad Master 🧙*
*Last validated: 2026-03-20 · `npx prisma validate` ✅ PASSED*
