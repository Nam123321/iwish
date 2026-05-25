# Validation Plan: AI Database & KB Upgrade (Epic 6 & 7)

**Assignee:** QA Agent (Automated) + Kira++ (Data Verification)
**Objective:** Cross-check, validate, and debug the pgvector Semantic Search and Customer 360 Redis Cache layers to ensure they meet business requirements.

---

## 1. Cơ Chế Hoạt Động & Performance Expected

### 1.1 Luồng Xử Lý (Record & Response)
1. **Dữ liệu vào (Record):**
   - **Structured Data (Customer 360):** Khi có giao dịch (Order, Debt, Wallet), hệ thống emit event. `Customer360Service` invalidate Redis cache. Lần gọi tiếp theo sẽ query DB và build lại cache.
   - **Unstructured Data (pgvector):** Khi Product/Document được tạo/update, đẩy vào BullMQ worker -> gọi `EmbeddingService` (Gemini API) -> Build 768-dim vector -> Update vào PostgreSQL column `name_embedding` / `content_embedding`.
2. **Truy vấn (Response):**
   - **LLM Context Injection:** Gọi `Customer360CacheService` -> Lấy chuỗi mô tả dạng text (~800 tokens) -> Nhét vào System Prompt.
   - **Semantic Search:** Người dùng search -> `EmbeddingService` nhúng câu query hiện tại -> Dùng `VectorSearchHelper` chạy `$queryRaw (cosine_similarity)` qua index HNSW -> Trả về Top 5 kết quả -> Đưa vào LLM UI.

### 1.2 Performance Metrics (SLA)
- **Redis Cache Hit:** < 10ms (Customer 360 retrieval)
- **Redis Cache Miss (Rebuild):** ~150-300ms (Query 8 DB tables)
- **Embedding Generation:** ~200-400ms (Gemini API latency)
- **pgvector HNSW Search:** < 50ms (for datasets < 1M rows)
- **Total AI Context Assembly:** < 500ms (trước khi gọi LLM suy luận)

---

## 2. 10 Use Cases Kiểm Tra Thực Tế

### Nhóm 1: Customer 360 (In-prompt Context)
**UC1: Nhắc nhở công nợ khi đặt hàng (Chat-to-Order)**
- **Input:** Khách Dealer A chat "Lấy tôi 5 thùng sữa". Dealer A đang nợ 45tr/50tr, trễ hạn 5 ngày.
- **Expected DB Behaviors:** Redis hit <10ms. Context báo `isOverdue: true`.
- **Expected AI Response:** AI từ chối khéo hoặc nhắc nhở thanh toán công nợ trước khi lên đơn mới.

**UC2: Ví điện tử đủ số dư (Chat-to-Order)**
- **Input:** Khách Retail B mua đơn hàng 400K, ví điện tử có 500K. "Tôi mua 2 hộp Paracetamol".
- **Expected DB Behaviors:** Redis hit <10ms. Context báo `walletBalance: 500000`.
- **Expected AI Response:** Lên chi tiết đơn hàng (400K) và AI chủ động đề xuất: "Ví bạn còn 500K, bạn có muốn thanh toán luôn bằng ví không?"

**UC3: Phân tích hành vi mua sắm (PurchaseAnalyzer)**
- **Input:** AI Supervisor hoặc Chat tự động gợi ý sản phẩm cho Khách VIP C. Khách này chu kỳ mua 10 ngày/lần.
- **Expected DB Behaviors:** Redis fetch `orderFrequencyDays: 10`, `topProducts: [Sữa, Bỉm]`.
- **Expected AI Response:** AI gợi ý đúng sản phẩm Sữa & Bỉm khi khách mở app vào ngày thứ 9 kể từ đơn cuối.

**UC4: Cache Invalidation (Data Sync)**
- **Input:** Khách hàng mới thanh toán nợ.
- **Expected DB Behaviors:** Event `debt.transaction_created` chạy -> Xóa Redis key `customer360:{id}`. Lần tới chat, DB queries chạy tốn ~200ms và build lại cache với `currentDebt: 0`.
- **Expected AI Response:** Ngay sau khi thanh toán, chat mua hàng AI không còn nhắc nợ nữa.

