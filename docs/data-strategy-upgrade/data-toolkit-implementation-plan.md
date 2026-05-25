# Data Agent Toolkit — Implementation Plan

**Ref:** data-agent-toolkit-research.md (`data-agent-toolkit-research.md`)
**Goal:** Build 17 missing SKILLs/Workflows across 5 priority waves, verified end-to-end.

---

## Wave 1: P0 — Critical (Now)

### W1.1 `/create-cache-strategy` Workflow
- **File:** `_bmad/bmm/workflows/3-solutioning/create-cache-strategy/workflow.md`
- **Stub:** `.agent/workflows/bmad-bmm-create-cache-strategy.md`
- **RACI:** Shinji=R (what/when/TTL), Kira++=C (key structure)
- **Steps:** Identify hot-read paths → classify L1/L2/L3 → define cache keys → TTL matrix → invalidation triggers → Mermaid diagram → ⚡ Kira++ for key schema

### W1.2 `cache-performance-guardian` SKILL
- **File:** `.agent/skills/cache-performance-guardian/SKILL.md`
- **Checks:** C1: Hot-path detection (APIs with >10 DB queries/sec) · C2: Cache coverage (each hot-path has cache) · C3: TTL appropriateness · C4: Invalidation correctness · C5: Redis memory budget

### W1.3 `/create-ai-context-pipeline` Workflow
- **File:** `_bmad/bmm/workflows/3-solutioning/create-ai-context-pipeline/workflow.md`
- **Stub:** `.agent/workflows/bmad-bmm-create-ai-context-pipeline.md`
- **RACI:** Shinji=R (pipeline), Songoku=C (token budget)
- **Steps:** Classify context sources (Semantic/Live/Memory) → assign injection method (system prompt / tool call / RAG) → token budget per source → context assembly flow → Mermaid diagram

---

## Wave 2: P1 — Epic 10

### W2.1 `/create-event-topology` Workflow
- **File:** `_bmad/bmm/workflows/3-solutioning/create-event-topology/workflow.md`
- **Stub:** `.agent/workflows/bmad-bmm-create-event-topology.md`
- **Steps:** Event catalog → payload schemas → transport selection → DLQ strategy → monitoring hooks

### W2.2 `/create-external-integration` Workflow
- **File:** `_bmad/bmm/workflows/3-solutioning/create-external-integration/workflow.md`
- **Stub:** `.agent/workflows/bmad-bmm-create-external-integration.md`
- **Steps:** API mapping → auth strategy → retry/circuit breaker → data transform → error handling

### W2.3 `/create-dashboard-spec` Workflow
- **File:** `_bmad/bmm/workflows/3-solutioning/create-dashboard-spec/workflow.md`
- **Stub:** `.agent/workflows/bmad-bmm-create-dashboard-spec.md`
- **Steps:** Load BI Pipeline output → chart type selection → drill-down paths → filter/date range → refresh intervals → UI Spec output

### W2.4 `data-quality-monitor` SKILL
- **File:** `.agent/skills/data-quality-monitor/SKILL.md`
- **Checks:** DQ1: Null rate thresholds · DQ2: Outlier detection · DQ3: Schema drift · DQ4: Freshness alerts · DQ5: Cross-entity consistency

### W2.5 `multi-tenant-data-validator` SKILL
- **File:** `.agent/skills/multi-tenant-data-validator/SKILL.md`
- **Checks:** MT1: Every Prisma query scoped by tenantId · MT2: No cross-tenant joins · MT3: API endpoints enforce tenant context · MT4: Redis keys namespaced by tenant · MT5: Cognee searches scoped by tenant

### W2.6 `context-budget-validator` SKILL
- **File:** `.agent/skills/context-budget-validator/SKILL.md`
- **Checks:** CB1: Total prompt <80% model context window · CB2: Each context source has token ceiling · CB3: Redundant context detection · CB4: Cost-per-query within budget · CB5: Fallback when context exceeds limit

---

## Wave 3: P2 — Epic 10b

