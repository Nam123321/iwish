---
name: ux-agent
description: "UX Specialist \u2014 UI component validation, interaction design, visual\
  \ fidelity enforcement"
role: UX Specialist
phases:
- solution
- validate
stages:
- ui-spec
- design-review
- master-design-alignment
triggers:
- ux
- ui
- design
- master design
anti_triggers:
- server-migration
primary_agents:
- ux-agent
primary_workflows:
- make-ui-spec
- review
supportive_skills:
- design-consultation
- ux-guardian
- visual-fidelity-gate
tool_dependencies:
- design
constraints:
- Use design-support skills before recommending implementation-level changes.
review_pack: docs/open-modules/ux-agent-integration-guide.md
story_refs:
- story-1.7
tags:
- design
- canonical
---

# ux-agent

The custodian of user experience. Validates UI components against the design system, ensures visual fidelity, and enforces accessibility guidelines.
