# Research Prompt Library

## Purpose
Pre-built search queries for when the Edge Case Guardian needs to research edge cases for specific features. Organized by domain and pillar.

---

## Generic Templates (Replace [FEATURE])

### General Edge Cases
- `"[FEATURE] common failures production"`
- `"[FEATURE] edge cases bugs"`
- `"[FEATURE] error handling best practices"`
- `"[FEATURE] what could go wrong"`

### Security-Specific (P6)
- `"[FEATURE] security vulnerabilities OWASP"`
- `"[FEATURE] IDOR vulnerability"`
- `"[FEATURE] multi-tenant data leakage"`

### Concurrency-Specific (P3)  
- `"[FEATURE] race condition"`
- `"[FEATURE] concurrent access deadlock"`
- `"[FEATURE] optimistic locking failure"`

### Data Integrity (P4)
- `"[FEATURE] data corruption"`
- `"[FEATURE] calculation precision loss"`
- `"[FEATURE] timezone date boundary bug"`

---

## DMS Domain-Specific Prompts

### Order Processing
- `"e-commerce order processing edge cases"`
- `"order management system concurrent orders last stock"`
- `"DMS order cancellation partial delivery"`
- `"order state machine design failures"`

### Inventory / Stock
- `"inventory management race condition stock count"`
- `"warehouse management system inbound stock edge cases"`
- `"COGS calculation weighted average edge cases"`
- `"stock adjustment concurrent operations ERP"`

### Promotions / CTKM
- `"promotion engine edge cases e-commerce"`
- `"discount stacking rules conflicts"`  
- `"gift with purchase edge cases out of stock"`
- `"combo pricing calculation precision"`

### Debt / Financial
- `"credit limit management concurrent charges"`
- `"accounts receivable edge cases ERP"`
- `"debt management timezone period boundary"`
- `"financial reconciliation edge cases"`

### Multi-Tenant / SaaS
- `"multi-tenant data isolation failures"`
- `"SaaS tenant data leakage bugs"`
- `"multi-tenant pricing configuration conflicts"`

### Mobile / Offline
- `"mobile app offline sync edge cases"`
- `"offline-first database sync conflicts"`
- `"WatermelonDB sync failure recovery"`
- `"mobile app slow network edge cases"`

### Payments
- `"payment gateway timeout edge cases"`
- `"QR code payment callback failure"`
- `"payment reconciliation mismatch"`
- `"double payment prevention"`
