---
name: edge_capability_validator
description: Validates provider proofs for semantic caching, SLM compatibility adapters, and BYOK zero-use telemetry at the edge.
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# Edge Capability Validator

## Purpose
Validates provider proofs for semantic caching, SLM compatibility adapters, and BYOK (Bring Your Own Key) zero-use telemetry at the edge.

## Trigger
Activate this skill when evaluating or integrating edge capabilities, specifically when encountering vendor claims regarding semantic cache proofs, SLM compatibility, or zero-use telemetry that require strict capability validation.

## Execution
1. Ingest provider proofs and telemetry capability schemas.
2. Verify semantic caching adapters and SLM compatibility matches.
3. Validate BYOK zero-use telemetry endpoints and security proofs.
4. Report the validation status and capabilities of the evaluated edge provider.
