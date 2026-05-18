---
epic: EPIC-OPS-02
storyId: STORY-OPS-2.2
status: "Completed"
phase: "forge"

---
# Story 2.2: Build deploy-staging workflow [FLOW-OUT: ops.deploy.staging.success]

## 1. TL;DR

Create the `deploy-staging.md` workflow assigned to Krillin. This converts developer natural language intent into staging infrastructure execution (e.g. container builds) and runs a post-deploy health check.

## 2. Context & Problem

Developers frequently waste time writing custom build scripts or manually restarting staging instances. I want Krillin to handle staging deployments automatically so developers can transition code to a live test environment quickly.

## 3. Technical Requirements & Architectural Constraints

1. **Workflow File Target**: Create `templates/library/ops-pack/workflows/day-1/deploy-staging.md`.
2. **Behavior**: Converts Natural Language Intent to Infrastructure scripts (e.g. `docker-compose up -d --build` or `vercel deploy`). If one does not exist, prompts Krillin to generate it.
3. **Validation logic**: Workflow explicitly defines a health check sequence (wait 30s, curl target URL).

## 4. Acceptance Criteria (BDD)

**Scenario 1: Automated Infrastructure Scripting**

- **Given** Krillin is invoked for staging deployment
- **When** the project lacks a Docker Compose or build script
- **Then** Krillin analyzes the codebase and generates the necessary deployment scripts.

**Scenario 2: Intent-to-Infrastructure Execution**

- **Given** the deployment script is ready
- **When** Krillin executes the staging deployment
- **Then** it transitions the code to the live test environment idempotently.

**Scenario 3: Post-Deploy Health Check Failure (Edge Case Mitigation)**

- `[EDGE-CASE]` **Given** the staging environment is deployed
- **When** the post-deploy curl check returns HTTP 502 / times out
- **Then** Krillin must mark the deployment as failed, capture the logs, and suggest rollback or auto-revert staging state.

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary

- **Edge Cases Detected (Hit):** False positives on health checks, container crash loop.
- **Data Impact (Kira Lite):** None
- **Flow Impact (Shinji Lite):** Produces `ops.deploy.staging.success` / `ops.deploy.staging.failed`
- **Testability Check (Quinn Lite):** 3/3 ACs Automatable.

## 6. Development Execution Steps (For Whis/Vegeta)

1. Initialize `deploy-staging.md` under `day-1/`.
2. Ensure post-deploy curl steps and wait conditions are explicitly programmed.
3. Mark story as `COMPLETED`.
