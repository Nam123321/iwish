---
name: 'visualize-architecture'
description: 'Direct slash command to visualize architecture, workflows, pipelines, and state machines into high-fidelity interactive HTML diagrams and JSON schemas using Archify under the Dual-File Rule.'
triggers:
  - visualize-architecture
  - archify
  - visualize
  - diagram
---

# `/visualize-architecture` - Interactive System Architecture & Workflow Visualizer

Visualizes software architecture, microservices, cloud topologies, data flows, sequences, and workflow state machines using the **Archify** visual engine.

---

## 🛡️ Core Directives & Invariants

1. **Dual-File Rule (Bắt buộc)**:
   Mỗi lần thực thi bắt buộc phải sinh đồng thời cả 2 tệp tại thư mục:
   `_iwish-output/2. Product Planning/system-design-visuals/`:
   - **Schema JSON**: `archify-{topic}-{uuid}.json` (chứa Intermediate Representation chuẩn của Archify).
   - **Interactive HTML**: `archify-{topic}-{uuid}.html` (canvas HTML độc lập, hỗ trợ dark/light mode, pan, zoom, trace motion).

2. **UUID Anti-Collision Constraint**:
   Tên file bắt buộc phải chứa UUID v4 (ví dụ: `archify-auth-pipeline-f47ac10b-58cc-4372-a567-0e02b2c3d479.json`) để tránh xung đột khi nhiều agent hoặc nhánh cùng thực thi.

3. **Sandbox Execution Boundary**:
   Bắt buộc chạy qua script sandbox Zero-Trust:
   `.agent/scripts/run-archify-sandbox.py` (ngăn chặn RCE và kiểm định tính toàn vẹn 9/9 checks).

---

## 🚀 Các Bước Thực thi (Workflow Execution Steps)

### Bước 1: Thu thập Ngữ cảnh & Lựa chọn Loại Sơ đồ (Context & Type Selection)
Phân tích yêu cầu của người dùng hoặc tài liệu tham chiếu (`architecture.md`, `data-spec.md`, `impl-plan.md`, hoặc mã nguồn):
- `architecture`: Sơ đồ thành phần, dịch vụ, database, cloud / security boundary, VPC.
- `workflow`: Luồng nghiệp vụ, CI/CD, approval gates, DAG của worker / queue.
- `sequence`: Chuỗi gọi API, tương tác client - backend - gateway - DB.
- `dataflow`: Pipeline dữ liệu, ETL / ELT, streaming Kafka / BullMQ, data lineage.
- `lifecycle`: Máy trạng thái (State Machine), vòng đời tài liệu / file / đơn hàng.

### Bước 2: Khởi tạo Cấu trúc Archify JSON IR (Draft Schema)
Tạo tệp JSON tại:
`_iwish-output/2. Product Planning/system-design-visuals/archify-{topic}-{uuid}.json`
Đảm bảo cấu trúc:
```json
{
  "schema_version": 1,
  "diagram_type": "<type>",
  "meta": {
    "title": "<Tiêu đề sơ đồ>",
    "quality_profile": "showcase",
    "viewBox": [800, 1000]
  },
  "layout": { "mode": "grid" },
  "components": [
    { "id": "client", "label": "Client UI", "type": "frontend", "pos": [350, 50] },
    { "id": "api", "label": "API Gateway", "type": "backend", "pos": [350, 250] },
    { "id": "db", "label": "PostgreSQL", "type": "database", "pos": [350, 450] }
  ],
  "connections": [
    { "from": "client", "to": "api" },
    { "from": "api", "to": "db" }
  ]
}
```

### Bước 3: Kiểm định Cấu trúc qua Sandbox (Validate Gate)
Chạy lệnh kiểm tra schema:
```bash
python3 .agent/scripts/run-archify-sandbox.py validate <type> "_iwish-output/2. Product Planning/system-design-visuals/archify-{topic}-{uuid}.json"
```
*Lưu ý:* Nếu có lỗi cú pháp hoặc sai component type, sửa lại file JSON trước khi tiến hành render.

### Bước 4: Xuất bản HTML Tương tác qua Sandbox (Deliver Gate)
Chạy lệnh render HTML với chất lượng cao nhất:
```bash
python3 .agent/scripts/run-archify-sandbox.py deliver <type> "_iwish-output/2. Product Planning/system-design-visuals/archify-{topic}-{uuid}.json" "_iwish-output/2. Product Planning/system-design-visuals/archify-{topic}-{uuid}.html" --quality showcase
```

### Bước 5: Đối soát Cơ học & Trình bày Liên kết Kép (Dual-Linking Presentation)
1. Kiểm tra sự tồn tại vật lý của cả 2 tệp:
   - `test -s "_iwish-output/2. Product Planning/system-design-visuals/archify-{topic}-{uuid}.json"`
   - `test -s "_iwish-output/2. Product Planning/system-design-visuals/archify-{topic}-{uuid}.html"`
2. Trả về kết quả trong chat kèm liên kết Markdown có thể click mở trực tiếp:
   - 🎨 **Sơ đồ Trực quan Tương tác (Canvas)**: `[archify-{topic}-{uuid}.html](file://<path>)`
   - 📋 **Đặc tả Cấu trúc Dữ liệu (Schema)**: `[archify-{topic}-{uuid}.json](file://<path>)`
3. (Tùy chọn) Nhúng liên kết kép vào tài liệu kiến trúc liên quan (ví dụ: `2.5. architecture.md`).
