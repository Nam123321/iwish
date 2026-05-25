---
description: "Docker Optimization Expert using SlimToolkit (formerly DockerSlim)"
---

# Docker Optimizer (SlimToolkit)

This skill provides expertise in optimizing Docker images using [SlimToolkit](https://github.com/slimtoolkit/slim). It focuses on reducing image size, improving security (seccomp/apparmor), and debugging container internals.

> [!IMPORTANT]
> **SlimToolkit is best suited for custom, single-process application images** (Node.js, Python, Go, etc.).
> It is **NOT recommended** for complex third-party vendor images (databases, caches, API gateways).
> For vendor images, prefer official `-slim` or `-alpine` base tags, or multi-stage Dockerfile builds.

## Optimization Decision Tree

```
Is the image a third-party vendor image (Postgres, Redis, Neo4j, Kong, etc.)?
├── YES → Does an official -slim / -alpine variant exist?
│   ├── YES → Use the official slim/alpine tag in docker-compose.yml
│   └── NO  → Consider multi-stage Dockerfile rebuild
└── NO (custom app image) → Use SlimToolkit `slim build`
```

## Core Capabilities

1.  **Installation & Setup**
    - **Mac (Intel)**:
      ```bash
      curl -L -o dist_mac.zip https://github.com/slimtoolkit/slim/releases/download/1.40.11/dist_mac.zip && unzip dist_mac.zip -d slimtoolkit
      ```
    - **Mac (Apple Silicon)**:
      ```bash
      curl -L -o dist_mac_m1.zip https://github.com/slimtoolkit/slim/releases/download/1.40.11/dist_mac_m1.zip && unzip dist_mac_m1.zip -d slimtoolkit
      ```
    - Verify installation with `./slimtoolkit/dist_mac/slim --version`.

2.  **Image Analysis (`xray`)**
    - Deep dive into image layers and file composition.
    - Identify bloat and unnecessary files.
    - Command: `slim xray --target <image:tag>`

3.  **Image Optimization (`build`)**
    - Minify images by tracing execution and removing unused files.
    - Auto-generate security profiles.
    - **Crucial**: Use `--http-probe=false` for non-web apps or lengthy startups.
    - **Crucial**: Use `--continue-after 30` for autonomous unattended runs.
    - Command: `slim build --target <image:tag> --tag <image:slim> --http-probe=false --continue-after 30`

4.  **Validation**
    - Compare original vs. slim image sizes.
    - Test run the new slim image to ensure functionality.
    - Command: `docker run --rm <image:slim>`

## Multi-Stage Dockerfile (Primary Standard)

For the most reliable and repeatable optimization, use **multi-stage builds** in the Dockerfile itself:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Stage 2: Production (only runtime deps)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
CMD ["npm", "start"]
```

> [!TIP]
> Multi-stage builds are the **gold standard** for image optimization. They produce small,
> secure images without any post-processing tools and work reliably in all CI/CD environments.

## Best Practices

- **Always Keep Original**: Never overwrite the original tag. Use a suffix like `:slim` or `:min`.
- **Http Probe**: By default, `slim` probes HTTP ports. If your app takes time to start, increase timeout or disable probe if irrelevant.
- **Preserved Paths**: If `slim` removes a required file (rare but possible with dynamic imports), use `--include-path /path/to/file` to force inclusion.
- **Environment Variables**: Ensure `.env` is loaded or passed if the app relies on it during startup, as `slim` runs the container to analyze it.
- **Timeout Guard**: Always set `--continue-after <seconds>` to avoid hanging indefinitely during unattended runs.
- **Vendor Images**: Never run `slim build` against Postgres, Redis, Neo4j, Kong, Qdrant, or similar complex vendor images. Use their official `-slim`/`-alpine` tags instead.

## Common Issues & Fixes

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| App crashes in slim image | Missing file/library | Use `--include-path` to add it back |
| Build stuck on probing | App start is slow | Use `--http-probe-cmd` or `--http-probe-start-wait` |
| "No such file or directory" | Dynamic require/import | Explicitly include the directory |
| IPC timeout / sensor error | Complex multi-process image or Docker Desktop networking | Skip image; use official slim/alpine tag or multi-stage build |
| Build hangs indefinitely | No `--continue-after` set | Always add `--continue-after 30` |

## Example Usage

```bash
# Analyze
slim xray --target my-app:latest

# Optimize (Web App)
slim build --target my-app:latest --tag my-app:slim --http-probe-ports 3000 --continue-after 30

# Optimize (CLI Tool)
slim build --target my-cli:latest --tag my-cli:slim --http-probe=false --continue-after 30
```

## Known Incompatible Images

The following image categories should **NOT** be optimized with SlimToolkit:

| Category | Examples | Recommended Alternative |
| :--- | :--- | :--- |
| Databases | Postgres, MySQL, Neo4j | Use official `-slim` or `-alpine` tags |
| Caches | Redis, Memcached | Use `-alpine` tags (e.g., `redis:7-alpine`) |
| API Gateways | Kong, Envoy, Nginx | Use `-alpine` tags |
| Vector DBs | Qdrant, Milvus | Use vendor-provided slim variants |
| Supabase Stack | Studio, Edge Runtime, Realtime | Use Supabase-provided slim tags when available |
