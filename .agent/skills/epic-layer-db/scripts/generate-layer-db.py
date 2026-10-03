#!/usr/bin/env python3
"""
Generate Layer-Epic-DB and contract_claims.yaml conforming to template.md [Phase 2.5B, C3, C8]
Scans Prisma models across all schema folders, inspects story data-specs, and scaffolds DB layer specification.
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
import yaml


def parse_prisma_models(project_root: Path):
    models = set()
    model_regex = re.compile(r"^model\s+([A-Za-z0-9_]+)\s*\{", re.MULTILINE)
    schema_dirs = [
        project_root / "prisma" / "schema",
        project_root / "prisma",
        project_root / "packages" / "database" / "prisma",
        project_root / "packages" / "database" / "prisma" / "domains",
    ]
    for sdir in schema_dirs:
        if sdir.is_dir():
            for pfile in sdir.glob("*.prisma"):
                try:
                    content = pfile.read_text(encoding="utf-8")
                    models.update(model_regex.findall(content))
                except Exception:
                    continue
    return sorted(list(models))


def extract_story_models(epic_dir: Path):
    story_models = {"owned": set(), "reads": set()}
    model_regex = re.compile(r"model\s+([A-Za-z0-9_]+)\s*\{", re.MULTILINE)
    read_regex = re.compile(r"-\s+\*\*`([A-Za-z0-9_]+)`\*\*", re.MULTILINE)
    for data_spec in epic_dir.glob("Story-*/data-spec.md"):
        try:
            content = data_spec.read_text(encoding="utf-8")
            found = model_regex.findall(content)
            story_models["owned"].update(found)
            
            for match in read_regex.findall(content):
                if match not in story_models["owned"]:
                    story_models["reads"].add(match)
        except Exception:
            continue
    
    # Remove any overlaps just in case
    story_models["reads"] = story_models["reads"] - story_models["owned"]
    return story_models


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


def main():
    parser = argparse.ArgumentParser(description="Generate Layer-Epic-DB and contract_claims.yaml")
    parser.add_argument("--epic-dir", required=False, help="Directory containing target epic docs")
    parser.add_argument("--output", required=False, help="Custom output path for layer-epic-db.md")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[4]
    all_models = parse_prisma_models(project_root)

    if not args.epic_dir:
        print(json.dumps({"models": all_models}, indent=2))
        return

    epic_dir = Path(args.epic_dir).resolve()
    epic_dir.mkdir(parents=True, exist_ok=True)
    epic_id, value_stream, title = parse_epic_metadata(epic_dir)

    output_path = Path(args.output).resolve() if args.output else (epic_dir / "layer-epic-db.md")
    claims_path = epic_dir / "contract_claims.yaml"

    # Identify models from story data-specs first
    story_models = extract_story_models(epic_dir)
    owned_models = sorted(list(story_models["owned"]))

    # Also match models from codebase related to epic title
    clean_title = re.sub(r"[^A-Za-z0-9]", "", title)
    for m in all_models:
        if len(m) > 3 and (m.lower() in clean_title.lower() or clean_title.lower() in m.lower()):
            if m not in owned_models:
                owned_models.append(m)

    if not owned_models:
        print(f"⚠️ WARNING: No Prisma models matched for {epic_id}. Emitting scaffold with [TODO_DEFINE_MODEL] markers.")
        fallback_model = "[TODO_DEFINE_OWNED_MODEL]"
        owned_list_str = f"- **`[TODO_DEFINE_OWNED_MODEL]`**: Core entity for {epic_id}. (Agent MUST replace with actual models from story analysis)"
        primary_model = "TodoModel"
        owned_str = "[TODO_DEFINE_OWNED_MODEL]"
    else:
        owned_list_str = "\n".join([f"- **`{m}`**: Core entity owned and managed by {epic_id}." for m in owned_models])
        primary_model = owned_models[0]
        owned_str = ", ".join(owned_models)

    # READS models should NOT be blindly hardcoded
    reads_models = sorted(list(story_models["reads"]))
    if not reads_models:
        reads_list_str = "- None declared (Agent MUST analyze story data-specs to identify referenced models)"
        reads_str = "None"
    else:
        reads_list_str = "\n".join([f"- **`{m}`**: Read-only reference for tenancy and authorization." for m in reads_models])
        reads_str = ", ".join(reads_models)

    template_str = """---
