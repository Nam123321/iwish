# ML System Design (MLSD) — 9 Trục Đánh Giá Kiến Trúc

| Trục # | Tên Trục | Trọng Tâm Đánh Giá | Tiêu Chuẩn Thẩm Định |
|---|---|---|---|
| **Axis 1** | **Problem Formulation & Metrics** | Chuyển bài toán nghiệp vụ thành bài toán ML/AI. | Phải phân định rõ Offline Metrics (Precision, Recall, ROC-AUC, NDCG) vs Online Business Metrics (CTR, CVR, Revenue, Churn, User Retention). SLA về latency (P95/P99 < 200ms). |
| **Axis 2** | **Data Engineering & Feature Store** | Nguồn dữ liệu, pipeline tiền xử lý, tính năng. | Xử lý Cold Start, Train-Serving Skew, Data Leakage, cơ chế đồng bộ Online/Offline Feature Store (Redis/Feast). |
| **Axis 3** | **Model Selection & Architecture** | Lựa chọn họ mô hình, inductive bias. | Đánh giá Trade-off giữa Classical ML (XGBoost/LightGBM) vs Deep Learning vs LLM/SLM. Phân tích chi phí: RAG vs Fine-tuning (LoRA). |
| **Axis 4** | **Training Strategy & Optimization** | Chiến lược huấn luyện, scaling. | Distributed Training (DDP, FSDP, DeepSpeed), Loss functions phù hợp, Learning Rate Schedule, Quantization-aware training (QAT). |
| **Axis 5** | **Serving & Inference Architecture** | Tầng phục vụ inference trong môi trường production. | Batching động (Dynamic Batching), KV-Cache management (PagedAttention/vLLM), Model parallelism (TP/PP), Speculative Decoding. |
| **Axis 6** | **Scalability & Capacity Planning** | Khả năng chịu tải và dự toán tài nguyên. | Tính toán QPS, GPU memory footprint (VRAM Sizing: Weights + KV Cache + Activations), Throughput optimization. |
| **Axis 7** | **Resilience & Fault Tolerance** | Khả năng sống sót khi thành phần AI suy thoái. | Cascade fallback (Model to Classical Rules), Circuit Breaker, Exponential Backoff, Semantic Cache (GPTCache) để giảm tải downstream. |
| **Axis 8** | **Continuous Learning & Evaluation** | Vòng đời sau triển khai, đánh giá liên tục. | Giám sát Data Drift / Concept Drift (Evidently/Whylogs), Shadow Deployment, Canary Routing, Feedback loop từ user behavior. |
| **Axis 9** | **Security, Privacy & Ethics** | An toàn, bảo mật và quyền riêng tư AI. | Phòng chống Prompt Injection / Jailbreak, PII Masking/Scrubbing (Presidio), Differential Privacy, Rate Limiting per user/tenant. |
