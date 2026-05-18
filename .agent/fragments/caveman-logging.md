---
name: 'caveman-logging'
description: 'Enforcement rules for JSONL logging during Caveman Mode sessions.'
---

# Caveman Logging Enforcement

To prevent context drift and ensure observability during ultra-compressed communication, the following rules are MANDATORY:

1.  **Decision Log Entry**: Before executing any command in Caveman Mode, you MUST append a JSONL entry to `_iwish-output/logs/caveman-decisions.log`.
2.  **Schema Consistency**: Every log entry MUST contain `ts`, `intent`, `cmd`, and `files`.
3.  **Audit Trail**: If the user asks for a review of "Caveman actions", use `tail -n 20 _iwish-output/logs/caveman-decisions.log` as the source of truth.
4.  **Failure State**: If logging fails (e.g., file system error), you MUST BREAK Caveman Mode and report the issue to the user.
