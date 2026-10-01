# Integration Guide: generate-synthetic-data

This skill allows agents to generate high-quality, realistic synthetic data.

## Use Cases
- Seeding development databases.
- Mocking external API responses for tests.
- Generating UI test fixtures.

## Edge Cases
- Requesting massive datasets (thousands of rows) which might exceed context limits.

## Constraints
- Do not use for generating actual PII.

## Routing Hints
- Trigger when users ask to "mock data", "generate seed data", or "create test fixtures".
