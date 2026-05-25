# Data Domain RACI Matrix — Kira++ & Shinji

> **Phân tách nguyên tắc:** Kira++ = "CÁI GÌ" (structure/shape) | Shinji = "NHƯ THẾ NÀO" (flow/movement)

## RACI Legend
- **R** = Responsible (owns the output)
- **A** = Accountable (final approval)
- **C** = Consulted (provides input)
- **I** = Informed (notified of output)

## Responsibility Matrix

| Capability | Kira++ 🗄️ | Shinji 📊🔬 | Notes |
|---|---|---|---|
| **Prisma model design** | **R** | C | Kira designs table structure, Shinji advises on flow needs |
| **Seed data governance** | **R** | I | Kira owns seed quality |
| **Type alignment FE↔BE** | **R** | I | Kira validates shared types |
| **Migration strategy** | **R** | C | Shinji may have requirements that affect migration order |
| **Cache key format** | **R** | C | Kira designs Redis key structure |
| **Cache invalidation flow** | C | **R** | Shinji designs when/how cache is cleared |
| **Metering model** (TenantUsage) | **R** | C | Kira designs the schema |
| **Metering pipeline** (Redis→DB) | C | **R** | Shinji designs the sync flow |
| **KB sync target data model** | **R** | C | Kira designs what gets stored |
| **KB sync pipeline design** | C | **R** | Shinji designs how data flows into KB |
| **Event payload schema** | **R** | C | Kira defines structure |
| **Event flow/topology** | C | **R** | Shinji designs producer→consumer chain |
| **BI aggregation logic** | C | **R** | Shinji designs metric calculations |
| **BI data model** (materialized views) | **R** | C | Kira designs the DB structure |
| **Data lineage/impact** | I | **R** | Shinji traces downstream effects |
| **External integration flow** | C | **R** | Shinji designs VNPay/Stripe/Misa flows |
| **External integration schema** | **R** | C | Kira designs response/request models |
| **Cache Read Model design** (structure) | **R** | C | Kira designs Redis key schema, Shinji defines what/when |
| **Cache strategy** (what/when/TTL) | C | **R** | Shinji determines hot-paths and invalidation |
| **AI Context Pipeline design** | I | **R** | Shinji designs context assembly flow |
| **Context token budget** | I | C | Songoku owns token optimization |
| **Cache performance audit** | C | **R** | Shinji validates cache coverage and memory |
| **Event topology design** | I | **R** | Shinji designs event catalog, DLQ, monitoring |
| **External integration flow** | C | **R** | Shinji designs retry, circuit breaker, webhook handling |
| **Dashboard UI spec** | I | **R** | Shinji designs KPIs, charts, filters, refresh strategy |
| **Data quality monitoring** | C | **R** | Shinji defines null rate, outlier, freshness rules |
| **Multi-tenant isolation audit** | **R** | C | Kira++ scans Prisma queries, Redis keys for tenant leakage |
| **Context token budget audit** | I | C | Songoku validates prompt assembly cost and token limits |

## Collaboration Protocol

1. **When Shinji needs schema changes:** Shinji produces `data-flow-architecture.md` → Kira++ reviews and creates `data-spec.md`
2. **When Kira++ schema affects flows:** Kira++ notifies Shinji of model changes → Shinji updates flow documentation
3. **For cross-domain features:** Use Party Mode — both agents discuss in same context
4. **Conflict resolution:** If disagree on boundary, escalate to BMad Master for ruling
