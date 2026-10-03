---
name: epic-layer-db
description: Designs and generates horizontal Layer-Epic-DB and contract_claims.yaml for an Epic, scanning Prisma models and story data-specs.
---

# Epic Layer DB (`/epic-layer-db`)

Executes horizontal database model & contract claims design for an Epic:
1. Scans Prisma schemas across packages and story data-specs.
2. Scaffolds `layer-epic-db.md` and `contract_claims.yaml`.
3. Validates contract claims against schema and checks cross-epic OWNS collision.
