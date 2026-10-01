---
name: plugin-lifecycle-6layer-auditor
description: 'Audits plugin completeness across Cowok 6-Layer architecture. Detects
  missing trigger mechanisms, layer coverage gaps, and operational readiness. Dual-purpose:
  Development-time audit and Runtime plugin lifecycle guardian for Advisor/Evolution
  agents.'
---

---
name: plugin-lifecycle-6layer-auditor
description: Audits plugin completeness across Cowok's 6-Layer architecture — detects missing trigger mechanisms, layer coverage gaps, and operational readiness. Dual-purpose: (1) Cowok feature development audit (2) Runtime plugin lifecycle guardian for Advisor/Evolution agents.
---

# 🔍 Plugin Lifecycle 6-Layer Auditor Skill

## Purpose

Dual-purpose auditing skill that ensures every plugin (both during Cowok platform development and at runtime) is properly wired across all 6 architectural layers with correct trigger mechanisms.

**Mục đích 1 — Development-Time Audit (Dùng khi phát triển Cowok):**
Phát hiện các feature/story đang xây dựng plugin nhưng thiếu coverage ở một hoặc nhiều layer. Giúp team bổ sung gap trước khi ship.

**Mục đích 2 — Runtime Plugin Guardian (Dùng bởi Advisor Agent):**
Khi tạo plugin mới, import plugin bên ngoài, hoặc quản lý vòng đời plugin → skill này tạo plan, detect lỗi, audit để đảm bảo plugin đã đủ điều kiện vận hành thực tế xuyên 6 layer.

---

## 6-Layer Plugin Completeness Matrix

Mỗi plugin PHẢI được đánh giá qua 6 checkpoints tương ứng 6 layers:

| Layer | Checkpoint | Required Evidence | Severity if Missing |
|---|---|---|---|
| **L1: Generative UI** | Plugin có `uiComponents[]` hoặc có khả năng render response qua existing UI components? | UI Schema definition HOẶC explicit declaration `headless: true` | ⚠️ WARN (headless plugins exempt) |
| **L2: Security & Routing** | Plugin có `safetyTier` declaration? Intent routing embeddings đã được index? | `safetyTier: L1-L5` in manifest + pgvector embedding exists in catalog | 🔴 CRITICAL |
| **L3: Orchestration** | Plugin tools/skills đã được bind vào Node Architecture? EffectGate rules configured? | `NodeDefinition` entry hoặc `capabilities.tools[]` with Zod schemas | 🔴 CRITICAL |
| **L4: Data & Context** | Plugin có ghi data vào context? Memory scope (session/user/workspace) đã khai báo? | `contextScope` declaration hoặc `stateless: true` | ⚠️ WARN |
| **L5: AI Inference** | Plugin có `cognitiveLoad` và `referModelTier` declaration? | Numeric values in manifest | ⚠️ WARN (defaults sẽ được assign) |
| **L6: LLMOps & Co-Evolution** | OTel spans có được emit cho plugin invocations? Telemetry pipeline connected? | OTel instrumentation code hoặc MCP transport auto-instrumentation | ⚠️ WARN |

---

## Trigger Mechanism Audit Checklist

Mỗi plugin PHẢI khai báo ít nhất 1 trigger mode. Audit checklist:

| Trigger Mode | Mô tả | Validation |
|---|---|---|
| `intent` | Agent tự phát hiện plugin qua NL intent matching (pgvector similarity search) | Verify embedding exists in `PluginCatalogEmbedding` table |
| `explicit` | User gọi trực tiếp bằng tên hoặc slash command | Verify `SlashCommandRegistry` entry hoặc `@mention` handler |
| `workflow_node` | Plugin được gọi như một Node trong Workflow DAG | Verify `WorkflowNodeDefinition` binding exists |
| `event` | Plugin phản ứng với system events (webhook, state change) | Verify event subscription config in manifest |
| `cron` | Plugin chạy theo lịch định kỳ | Verify cron expression in manifest + BullMQ job scheduler binding |

---

## Mode 1: Development-Time Audit

### Khi nào kích hoạt:
- Khi dev team đang xây plugin feature mới (Epic-41, Epic-92, Epic-95)
- Khi review Story specs cho plugin-related stories
- Khi chạy `/deep-audit` hoặc `/reconcile-change` liên quan đến plugin

### Procedure:

**Step 1: Collect Plugin Inventory**
```
Scan codebase:
- src/plugins/         → Physical plugin implementations
- src/features/plugins/ → Plugin UI/management features
- prisma/schema.prisma → PluginRegistry, PluginVersion, NodeDefinition tables
- _iwish-output/3. Development/1. Epic & Story/ → Story specs mentioning "plugin"
```

