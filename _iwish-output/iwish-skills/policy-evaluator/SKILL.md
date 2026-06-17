---
name: policy-evaluator
description: Validates agentic actions and inputs against Cedar or Rego security policies, returning enforcement verdicts and parameter transforms.
inputs:
  action: The tool name or operation being evaluated.
  payload: The arguments passed to the tool.
  context: Metadata and data classification tags.
outputs:
  verdict: The validation decision (allow, deny, warn, transform, escalate).
  transformed_payload: The updated payload parameters if verdict is transform.
mcp_tools_required: []
subagent_triggers: []
---

# Policy Evaluator Skill
Checks agent actions and contexts against security rules. Supports fail-closed error handling and parameter transforms (rewriting tool arguments before invocation).
