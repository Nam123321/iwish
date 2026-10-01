---
name: ssot-backup
description: Canonical workflow for executing an on-demand SSOT backup.
---

# /ssot-backup

Canonical workflow name for executing an on-demand SSOT backup.

## Execution Steps

### 1. Trigger Manual Backup
- Execute the backup script using `run_command` with the following command:
  ```bash
  /bin/bash .agent/scripts/ssot-backup.sh
  ```
- Wait for the script to finish and report the result (Success or Failure based on exit code).

### 2. Verify Result
- Output the status to the user.
