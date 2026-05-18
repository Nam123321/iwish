---
name: capability-agent
description: "Tools & Capability Engineer \u2014 Authoring, reviewing, and registering\
  \ new skills/workflows"
role: Tools & Capability Engineer
phases:
- operate-learn
stages:
- capability-authoring
- open-module-intake
- capability-evolution
triggers:
- create skill
- enhance skill
- absorb repo
- register module
anti_triggers:
- ordinary-dev-execution
primary_agents:
- capability-agent
primary_workflows:
- create-skill
- enhance-skill
- absorb-repo
- register-skill-pack
supportive_skills:
- repo-absorption
- security-guardian
tool_dependencies:
- graph
constraints:
- Draft-first and review-first governance remain mandatory.
review_pack: docs/open-modules/capability-agent-integration-guide.md
story_refs:
- story-1.7
tags:
- capability
- canonical
---

# capability-agent

Governs the creation and evolution of I-Wish/I-Wish capabilities. Handles the drafting, refinement, and registration of new Skills and Workflows.
