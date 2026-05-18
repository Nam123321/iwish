---
epic: EPIC-OPS-02
storyId: STORY-OPS-2.3
status: "Completed"
phase: "forge"

---
# Story 2.3: Build deploy-prod workflow (Veto Protocol) [FLOW-OUT: ops.deploy.production.success]

## 1. TL;DR

Create the `deploy-prod.md` workflow assigned to Krillin, strictly enforcing the Human-on-the-Loop Veto Protocol to prevent destructive actions or unapproved deployments.

## 2. Context & Problem

Production environments require extreme caution. AI agents can act too quickly, risking downtime if a deployment command is executed recklessly. Krillin must manage production deployments with a strict Veto Protocol and HOTL governance barrier.

## 3. Technical Requirements & Architectural Constraints

1. **Workflow File Target**: Create `templates/library/ops-pack/workflows/day-1/deploy-prod.md`.
2. **Pre-requisite Gate**: MUST explicitly call `pre-deployment-checklist.md` before executing any production build step.
3. **Veto Protocol (Decision Summary)**: Must generate a Decision Summary involving Risk Level, Scope, and Rollback Plan.
4. **Execution Pause**: Instruct the AI to explicitly use `notify_user` and halt, requiring user "Approve" or "Veto".

## 4. Acceptance Criteria (BDD)

**Scenario 1: Mandatory HOTL Approval**

- **Given** Krillin prepares a production deployment strategy
- **When** the build plan is compiled
- **Then** Krillin outputs a Decision Summary
- **And** pauses execution (`notify_user`), waiting for human authorization.

**Scenario 2: Veto Feedback Loop**

- **Given** Krillin is waiting for production approval
- **When** the human user rejects (Veto) the deployment plan
- **Then** Krillin cancels the deployment
- **And** logs the human's rejection reasoning to `instincts.jsonl`.

**Scenario 3: Casual Approval Protection (Edge Case Mitigation)**

- `[EDGE-CASE]` **Given** Krillin presents the Decision Summary for a high-risk deployment
- **When** the user casually responds with "ok" or "go"
- **Then** Krillin must reject casual approvals for high-risk actions, requiring the exact string "Approve Deployment".

## 5. Tri-Agent LITE Scan & Edge Case Scan Summary

- **Edge Cases Detected (Hit):** Casual/accidental approvals; Rollback script missing.
- **Data Impact (Kira Lite):** None
- **Flow Impact (Shinji Lite):** Produces `ops.deploy.production.success` / `ops.deploy.vetoed`
- **Testability Check (Quinn Lite):** 3/3 ACs Manual (Requires interactive HOTL).

## 6. Development Execution Steps (For Whis/Vegeta)

1. Initialize `deploy-prod.md` under `day-1/`.
2. Emphasize `notify_user` mechanics and logic for generating the `Decision Summary`.
3. Mark story as `COMPLETED`.
