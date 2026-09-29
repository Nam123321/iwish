---
name: Edge Case Guardian
description: >
  Systematic edge case, painful case, and business rule conflict identification 
  using the 8-Pillar Taxonomy and FMEA-inspired scoring. Forces research-backed 
  analysis before declaring edge cases. Maintains a Knowledge Graph of all 
  identified risks linked to features, stories, and epics.
---

# 🛡️ Edge Case Guardian SKILL

## Purpose

Provides a **research-backed, systematic framework** for identifying edge cases, painful scenarios, and business rule conflicts across the SDLC. This SKILL is the "recipe book" — it contains the taxonomy, scoring rubric, research rules, and Knowledge Graph schema that any BMAD agent can load.

## When to Use

- During **PRD creation/validation** — light scan for architectural-level risks
- During **Epic & Story creation** — full 8-Pillar analysis per epic/story
- During **Implementation Readiness** check — cross-check stories against Knowledge Graph
- During **Code Review** — verify known edge cases are handled in code
- During **Retrospective** — harvest new edge cases discovered during implementation
- During **Data Architecture Review** — check data-level edge cases (boundary, integrity, concurrency)
- **On demand** — any agent can load this SKILL for edge case thinking

---

## 1. The 8-Pillar Edge Case Taxonomy

Every feature, story, or epic MUST be analyzed through these 8 lenses:

### P1: Input Boundary 🔢
> "What happens at the extremes of every input?"

- Minimum, maximum, zero, negative values
- Empty strings, null, undefined
- Extremely long inputs, special characters, Unicode
- Invalid data types (string where number expected)
- Date boundaries: leap year, timezone crossings, epoch limits

### P2: State Transition 🔄
> "What if the entity is in an unexpected state?"

- Operations on deleted/archived entities
- Actions during state transitions (edit during processing)
- Rollback after partial state change
- Re-entry into a completed state
- State machine gaps: undefined transitions

### P3: Concurrency ⚡
> "What if two actors do this simultaneously?"

- Race conditions on shared resources (last stock item)
- Concurrent writes to same record
- Deadlocks from multi-table transactions
- Optimistic vs pessimistic locking failures
- Eventual consistency gaps in distributed operations

### P4: Data Integrity 💾
> "What if the data is inconsistent or corrupted?"

- Foreign key to deleted parent record
- Denormalized value out of sync with source
- Timezone/locale mismatch in date calculations
- Precision loss in financial calculations (Float vs Decimal)
- Orphaned records from failed cascades

### P5: Integration Failure 🔌
> "What if an external dependency fails?"

- API timeout or 5xx response
- Partial success in multi-step integration
- Webhook delivery failure / duplicate delivery
- Third-party service downtime (payment, AI, SMS)
- Network partition between microservices

### P6: Permission & Security 🔒
> "What if someone accesses this who shouldn't?"

- Cross-tenant data leakage
- Role escalation (user → admin actions)
- Expired token/session reuse
- IDOR (Insecure Direct Object Reference)
- Mass assignment / parameter tampering

### P7: Infrastructure & Environment 🌐
> "What if the environment is degraded?"

- Offline mode (mobile/Sales App)
- Slow network (2G, high latency)
- Low memory / CPU saturation
- Full disk / database connection pool exhaustion
- Browser compatibility (old Safari, embedded WebView)

### P8: Business Rule Conflict ⚖️
> "What if two valid business rules contradict?"

- Promotion + debt limit interaction
- Combo discount + gift stacking rules
- Multi-level unit pricing edge cases
- Customer credit limit vs order minimum
- Tax calculation on discounted + combo + gift items

---

## 2. Research Mandate (MANDATORY)

```
🚨 CRITICAL: Edge cases MUST be research-backed. No hallucination allowed.
```

### Before generating edge cases for any feature/story:

