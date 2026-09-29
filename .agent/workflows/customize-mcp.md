---
name: customize-mcp
description: "Safely upgrades or customizes an MCP Gateway without downtime, with distributed locks, size validation, branch isolation, and automatic rollback on failure."
version: 1.0.0
---

# 🛠️ Workflow: customize-mcp

This workflow provides a secure, zero-downtime mechanism for upgrading or customizing an active MCP gateway. It enforces strict concurrency control, payload validation, and robust rollback protocols.

## 📋 Pre-Execution Constraints (Payload Validation)

Before any system changes are initiated, perform the following structural validation on the incoming schema payload:
1. **Size Constraint**: Reject the payload synchronously with a `413 Payload Too Large` error if the payload exceeds **5MB**.
2. **Nesting Constraint**: Reject the payload synchronously if it contains JSON nesting exceeding **20 levels**.

## 🚀 Execution Steps

### Step 1: Distributed Lock Acquisition
- Obtain a distributed lock on the MCP gateway resource.
- **Concurrency Check**: If the lock is already held by another user/process, **halt** execution and return a `"deployment in progress"` error to the secondary user immediately.

### Step 2: Safe Branch Isolation
- Create a new, isolated branch (or staging environment) for the upgrade.
- **Timeout Rule**: This operation has a strict **30-second timeout**. If branch creation exceeds 30 seconds, abort gracefully and clean up any orphaned or partial branches.

### Step 3: Schema & API Validation
- Apply the customized schema/payload to the staging branch.
- Perform a dry-run validation against the MCP Gateway API contract.
- Verify that the schema adheres to standard security rules.

### Step 4: Zero-Downtime Deployment
- If validation passes, route traffic safely from the old environment to the new branch (blue/green deployment pattern) to ensure no downtime occurs during the upgrade.

### Step 5: Rollback Mechanism & Timeout Handling
- Monitor the health of the upgraded system for any schema/API errors post-deployment.
- **Automatic Rollback**: If the new deployment fails health checks, trigger an automatic rollback to the previous known good state.
- **Infrastructure Failure Rule**: If a rollback fails due to infrastructure timeout or unresponsiveness, trigger a **P0 alert** and cleanly restart the service to the last known good snapshot, strictly enforcing immutable infrastructure principles.

### Step 6: Cleanup
- Release the distributed lock.
- Purge any temporary deployment artifacts.
