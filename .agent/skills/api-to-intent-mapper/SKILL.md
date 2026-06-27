---
name: api-to-intent-mapper
description: "Aggregates and filters multiple REST API endpoints into high-level Intent-based tools for LLM use, preventing context window overflow and enforcing read-only safety."
---

# API to Intent Mapper Skill

## Context & Objective
When LLMs interact with standard REST APIs, they often need to make multiple sequential calls to gather enough context (e.g., getting a user, then getting their settings, then getting their orders). This process consumes significant time and context window space, especially when APIs return redundant metadata (`_links`, `HATEOAS`, etc.).

This skill provides a methodology and supporting script to group multiple raw REST endpoints into a single, high-level "Intent Tool" (e.g., `get_full_user_profile`). By filtering redundant JSON fields and enforcing hard limits on data size, this skill prevents Context Window Overflow while delivering focused, intent-driven context.

## Instructions for LLM Agents

When creating, wrapping, or executing an Intent Tool using this skill, follow these rules:

1. **Identify the Intent**: Group related API endpoints that serve a single conceptual user intent (e.g., "Get all info needed to display a user dashboard").
2. **Define a Single Input**: The tool should take a minimal set of logical parameters (e.g., `user_id`) and use them to construct the URLs/payloads for all underlying sub-requests.
3. **Use the `intent_mapper.py` Script**: Execute the provided Python script (`.agent/skills/api-to-intent-mapper/scripts/intent_mapper.py`) to perform the actual API calls. The script acts as a safe execution proxy and handles:
   - Parallel or sequential fetching of multiple endpoints.
   - Removing redundant fields (`_links`, `href`, `uuid` strings that aren't needed by the LLM).
   - Enforcing Read-Only operations (only `GET` or specific `POST`-query methods are allowed) to prevent state mutation.
   - Catching HTTP errors (404, 500, timeouts) and 429 Rate Limits, returning partial data gracefully instead of crashing.
   - Enforcing hard limits on list sizes and string lengths to prevent Context Window Overflow.
4. **Read-Only Enforcement**: Never use this skill for state-mutating operations (`POST` for creation, `PUT`, `DELETE`, etc.). It is strictly for context gathering. If a mutating endpoint is passed, the script will reject it unless it's explicitly allowed as a query.

## Error Handling & Resiliency
If a sub-request fails due to timeout, 404, 500, or rate limiting (429), the script will not fail the entire intent. Instead, it will return the successful responses and append a `warning` block for the failed endpoints. You must parse this partial data and inform the user if critical context is missing.

## Usage Example

```bash
python3 .agent/skills/api-to-intent-mapper/scripts/intent_mapper.py \
  --endpoints '[
    {"url": "https://api.example.com/users/123", "method": "GET"}, 
    {"url": "https://api.example.com/users/123/settings", "method": "GET"}
  ]' \
  --max-items 50 \
  --max-chars 5000
```
