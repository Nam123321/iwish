# 📊 Data Agent Toolkit — Comprehensive Research Report
**Council:** BMad Master × Shinji × Kira++ × Songoku
**Date:** 2026-03-19 | **Scope:** Full-spectrum Data Strategy capabilities

---

## Executive Summary

Nghiên cứu dựa trên 7 lĩnh vực cốt lõi: Data Strategy Framework, Data Governance, Data Quality, BI Pipeline, CQRS/Event Sourcing, Data Mesh, và MLOps/Data Science. Tổng hợp thành **5 Trụ Cột (Pillars)**, phân bổ vào Workflows (quy trình tạo output) và SKILLs (quy trình kiểm duyệt/validation).

---

## Current State (Đã Có)

| # | Asset | Type | Agent | Status |
|---|-------|------|-------|--------|
| 1 | `/create-data-flow` | Workflow | Shinji | ✅ |
| 2 | `/create-kb-strategy` | Workflow | Shinji | ✅ |
| 3 | `/create-bi-pipeline` | Workflow | Shinji | ✅ |
| 4 | `[CD] Cache Design` | Prompt | Kira++ | ✅ |
| 5 | `[MM] Metering Model` | Prompt | Kira++ | ✅ |
| 6 | `[BP] BI Pipeline` | Prompt | Shinji | ✅ |
| 7 | `[ES] Event System` | Prompt | Shinji | ✅ |
| 8 | `[DL] Data Lineage` | Prompt | Shinji | ✅ |
| 9 | `data-flow-guardian` | SKILL | Shinji | ✅ |
| 10 | `kb-sync-validator` | SKILL | Shinji | ✅ |
| 11 | `bi-metrics-validator` | SKILL | Shinji | ✅ |
| 12 | `data-integrity-guardian` | SKILL | Kira++ | ✅ |

---

## 5 Pillars — Full Capability Matrix

### Pillar 1: Data Architecture & Governance 🏛️
*Quản lý cấu trúc dữ liệu, quyền truy cập, chuẩn mực, và vòng đời dữ liệu.*

| # | Capability | Type | Agent | Status | Priority |
|---|-----------|------|-------|--------|----------|
| 1.1 | `/create-data-spec` (Schema design) | Workflow | Kira++ | ✅ EXISTS | — |
| 1.2 | `/validate-schema` (FE↔BE alignment) | Workflow | Kira++ | ✅ EXISTS | — |
| 1.3 | `/seed-data-audit` | Workflow | Kira++ | ✅ EXISTS | — |
| 1.4 | `data-integrity-guardian` SKILL | SKILL | Kira++ | ✅ EXISTS | — |
| 1.5 | `/create-data-governance-policy` | Workflow | Kira++ | ❌ MISSING | P2 |
| 1.6 | `data-retention-validator` SKILL | SKILL | Kira++ | ❌ MISSING | P2 |
| 1.7 | `/data-catalog` (Entity registry) | Workflow | Kira++ | ❌ MISSING | P3 |

> **1.5** — Tạo chính sách quản trị dữ liệu: phân loại PII, retention rules, access control policies, audit trail requirements. Quan trọng khi triển khai GDPR/PDPA compliance cho multi-tenant.
> **1.6** — Kiểm duyệt: soft-delete vs hard-delete, TTL cho logs/events, data archival policy.
> **1.7** — Registry tự động liệt kê tất cả Prisma models, relationships, và mục đích sử dụng — giống Data Catalog nhưng tích hợp vào quy trình BMAD.

---

### Pillar 2: Data Flow & Integration 🔀
*Thiết kế và kiểm duyệt luồng dữ liệu giữa các module, hệ thống bên ngoài, và KB.*

| # | Capability | Type | Agent | Status | Priority |
|---|-----------|------|-------|--------|----------|
| 2.1 | `/create-data-flow` | Workflow | Shinji | ✅ EXISTS | — |
| 2.2 | `/create-kb-strategy` | Workflow | Shinji | ✅ EXISTS | — |
| 2.3 | `data-flow-guardian` SKILL | SKILL | Shinji | ✅ EXISTS | — |
| 2.4 | `kb-sync-validator` SKILL | SKILL | Shinji | ✅ EXISTS | — |
| 2.5 | `/create-cache-strategy` (CQRS Read Model) | Workflow | Shinji+Kira++ | ❌ MISSING | **P0** |
| 2.6 | `cache-performance-guardian` SKILL | SKILL | Shinji | ❌ MISSING | **P0** |
| 2.7 | `/create-event-topology` | Workflow | Shinji | ❌ MISSING | P1 |
| 2.8 | `/create-external-integration` | Workflow | Shinji | ❌ MISSING | P1 |
| 2.9 | `event-consistency-validator` SKILL | SKILL | Shinji | ❌ MISSING | P2 |