### W3.1 `/create-data-governance-policy` Workflow
### W3.2 `data-retention-validator` SKILL
### W3.3 `event-consistency-validator` SKILL
### W3.4 `/create-data-observability` Workflow
### W3.5 `/create-scale-strategy` Workflow
### W3.6 `tenant-analytics-validator` SKILL

---

## Wave 4: P3 — Future

### W4.1 `/data-catalog` Workflow
### W4.2 `/create-feature-store-spec` Workflow
### W4.3 `/create-training-data-pipeline` Workflow
### W4.4 `backup-recovery-validator` SKILL

---

## Agent Updates Required

| Agent | Updates |
|-------|---------|
| **Shinji** | Add menu items: `[CS]` Cache Strategy, `[AC]` AI Context Pipeline, `[ET]` Event Topology |
| **Kira++** | Add menu item: `[MT]` Multi-Tenant Audit |
| **BMad Master** | Update `[DD]` router classification to include new capabilities |
| **data-raci.md** | Add 7 new capability rows (per research RACI table) |

---

## ✅ VERIFICATION CHECKLIST (per Wave)

> [!CAUTION]
> Mỗi wave PHẢI pass checklist này trước khi đánh dấu Done. SKILL/Workflow chỉ nằm trên giấy = chưa hoàn thành.

### V1: File Existence & Structure
- [ ] Tất cả file `.md` tồn tại đúng đường dẫn
- [ ] Workflow có frontmatter đúng: `name`, `description`, `agent`, `phase`
- [ ] SKILL có frontmatter đúng: `name`, `description`
- [ ] Stub files tồn tại trong `.agent/workflows/` và trỏ đúng path

### V2: Cross-Reference Integrity
- [ ] Agent menu `action="#id"` khớp với `<prompt id="id">` trong cùng file
- [ ] Agent menu `exec="path"` trỏ đến file thực tế tồn tại
- [ ] Workflow references SKILL path → SKILL file tồn tại
- [ ] RACI matrix bao phủ mọi capability mới
- [ ] BMad Master `[DD]` router phân loại đúng capability mới

### V3: Smoke Test — Mỗi Workflow
- [ ] Chạy `/workflow-name` từ agent prompt → Agent load được file
- [ ] Truyền 1 story file thực tế → Workflow xuất output đúng format
- [ ] Output có Mermaid diagram (nếu workflow yêu cầu)
- [ ] Output flag "⚡ Kira++ collaboration" khi cần (nếu applicable)
- [ ] Output saved đúng `{output_folder}/data-specs/{key}.md`

### V4: Smoke Test — Mỗi SKILL
- [ ] Chạy SKILL validation trên codebase hiện tại → có output report
- [ ] Report có đúng format: Summary → Critical → Warning → Passing
- [ ] Mỗi check (C1, C2...) có verdict rõ ràng (✅/❌/⚠️)
- [ ] Không có false positive quá 2 items trên 1 report

### V5: Integration Test — Real-World Scenario
- [ ] **Scenario A (CQRS):** Chạy `/create-cache-strategy` cho module `chat-to-order` → output xác định đúng hot-read paths: CTKM, Customer Profile, Product
- [ ] **Scenario B (AI Context):** Chạy `/create-ai-context-pipeline` cho `chat-to-order` → output phân loại đúng: Product → Cognee (Semantic), CTKM → Redis (Live), Chat history → Mem0 (Memory)
- [ ] **Scenario C (Event):** Chạy `/create-event-topology` cho `order.created` → output có: producer (OrderService), consumers (NotificationService, BI aggregator, KB sync), DLQ strategy
- [ ] **Scenario D (Multi-tenant):** Chạy `multi-tenant-data-validator` trên Prisma schema → phát hiện đúng models thiếu tenantId FK

### V6: BMAD-DragonBall Sync
- [ ] Tất cả file mới đã copy vào `BMAD-DragonBall/docs/data-strategy-upgrade/`
- [ ] Research doc + sources đã có trong DragonBall
