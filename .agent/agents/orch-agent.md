---
name: orch-agent
description: "Orchestrator \u2014 Workflow routing, agent delegation, state management,\
  \ fallback handling"
role: Orchestrator
phases:
- discover
- plan
- solution
- implement
- validate
- deliver
- operate-learn
stages:
- intent-triage
- staged-planning
- orchestration
triggers:
- help
- route
- orchestrate
- what should we do
anti_triggers: []
primary_agents:
- orch-agent
primary_workflows:
- status
- plan
- make-story
- code
- review
- research
- make-ui-spec
supportive_skills: []
tool_dependencies:
- graph
constraints:
- Should shortlist via routing profiles before opening full capability bodies.
review_pack: docs/open-modules/orch-agent-integration-guide.md
story_refs:
- story-1.7
- story-1.17
tags:
- orchestrator
- canonical
---

# orch-agent

The master coordinator. Routes user intents to the appropriate workflow or sub-agent, maintains session state, and handles execution fallbacks.