> **2.5** — **CRITICAL!** Thiết kế kiến trúc CQRS: Read Model (Redis/Elasticsearch) vs Write Model (Prisma). Xác định dữ liệu nào nên được cache, TTL, invalidation strategy, và phân tầng (L1 in-memory → L2 Redis → L3 DB).
> **2.6** — Quét codebase tìm API endpoints truy vấn DB trực tiếp mà đáng lẽ phải dùng cache. Đánh giá cache hit ratio.
> **2.7** — Full workflow cho Event-Driven Architecture: event catalog, payload schemas, dead letter queues, ordering guarantees, monitoring.
> **2.8** — Thiết kế luồng tích hợp bên ngoài (VNPay, Misa, GHN...) — request/response mapping, retry, circuit breaker.
> **2.9** — Kiểm duyệt event payload consistency, phát hiện events bị mất/trùng, và at-least-once vs exactly-once guarantees.

---

### Pillar 3: BI, Analytics & Observability 📈
*Thiết kế dashboard, metrics, reporting, và giám sát sức khỏe hệ thống dữ liệu.*

| # | Capability | Type | Agent | Status | Priority |
|---|-----------|------|-------|--------|----------|
| 3.1 | `/create-bi-pipeline` | Workflow | Shinji | ✅ EXISTS | — |
| 3.2 | `bi-metrics-validator` SKILL | SKILL | Shinji | ✅ EXISTS | — |
| 3.3 | `/create-dashboard-spec` | Workflow | Shinji | ❌ MISSING | P1 |
| 3.4 | `data-quality-monitor` SKILL | SKILL | Shinji | ❌ MISSING | P1 |
| 3.5 | `/create-data-observability` | Workflow | Shinji | ❌ MISSING | P2 |
| 3.6 | `tenant-analytics-validator` SKILL | SKILL | Shinji | ❌ MISSING | P2 |

> **3.3** — Từ BI Pipeline → thiết kế cụ thể UI Dashboard: chart types, drill-down paths, filter options, refresh intervals. Output là UI Spec cho Dev.
> **3.4** — Giám sát chất lượng dữ liệu liên tục: null rates, outliers, schema drift detection, data freshness alerts. Chạy như health check.
> **3.5** — Thiết kế hệ thống giám sát dữ liệu toàn diện: logging, tracing, alerting cho data pipelines. Track pipeline failures, latency, throughput.
> **3.6** — Kiểm duyệt metrics được tính đúng theo tenant isolation. Đảm bảo SaaS admin metrics (MRR, churn) không bị lẫn với tenant-scoped metrics.

---

### Pillar 4: AI/ML Data Pipeline 🤖
*Quản lý dữ liệu phục vụ cho các tính năng AI: prompt context, feature engineering, model training data.*

| # | Capability | Type | Agent | Status | Priority |
|---|-----------|------|-------|--------|----------|
| 4.1 | `prompt-engineering-guardian` SKILL | SKILL | Songoku | ✅ EXISTS | — |
| 4.2 | `ai-cost-optimizer` SKILL | SKILL | Songoku | ✅ EXISTS | — |
| 4.3 | `/create-ai-context-pipeline` | Workflow | Shinji+Songoku | ❌ MISSING | **P0** |
| 4.4 | `context-budget-validator` SKILL | SKILL | Shinji+Songoku | ❌ MISSING | P1 |
| 4.5 | `/create-feature-store-spec` | Workflow | Shinji | ❌ MISSING | P3 |
| 4.6 | `/create-training-data-pipeline` | Workflow | Shinji | ❌ MISSING | P3 |

> **4.3** — **CRITICAL!** Thiết kế pipeline Context cho LLM: Semantic (Cognee) + Live (Redis Cache) + Memory (Mem0). Xác định: dữ liệu nào inject vào system prompt, dữ liệu nào dùng Tool Calling, token budget allocation. Đây chính là câu hỏi bạn vừa đặt ra!
> **4.4** — Kiểm duyệt context window: phát hiện prompt quá dài, context không liên quan, token waste. Cross-check với `ai-cost-optimizer`.
> **4.5** — Feature Store cho ML: standardized feature definitions, offline/online serving, point-in-time correctness. Cần khi xây dựng churn prediction (Epic 10b).
> **4.6** — Pipeline cho ML training data: labeling, versioning, bias detection. Cần khi xây dựng recommendation engine.

---

### Pillar 5: Scale & Operations ⚙️
*Quản lý dữ liệu khi hệ thống scale: multi-tenant, performance, migration, disaster recovery.*

