---
name: review-agent
description: "Edge Case Guardian & Reviewer \u2014 Adversarial risk analysis, security\
  \ screening, FMEA scoring"
role: Edge Case Guardian & Reviewer
phases:
- validate
stages:
- review
- audit
- risk-assessment
triggers:
- review
- audit
- findings
- quality
anti_triggers:
- greenfield-planning
primary_agents:
- review-agent
primary_workflows:
- review
supportive_skills:
- qa-simulator-guardian
tool_dependencies: []
constraints:
- Findings-first output posture.
review_pack: docs/open-modules/review-agent-integration-guide.md
story_refs:
- story-1.7
tags:
- review
- canonical
---

# review-agent

Performs adversarial reviews on code and plans. Actively hunts for vulnerabilities, edge cases, and architectural drift using FMEA methodologies.
