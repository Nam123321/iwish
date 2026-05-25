---
description: "Optimize Docker images using SlimToolkit to reduce size and improve security"
---

# Optimal Docker Workflow

This workflow guides you through optimizing your Docker images using the [SlimToolkit](https://github.com/slimtoolkit/slim). It helps reduce image size (often by 10-30x) and enhances security by removing unnecessary components.

## Prerequisites

- **Docker Desktop** installed and running.
- **SlimToolkit (`slim`)** installed (Workflow will attempt to install/verify).

## Steps

1.  **Verify/Install SlimToolkit**
    - Check if `slim` command is available.
    - If not, run installation command based on architecture:
      - **Mac (Intel)**: `curl -L -o dist_mac.zip https://github.com/slimtoolkit/slim/releases/download/1.40.11/dist_mac.zip && unzip dist_mac.zip -d slimtoolkit`
      - **Mac (M1/M2)**: `curl -L -o dist_mac_m1.zip https://github.com/slimtoolkit/slim/releases/download/1.40.11/dist_mac_m1.zip && unzip dist_mac_m1.zip -d slimtoolkit`

2.  **Analyze Current Images**
    - List available Docker images with their sizes.
    // turbo
    - Run `docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"` to show candidates for optimization.

3.  **Select Target Image**
    - Ask user for the `IMAGE_NAME:TAG` they want to optimize (e.g., `my-app:latest`).
    - **Caution**: Ensure the image is built and available locally.

4.  **Run Optimization (`slim build`)**
    - Execute `slim build` on the target image.
    - **Option**: Ask if the app is a web server (needs HTTP probe) or a CLI tool (no probe needed).
    - Command: `slim build --target <IMAGE_NAME:TAG> --tag <IMAGE_NAME>:slim` (plus any necessary flags).

5.  **Verify Results**
    - Compare sizes: `docker images | grep <IMAGE_NAME>`
    - **Test Run**: Prompt user to test the new slim image: `docker run --rm <IMAGE_NAME>:slim` to ensure it works as expected.

6.  **Update Configuration (Optional)**
    - If successful, suggest identifying where this image is used (e.g., `docker-compose.yml`) and updating the tag to `:slim`.

## Troubleshooting

- **App fails to start?** The slimmed image might be missing a file. Use `--include-path` to add it back.
- **Build hangs?** If the app takes a long time to start, `slim` might be waiting for the HTTP probe. Try `--http-probe=false` or increase timeout.