| # | Capability | Type | Agent | Status | Priority |
|---|-----------|------|-------|--------|----------|
| 5.1 | `[MM] Metering Model` | Prompt | Kira++ | ✅ EXISTS | — |
| 5.2 | `/create-scale-strategy` | Workflow | Shinji+Kira++ | ❌ MISSING | P2 |
| 5.3 | `multi-tenant-data-validator` SKILL | SKILL | Kira++ | ❌ MISSING | P1 |
| 5.4 | `/create-migration-plan` | Workflow | Kira++ | ❌ MISSING | P2 |
| 5.5 | `backup-recovery-validator` SKILL | SKILL | Kira++ | ❌ MISSING | P3 |

> **5.2** — Thiết kế chiến lược scale: database sharding/partitioning, read replicas, connection pooling, horizontal scaling triggers.
> **5.3** — Kiểm duyệt mọi query đều scoped by tenantId. Phát hiện cross-tenant data leakage. Test với multiple tenants.
> **5.4** — Quy trình migration an toàn: zero-downtime migrations, rollback plans, data backfill strategies.
> **5.5** — Kiểm duyệt backup policy, point-in-time recovery capability, disaster recovery SLA.

---

## Priority Summary

| Priority | Count | Items |
|----------|-------|-------|
| **P0** (Cần ngay) | 3 | `/create-cache-strategy`, `cache-performance-guardian`, `/create-ai-context-pipeline` |
| **P1** (Epic 10) | 5 | `/create-event-topology`, `/create-external-integration`, `/create-dashboard-spec`, `data-quality-monitor`, `multi-tenant-data-validator` |
| **P2** (Epic 10b) | 5 | `/create-data-governance-policy`, `data-retention-validator`, `event-consistency-validator`, `/create-data-observability`, `/create-scale-strategy` |
| **P3** (Future) | 4 | `/data-catalog`, `/create-feature-store-spec`, `/create-training-data-pipeline`, `backup-recovery-validator` |

---

## RACI Update Needed

| New Capability | Kira++ | Shinji | Songoku |
|----------------|--------|--------|---------|
| Cache Read Model design (structure) | **R** | C | I |
| Cache strategy (what/when/TTL) | C | **R** | I |
| AI Context Pipeline design | I | **R** | C |
| Context token budget | I | C | **R** |
| Multi-tenant data isolation | **R** | C | I |
| Data governance policy | **R** | C | I |
| Data quality monitoring | C | **R** | I |

---

## Research Sources

### Data Strategy & Governance
- [Databricks — Data Strategy Framework](https://www.databricks.com/glossary/data-strategy)
- [EWSolutions — Data Governance Checklist](https://www.ewsolutions.com)
- [Atlan — Data Governance Framework](https://atlan.com/data-governance-guide/)
- [NudgeSecurity — SaaS Data Governance](https://www.nudgesecurity.com)
- [ComplyDog — SaaS Compliance Checklist](https://www.complydog.com)

### Data Quality & Catalog
- [Atlan — Data Quality Best Practices](https://atlan.com/data-quality/)
- [Boomi — Data Quality Monitoring](https://boomi.com/content/article/data-quality-best-practices/)
- [Metaplane — Data Quality Monitoring 2025](https://www.metaplane.dev)
- [Digna.ai — AI-Native Data Quality 2026](https://digna.ai)
- [Promethium — Data Catalog Trends 2026](https://www.promethium.ai)

### BI Pipeline & Analytics
- [BuzzyBrains — BI Pipeline Architecture](https://www.buzzybrains.com)
- [StitchData — SaaS Pipeline Design](https://www.stitchdata.com)
- [Fivetran — Modern Data Pipeline](https://www.fivetran.com)

### CQRS & Event Sourcing
- [AWS — CQRS Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/cqrs-pattern.html)
- [CQRS.nu — CQRS Reference](https://cqrs.nu)
- [Daniel Whittaker — Event Sourcing Guide](https://danielwhittaker.me)

### Data Mesh
- [Acceldata — Data Mesh Implementation](https://www.acceldata.io)
- [Atlan — Data Mesh Guide](https://atlan.com/data-mesh-guide/)
- [Monte Carlo Data — Data Mesh Checklist](https://www.montecarlodata.com)

### MLOps & Data Science
- [HatchWorks — MLOps Best Practices 2025](https://www.hatchworks.com)
- [ThirstySprout — MLOps Feature Store](https://www.thirstysprout.com)
- [MyUndoAI — MLOps Observability 2025](https://myundoai.com)
- [OvalEdge — Data Lineage Best Practices](https://www.ovaledge.com)
- [SeeMoreData — End-to-End Data Lineage](https://www.seemoredata.io)
- [Spacelift — Observability Best Practices](https://spacelift.io)

