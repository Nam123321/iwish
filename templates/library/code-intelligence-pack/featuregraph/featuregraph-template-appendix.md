---
description: 'FeatureGraph template appendix — Cross-Feature Dependencies section that must be included in story and PRD templates for Producer workflows to feed the FeatureGraph Indexer.'
---

# FeatureGraph Template Appendix

> This appendix defines the **mandatory sections** that Producer workflows (`/create-story`, `/create-prd`) MUST include in their output to enable automatic indexing into the FeatureGraph.

---

## For `/create-story` Template

Add this section **after Acceptance Criteria** and **before Dev Notes**:

```markdown
## Cross-Feature Dependencies

### Impacts (This story changes features that other features depend on)
- FR## — [Feature Name] — [Reason for impact]

### Consumes (This story depends on other features)
- FR## — [Feature Name] — [What this story uses from that feature]

### Shared Entities (Prisma models shared with other features)
- [ModelName] — shared with FR## ([Feature Name])

### Cross-Portal (This feature appears on multiple portals)
- [Portal Name]: [What this feature does on that portal]
```

**Example (Story 5.8 — Payment Voucher):**

```markdown
## Cross-Feature Dependencies

### Impacts
- FR45 — Deposit/Vỏ Chai — Payment changes deposit balance calculation
- FR76 — Revenue Reports — Payment creates revenue entries

### Consumes
- FR8 — Pricing Strategy — Uses price from pricing model
- FR29 — CTKM — Applies promotional discounts

### Shared Entities
- OrderItem — shared with FR29 (CTKM), FR34 (Cart)
- PaymentTransaction — shared with FR45 (Deposit)

### Cross-Portal
- admin: View/manage payment transactions
- sales-web: Process payment at checkout
- sales-app: Process payment on mobile
```

---

## For `/create-prd` Template

Add this field to **each Functional Requirement**:

```markdown
### FR## — [Feature Name]
...existing description...

**Related FRs:** FR##, FR##, FR##
**Primary Portals:** [portal1], [portal2]
**Key Entities:** [Model1], [Model2]
```

---

## Why This Matters

Without these structured sections:
1. The FeatureGraph Indexer **cannot build IMPACTS relationships** accurately.
2. Agents will **miss cross-feature dependencies** during `/dev-story`.
3. The Validation Script will report **orphan nodes** (FRs with no connections).

These sections are the **fuel** that powers the FeatureGraph engine.
