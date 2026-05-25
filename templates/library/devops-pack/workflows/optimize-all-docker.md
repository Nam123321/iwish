---
description: "Optimize Docker images using SlimToolkit — scoped to custom app images with smart fallback"
---

# Bulk Docker Optimization (v2)

This workflow optimizes **custom application Docker images** using SlimToolkit.
It skips third-party vendor images (databases, caches, gateways) and recommends
official `-slim` / `-alpine` variants instead.

> [!IMPORTANT]
> SlimToolkit works reliably on **simple, single-process app containers** (Node, Python, Go CLIs).
> It frequently times out on complex multi-process vendor images (Postgres, Redis, Neo4j, Kong, etc.).
> For those, always prefer official slim/alpine base tags.

## Steps

1. **List Images**
   - Run `docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}"`.
   - Partition into two groups:
     - **Custom App Images** — images built by the project (e.g., `my-api:latest`, `admin-portal:latest`).
     - **Vendor Images** — third-party images (Supabase, Redis, Neo4j, Qdrant, etc.).
   - Skip any image already tagged with `:slim` or `-slim`.

2. **Optimize Custom App Images**
   - For each custom app image:
     ```bash
     slim build --target <IMAGE> --tag <IMAGE>:slim \
       --http-probe=false --continue-after 30
     ```
   - Log original vs slim size.
   - If optimization fails or times out (>120 s), log the failure and continue.

3. **Recommend Vendor Image Alternatives**
   - For each vendor image, check if a `-slim` or `-alpine` variant exists:
     - Suggest updating `docker-compose.yml` to use the lighter official tag.
     - Example: `postgres:17.6.1.071` → `postgres:17.6.1.071-slim` (4.58 GB → 37 MB).
   - If no slim variant is available, suggest **multi-stage Dockerfile rebuilds** as the primary optimization path.

4. **Summary**
   - Report per-image results (success / failed / skipped / recommended).
   - Report total space saved and potential savings from vendor switches.

## Fallback Rules

| Scenario | Action |
| :--- | :--- |
| `slim build` times out (>120 s) | Skip image, log failure, continue to next |
| Vendor image detected | Do NOT attempt `slim build`; recommend official `-slim`/`-alpine` tag |
| No slim variant available | Recommend multi-stage Dockerfile rebuild |
| Image already has `:slim` or `-slim` tag | Skip entirely |
