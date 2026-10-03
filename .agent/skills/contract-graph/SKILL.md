---
name: contract-graph
description: Unified Contract Graph (UCG) synchronization engine, multi-layer graph indexer, and drift classification engine across Planning, Stories, Prisma schema, UI components, and API routes.
---

# Contract Graph (`/contract-graph`)

UCG (Unified Contract Graph) is the machine-queryable single source of truth (SSOT) graph stored in FalkorDB, linking:
- Planning Entities (`2.2. database-spec.md`)
- Prisma Models (`prisma/schema.prisma`)
- Story Contract Claims (`data-spec.md` & story frontmatter)
- UI Components (`src/components/`, `2.11. component-registry.md`)
- API Endpoints (`server/**/*.routes.ts`, `2.12. api-registry.md`)

## Infrastructure & Port Configuration (Cowok-ai)
- **Container Name**: `distro-falkordb`
- **Host Port**: `127.0.0.1:6379` (mapped to internal `6379/tcp`)
- **Important**: Port `6379` and container `distro-falkordb` belong to the **Distro** project. In Cowok-ai, ALL FalkorDB connections MUST use `localhost:6379` or `docker exec distro-falkordb redis-cli`.

## Commands

```bash
# Bootstrap UCG and seed 2.2, 2.11, 2.12 registries from code (using Cowok-ai schema)
python3 .agent/skills/contract-graph/scripts/ucg-sync.py --mode bootstrap --schema prisma/schema.prisma --force-overwrite

# Ingest Epic claims into FalkorDB
python3 .agent/skills/contract-graph/scripts/ucg-sync.py --mode inject-claims --claims-file "<path_to_contract_claims.yaml>"

# Triangulate and classify drift across Planning, Stories, and Prisma
python3 .agent/skills/contract-graph/scripts/ucg-sync.py --mode triangulate

# Incremental sync-back on story completion
python3 .agent/skills/contract-graph/scripts/ucg-sync.py --mode sync-back --story-dir "<story_dir>"

# Replay buffered writes if FalkorDB was previously down
python3 .agent/skills/contract-graph/scripts/ucg-sync.py --mode replay-buffer
```

## Architecture & Schema
See `ucg-schema.md` for full node and edge specifications, and `scripts/cypher-templates.yaml` for standardized Cypher query templates.
