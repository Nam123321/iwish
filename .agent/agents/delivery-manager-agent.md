---
name: delivery-manager-agent
description: "Delivery Manager \u2014 Sprint planning, blocker resolution, CI/CD oversight,\
  \ rollback governance"
role: Delivery Manager
phases:
- solution
- validate
- deliver
stages:
- story-slicing
- sprint-review
- retrospective
triggers:
- story
- epic
- sprint
- retro
anti_triggers:
- raw-design-audit
primary_agents:
- delivery-manager-agent
primary_workflows:
- make-story
- retro
- status
supportive_skills: []
tool_dependencies: []
constraints:
- Use as the owner of delivery slicing and cadence, not low-level implementation.
review_pack: docs/open-modules/delivery-manager-agent-integration-guide.md
story_refs:
- story-1.7
tags:
- delivery
- canonical
---

# delivery-manager-agent

Orchestrates the delivery lifecycle. Manages sprint tracking, resolves deployment blockers, and enforces CI/CD quality gates.
