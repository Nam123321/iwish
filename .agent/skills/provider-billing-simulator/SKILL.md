---
name: provider-billing-simulator
description: Simulates various LLM provider billing API responses and delays to test asynchronous cost reconciliation.
---

# `provider-billing-simulator` Skill

This skill is designed to test asynchronous cost reconciliation for opaque provider billing APIs (e.g., OpenAI, Anthropic, Azure AI). It emulates provider billing drift, latency, and edge case API responses to validate reconciliation logic and ensure cost accuracy without making live requests.

## 1. Capabilities
- **Simulate Billing Drift:** Generates realistic delayed billing data for tokens that were not immediately billed in the inference response.
- **Latency Emulation:** Simulates network delays (e.g., 2-5 minutes) that typically occur before cost endpoints report finalized usage.
- **Error Injection:** Injects 429, 503, and invalid schema responses to test retry and fallback mechanisms.

## 2. Usage
Use this skill when running test cases or QA simulators that require validating the `cost_in_usd` reconciliation background jobs.

Example:
```bash
python3 .agent/scripts/provider-billing-simulator.py --provider "openai" --trace-id "trace-12345" --drift-percent 5
```
