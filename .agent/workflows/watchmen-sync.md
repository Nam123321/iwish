---
name: watchmen-sync
description: Watchmen Branch Synchronization Protocol via /watchmen-sync command.
---
# /watchmen-sync

This workflow executes the Watchmen Branch Synchronization Protocol to enforce Zero-Trust Watchmen v6.3 compliance.

**Execution Steps:**
1. Run `git fetch origin_backup && git merge origin_backup/master --no-edit`
2. Auto-inject `watchmen_core` Anti-Amnesia hooks into any new `.py` or `.js` files in `.agent/scripts`.
3. Run `python3 .agent/scripts/validate-watchmen-compliance.py`.
4. The Agent MUST directly execute `python3 .agent/scripts/watchmen_signer.py` via the `run_command` tool. 
   *(Note: This script has native macOS `osascript` integration. The OS will automatically display a secure GUI popup asking for the Admin Passphrase. The Agent simply waits for the user to submit it).*
5. Once the signing script succeeds, execute: `git add .agent/config/scripts-lock.* && git commit -m "chore(security): auto-sync and re-sign watchmen"` to seamlessly commit the new signatures.

For detailed technical implementation, the Agent MUST read `/.agent/skills/watchmen-sync-guardian/SKILL.md`.
