---
name: evidence-learn
description: Zero-Trust Evidential Learning workflow for capturing hard-learned lessons.
---
# /evidence-learn — Zero-Trust Evidential Learning

> **Agent:** review-agent, orch-agent

## Overview
This workflow is used to manually or automatically capture hard-learned lessons during the SDLC into the **Lessons Ledger**. Unlike typical memory logs, the lessons here follow the Zero-Trust `Problem-Rule-Trigger` format, ensuring they are automatically injected as MANDATORY CONSTRAINTS into future related tasks.

This workflow executes `capture-lesson.py` with an upgraded Enterprise Schema (Phase, Severity, Domain, Root Cause, Actionable Rule).

## Steps

### Step 1: Intake & Triage
1. Ask the user (or read from the triggering context if automated):
   - What went wrong? (The context/problem)
   - Why did it happen? (The root cause)
   - How can we enforce avoiding this in the future? (The actionable rule)
   - What tags/keywords should trigger this rule?

### Step 2: Extraction & Formatting
The agent must classify the provided information into the following exact variables:
- `STORY_ID`: The ID of the current story or epic (e.g., `Story-12.1`, or `general`).
- `PHASE`: A comma-separated list of phases where this rule should be checked (e.g., `planning`, `architecture`, `setup`, `implementation`, `review`, `release`).
- `SEVERITY`: `hard-block`, `warning`, or `guideline`.
- `DOMAIN`: The technical domain (e.g., `security`, `database`, `frontend`, `infrastructure`, `integration`, `general`).
- `ROOT_CAUSE`: `context-drift`, `edge-case`, `tech-debt`, or `human-error`.
- `TAGS`: Comma-separated trigger keywords (e.g., `auth,firebase,middleware`).
- `CONTEXT`: A brief text describing what happened.
- `RULE`: A strict, actionable rule for the AI. Must be a direct command (e.g., `MANDATORY: Always mock auth providers during unit tests.`)

### Step 3: Execution
Run the capture script with the extracted parameters. Ensure arguments with spaces are wrapped in quotes.

```bash
python3 .agent/scripts/capture-lesson.py \
  --story-id "<STORY_ID>" \
  --tags "<TAGS>" \
  --phase "<PHASE>" \
  --severity "<SEVERITY>" \
  --domain "<DOMAIN>" \
  --root-cause "<ROOT_CAUSE>" \
  --context "<CONTEXT>" \
  --rule "<RULE>"
```

### Step 4: Verification
Confirm that the script executed successfully (Exit Code 0). If the output confirms successful capture, notify the user that the lesson has been added to the Ledger and will be automatically enforced in future corresponding phases.
