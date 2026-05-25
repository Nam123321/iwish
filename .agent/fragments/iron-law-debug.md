---
name: 'Iron Law of Debugging'
description: 'Debugging rigor methodology (Deprecated: See Pivot Guardian)'
---

# The Iron Law of Debugging (Merged into Pivot Guardian)

> [!WARNING]
> This fragment has been deprecated and its core rules (3-Retry Limit, Structured Escalation Payload) have been fully absorbed into **Skill: Pivot Guardian**.
>
> When executing debugging loops, **do not rely on this file**. Instead, you MUST follow the Escalation Protocol and 3-Retry logic defined in `/.agent/skills/pivot-guardian/SKILL.md`.

## Core Philosophy (Legacy)
1. **The Iron Law**: Never apply a "band-aid" fix. You must understand exactly why the code failed before changing it. Do not mask the symptom; fix the root cause.
2. **Scope Lock**: Do not modify files outside the immediately affected component unless explicitly authorized. Avoid tangential clean-ups that increase the risk of regression.
