# Navigator Guardian Skill
**Name**: Navigator Guardian
**Description**: Ensures the Idea Navigator Dashboard is always in sync with project progress.

## Instructions
This skill is a mandatory "Post-Step Hook" for all Phase 1 (Ideation & Analysis) workflows.

### 1. Trigger Conditions
- After completing a `brainstorming` session.
- After completing an `idea-challenge` flow or updating `idea-challenge`, `distillate`, or `biz-stack` artifacts.
- After completing `market-research`, `domain-research`, or `technical-research`.
- After finalizing a `product-brief` or `prd`.

### 2. Execution Protocol
When triggered, the agent MUST:
1. Run the sync command: `python3 sync_navigator.py`.
2. Verify that `_bmad-output/navigator-data.js` has been updated.
3. Inform the user: "🚀 **Idea Navigator Updated**: Your visual journey has been synchronized. Open `_bmad-output/idea-navigator.html` to view the latest insights."

### 3. Visual Lineage Policy
- If a major pivot occurred, the agent should mention it in the `sync_navigator.py` or update the narrative metadata to reflect the change.
- Ensure that the "Visual Lineage" SVG connectors are consistent with the logic discussed in the session.
- Treat Discover/analysis artifacts such as `idea-challenge-{project}.md`, `idea-challenge-{project}-distillate.md`, and `biz-stack.md` as first-class inputs for the Navigator overview so the story from idea to PRD is not broken.
