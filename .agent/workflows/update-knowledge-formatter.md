---
description: 'Automatically upgrade legacy documentation files to standard OKF frontmatter, validate, index, and update dashboard.'
---

# /update-knowledge-formatter

## Purpose

Automate the retrofit and upgrade process for existing project documentation, closing the gap when upgrading a project to I-Wish Open Knowledge Format (OKF) standard.

This supportive workflow recursively scans `_iwish-output/` or `_iwish-output/`, formats missing frontmatter blocks based on the context of the files, validates the updated files against standard JSON schemas, indexes them into FalkorDB/Neo4j, and refreshes the user guide dashboard.

## When to Use

Use this workflow when:
- Upgrading an existing project to the OKF pipeline.
- Documents are missing required YAML frontmatter (indicated by warning logs in `iwish doctor` or `validate-okf`).
- Schema validation errors exist across the output folders.

## Upgrade Sequence

### 1. Identify Output Directory
- Look for the active output directory: `_iwish-output/` or `_iwish-output/`.
- If neither exists, halt the command and request generation of the PRD/brief first.

### 2. Auto-Format Files with Frontmatter
- Scan recursively for all `.md` files (excluding `node_modules`, scratch directories, and hidden files).
- For each file that lacks a compliant frontmatter header:
  - **Infer OKF Type:**
    - If path/filename contains `/stories/` or starts with `story-` -> `I-Wish Story`
    - If path/filename contains `/Product Planning/2.1.` or starts with `prd` or `product-brief` -> `I-Wish PRD`
    - If path/filename contains `/Functional Design/3.2. ui` or contains `ui-spec` -> `I-Wish UI Spec`
    - If path/filename contains `/Functional Design/3.3. data` or contains `data-spec` -> `I-Wish Data Spec`
    - If path/filename contains `/Functional Design/3.1. architecture` or contains `architecture-spec` -> `I-Wish Architecture Spec`
    - If path/filename contains `/bug-reports/` or starts with `bug-` -> `I-Wish Bug Report`
    - If path/filename contains `/reconciliation/` or contains `reconciliation` -> `I-Wish Reconciliation Work Item`
    - If path/filename contains `/reviews/` or contains `review` -> `I-Wish Concept`
    - Default -> `I-Wish Concept`
  - **Extract Title:** Scan for H1 heading `# Title` or fall back to the filename.
  - **Extract Description:** Extract description from first non-header paragraphs or use standard fallback.
  - **Format URI:** Generate absolute `file:///...` resource paths.
  - **Prepend YAML:** Prepend the compliant OKF frontmatter to the top of the file.

### 3. Run Validation Gate
- Run `iwish validate-okf` on the target directory.
- Verify that every modified file compiles cleanly with no JSON Schema violations.

### 4. Index Graph Nodes
- Execute `iwish featuregraph-index` to parse the OKF metadata and upsert nodes and `LINKS_TO` relationships in the database graph.

### 5. Refresh Visual Dashboard
- Run `iwish gen-dashboard` to compile and display the updated dependency network.

## Outputs
- Standardized OKF-compliant documentation files with valid frontmatter.
- Updated Features Graph with documented relationships.
- Refreshed interactive visual dashboard.
