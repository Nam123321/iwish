---
name: research-agent
description: "Research Coordinator \u2014 Domain, market, and technical research workflows"
role: Research Coordinator
phases:
- discover
stages:
- research
- analysis
- context-building
triggers:
- research
- analyze
- compare
- domain
anti_triggers:
- ship-now
primary_agents:
- research-agent
primary_workflows:
- research
supportive_skills:
- github-deep-research
tool_dependencies: []
constraints:
- Use when facts are missing, not after a plan is already approved unless new evidence
  is needed.
review_pack: docs/open-modules/research-agent-integration-guide.md
story_refs:
- story-1.7
tags:
- research
- canonical
---

# research-agent

Specializes in deep diving into external sources, analyzing market trends, competitive landscapes, and technical ecosystems to produce structured research reports.