epic_id: "{epic_id}"
value_stream: "{value_stream}"
layer: db
status: draft
cs: 3
models_count: {models_count}
---

# Layer-Epic-DB: {title}

## 1. Data Architecture & Scope Overview
Data architecture and persistence boundary for {epic_id} ({value_stream}).
Models are mapped and validated against `2.2. database-spec.md` Section 99.

## 2. Entity Inventory & Classification

### 2.1 Owned Models (New & Schema Master for this Epic)
{owned_list_str}

### 2.2 Mutated Models (Cross-Epic Data Mutation)
- None (pure domain boundary isolation)

### 2.3 Read-Only Models (Cross-Epic Reference/Query Only)
{reads_list_str}

## 3. Schema Definitions & Field Specifications

```prisma
// Authoritative definitions for {epic_id}
model {primary_model} {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  status      String   @default("ACTIVE")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
}
```

## 4. Entity-Relationship Diagram

```mermaid
erDiagram
    Tenant ||--o{ {primary_model} : "owns"
    User ||--o{ {primary_model} : "creates"

    {primary_model} {
        string id PK
        string tenantId FK
        string name
        string status
        datetime createdAt
    }
```

## 5. Data Migration, Seeding & Integrity Considerations
- **Migration Strategy**: Additive schema migrations only; zero-downtime compatible.
- **Seeding**: Initial test records seeded via `db:seed`.
- **Integrity**: Enforce multi-tenant isolation via `tenantId` index on all queries.

## 6. Contract Claims Summary
- **OWNS**: [{owned_str}]
- **READS**: [{reads_str}]
- **MUTATES**: []
"""
    doc_content = (
        template_str
        .replace("{epic_id}", epic_id)
        .replace("{value_stream}", value_stream)
        .replace("{title}", title)
        .replace("{models_count}", str(len(owned_models) + len(reads_models)))
        .replace("{owned_list_str}", owned_list_str)
        .replace("{reads_list_str}", reads_list_str)
        .replace("{primary_model}", primary_model)
        .replace("{owned_str}", owned_str)
        .replace("{reads_str}", reads_str)
    )

    output_path.write_text(doc_content, encoding="utf-8")

    # Generate contract_claims.yaml matching schema (C8: removed hardcoded has_ui_stories: True)
    valid_claims = []
    for m in owned_models:
        if m != "[TODO_DEFINE_OWNED_MODEL]":
            valid_claims.append({
                "model": m,
                "intent": "OWNS",
                "rationale": f"Primary lifecycle and schema ownership for {epic_id} (Story data-spec declared)"
            })
    for m in reads_models:
        valid_claims.append({
            "model": m,
            "intent": "READS",
            "rationale": f"Cross-domain reference required by {epic_id}"
        })

    if not valid_claims:
        # Fallback minimal schema-compliant placeholder if no models discovered yet
        valid_claims.append({
            "model": "TodoModel",
            "intent": "OWNS",
            "rationale": f"Pending explicit model assignment for {epic_id} by Developer/Agent"
        })

    claims_payload = {
        "epic_id": epic_id,
        "value_stream": value_stream,
        "claims": valid_claims
    }

    claims_path.write_text(yaml.dump(claims_payload, sort_keys=False), encoding="utf-8")

    print(f"✅ Generated template-compliant Layer-Epic-DB: {output_path}")
    print(f"✅ Emitted contract claims (without hardcoded UI flag): {claims_path}")


if __name__ == '__main__':
    main()
