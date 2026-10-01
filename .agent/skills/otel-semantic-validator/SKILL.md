---
name: otel-semantic-validator
description: Validates application telemetry traces and metrics against OTel GenAI semantic mapping and configured cardinality budgets.
---

# otel-semantic-validator

This skill validates that telemetry traces and metrics emitted by the application comply with OpenTelemetry (OTel) GenAI semantic mapping conventions, and checks if they adhere to the configured cardinality budgets.

## Usage
Run this skill during CI/CD or PR checks when telemetry configuration is modified or when application tracing is updated.
