#!/usr/bin/env python3
"""
Generate Layer-Epic-API document conforming to template.md [Phase 2.5B]
Scans server routes, binds data models from layer-epic-db.md, and scaffolds API contract specifications.
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path


def parse_epic_metadata(epic_dir: Path):
    epic_file = epic_dir / "epic.md"
    epic_id = epic_dir.name
    value_stream = "Unknown"
    title = epic_dir.name

    if epic_file.exists():
        content = epic_file.read_text(encoding="utf-8")
        m_title = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if m_title:
            title = m_title.group(1).strip()
        m_id = re.search(r"Epic-(\d+)", epic_dir.name)
        if m_id:
            epic_id = f"Epic-{m_id.group(1)}"
        parts = epic_dir.parts
        for p in parts:
            if p.startswith("VS-"):
                value_stream = p
                break
    return epic_id, value_stream, title


def get_bound_models(epic_dir: Path):
    layer_db = epic_dir / "layer-epic-db.md"
    models = []
    if layer_db.exists():
        content = layer_db.read_text(encoding="utf-8")
        models = re.findall(r"-\s+\*\*`([A-Za-z0-9_]+)`\*\*", content)
    if not models:
        models = ["EpicEntity"]
    return models


def scan_existing_routes(project_root: Path):
    routes = []
    route_pattern = re.compile(r'\.(get|post|put|delete|patch)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]')
    next_route_pattern = re.compile(r'export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\b')
    server_dirs = [
        project_root / "server",
        project_root / "src/server",
        project_root / "apps/api",
        project_root / "src/app/api",
        project_root / "api",
    ]

    for sdir in server_dirs:
        if sdir.exists():
            for root, _, files in os.walk(sdir):
                for file in files:
                    if file.endswith('.ts') or file.endswith('.js'):
                        filepath = os.path.join(root, file)
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                content = f.read()
                                matches = route_pattern.findall(content)
                                for method, path in matches:
                                    routes.append({
                                        "method": method.upper(),
                                        "path": path,
                                        "file": filepath
                                    })
                                next_matches = next_route_pattern.findall(content)
                                for method in next_matches:
                                    rel = os.path.relpath(filepath, str(sdir))
                                    endpoint = "/" + rel.replace("/route.ts", "").replace("/route.js", "").replace("\\", "/")
                                    routes.append({
                                        "method": method.upper(),
                                        "path": endpoint,
                                        "file": filepath
                                    })
                        except Exception:
                            continue
    return routes


def main():
    parser = argparse.ArgumentParser(description="Generate Layer-Epic-API conforming to template.md")
    parser.add_argument("--epic-dir", required=False, help="Directory containing target epic docs")
    parser.add_argument("--output", required=False, help="Custom output path for layer-epic-api.md")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[4]
    existing_routes = scan_existing_routes(project_root)

    if not args.epic_dir:
        print(json.dumps(existing_routes[:20], indent=2))
        return

    epic_dir = Path(args.epic_dir).resolve()
    epic_dir.mkdir(parents=True, exist_ok=True)
    epic_id, value_stream, title = parse_epic_metadata(epic_dir)
    bound_models = get_bound_models(epic_dir)

    primary_model = bound_models[0]
    resource_slug = primary_model.lower() + "s"

    output_path = Path(args.output).resolve() if args.output else (epic_dir / "layer-epic-api.md")

    doc_content = f"""---
epic_id: "{epic_id}"
value_stream: "{value_stream}"
layer: api
status: draft
cs: 3
endpoints_count: 3
---

# Layer-Epic-API: {title}

## 1. API Architecture Overview & Protocols
Defines the RESTful and procedure boundaries for {epic_id}.
All endpoints enforce JWT bearer authentication, multi-tenant scoping, and input validation via Zod schemas.

## 2. Endpoint Inventory Table
Lists all endpoints bound to entities declared in `layer-epic-db.md`:

| Method | URI / Procedure Name | Auth / Permission | Bound Model(s) | Status | Description |
|--------|----------------------|-------------------|----------------|--------|-------------|
| GET    | `/api/v1/{resource_slug}` | `Bearer (Member, Admin)` | `{primary_model}` | New | List {primary_model} records with pagination |
| POST   | `/api/v1/{resource_slug}` | `Bearer (Admin)` | `{primary_model}` | New | Create a new {primary_model} record |
| GET    | `/api/v1/{resource_slug}/:id` | `Bearer (Member, Admin)` | `{primary_model}` | New | Retrieve {primary_model} details by ID |

## 3. Request & Response Schemas

```typescript
import {{ z }} from 'zod';

export const Create{primary_model}Schema = z.object({{
  name: z.string().min(2).max(100),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
}});

export type Create{primary_model}Input = z.infer<typeof Create{primary_model}Schema>;

export interface {primary_model}Response {{
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}}
```

## 4. Error Handling & HTTP Status Codes

| Status Code | Error Code | Trigger Condition |
|-------------|------------|-------------------|
| 400 Bad Request | `VALIDATION_ERROR` | Schema validation fails on request body or parameters |
| 401 Unauthorized | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 Forbidden | `FORBIDDEN` | User does not have sufficient role or tenant access |
| 404 Not Found | `RESOURCE_NOT_FOUND` | Target {primary_model} entity not found in tenant scope |
| 409 Conflict | `ENTITY_COLLISION` | Duplicate unique property violation |

## 5. Cross-Epic Contract & Integration Dependencies
- **Upstream Dependencies**: Auth / Tenant session context from Core Platform.
- **Bound Data Models**: `{', '.join(bound_models)}` from `layer-epic-db.md`.
- **Downstream Consumers**: Frontend views specified in `layer-epic-fe.md`.
"""

    output_path.write_text(doc_content, encoding="utf-8")
    print(f"✅ Generated template-compliant Layer-Epic-API: {output_path}")


if __name__ == '__main__':
    main()
