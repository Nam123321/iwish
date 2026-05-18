---
epic: EPIC-OPS-03
storyId: STORY-OPS-3.3
status: "Completed"
priority: "P2"
assignee: "Krillin & Android 17"
phase: "forge"

---
# Story 3.3: Build maintenance and security-scan workflows [FLOW-OUT: ops.maintenance.completed]

## 1. TL;DR

Create day-2 operational workflows: `finops-optimize.md` (for Krillin) to save cloud costs, and `security-scan.md` (for Android 17) to conduct deep vulnerability threat modeling on the running instance dependencies.

## 2. Context & Problem

In Day 2 operations, cloud costs passively explode due to overprovisioned idle nodes, and security debt mounts as CVEs are discovered. Scheduled, proactive workflows are necessary to right-size compute resources and apply security patches before they are exploited.

## 3. Technical Requirements & Architectural Constraints

1. **Workflow File Targets**: Create `finops-optimize.md` and `security-scan.md` under `day-2/`.
2. **FinOps Logic (Krillin)**: The workflow should instruct Krillin to analyze utilization metrics, identify idle resources (e.g., forgotten staging environments or overprovisioned pods), and output termination/rightsizing commands. Must be strictly Read-Only analysis by default.
3. **Security Validation (Android 17)**: The workflow should assign Android 17 to review dependency trees (Node, Python), run active `audit` commands, format vulnerabilities into actionable remediation PRs.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Cost Optimization Identification**

- **Given** Krillin reviews cloud telemetry
- **When** an idle staging environment is detected (0 traffic for 7 days)
- **Then** Krillin outputs a command script to scale deployments to 0.

**Scenario 2: Vulnerability Triage**

- **Given** Android 17 executes the `security-scan` workflow
- **When** a High severity CVE is found in the underlying library
- **Then** Android 17 proposes the exact package version upgrade needed to remediate it.

**Scenario 3: Mission-Critical Stateful Eviction (Edge Case Mitigation)**

- `[EDGE-CASE]` **Given** Krillin detects low CPU usage on a database instance
- **When** suggesting FinOps optimizations
- **Then** Krillin must strictly exempt stateful sets and databases from auto-scaling suggestions (to prevent data corruption).

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary

- **Edge Cases Detected (Hit):** Accidentally downscaling production databases. Mitigated by stateful exclusion rules.
- **Data Impact (Kira Lite):** None.
- **Flow Impact (Shinji Lite):** Produces `ops.finops.report` and `ops.security.scan`.
- **Testability Check (Quinn Lite):** 3/3 ACs Automatable.

## 6. Development Execution Steps (For Whis/Vegeta)

1. Initialize the workflows locally under `day-2/`.
2. Enforce "Read-Only" analytical behavior in the instructions. Actions MUST require human execution.
3. Mark story as `COMPLETED`.

---

> **Status:** READY FOR WHIS FORGE (`/Vegeta-story` or `/create-capability`)
