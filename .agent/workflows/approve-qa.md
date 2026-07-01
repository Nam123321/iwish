---
name: approve-qa
description: Approve a manual test and complete the story
category: implementation
roles:
  - orch-agent
steps:
  - id: step-01-read-state
    description: "Read `.agent/cache/qa-loop.json` to identify the pending story."
  - id: step-02-update-status
    description: "Transition story to `completed` in `sprint-status.yaml` and `story.md`."
  - id: step-03-inject-node
    description: "Run `iwish inject-node` to persist the completed story to the knowledge graph."
  - id: step-04-cleanup
    description: "Clear or archive the `.agent/cache/qa-loop.json` state."
---

# Approve QA Human Cross-Check

This workflow is executed when a human manually approves a QA test that is in the `Pending_Approval` state (Human Cross-Check Gate).

## Step 1: Read Loop State
- Agent reads `.agent/cache/qa-loop.json`.
- Verify that `status` is `Pending_Approval`.
- Extract the `story_id`.

## Step 2: Update Status
- Agent modifies `_iwish-output/3. Development/sprint-status.yaml` (or the equivalent flat file `_iwish-output/sprint-status.yaml` if flat layout is used):
  - Find the corresponding `story_id`.
  - Change `status` to `completed`.
- Agent modifies the physical `story.md` file (e.g., `_iwish-output/stories/story-{id}.md` or the hierarchical path):
  - Run `python3 .agent/scripts/update-story-status.py <path_to_story.md> completed` to update the status in the OKF frontmatter safely.

## Step 3: Knowledge Graph Injection
- Agent runs `iwish inject-node --file "<path_to_story.md>" --metadata '{"summary": "...", "tags": [...], "layer": "story"}'` to update the semantic graph.

## Step 4: Cleanup
- Agent deletes or clears the `.agent/cache/qa-loop.json` file.
- Agent halts execution and notifies the user: *"Story {id} has been fully completed and injected into the Knowledge Graph."*