1. **Web Research (Required):**
   - Search: `"[Feature Name] common failures"` OR `"[Feature] edge cases"`
   - Search: `"[Domain] [Feature] real-world incidents"` OR `"[Feature] bugs production"`
   - Search: `"[Feature] security vulnerabilities"` (for P6 pillar)

2. **Knowledge Graph Review (Required):**
   - Check `_iwish-output/edge-case-knowledge/index.md` for related features
   - Load relevant pillar files for cross-referencing

3. **Source Attribution (Required for each edge case):**
   - ✅ `[RESEARCHED]` — Citation URL or source reference
   - ✅ `[KG-LINKED]` — Reference to existing Knowledge Graph node
   - ✅ `[NOVEL]` — New scenario with explicit reasoning why it's uncovered
   - ⚠️ `[UNVERIFIED]` — No source found, requires user validation

4. **Quality Gate:**
   - Edge cases marked `[UNVERIFIED]` MUST be flagged to user for validation
   - At least 60% of edge cases per feature should be `[RESEARCHED]` or `[KG-LINKED]`

---

## 3. Scoring Rubric (FMEA-Inspired)

Each edge case is scored on 3 axes (1–5 scale):

### Severity (S) — "How bad is it?"
| Score | Level | Description | Examples |
|-------|-------|-------------|----------|
| 1 | Cosmetic | UI glitch, no data impact | Wrong icon, minor layout shift |
| 2 | Minor | Inconvenience, easy workaround | Need to refresh page, retry button |
| 3 | Moderate | Wrong calculation, partial data loss | Incorrect total, missing line item |
| 4 | Major | Financial damage, data corruption | Wrong payment amount, orphaned records |
| 5 | Critical | Security breach, complete data loss | Tenant data leak, cascade delete |

### Probability (P) — "How often?"
| Score | Level | Description |
|-------|-------|-------------|
| 1 | Rare | Once per year or less |
| 2 | Unlikely | Monthly occurrence |
| 3 | Occasional | Weekly occurrence |
| 4 | Likely | Daily occurrence |
| 5 | Certain | Every transaction could trigger |

### Detectability (D) — "How quickly do we notice?"
| Score | Level | Description |
|-------|-------|-------------|
| 1 | Obvious | Immediate user-visible error |
| 2 | Quick | Visible in same session/page |
| 3 | Delayed | Only in reports/logs next day |
| 4 | Hidden | Discovered during audit/reconciliation |
| 5 | Silent | Data corrupted, discovered months later |

### Risk Priority Number (RPN)

**RPN = S × P × D** (range: 1–125)

| RPN Range | Label | Action Required |
|-----------|-------|----------------|
| 60–125 | 🔴 CRITICAL | **MUST** have dedicated AC + automated test. BLOCKER if missing. |
| 25–59 | 🟡 IMPORTANT | **SHOULD** have AC in story. Manual test acceptable. |
| 1–24 | 🟢 AWARENESS | **MAY** document for awareness. No AC required. |

---

## 4. Quality Criteria for Edge Cases

An edge case is considered **well-defined** when it satisfies ALL of these:

| Criterion | Description | Example (Good) | Example (Bad) |
|-----------|-------------|----------------|---------------|
| **Specific Trigger** | Describes exactly what causes it | "User submits order with qty=0 for a combo item" | "Something goes wrong with orders" |
| **Observable Impact** | Clear consequence | "Order saved with ₫0 total, inventory not adjusted" | "System might behave unexpectedly" |
| **Reproducible** | Can be recreated | "Steps: Add combo → set qty to 0 → click submit" | "Sometimes it breaks" |
| **Scored** | Has RPN | "S=4 × P=3 × D=3 = 36 🟡" | No scoring |
| **Sourced** | Has attribution | "[RESEARCHED] Common e-commerce qty=0 bug [URL]" | No source |
| **Actionable** | Has resolution path | "Validate qty > 0 in Zod schema + frontend" | "Needs investigation" |

