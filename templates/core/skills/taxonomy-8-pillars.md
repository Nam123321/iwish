# 8-Pillar Edge Case Taxonomy — Quick Reference

## Purpose
Quick-reference card for the 8 pillars. Load this when you need a compact checklist without the full SKILL.md context.

---

| # | Pillar | Guiding Question | Key Checks |
|---|--------|-------------------|------------|
| P1 | 🔢 Input Boundary | "What at the extremes?" | min/max/0/null/negative, long strings, special chars, dates |
| P2 | 🔄 State Transition | "Unexpected state?" | deleted entity ops, mid-transition actions, rollback, re-entry |
| P3 | ⚡ Concurrency | "Two actors same time?" | race conditions, deadlocks, optimistic lock fail, eventual consistency |
| P4 | 💾 Data Integrity | "Inconsistent data?" | FK orphans, denorm desync, timezone, precision, cascade fail |
| P5 | 🔌 Integration Failure | "Dependency fails?" | API timeout, partial success, webhook fail, service down |
| P6 | 🔒 Permission & Security | "Wrong access?" | tenant leak, role escalation, expired token, IDOR, mass assign |
| P7 | 🌐 Infrastructure | "Env degraded?" | offline, slow network, low memory, full disk, browser compat |
| P8 | ⚖️ Business Rule Conflict | "Rules contradict?" | promo+debt, combo+gift, MLU pricing, credit+minimum, tax stacking |

## DMS-Specific Additions per Pillar

### P1 — Input Boundary (DMS Focus)
- Product quantity = 0 in cart/order
- Price with excessive decimals (12.123456)
- Product name with HTML/script tags
- Order with 500+ line items
- Voucher code with special characters

### P2 — State Transition (DMS Focus)
- Cancel order after partial delivery
- Edit order during warehouse processing
- Return product after debt settlement closed
- Reactivate deactivated sales agent with pending orders
- Inbound stock adjustment during stock count

### P3 — Concurrency (DMS Focus)
- Two NVBH agents order last-in-stock product
- Concurrent debt charges against same credit limit
- Simultaneous inbound receipt for same PO
- Two admins editing same CTKM promotion
- Stock count while inbound in progress

### P4 — Data Integrity (DMS Focus)
- Debt balance desync after failed transaction rollback
- COGS calculation with mixed weight units
- Period boundary timezone mismatch (UTC vs Asia/Ho_Chi_Minh)
- Foreign key to soft-deleted product in order line
- Combo pricing > sum of parts (should never happen)

### P5 — Integration Failure (DMS Focus)
- AI scan service timeout during inbound
- VietQR payment callback timeout
- Bank reconciliation import with malformed CSV
- Sales App sync failure during poor connectivity
- Webhook missed for order status change

### P6 — Permission & Security (DMS Focus)
- NVBH agent accessing another tenant's customers
- Deactivated user session still valid
- Admin role downgrade while editing sensitive data
- API endpoint missing tenant isolation check
- Direct URL access to other tenant's order

### P7 — Infrastructure (DMS Focus)
- Sales App offline during route visit
- WatermelonDB sync failure after app crash
- Admin dashboard with 10,000+ order table
- Image upload on 2G connection
- PDF receipt generation under heavy load

### P8 — Business Rule Conflict (DMS Focus)
- Promotion applies gift but customer has debt over limit
- Combo price + additional discount exceeds product cost
- Volume discount tier change mid-order
- Customer credit limit change while order is processing
- Free gift product is out of stock
