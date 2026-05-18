---
epic: EPIC-OPS-02
storyId: STORY-OPS-2.1
status: "Completed"
phase: "forge"

---
# Story 2.1: Build pre-deployment-checklist workflow [FLOW-OUT: ops.predeploy.checked]

## 1. TL;DR
Create the `pre-deployment-checklist.md` workflow assigned to Android 17. This workflow is the mandatory first step before any deployment, checking environment variables, test health, and Policy-as-Code rules.

## 2. Context & Problem
Deployments frequently fail due to misconfigurations (e.g. missing environment variables or unrun migrations) rather than bad code. We need Android 17 to execute a strict checklist to catch these structural and security issues *before* resources are committed to a deployment.

## 3. Technical Requirements & Architectural Constraints
1. **Workflow File Target**: Create `templates/library/ops-pack/workflows/day-1/pre-deployment-checklist.md`.
2. **Inputs**: Expects target environment (staging/production) to determine the strictness of checks.
3. **Behavior Logic**: Instructs the AI (Android 17) to check `.env.example`, confirm test suite (e.g. `npm run test` exits 0), verify Prisma/DB migrations, and assert Policy-as-Code requirements.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Successful Pre-Flight Check**
- **Given** Krillin invokes the pre-deployment checklist
- **When** Android 17 executes the workflow and all tests, env vars, and code policies pass
- **Then** Android 17 returns a `Ready for Deployment` signal.

**Scenario 2: Policy-as-Code Violation**
- **Given** Android 17 is running the checklist
- **When** it detects missing environment variables or failing tests
- **Then** the workflow completely halts the overarching deployment process
- **And** explicitly prints the failure reasons.

**Scenario 3: CI/CD Hangs (Edge Case Mitigation)**
- `[EDGE-CASE]` **Given** the pre-flight check depends on a third-party service (e.g. SonarQube API)
- **When** the service does not respond
- **Then** the checklist must timeout after 60s and Fail-Closed, preventing deployment.

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary
- **Edge Cases Detected (Hit):** Pre-flight dependency failure (timeout).
- **Data Impact (Kira Lite):** None. 
- **Flow Impact (Shinji Lite):** Produces `ops.predeploy.checked`
- **Testability Check (Quinn Lite):** 3/3 ACs Automatable (unit testing conditions).

## 6. Development Execution Steps (For Whis/Vegeta)
1. Ensure directory `templates/library/ops-pack/workflows/day-1/` exists.
2. Initialize and write `pre-deployment-checklist.md`.
3. Verify `<persona>SecOps</persona>` is defined.
4. Mark story as `COMPLETED`.
