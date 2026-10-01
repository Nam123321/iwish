---
name: project-drift-detector
description: >
  Continuous Macro-Auditor and Legacy Migration Engine for I-Wish Anti-Drift Architecture (V3).
  Enforces SSOT boundaries across Prisma, APIs, and Story manifests.
---

# 🛡️ Project Drift Detector Skill

## Purpose
`project-drift-detector` is a continuous macro-auditor and contract verification engine designed to eliminate SSOT drift between architecture documentation (`data-spec.md`, `contract-manifest.yaml`) and actual source code (`schema.prisma`, endpoints).

## Core Capabilities
1. **Continuous Project Drift Audit (`--mode continuous`)**:
   - Compares production database AST with all active and completed story manifests.
   - Detects **Orphaned Models** (database tables created without an owning story).
   - Detects **Phantom Models** (models documented in specs that were never built).
   - Detects **Mutation Collisions** (two concurrent stories claiming write authority over the same model).
2. **AI Contract Compiler Integration**:
   - Generates bounded `contract-context.json` slices for Stage 3B (Code Execution).
   - Guarantees that `/pi-code-agent` and `/omp-orch-skill` code within strict physical data boundaries.
3. **Semantic Diff Pre-Merge Gate (`validate-contract-semantic-diff.py`)**:
   - Evaluates Git diffs of `schema.prisma` against story contract boundaries.
   - Triggers `FAIL CLOSED` if an agent mutates undeclared tables or fields.
4. **Safe Legacy Story Retrofitting (`--mode migrate`)**:
   - Batch scans completed legacy stories and extracts data models into standard frontmatter `contract_manifest` blocks.
   - Marks all retrofitted manifests as `status: UNVERIFIED` until formally reviewed, avoiding unauthorized authority elevation.

## CLI Usage

### 1. Run Continuous Audit
```bash
python3 .agent/skills/project-drift-detector/scripts/project-drift-detector.py \
  --mode continuous \
  --prisma-file prisma/schema.prisma \
  --out _iwish-output/adhoc-workspace/scratch/project-drift-report.json
```

### 2. Compile Story Contract Context (Stage 3A -> Stage 3B)
```bash
python3 .agent/skills/project-drift-detector/scripts/ai-contract-compiler.py \
  --story-dir "_iwish-output/3. Development/1. Epic & Story/VS-03. Workflow & Automation/Epic-10/Story-10.10"
```

### 3. Verify Semantic Diff Gate (Stage 4 Review Gate)
```bash
python3 .agent/skills/project-drift-detector/scripts/validate-contract-semantic-diff.py \
  --story-dir "_iwish-output/3. Development/1. Epic & Story/VS-03. Workflow & Automation/Epic-10/Story-10.10" \
  --output-json "_iwish-output/adhoc-workspace/scratch/semantic-diff-report.json"
```

### 4. Distributed Concurrency & Epoch Publishing (Redis Lease)
```bash
# Acquire lease
python3 .agent/skills/project-drift-detector/scripts/redis-epoch-manager.py --action acquire --client-id <agent_id>

# Publish new epoch upon story completion
python3 .agent/skills/project-drift-detector/scripts/redis-epoch-manager.py --action publish --client-id <agent_id> --epoch <epoch_id>

# Run Garbage Collection (Retaining at least 2 active epochs)
python3 .agent/skills/project-drift-detector/scripts/redis-epoch-manager.py --action gc --retain 2
```

### 5. Migrate Legacy Stories (Dry Run / Live)
```bash
# Dry run
python3 .agent/skills/project-drift-detector/scripts/project-drift-detector.py --mode migrate --dry-run

# Live non-destructive retrofit
python3 .agent/skills/project-drift-detector/scripts/project-drift-detector.py --mode migrate
```

## Zero-Trust Verification Rules
- **Non-Destructive Guarantee**: The migration engine MUST NEVER overwrite or remove existing prose or markdown specifications. It only injects frontmatter metadata.
- **Unverified by Default**: All retrofitted legacy manifests MUST explicitly carry `status: UNVERIFIED`.
- **Fail-Closed Gate**: Any unrecognized Prisma mutations in a story branch cause immediate failure with an exit code of `1`.

## Global Macro-Auditor Integration (Anti-Drift V4)
- **Stage 3A (Plan)**: Acts as the Global Macro-Auditor to scan the architecture pre-implementation and guarantee `impl-plan.md` has comprehensive test coverage for FMEA constraints.
- **Stage 4 (Review)**: Operates as a Secondary Watchmen Gate, blocking merges if contract diff verification fails.

### 6. Batch Reconcile Mode
```bash
# Sửa lỗi cấu trúc cho các story cũ đã completed
python3 .agent/skills/project-drift-detector/scripts/project-drift-detector.py --mode reconcile
```