**Step 2: Cross-reference against 6-Layer Matrix**
For each discovered plugin/plugin-feature:
1. Check L1: Does it have UI rendering logic OR explicit headless declaration?
2. Check L2: Does it have safety tier + routing embedding?
3. Check L3: Does it have Node binding + EffectGate config?
4. Check L4: Does it declare context scope?
5. Check L5: Does it declare cognitive load + model tier?
6. Check L6: Does it have OTel instrumentation?

**Step 3: Generate Gap Report**
Output format:
```markdown
## Plugin 6-Layer Coverage Audit Report
Date: {timestamp}
Scope: {epic/story/global}

### Coverage Summary
| Plugin/Feature | L1 | L2 | L3 | L4 | L5 | L6 | Triggers | Score |
|---|---|---|---|---|---|---|---|---|
| misa-connector | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | intent,workflow | 4/6 |
| ocr-engine     | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | intent,explicit | 6/6 |

### Critical Gaps (Must Fix Before Ship)
1. [PLUGIN_ID]: Missing L2 safetyTier → RISK: unclassified plugin may bypass EffectGate
2. [PLUGIN_ID]: Missing trigger registration → RISK: plugin unreachable by agents

### Recommended Stories/Tasks
1. Create task to add OTel instrumentation to [PLUGIN_ID]
2. Create task to register [PLUGIN_ID] in pgvector catalog
```

**Step 4: Sign Report**
```bash
# Invoke Watchmen signing for Zero-Trust compliance
python3 .agent/scripts/mcp-signing-daemon.py --sign-artifact <path_to_report.md>
```

---

## Mode 2: Runtime Plugin Guardian (Advisor Agent Mode)

### Khi nào kích hoạt:
- Khi Advisor Agent detect plugin health issues (Health Score < 30)
- Khi Admin/Process Owner tạo hoặc import plugin mới
- Khi Evolution Agent (L6) đề xuất tạo plugin tự động (Tier 4)
- Khi system detect plugin invocation failures > threshold

### Procedure:

**Step 1: Pre-Flight Readiness Check**
Before any plugin activation, validate:
```
□ Manifest parsed successfully (Progressive Manifest v3 schema)
□ safetyTier declared and ≤ tenant's maximum allowed tier
□ At least 1 trigger mode declared and configured
□ Required dependencies (if any) are already installed
□ MCP Tool Poisoning Scan PASSED (mcp-tool-poisoning-defense skill)
□ Credential requirements (if any) can be satisfied by Credential Broker
```

**Step 2: Layer-by-Layer Activation Verification**
```
L2 Gate: Intent embedding generated and indexed? → If NO → Generate and index
L3 Gate: Node binding created? EffectGate rules applied? → If NO → Create with safetyTier defaults
L5 Gate: cognitiveLoad assigned? → If NO → Assign default based on capability signature
L6 Gate: OTel span template configured? → If NO → Apply auto-instrumentation wrapper
```

**Step 3: Dry-Run Simulation (Optional, for L3+ safety plugins)**
```
Generate 3 synthetic test queries matching plugin intent
Execute against sandbox (not production)
Verify: tool-call success, latency < threshold, no error
Report results to Admin via Chat Card
```

**Step 4: Activation Decision**
```
All gates PASS → Auto-activate (for L1-L2 safety tier)
All gates PASS → Present [Activate] Card to Admin (for L3+ safety tier)
Any CRITICAL gate FAIL → Block activation + Generate remediation plan
```

---

## Integration Points

| System | How this skill integrates |
|---|---|
| **Advisor Loop (L3-A)** | Advisor calls this skill when recommending new plugins or detecting usage patterns |
| **Evolution Pipeline (L6)** | Evolution Agent calls this skill before registering auto-generated plugins (Tier 4) |
| **Plugin Import Flow** | Import pipeline calls Mode 2 Pre-Flight before any external plugin is activated |
| **`/deep-audit` workflow** | Orchestrator calls Mode 1 when auditing plugin infrastructure |
| **Health Score Monitor** | When Health Score drops, this skill runs diagnostic to identify which layer is failing |

---

## Anti-Patterns to Detect

1. **Ghost Plugin**: Plugin in PluginRegistry but no embedding in pgvector → unreachable by agents
2. **Orphan Tool**: Tool defined in plugin but no NodeDefinition binding → workflow engine can't compose it
3. **Naked Plugin**: Plugin without safetyTier → bypasses EffectGate security entirely
4. **Silent Plugin**: Plugin without OTel instrumentation → invisible to performance dashboard and Co-Evolution
5. **Zombie Plugin**: Plugin quarantined but still referenced in active WorkflowTemplates → workflow failures
6. **Headless Lie**: Plugin declares `headless: true` but actually renders UI → bypasses L1 UI sandboxing
