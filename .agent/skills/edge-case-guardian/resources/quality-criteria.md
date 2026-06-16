# Edge Case Quality Criteria

## Purpose
Quality gate checklist for evaluating whether an identified edge case is well-defined and actionable.

---

## The 6-Point Quality Gate

Every edge case MUST pass ALL 6 criteria to be considered well-defined:

### 1. ✅ Specific Trigger
- **Describes exactly** what input/action/condition causes the edge case
- ❌ Bad: "Something goes wrong with orders"
- ✅ Good: "User submits order with qty=0 for a combo item while promotion is active"

### 2. ✅ Observable Impact  
- **Clear, measurable consequence** of the edge case occurring
- ❌ Bad: "System might behave unexpectedly"
- ✅ Good: "Order saved with ₫0 total, inventory deducted but revenue = 0, financial report distorted"

### 3. ✅ Reproducible
- **Step-by-step** reproduction path or scenario description
- ❌ Bad: "Sometimes it breaks"
- ✅ Good: "Steps: 1) Open NVBH catalog 2) Add combo T-01 3) Set qty to 0 4) Click 'Đặt hàng'"

### 4. ✅ Scored (FMEA)
- Has **RPN score** (Severity × Probability × Detectability)
- ❌ Bad: "This is a high-risk issue"
- ✅ Good: "S=4 × P=3 × D=3 = 36 🟡 IMPORTANT"

### 5. ✅ Sourced
- Has **attribution** tag: [RESEARCHED], [KG-LINKED], [NOVEL], or [UNVERIFIED]
- ❌ Bad: No source mentioned
- ✅ Good: "[RESEARCHED] Common e-commerce qty validation vulnerability — OWASP Input Validation"

### 6. ✅ Actionable
- Has a **resolution path** (how the system should handle it)
- ❌ Bad: "Needs further investigation"
- ✅ Good: "Add Zod validation: `z.number().int().min(1)` in OrderItemDto + frontend qty input min=1"

---

## Anti-Patterns (Edge Cases to REJECT)

| Anti-Pattern | Why It's Bad | What to Do Instead |
|---|---|---|
| **Too vague** | "Users might do unexpected things" | Specify WHICH user does WHAT unexpected thing |
| **Hallucinated** | Edge case with no grounding in reality | Research first, mark [UNVERIFIED] if no source found |
| **Duplicate** | Same edge case already in Knowledge Graph | Link to existing node instead of creating new |
| **Non-actionable** | "System could fail under extreme load" | Define WHAT load level, WHAT failure mode, WHAT threshold |
| **Out of scope** | Edge case for a feature not in current epic | Document in KG with status "Deferred" and link to future epic |
| **Happy path disguised** | "User enters valid email and registers" | This is acceptance criteria, not an edge case |
