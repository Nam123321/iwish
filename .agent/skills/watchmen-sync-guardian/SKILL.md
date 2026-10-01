---
name: watchmen-sync-guardian
description: Automatically syncs the current branch with master, enforces Zero-Trust Watchmen v6.3 compliance, and prepares the workspace for Admin signing.
---

# Watchmen Branch Synchronization Protocol

## Trigger
When the user types `/watchmen-sync`, execute the following workflow.

## Context
This branch needs to pull the Zero-Trust Category A Watchmen framework from `master` and become compliant.

## Execution Steps

### Step 1: Pull from Master
Execute the following bash commands to sync with master:
```bash
git fetch origin_backup
git merge origin_backup/master --no-edit
```
*If there are merge conflicts, halt and ask the user to resolve them first.*

### Step 2: Auto-Inject Anti-Amnesia Hooks
Scan all `.py` and `.js` files in `.agent/scripts/`. If they are newly created in this branch and missing the Watchmen execution hooks, inject them:
- **Python (`.py`)**: Must have `import watchmen_core` and `watchmen_core.verify_execution(__file__)`.
- **NodeJS (`.js`)**: Must have `require('./watchmen_core.js').verify_execution(__filename);`.
Use `replace_file_content` to inject these at the top of the files if they are missing.

### Step 3: Verify Compliance
Run the compliance validator:
```bash
python3 .agent/scripts/validate-watchmen-compliance.py
```
*If validation fails, fix the scripts before proceeding.*

### Step 4: Automated Admin Signature (via Native macOS GUI)
Because signing requires the Admin's Private Key Passphrase, the Python script uses native macOS `osascript` to prompt the user securely. The Agent MUST execute the commands directly instead of asking the user to copy-paste.

Execute the following in sequence using `run_command`:
```bash
# 1. Run the signer. The Agent will wait while macOS prompts the user for the passphrase.
python3 .agent/scripts/watchmen_signer.py

# 2. Stage the newly generated cryptographic signatures
git add .agent/config/scripts-lock.*

# 3. Commit the synchronization
git commit -m "chore(security): sync branch with watchmen v6.3 and re-sign"
```

Once completed, notify the user: *"✅ Giao thức Đồng bộ và Ký duyệt Zero-Trust Watchmen đã hoàn tất thành công!"*