### Nhóm 2: Vector Semantic Search (Sản phẩm & RAG)
**UC5: Tìm kiếm mơ hồ / đồng nghĩa (Chat-to-Order)**
- **Input:** "Thuốc giảm đau cho người lớn" (Trong DB chỉ có "Paracetamol 500mg" và "Ibuprofen").
- **Expected DB Behaviors:** Query embedding (~300ms) -> HNSW search đánh giá Cosine Similarity > 0.4.
- **Expected AI Response:** AI trả về Paracetamol và Ibuprofen dù không khớp keyword.

**UC6: Khớp sai (Low Threshold / Negative Match)**
- **Input:** "Tôi muốn mua điện thoại iPhone".
- **Expected DB Behaviors:** Vector search trả về các sản phẩm y tế nhưng score < 0.4. `Limit=5` bị filter rỗng ở code.
- **Expected AI Response:** "Xin lỗi, nhà thuốc chúng tôi không bán điện thoại iPhone."

**UC7: RAG Document Retrieval (Pharma QA)**
- **Input:** "Chống chỉ định của thuốc hạ sốt trẻ em loại XYZ là gì?" (Thông tin nằm trong file PDF HDSD đã upload).
- **Expected DB Behaviors:** vector search bảng `knowledge_documents` -> Match với chunk text HDSD -> Đưa chunk vào prompt.
- **Expected AI Response:** AI đọc đúng chống chỉ định từ document, không bịa (hallucinate), có trích dẫn nguồn.

**UC8: Content Similarity (Gợi ý viết bài Social)**
- **Input:** "Viết một bài facebook bán Vitamin C mùa dịch".
- **Expected DB Behaviors:** Search bảng `content_library_entries` -> Tìm các bài viết caption_embedding tương tự đã từng tạo về Vitamin C/Tăng sức đề kháng.
- **Expected AI Response:** AI viết bài mới nhưng giữ nguyên văn phong, cấu trúc (few-shot) của các bài marketing tốt nhất trong quá khứ.

### Nhóm 3: Batch & Scale (Hệ thống)
**UC9: Khởi tạo dữ liệu lớn (Batch Worker)**
- **Input:** Tenant mới import 10,000 products từ Excel.
- **Expected DB Behaviors:** BullMQ gom thành batch 100 texts -> Gọi Gemini batch API -> Update `$queryRaw` vào `name_embedding`. Thời gian process < 20 phút. Hệ thống không bị rate limit (handled by retry/backoff).
- **Expected AI Response:** N/A (Admin dashboard báo 100% indexed).

**UC10: HNSW Index Selection**
- **Input:** AI gọi `$queryRaw` search 1 embedding trên table product 100K rows.
- **Expected DB Behaviors:** Postgres EXPLAIN ANALYZE chỉ ra sử dụng `Index Scan using idx_product_name_embedding`. Tốc độ query DB < 20ms thay vì Seq Scan > 500ms.
- **Expected AI Response:** N/A (Backend API fast response).

---

## 3. Quy Trình QA Cross-Check Đề Xuất

BMad Master chỉ định **QA Agent** thực hiện các bước sau trong môi trường Post-Deploy:

1. **DB Level:** Run `SELECT * FROM pg_extension;` để khẳng định vector tồn tại.
2. **Seeding:** Seed 10 products mẫu (y tế) + 1 khách hàng mẫu với lịch sử nợ/đơn hàng.
3. **Execution Level:** Viết e2e test gọi thẳng vào `EmbeddingService.embed()` để check API keys.
4. **Integration Level:** Gọi `Customer360Service.getPromptContext()` -> Log result và đo thời gian (Time-to-first-fetch vs Cache-hit).
5. **AI Simulation:** Dùng tool /simulate-user (User Simulation Guardian) đóng vai khách bị nợ chat với AI -> Chụp screenshot console DB và LLM Prompt gửi đi.
