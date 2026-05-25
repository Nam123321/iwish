---
description: 'Query the FeatureGraph to analyze cross-feature impact when changing, removing, or upgrading product features. PM/Architect tool.'
---

# /impact-analysis — FeatureGraph Impact Analysis

> **Agent:** Bulma (PM) + Piccolo (Architect support)
> **Purpose:** Cho phép Master/Architect truy vấn nhanh FeatureGraph để đánh giá tác động khi thay đổi specs.

---

## Khi nào dùng?

- Master muốn biết: "Nếu bỏ tính năng X thì ảnh hưởng tới đâu?"
- Architect muốn estimate effort cho thay đổi PRD
- PM cần scoping cho sprint mới

---

## Workflow Steps

### Step 1: Xác định FR cần phân tích

- Hỏi Master: "Master muốn phân tích tính năng nào? (Nhập FR ID hoặc tên tính năng)"
- Nếu Master nhập tên → tìm FR ID bằng:
  ```
  concept_features("pricing")  // nếu nhập concept
  ```
  hoặc tìm trong `prd.md` bằng keyword.

### Step 2: Query FeatureGraph (MCP)

> [!IMPORTANT]
> Bắt buộc gọi MCP tools, KHÔNG tự suy luận.

1. **Impact Analysis (độ sâu 3):**
   ```
   feature_impact(fr_id, depth=3)
   ```

2. **Portal Coverage:**
   ```
   feature_portals(fr_id)
   ```

3. **Implementation Status:**
   ```
   feature_stories(fr_id)
   ```

### Step 3: Trình bày kết quả cho Master

Format báo cáo:

```markdown
## 🔍 Impact Analysis: [FR_ID] — [FR_NAME]

### Tác động trực tiếp (Depth 1)
| FR | Tên | Portals |Priority |
|---|---|---|---|
| FR9 | Dynamic Pricing | admin, sales-web | 🔴 High |

### Tác động gián tiếp (Depth 2-3)
| FR | Tên | Qua FR nào | Distance |
|---|---|---|---|
| FR34 | Cart Auto-Apply | via FR29 | 2 |

### Portals bị ảnh hưởng
- Admin Portal: Config, Setup screens
- Webstore: Display, Cart screens
- Sales App: Catalog, Order screens

### Stories cần review/update
| Story | Tên | Status | Action |
|---|---|---|---|
| S1.7 | Pricing Setup | ✅ Done | Needs update |
| S4.2 | CTKM Engine | 🔄 In Progress | Check impact |

### Ước lượng Effort: [X] story updates, [Y] portals affected
```

### Step 4: Hỏi Master quyết định

- "Master muốn tạo story mới cho các tính năng bị ảnh hưởng không?"
- "Master muốn em chạy `/create-story` cho các FR cần update không?"

---

## Graceful Degradation

Nếu FalkorDB/MCP không khả dụng:
1. Đọc `feature-dependency-map.yaml` (fallback file)
2. Nếu YAML cũng không có → đọc `feature-hierarchy.md` và tự cross-reference (cảnh báo Master kết quả có thể không đầy đủ)