---

## 5. Knowledge Graph Schema

### Location
```
_iwish-output/edge-case-knowledge/
├── index.md                    # Master index: all nodes by pillar, epic, feature
├── pillars/
│   ├── p1-input-boundary.md
│   ├── p2-state-transition.md
│   ├── p3-concurrency.md
│   ├── p4-data-integrity.md
│   ├── p5-integration-failure.md
│   ├── p6-permission-security.md
│   ├── p7-infrastructure-environment.md
│   └── p8-business-rule-conflict.md
└── epics/
    └── [epic-name]-risk-matrix.md   # Per-epic summary view
```

### Node Format (in pillar files)
```markdown
### EC-[PILLAR]-[SEQ]: [Short Title]
- **Pillar:** P[N] — [Pillar Name]
- **RPN:** S=[n] × P=[n] × D=[n] = [Score] [🔴/🟡/🟢]
- **Trigger:** [What causes this edge case]
- **Impact:** [Business/technical consequence]
- **Source:** [RESEARCHED|KG-LINKED|NOVEL|UNVERIFIED] — [Citation/link/reasoning]
- **Linked Features:** [Epic X / Story Y.Z / Feature Name]
- **Resolution:** [How the system should handle it]
- **AC Reference:** [Story file path + AC number, or "pending"]
- **Status:** [Open | Mitigated | Accepted-Risk | Deferred]
```

### Index Format
```markdown
# Edge Case Knowledge Graph — Index

## Summary
- Total nodes: [N]
- Open: [N] | Mitigated: [N] | Accepted: [N] | Deferred: [N]
- 🔴 Critical (RPN ≥ 60): [N]
- 🟡 Important (RPN 25-59): [N]  
- 🟢 Awareness (RPN < 25): [N]

## By Pillar
| Pillar | Count | 🔴 | 🟡 | 🟢 |
|--------|-------|-----|-----|-----|
| P1 Input Boundary | ... | | | |
...

## By Epic
| Epic | Count | 🔴 | 🟡 | 🟢 |
|------|-------|-----|-----|-----|
| Epic 1 | ... | | | |
...
```

---

## 6. AC Injection Format

Edge cases with RPN ≥ 25 MUST be translated into Acceptance Criteria:

```markdown
**[EDGE-CASE: EC-P3-001]** Given {precondition describing the edge scenario}
When {action that triggers the edge case}
Then {expected safe behavior / recovery}
And {data integrity preserved / user notified}
```

Example:
```markdown
**[EDGE-CASE: EC-P3-007]** Given two sales agents viewing the same product with qty=1 in stock
When both submit orders simultaneously
Then only the first order is confirmed
And the second agent receives "Hết hàng" with option to adjust order
```

---

## 7. Self-Update Protocol

After EVERY edge case analysis session:

1. **Add new nodes** to the appropriate pillar file
2. **Update index.md** with new counts and links
3. **Update epic risk matrix** if the session touched that epic
4. **Link to story ACs** when edge cases are injected into stories
5. **Transition status** of nodes:
   - `Open` → `Mitigated` when AC is written and story is done
   - `Open` → `Deferred` when user explicitly defers
   - `Open` → `Accepted-Risk` when user accepts the risk without mitigation

---

## 8. Analysis Depth by Context

| Context | Depth | Pillars to Scan | Output |
|---------|-------|----------------|--------|
| **PRD Validation** | Light | P2, P3, P5, P8 | High-level risk flags in PRD doc |
| **Epic Design** | Medium | All 8 pillars | Epic risk matrix |
| **Story Creation** | Full | All 8 pillars | AC injection + KG nodes |
| **Implementation Readiness** | Cross-check | All open 🔴 nodes | BLOCKER report |
| **Code Review** | Targeted | Based on changed files | Verify known ECs are handled |
| **Retrospective** | Harvest | All 8 pillars | New ECs from production learnings |
