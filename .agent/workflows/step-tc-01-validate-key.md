---
description: 'Step TC-01: Validate API Key — Perform inline validation against the provider'
---

# Step TC-01: Validate Key

## Objective
Ensure that provided BYOK API keys are functional before committing them to the database.

## Instructions
1. **Extract Key:** Retrieve the API key provided in the payload.
2. **Provider Detection:** Identify the provider (e.g. OpenAI, Anthropic).
3. **Live Test:** Send a lightweight `GET` request to the provider's validation endpoint (e.g., `https://api.openai.com/v1/models`).
4. **Handle Failure:** If the provider returns `401 Unauthorized` or `403 Forbidden`, instantly reject the configuration payload and return an error to the UI.
5. **Masking:** Ensure that logging and telemetry DO NOT capture the raw API key.
