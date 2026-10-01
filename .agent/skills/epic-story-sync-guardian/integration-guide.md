# Integration Guide: epic-story-sync-guardian

To integrate this skill:
1. Ensure `.agent/skills/epic-story-sync-guardian/SKILL.md` is present in the workspace.
2. In `.agent/workflows/iwish-feature-reconcile-change.md`, append a step to execute `validate-sprint-status.py` at the very beginning of the flow (Pre-flight checks).
3. If the script exits with `1`, the agent must HALT and report the drift to the user.
